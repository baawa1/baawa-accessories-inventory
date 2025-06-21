import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/contexts/AuthContext'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'BaaWA Accessories Inventory', // Updated title
  description: 'Inventory management for BaaWA Accessories', // Updated description
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      {/* Added suppressHydrationWarning for Shadcn UI theming */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* The main app structure is now handled by src/app/(app)/layout.tsx */}
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
        {/* Footer can be added here if it's global, or within (app)/layout.tsx */}
      </body>
    </html>
  )
}
