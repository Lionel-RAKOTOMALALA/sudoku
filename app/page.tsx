'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './sudoku.module.css';

const PUZZLES = {
  easy: [
    [5,3,0,0,7,0,0,0,0],
    [6,0,0,1,9,5,0,0,0],
    [0,9,8,0,0,0,0,6,0],
    [8,0,0,0,6,0,0,0,3],
    [4,0,0,8,0,3,0,0,1],
    [7,0,0,0,2,0,0,0,6],
    [0,6,0,0,0,0,2,8,0],
    [0,0,0,4,1,9,0,0,5],
    [0,0,0,0,8,0,0,7,9]
  ],
  medium: [
    [0,0,0,2,6,0,7,0,1],
    [6,8,0,0,7,0,0,9,0],
    [1,9,0,0,0,4,5,0,0],
    [8,2,0,1,0,0,0,4,0],
    [0,0,4,6,0,2,9,0,0],
    [0,5,0,0,0,3,0,2,8],
    [0,0,9,3,0,0,0,7,4],
    [0,4,0,0,5,0,0,3,6],
    [7,0,3,0,1,8,0,0,0]
  ],
  hard: [
    [0,0,0,6,0,0,4,0,0],
    [7,0,0,0,0,3,6,0,0],
    [0,0,0,0,9,1,0,8,0],
    [0,0,0,0,0,0,0,0,0],
    [0,5,0,1,8,0,0,0,3],
    [0,0,0,3,0,6,0,4,5],
    [0,4,0,2,0,0,0,6,0],
    [9,0,3,0,0,0,0,0,0],
    [0,2,0,0,0,0,1,0,0]
  ],
  expert: [
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,3,0,8,5],
    [0,0,1,0,2,0,0,0,0],
    [0,0,0,5,0,7,0,0,0],
    [0,0,4,0,0,0,1,0,0],
    [0,9,0,0,0,0,0,0,0],
    [5,0,0,0,0,0,0,7,3],
    [0,0,2,0,1,0,0,0,0],
    [0,0,0,0,4,0,0,0,9]
  ]
};

const ALGO_DESC = {
  bt: "Backtracking pur — Affecte une valeur, verifie les conflits, revient en arriere si necesaire. Simple mais peut faire des milliers de retours arriere sur les grilles difficiles.",
  ac3: "BT + AC-3 — Avant chaque affectation, AC-3 propage les contraintes et reduit les domaines. Beaucoup moins de retours arriere, resolution bien plus rapide.",
  mrv: "BT + AC-3 + MRV/LCV — Choisit la variable avec le moins de valeurs restantes (MRV) et la valeur qui contraindra le moins les voisins (LCV). Algorithme le plus robuste et efficace."
};

type Board = number[][];
type Fixed = boolean[][];
type DomainValue = number[][];
type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';
type Algo = 'bt' | 'ac3' | 'mrv';
type Operation = 
  | { type: 'assign'; r: number; c: number; v: number; ac3: number; pruned: number }
  | { type: 'backtrack'; r: number; c: number; v: number }
  | { type: 'conflict'; r: number; c: number; v: number };
type LogEntry = { message: string; className: string };

