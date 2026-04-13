<div align="center">

```
███████╗██╗   ██╗██████╗  ██████╗ ██╗  ██╗██╗   ██╗
██╔════╝██║   ██║██╔══██╗██╔═══██╗██║ ██╔╝██║   ██║
███████╗██║   ██║██║  ██║██║   ██║█████╔╝ ██║   ██║
╚════██║██║   ██║██║  ██║██║   ██║██╔═██╗ ██║   ██║
███████║╚██████╔╝██████╔╝╚██████╔╝██║  ██╗╚██████╔╝
╚══════╝ ╚═════╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝ ╚═════╝
        ✦  CSP  SOLVER  ✦  ALGORITHMES  CSP  ✦
```

**Résolveur de Sudoku — Backtracking · AC-3 · MRV/LCV**

[![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![License MIT](https://img.shields.io/badge/Licence-MIT-22c55e?style=for-the-badge)](./LICENSE)

<br/>

> *"Voir un algorithme résoudre un problème étape par étape — c'est exactement ce que fait ce projet."*

<br/>

[**🚀 Démo Live**](#) · [**📖 Documentation**](#algorithmes-expliqués) · [**🐛 Signaler un bug**](https://github.com/Lionel-RAKOTOMALALA/sudoku/issues)

</div>

---

## ✦ Aperçu

**Sudoku CSP Solver** est une application web interactive qui résout des grilles de Sudoku à l'aide de trois approches algorithmiques distinctes issues du domaine des **Problèmes de Satisfaction de Contraintes (CSP)**. Chaque résolution se déroule **visuellement, étape par étape**, avec des métriques en temps réel pour comparer l'efficacité de chaque méthode.

C'est un **outil pédagogique** pour comprendre les algorithmes de recherche et de propagation de contraintes — des techniques déterministes et entièrement explicables, sans apprentissage automatique.

```
Difficulté  →  Algorithme  →  Résolution animée  →  Analyse de performance
```

> **Note** — Ces algorithmes appartiennent à l'**IA symbolique classique** (années 80–90). Ils sont déterministes, entièrement explicables et ne font **aucun apprentissage**. Ils diffèrent fondamentalement du machine learning ou du deep learning modernes.

---

## ✦ Fonctionnalités

| Fonctionnalité | Détail |
|---|---|
| 🎯 **4 niveaux de difficulté** | Facile · Moyen · Difficile · Expert |
| 🧠 **3 algorithmes** | Backtracking pur, AC-3, MRV/LCV+AC-3 |
| 📊 **Analytics temps réel** | Étapes, retours arrière, assignations, élagages |
| 👁️ **Exécution visuelle** | Animation ajustable (vitesse 1–10) |
| 🌗 **Thème sombre/clair** | Intégration seamless |
| ⚡ **Métriques comparatives** | Visualisez l'efficacité relative des algorithmes |

---

## ✦ Algorithmes expliqués

### 1 — Backtracking pur (BT)

Recherche en profondeur classique. L'algorithme assigne des valeurs séquentiellement, détecte les conflits, et **revient en arrière** lorsqu'une impasse est atteinte.

```
Assignation → Conflit ? → Oui : Retour arrière
                        → Non : Continuer
```

- ✅ Simple, garantit de trouver une solution
- ❌ Peut générer **1000+ retours arrière** sur des puzzles difficiles

---

### 2 — Backtracking + AC-3

L'algorithme **AC-3** (Arc Consistency 3) propage les contraintes avant chaque assignation, réduisant les domaines des variables et éliminant les valeurs impossibles en amont.

```
Propagation AC-3 → Réduction des domaines → Assignation → ...
```

- ✅ Dramatiquement moins de retours arrière
- ✅ Meilleure performance sur puzzles complexes
- ❌ Surcoût pour les puzzles simples

---

### 3 — MRV/LCV + AC-3 (optimal)

L'approche la plus efficace, combinant deux heuristiques puissantes :

- **MRV** *(Minimum Remaining Values)* — Choisit la variable avec le **moins de valeurs possibles**
- **LCV** *(Least Constraining Value)* — Choisit la valeur qui **contraint le moins les voisins**

```
MRV → Variable critique  ─┐
LCV → Valeur optimale    ─┤→ AC-3 → Assignation → Répéter
```

- ✅ Performances optimales tous niveaux confondus
- ✅ Très peu de retours arrière (10–50 max)
- ✅ Le plus robuste des trois

---

## ✦ Comparaison des performances

```
                    BACKTRACKING PUR
  ████████████████████████████████████  1000+ retours arrière   ⏱ 5–15s

                    BACKTRACKING + AC-3
  █████████                              50–200 retours arrière  ⏱ 0.5–3s

                    MRV/LCV + AC-3
  ██                                     10–50 retours arrière   ⏱ 0.1–1s
```

| Algorithme | Retours arrière | Assignations | Appels AC-3 | Temps typique |
|---|---|---|---|---|
| **BT** | Très élevé (1000+) | Moyen | 0 | 5–15s |
| **BT + AC-3** | Faible (50–200) | Faible | Élevé | 0.5–3s |
| **MRV/LCV + AC-3** | Très faible (10–50) | Faible | Très élevé | 0.1–1s |

---

## ✦ Installation

### Prérequis

- **Node.js** ≥ 18
- **pnpm** ≥ 8 (ou npm/yarn)

### Démarrage rapide

```bash
# 1. Cloner le dépôt
git clone https://github.com/Lionel-RAKOTOMALALA/sudoku.git
cd sudoku

# 2. Installer les dépendances
pnpm install

# 3. Lancer le serveur de développement
pnpm dev

# 4. Ouvrir dans le navigateur
#    → http://localhost:3000
```

### Commandes disponibles

```bash
pnpm dev      # Serveur de développement (hot reload)
pnpm build    # Build de production
pnpm start    # Serveur de production
pnpm lint     # Vérification du code
```

---

## ✦ Utilisation

```
① Sélectionner la difficulté   →  Facile / Moyen / Difficile / Expert
② Choisir l'algorithme         →  BT / AC-3 / MRV+LCV
③ Régler la vitesse            →  Curseur 1 (lent) à 10 (rapide)
④ Lancer la résolution         →  Bouton "Résoudre"
⑤ Analyser les résultats       →  Métriques et statistiques affichées
```

---

## ✦ Structure du projet

```
sudoku/
├── app/
│   ├── layout.tsx          ← Layout racine avec métadonnées
│   ├── page.tsx            ← Composant principal du solveur
│   ├── globals.css         ← Styles globaux
│   └── sudoku.module.css   ← Styles spécifiques au composant
│
├── components/
│   ├── ui/                 ← Composants UI réutilisables
│   └── theme-provider.tsx  ← Gestion du thème
│
├── hooks/
│   ├── use-mobile.ts       ← Détection mobile
│   └── use-toast.ts        ← Notifications toast
│
├── lib/
│   └── utils.ts            ← Fonctions utilitaires
│
└── public/                 ← Ressources statiques
```

---

## ✦ Technologies utilisées

<div align="center">

| Technologie | Rôle |
|---|---|
| **Next.js 15** | Framework React avec SSR/SSG |
| **React 19** | Interface utilisateur réactive |
| **TypeScript** | Typage statique et robustesse |
| **Tailwind CSS** | Styles utilitaires |
| **CSS Modules** | Styles scopés par composant |
| **Radix UI** | Composants accessibles |
| **Vercel** | Déploiement et hébergement |

</div>

---

## ✦ Contribution

Les contributions sont les bienvenues ! Voici comment participer :

```bash
# 1. Forker le dépôt sur GitHub

# 2. Créer une branche de fonctionnalité
git checkout -b feature/ma-amelioration

# 3. Commiter vos changements
git commit -m "feat: ajouter ma-amelioration"

# 4. Pousser la branche
git push origin feature/ma-amelioration

# 5. Ouvrir une Pull Request sur GitHub
```

---

## ✦ Licence

Ce projet est distribué sous la licence **MIT**.
Voir le fichier [LICENSE](./LICENSE) pour les détails complets.

---

<div align="center">

**Conçu avec passion par [Lionel RAKOTOMALALA](https://github.com/Lionel-RAKOTOMALALA)**

*Algorithmique de recherche et satisfaction de contraintes appliquées au casse-tête le plus célèbre du monde.*

[![GitHub](https://img.shields.io/badge/GitHub-Lionel--RAKOTOMALALA-181717?style=flat-square&logo=github)](https://github.com/Lionel-RAKOTOMALALA)

</div>
