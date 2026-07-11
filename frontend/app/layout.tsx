import type { Metadata } from 'next'
// Ignore TS error for side-effect CSS import when no module declarations are present
// @ts-ignore
import './globals.css'

export const metadata: Metadata = {
  title: 'TaxGenie — AI Chartered Accountant',
  description: 'File ITR, GST, payroll and more — powered by AI',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
