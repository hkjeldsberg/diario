import type { Metadata } from 'next'
import { Playfair_Display, DM_Serif_Text, Caveat } from 'next/font/google'
import localFont from 'next/font/local'
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

const pappa = localFont({
  src: '../public/fonts/pappa.ttf',
  variable: '--font-pappa',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Diario',
  description: 'A personal memory book',
  manifest: '/favicon/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon/favicon.ico' },
    ],
    apple: '/favicon/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="no" className={`${playfair.variable} ${dmSerif.variable} ${caveat.variable} ${pappa.variable}`}>
      <body className="min-h-screen bg-cream">
        {children}
      </body>
    </html>
  )
}
