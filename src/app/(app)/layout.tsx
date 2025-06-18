'use client'

import * as React from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)', // Default width from example
          '--header-height': 'calc(var(--spacing) * 12)', // Default height from example
        } as React.CSSProperties
      }
    >
      <AppSidebar variant='inset' />
      <SidebarInset>
        <SiteHeader />
        <div className='flex flex-1 flex-col'>
          <main className='@container/main flex flex-1 flex-col gap-2 py-4 md:gap-6 md:py-6'>
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