export default function SudokuPage() {
  const [board, setBoard] = useState<Board>([]);
  const [fixed, setFixed] = useState<Fixed>([]);
  const [solvedBoard, setSolvedBoard] = useState<Board>([]);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [diff, setDiff] = useState<Difficulty>('easy');
  const [algo, setAlgo] = useState<Algo>('ac3');
  const [solving, setSolving] = useState(false);
  const [solveQueue, setSolveQueue] = useState<Operation[]>([]);
  const [stepCount, setStepCount] = useState(0);
  const [backCount, setBackCount] = useState(0);
  const [ac3Count, setAc3Count] = useState(0);
  const [pruneCount, setPruneCount] = useState(0);
  const [speed, setSpeed] = useState(3);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showWin, setShowWin] = useState(false);
  const [algoDesc, setAlgoDesc] = useState(ALGO_DESC.ac3);
  
  const animTimerRef = useRef<NodeJS.Timeout | null>(null);
  const solveQueueRef = useRef<Operation[]>([]);
  const boardRef = useRef<Board>([]);
  const fixedRef = useRef<Fixed>([]);
  const solvedBoardRef = useRef<Board>([]);
  const solveStateRef = useRef({ solving: false, solveQueue: [] as Operation[] });

  // Utility functions
  const getPeers = (r: number, c: number): [number, number][] => {
    const s: [number, number][] = [];
    for (let i = 0; i < 9; i++) {
      if (i !== c) s.push([r, i]);
      if (i !== r) s.push([i, c]);
    }
    const br = Math.floor(r / 3) * 3;
    const bc = Math.floor(c / 3) * 3;
    for (let i = br; i < br + 3; i++) {
      for (let j = bc; j < bc + 3; j++) {
        if (i !== r || j !== c) s.push([i, j]);
      }
    }
    return s;
  };

  const isValid = (b: Board, r: number, c: number, v: number): boolean => {
    for (let i = 0; i < 9; i++) {
      if (b[r][i] === v && i !== c) return false;
      if (b[i][c] === v && i !== r) return false;
    }
    const br = Math.floor(r / 3) * 3;
    const bc = Math.floor(c / 3) * 3;
    for (let i = br; i < br + 3; i++) {
      for (let j = bc; j < bc + 3; j++) {
        if ((i !== r || j !== c) && b[i][j] === v) return false;
      }
    }
    return true;
  };

  const initDomains = (b: Board): DomainValue => {
    const d: DomainValue = [];
    for (let r = 0; r < 9; r++) {
      d.push([]);
      for (let c = 0; c < 9; c++) {
        if (b[r][c]) {
          d[r].push([b[r][c]]);
        } else {
          d[r].push([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        }
      }
    }
    return d;
  };

  const cloneDomains = (d: DomainValue): DomainValue => {
    return d.map((row) => row.map((s) => [...s]));
  };

  const runAC3 = (b: Board, d: DomainValue): { ok: boolean; count: number; pruned: number } => {
    const queue: [number, number, number, number][] = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const peers = getPeers(r, c);
        for (let k = 0; k < peers.length; k++) {
          queue.push([r, c, peers[k][0], peers[k][1]]);
        }
      }
    }
    let pruned = 0;
    let count = 0;
    while (queue.length > 0) {
      const item = queue.shift()!;
      const [ri, ci, rj, cj] = item;
      count++;
      if (d[ri][ci].length === 1) {
        const val = d[ri][ci][0];
        const idx = d[rj][cj].indexOf(val);
        if (idx !== -1) {
          d[rj][cj].splice(idx, 1);
          pruned++;
          if (d[rj][cj].length === 0) return { ok: false, count, pruned };
          const newPeers = getPeers(rj, cj);
          for (let k = 0; k < newPeers.length; k++) {
            queue.push([rj, cj, newPeers[k][0], newPeers[k][1]]);
          }
        }
      }
    }
    return { ok: true, count, pruned };
  };

  const selectMRV = (b: Board, d: DomainValue): [number, number] | null => {
    let best: [number, number] | null = null;
    let bestSize = 10;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (!b[r][c] && d[r][c].length < bestSize) {
          bestSize = d[r][c].length;
          best = [r, c];
        }
      }
    }
    return best;
  };

  const orderLCV = (r: number, c: number, d: DomainValue): number[] => {
    const vals = d[r][c].slice();
    const peers = getPeers(r, c);
    vals.sort((a, b_val) => {
      let ca = 0;
      let cb = 0;
      for (let k = 0; k < peers.length; k++) {
        const pr = peers[k][0];
        const pc = peers[k][1];
        if (!boardRef.current[pr][pc]) {
          if (d[pr][pc].indexOf(a) !== -1) ca++;
          if (d[pr][pc].indexOf(b_val) !== -1) cb++;
        }
      }
      return ca - cb;
    });
    return vals;
  };

  const buildQueue = (): Operation[] => {
    const b = boardRef.current.map((row) => row.slice());
    const d = initDomains(b);
    if (algo !== 'bt') {
      const res = runAC3(b, d);
      if (!res.ok) return [];
    }
    const ops: Operation[] = [];

    const bt = (b: Board, d: DomainValue): boolean => {
      let cell: [number, number] | null = null;
      if (algo === 'mrv') {
        cell = selectMRV(b, d);
      } else {
        for (let r = 0; r < 9 && !cell; r++) {
          for (let c = 0; c < 9 && !cell; c++) {
            if (!b[r][c]) cell = [r, c];
          }
        }
      }
      if (!cell) return true;
      const [r, c] = cell;
      const vals = algo === 'mrv' ? orderLCV(r, c, d) : d[r][c].slice();

      for (let vi = 0; vi < vals.length; vi++) {
        const v = vals[vi];
        if (!isValid(b, r, c, v)) {
          ops.push({ type: 'conflict', r, c, v });
          continue;
        }
        b[r][c] = v;
        const nd = cloneDomains(d);
        nd[r][c] = [v];
        let ac3res = { ok: true, count: 0, pruned: 0 };
        if (algo !== 'bt') {
          const peers = getPeers(r, c);
          for (let k = 0; k < peers.length; k++) {
            const pr = peers[k][0];
            const pc = peers[k][1];
            const idx = nd[pr][pc].indexOf(v);
            if (idx !== -1) nd[pr][pc].splice(idx, 1);
          }
          ac3res = runAC3(b, nd);
        }
        if (ac3res.ok) {
          ops.push({ type: 'assign', r, c, v, ac3: ac3res.count, pruned: ac3res.pruned });
          if (bt(b, nd)) return true;
        }
        ops.push({ type: 'backtrack', r, c, v });
        b[r][c] = 0;
      }
      return false;
    };

    bt(b, d);
    return ops;
  };

  const solvePure = (b: Board): void => {
    const empty: [number, number][] = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (!b[r][c]) empty.push([r, c]);
      }
    }
    const vld = (b: Board, r: number, c: number, v: number): boolean => {
      for (let i = 0; i < 9; i++) {
        if (b[r][i] === v && i !== c) return false;
        if (b[i][c] === v && i !== r) return false;
      }
      const br = Math.floor(r / 3) * 3;
      const bc = Math.floor(c / 3) * 3;
      for (let i = br; i < br + 3; i++) {
        for (let j = bc; j < bc + 3; j++) {
          if ((i !== r || j !== c) && b[i][j] === v) return false;
        }
      }
      return true;
    };
    const btPure = (idx: number): boolean => {
      if (idx === empty.length) return true;
      const [r, c] = empty[idx];
      for (let v = 1; v <= 9; v++) {
        if (vld(b, r, c, v)) {
          b[r][c] = v;
          if (btPure(idx + 1)) return true;
          b[r][c] = 0;
        }
      }
      return false;
    };
    btPure(0);
  };

  const isConflict = (b: Board, r: number, c: number, v: number): boolean => {
    for (let i = 0; i < 9; i++) {
      if (i !== c && b[r][i] === v) return true;
      if (i !== r && b[i][c] === v) return true;
    }
    const br = Math.floor(r / 3) * 3;
    const bc = Math.floor(c / 3) * 3;
    for (let i = br; i < br + 3; i++) {
      for (let j = bc; j < bc + 3; j++) {
        if ((i !== r || j !== c) && b[i][j] === v) return true;
      }
    }
    return false;
  };

  const addLog = (msg: string, className: string = '') => {
    setLogs((prev) => [...prev.slice(-119), { message: msg, className }]);
  };

  const loadPuzzle = (p: Board) => {
    const newBoard = p.map((row) => row.slice());
    const newFixed = p.map((row) => row.map((v) => v !== 0));
    const newSolved = p.map((row) => row.slice());
    solvePure(newSolved);

    boardRef.current = newBoard;
    fixedRef.current = newFixed;
    solvedBoardRef.current = newSolved;

    setBoard(newBoard);
    setFixed(newFixed);
    setSolvedBoard(newSolved);
    setStepCount(0);
    setBackCount(0);
    setAc3Count(0);
    setPruneCount(0);
    setSolveQueue([]);
    setSolving(false);
    setShowWin(false);
    setLogs([]);
  };

  const renderBoardState = () => {
    setBoard([...boardRef.current]);
  };

  const applyOp = (op: Operation, newStepCount: number, newBackCount: number, newAc3Count: number, newPruneCount: number) => {
    if (op.type === 'assign') {
      boardRef.current[op.r][op.c] = op.v;
      const msg = `Affectation (${op.r + 1},${op.c + 1})=${op.v}${op.ac3 ? ` [AC3:${op.ac3} reduit:${op.pruned}]` : ''}`;
      addLog(msg, 'log-assign');
    } else if (op.type === 'backtrack') {
      boardRef.current[op.r][op.c] = 0;
      addLog(`Retour arriere (${op.r + 1},${op.c + 1})`, 'log-back');
    } else if (op.type === 'conflict') {
      addLog(`Conflit (${op.r + 1},${op.c + 1}) != ${op.v}`, 'log-conflict');
      return;
    }
    renderBoardState();
  };

  const checkWin = (newStepCount: number, newBackCount: number, newAc3Count: number, newPruneCount: number) => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (!boardRef.current[r][c] || boardRef.current[r][c] !== solvedBoardRef.current[r][c]) return;
      }
    }
    setShowWin(true);
    addLog('Solution complete ! Toutes les contraintes satisfaites.', 'log-info');
  };

  const solveOneStep = () => {
    if (!solveStateRef.current.solveQueue.length) {
      solveStateRef.current.solveQueue = buildQueue();
      addLog(`Demarrage — ${algo.toUpperCase()}`, 'log-info');
      if (!solveStateRef.current.solveQueue.length) {
        addLog('Aucune solution trouvee.', 'log-back');
        return;
      }
    }
    while (solveStateRef.current.solveQueue.length) {
      const op = solveStateRef.current.solveQueue.shift()!;
      const newStep = stepCount + (op.type === 'assign' ? 1 : 0);
      const newBack = backCount + (op.type === 'backtrack' ? 1 : 0);
      const newAc3 = ac3Count + (op.type === 'assign' ? op.ac3 : 0);
      const newPrune = pruneCount + (op.type === 'assign' ? op.pruned : 0);
      
      applyOp(op, newStep, newBack, newAc3, newPrune);
      setStepCount(newStep);
      setBackCount(newBack);
      setAc3Count(newAc3);
      setPruneCount(newPrune);
      
      if (op.type !== 'conflict') break;
    }
    if (!solveStateRef.current.solveQueue.length) {
      checkWin(stepCount, backCount, ac3Count, pruneCount);
    }
  };

  const getDelay = (): number => {
    return [500, 150, 40, 8, 0][speed - 1];
  };

  const solveAuto = () => {
    if (solveStateRef.current.solving) return;
    solveStateRef.current.solving = true;
    setSolving(true);
    
    if (!solveStateRef.current.solveQueue.length) {
      solveStateRef.current.solveQueue = buildQueue();
      addLog(`Resolution auto — ${algo.toUpperCase()}`, 'log-info');
    }

    const tick = () => {
      if (!solveStateRef.current.solveQueue.length || !solveStateRef.current.solving) {
        solveStateRef.current.solving = false;
        setSolving(false);
        checkWin(stepCount, backCount, ac3Count, pruneCount);
        return;
      }
      const delay = getDelay();
      const batch = delay === 0 ? solveStateRef.current.solveQueue.length : 1;
      let done = 0;
      
      while (done < batch && solveStateRef.current.solveQueue.length) {
        const op = solveStateRef.current.solveQueue.shift()!;
        const newStep = stepCount + (op.type === 'assign' ? 1 : 0);
        const newBack = backCount + (op.type === 'backtrack' ? 1 : 0);
        const newAc3 = ac3Count + (op.type === 'assign' ? op.ac3 : 0);
        const newPrune = pruneCount + (op.type === 'assign' ? op.pruned : 0);
        
        applyOp(op, newStep, newBack, newAc3, newPrune);
        setStepCount(newStep);
        setBackCount(newBack);
        setAc3Count(newAc3);
        setPruneCount(newPrune);
        
        if (op.type !== 'conflict') done++;
      }
      if (solveStateRef.current.solveQueue.length) {
        animTimerRef.current = setTimeout(tick, delay);
      } else {
        solveStateRef.current.solving = false;
        setSolving(false);
        checkWin(stepCount, backCount, ac3Count, pruneCount);
      }
    };
    tick();
  };

  const newPuzzle = () => {
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    solveStateRef.current.solving = false;
    solveStateRef.current.solveQueue = [];
    setSolving(false);
    loadPuzzle(PUZZLES[diff]);
  };

  const selectCell = (r: number, c: number) => {
    setSelected([r, c]);
  };

  const enterNum = (n: number) => {
    if (!selected) return;
    const [r, c] = selected;
    if (fixedRef.current[r][c]) return;
    boardRef.current[r][c] = n;
    renderBoardState();
    setStepCount((prev) => {
      setPruneCount(pruneCount);
      return prev;
    });
    checkWin(stepCount, backCount, ac3Count, pruneCount);
  };

  const changeDiff = (newDiff: Difficulty) => {
    setDiff(newDiff);
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    solveStateRef.current.solving = false;
    solveStateRef.current.solveQueue = [];
    setSolving(false);
    loadPuzzle(PUZZLES[newDiff]);
  };

  const changeAlgo = (newAlgo: Algo) => {
    setAlgo(newAlgo);
    setAlgoDesc(ALGO_DESC[newAlgo]);
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    solveStateRef.current.solving = false;
    solveStateRef.current.solveQueue = [];
    setSolving(false);
    setStepCount(0);
    setBackCount(0);
    setAc3Count(0);
    setPruneCount(0);
    boardRef.current = PUZZLES[diff].map((row) => row.slice());
    setBoard([...boardRef.current]);
    setLogs([]);
  };

  useEffect(() => {
    loadPuzzle(PUZZLES.easy);
  }, []);

  const filled = board.reduce((count, row) => count + row.filter((v) => v > 0).length, 0);
  const remaining = 81 - filled;
  const percentage = Math.round((filled / 81) * 100);

  return (
    <div className={styles.body}>
      <div className={styles.header}>
        <h1>
          Sudoku <span className={styles.accent}>CSP</span>
        </h1>
        <span className={styles.badge}>Solveur Complet</span>
      </div>

      <div className={styles.main}>
        <div className={styles['grid-wrap']}>
          <div className={styles['sudoku-grid']}>
            {board.map((row, r) =>
              row.map((value, c) => {
                const isFixed = fixed[r]?.[c];
                const isSolved = value && solvedBoard[r]?.[c] && value === solvedBoard[r][c];
                const isConflictCell = value && isConflict(board, r, c, value);
                const isSelected = selected && selected[0] === r && selected[1] === c;
                const isHighlighted =
                  selected &&
                  (selected[0] === r ||
                    selected[1] === c ||
                    (Math.floor(selected[0] / 3) === Math.floor(r / 3) &&
                      Math.floor(selected[1] / 3) === Math.floor(c / 3)));

                let cellClass = styles.cell;
                if (c === 2 || c === 5) cellClass += ` ${styles['border-r']}`;
                if (r === 2 || r === 5) cellClass += ` ${styles['border-b']}`;
                if (isFixed) cellClass += ` ${styles.fixed}`;
                if (isSolved) cellClass += ` ${styles['solved-cell']}`;
                if (isConflictCell) cellClass += ` ${styles.conflict}`;
                if (isSelected) cellClass += ` ${styles.selected}`;
                if (isHighlighted && !isSelected) cellClass += ` ${styles.highlighted}`;

                return (
                  <div
                    key={`${r}-${c}`}
                    className={cellClass}
                    onClick={() => selectCell(r, c)}
                  >
                    {value || ''}
                  </div>
                );
              })
            )}
          </div>

          <div className={styles.keypad}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <div
                key={n}
                className={styles.key}
                onClick={() => enterNum(n)}
              >
                {n}
              </div>
            ))}
            <div
              className={`${styles.key} ${styles.erase}`}
              onClick={() => enterNum(0)}
            >
              Effacer
            </div>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.card}>
            <div className={styles['card-title']}>Modélisation CSP</div>
            <span className={`${styles['csp-tag']} ${styles['tag-x']}`}>X : 81 variables</span>
            <span className={`${styles['csp-tag']} ${styles['tag-d']}`}>D : {'{'} 1..9{'}'}
            </span>
            <span className={`${styles['csp-tag']} ${styles['tag-c']}`}>C : 27 contraintes</span>
            <div className={styles['csp-desc']}>
              9 lignes + 9 colonnes + 9 blocs 3x3 — chaque unite impose des valeurs distinctes.
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles['card-title']}>Niveau de difficulte</div>
            <div className={styles['diff-btns']}>
              <button
                className={`${styles['diff-btn']} ${diff === 'easy' ? styles.active : ''}`}
                onClick={() => changeDiff('easy')}
              >
                Facile
              </button>
              <button
                className={`${styles['diff-btn']} ${diff === 'medium' ? styles.active : ''}`}
                onClick={() => changeDiff('medium')}
              >
                Moyen
              </button>
              <button
                className={`${styles['diff-btn']} ${diff === 'hard' ? styles.active : ''}`}
                onClick={() => changeDiff('hard')}
              >
                Difficile
              </button>
              <button
                className={`${styles['diff-btn']} ${diff === 'expert' ? styles.active : ''}`}
                onClick={() => changeDiff('expert')}
              >
                Expert
              </button>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles['card-title']}>Algorithme</div>
            <div className={styles['algo-btns']}>
              <button
                className={`${styles['algo-btn']} ${algo === 'bt' ? styles.active : ''}`}
                onClick={() => changeAlgo('bt')}
              >
                Backtracking
              </button>
              <button
                className={`${styles['algo-btn']} ${algo === 'ac3' ? styles.active : ''}`}
                onClick={() => changeAlgo('ac3')}
              >
                BT + AC-3
              </button>
              <button
                className={`${styles['algo-btn']} ${algo === 'mrv' ? styles.active : ''}`}
                onClick={() => changeAlgo('mrv')}
              >
                BT + AC-3 + MRV/LCV
              </button>
            </div>
            <div className={styles['algo-desc']}>{algoDesc}</div>
          </div>

          <div className={styles.card}>
            <div className={styles['card-title']}>Statistiques</div>
            <div className={styles['stats-grid']}>
              <div className={styles['stat-box']}>
                <div className={styles['stat-label']}>Cellules remplies</div>
                <div className={`${styles['stat-value']} ${styles['stat-green']}`}>{filled}</div>
              </div>
              <div className={styles['stat-box']}>
                <div className={styles['stat-label']}>Restantes</div>
                <div className={styles['stat-value']}>{remaining}</div>
              </div>
              <div className={styles['stat-box']}>
                <div className={styles['stat-label']}>Affectations</div>
                <div className={`${styles['stat-value']} ${styles['stat-yellow']}`}>{stepCount}</div>
              </div>
              <div className={styles['stat-box']}>
                <div className={styles['stat-label']}>Retours arriere</div>
                <div className={`${styles['stat-value']} ${styles['stat-red']}`}>{backCount}</div>
              </div>
              <div className={styles['stat-box']}>
                <div className={styles['stat-label']}>Propagations AC-3</div>
                <div className={styles['stat-value']}>{ac3Count}</div>
              </div>
              <div className={styles['stat-box']}>
                <div className={styles['stat-label']}>Domaines reduits</div>
                <div className={`${styles['stat-value']} ${styles['stat-yellow']}`}>{pruneCount}</div>
              </div>
            </div>
            <div className={styles['progress-wrap']}>
              <div className={styles['progress-label']}>
                <span>Progression</span>
                <span>{percentage}%</span>
              </div>
              <div className={styles['progress-bar']}>
                <div
                  className={`${styles['progress-fill']} ${percentage === 100 ? styles.green : ''}`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles['card-title']}>Controles</div>
            <div className={styles['speed-row']}>
              <label>Vitesse</label>
              <input
                type="range"
                min="1"
                max="5"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
              />
              <span>{['Lente', 'Lente', 'Normale', 'Rapide', 'Instantane'][speed - 1]}</span>
            </div>
            <div className={styles['btn-group']}>
              <button className={`${styles.btn} ${styles.primary}`} onClick={solveAuto}>
                Resoudre automatiquement
              </button>
              <button className={`${styles.btn} ${styles.step}`} onClick={solveOneStep}>
                Etape suivante
              </button>
              <button className={styles.btn} onClick={newPuzzle}>
                Nouveau puzzle
              </button>
              <button className={styles.btn} onClick={() => loadPuzzle(PUZZLES[diff])}>
                Reinitialiser
              </button>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles['card-title']}>Journal execution</div>
            <div className={styles['log-box']}>
              {logs.length === 0 ? (
                <div>En attente...</div>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className={log.className}>
                    {log.message}
                  </div>
                ))
              )}
            </div>
          </div>

          {showWin && (
            <div className={`${styles['win-banner']} ${styles.show}`}>
              Sudoku resolu ! Toutes les contraintes sont satisfaites.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
