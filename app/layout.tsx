import type { Metadata } from 'next'
import './globals.css'

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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&family=Open+Sans:wght@300;400;600;700&family=Lato:wght@300;400;700&family=Montserrat:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&family=Playfair+Display:wght@400;700&family=Merriweather:wght@300;400;700&family=Space+Mono:wght@400;700&family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;500;600;700&family=Quicksand:wght@300;400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body>{children}</body>
    </html>
  )
}