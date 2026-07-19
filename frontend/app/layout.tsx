import type { Metadata } from 'next'
// @ts-ignore: side-effect import of CSS may lack type declarations in this environment
import './globals.css'

export const metadata: Metadata = {
  title: 'TaxGenie — AI Chartered Accountant',
  description: 'File ITR, GST, payroll and more — powered by AI. Free CA replacement for India.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
