import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'BetStarters Discovery Cockpit',
  description: 'Discovery tool for B2B iGaming consulting',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  )
}
