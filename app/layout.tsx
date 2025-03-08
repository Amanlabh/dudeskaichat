import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DU Desk AI',
  description: 'DU Desk AI is a helpful assistant that determines CUET course eligibility based on exam attempts.',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
