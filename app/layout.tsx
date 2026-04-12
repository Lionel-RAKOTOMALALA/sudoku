import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { DM_Sans, Space_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });
const dmSans = DM_Sans({ subsets: ["latin"], variable: '--font-dm-sans' });
const spaceMono = Space_Mono({ subsets: ["latin"], weight: ['400', '700'], variable: '--font-space-mono' });

export const metadata: Metadata = {
  title: 'Sudoku CSP Solver',
  description: 'Sudoku solver using Constraint Satisfaction Problem algorithms (Backtracking, AC-3, MRV/LCV)',

}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${spaceMono.variable}`}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
