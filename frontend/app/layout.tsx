import type { Metadata, Viewport } from 'next'
// @ts-ignore: side-effect import of CSS may lack type declarations in this environment
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0D0F14',
}

export const metadata: Metadata = {
  title: 'TaxGenie — AI Chartered Accountant',
  description: 'File ITR, GST, payroll and more — powered by AI. Free CA replacement for India.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
      </head>
      <body>{children}</body>
    </html>
  )
}
