import type { Metadata } from 'next'
import './globals.css'
import { Inter, Roboto, Open_Sans, Lato, Montserrat, Poppins, Playfair_Display, Merriweather, Space_Mono, Orbitron, Rajdhani, Quicksand, DM_Mono } from 'next/font/google'
import AnalyticsClient from '../components/AnalyticsClient'

const inter = Inter({ subsets: ['latin'], weight: ['300','400','500','600','700'], variable: '--font-inter', display: 'swap' })
const roboto = Roboto({ subsets: ['latin'], weight: ['300','400','500','700'], variable: '--font-roboto', display: 'swap' })
const openSans = Open_Sans({ subsets: ['latin'], weight: ['300','400','600','700'], variable: '--font-open-sans', display: 'swap' })
const lato = Lato({ subsets: ['latin'], weight: ['300','400','700'], variable: '--font-lato', display: 'swap' })
const montserrat = Montserrat({ subsets: ['latin'], weight: ['300','400','500','600','700'], variable: '--font-montserrat', display: 'swap' })
const poppins = Poppins({ subsets: ['latin'], weight: ['300','400','500','600','700'], variable: '--font-poppins', display: 'swap' })
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400','700'], variable: '--font-playfair', display: 'swap' })
const merriweather = Merriweather({ subsets: ['latin'], weight: ['300','400','700'], variable: '--font-merriweather', display: 'swap' })
const spaceMono = Space_Mono({ subsets: ['latin'], weight: ['400','700'], variable: '--font-space-mono', display: 'swap' })
const orbitron = Orbitron({ subsets: ['latin'], weight: ['400','700','900'], variable: '--font-orbitron', display: 'swap' })
const rajdhani = Rajdhani({ subsets: ['latin'], weight: ['300','400','500','600','700'], variable: '--font-rajdhani', display: 'swap' })
const quicksand = Quicksand({ subsets: ['latin'], weight: ['300','400','500','600','700'], variable: '--font-quicksand', display: 'swap' })
const dmMono = DM_Mono({ subsets: ['latin'], weight: ['300','400','500'], variable: '--font-dm-mono', display: 'swap' })

export const metadata: Metadata = {
  title: 'Data Moodboard - Interactive Data Visualization Canvas',
  description: 'A Figma-like canvas for creating interactive data visualizations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${roboto.variable} ${openSans.variable} ${lato.variable} ${montserrat.variable} ${poppins.variable} ${playfair.variable} ${merriweather.variable} ${spaceMono.variable} ${orbitron.variable} ${rajdhani.variable} ${quicksand.variable} ${dmMono.variable}`}>
      <head>
      </head>
      <body>
        {children}
        <AnalyticsClient />
      </body>
    </html>
  )
}