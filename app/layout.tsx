import type { Metadata } from 'next'
import { Playfair_Display, DM_Serif_Text, Caveat } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const dmSerif = DM_Serif_Text({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-dm-serif',
  display: 'swap',
})

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-caveat',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Diario',
  description: 'A personal memory book',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="no" className={`${playfair.variable} ${dmSerif.variable} ${caveat.variable}`}>
      <body className="min-h-screen bg-cream">
        {children}
      </body>
    </html>
  )
}
