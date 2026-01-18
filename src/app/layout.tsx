import type { Metadata } from 'next'
import { Poppins, Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ThemedLayout } from '@/components/layout/ThemedLayout'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Blindtest',
  description: 'Application de blindtest musical',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={`${poppins.variable} ${inter.variable}`}>
      <body className="min-h-screen text-white font-sans antialiased">
        <ThemeProvider>
          <ThemedLayout>{children}</ThemedLayout>
        </ThemeProvider>
      </body>
    </html>
  )
}
