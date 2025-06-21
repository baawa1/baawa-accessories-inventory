'use client'

import * as React from 'react'
import Link from 'next/link' // Import Link for navigation
import {
  IconLayoutDashboard,
  IconBoxSeam,
  IconShoppingCart,
  IconSettings,
  IconHelp,
  IconSearch,
} from '@tabler/icons-react'

import { NavMain } from '@/components/nav-main'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useIsMobile } from '@/hooks/use-mobile' // Corrected import
import { Button } from '@/components/ui/button' // Import Button for the search

const navItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: IconLayoutDashboard,
  },
  {
    title: 'Inventory',
    url: '/inventory',
    icon: IconBoxSeam,
    items: [
      { title: 'Products', url: '/inventory' },
      { title: 'Add Product', url: '/inventory/add' },
      { title: 'Adjustments', url: '/inventory/adjustments' },
      { title: 'Reconciliations', url: '/inventory/reconciliations' },
    ],
  },
  {
    title: 'POS',
    url: '/pos',
    icon: IconShoppingCart,
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: IconSettings,
  },
]

// Minimal SidebarProps definition matching the one in ui/sidebar.tsx if not globally available
interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: 'left' | 'right'
  variant?: 'sidebar' | 'floating' | 'inset'
  collapsible?: 'offcanvas' | 'icon' | 'none'
}

export function AppSidebar({ className, variant, ...props }: SidebarProps) {
  const isMobile = useIsMobile()

  return (
    <Sidebar className={className} variant={variant || 'sidebar'} {...props}>
      <SidebarHeader>
        <div className='flex h-12 items-center justify-center'>
          <Link href='/dashboard' className='text-lg font-semibold'>
            BaaWA
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <Button
            variant='outline' // Changed from secondary to a valid Button variant
            className='w-full justify-start gap-2'
            // Removed asChild and the wrapping span to make it a functional button
            // onClick={() => { /* Implement search functionality here */ }}
          >
            <IconSearch size={16} />
            <span>Search...</span>
          </Button>
        </SidebarMenu>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href='/help' className='flex items-center gap-2 w-full'>
              <IconHelp size={16} />
              Help & Support
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
        <NavUser
          user={{
            name: 'Admin User',
            email: 'admin@baawa.com',
            avatar: '/avatars/placeholder.jpg', // Ensure this path exists or use a valid one
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
