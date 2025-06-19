'use client'

import Link from 'next/link'
import { IconCirclePlusFilled, IconMail, type Icon } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
    items?: { title: string; url: string }[]
  }[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className='flex flex-col gap-2'>
        <SidebarMenu>
          <SidebarMenuItem className='flex items-center gap-2'>
            <SidebarMenuButton
              tooltip='Quick Create'
              className='bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear'
            >
              <IconCirclePlusFilled />
              <span>Quick Create</span>
            </SidebarMenuButton>
            <Button
              size='icon'
              className='size-8 group-data-[collapsible=icon]:opacity-0'
              variant='outline'
            >
              <IconMail />
              <span className='sr-only'>Inbox</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          <Accordion type='multiple' className='w-full'>
            {items.map((item) =>
              item.items && item.items.length > 0 ? (
                <AccordionItem
                  value={item.title}
                  key={item.title}
                  className='border-0'
                >
                  <AccordionTrigger>
                    <span className='flex w-full items-center justify-start gap-2'>
                      {item.icon && <item.icon size={18} />}
                      <span>{item.title}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className='pl-6'>
                    <SidebarMenu>
                      {item.items.map((sub) => (
                        <SidebarMenuItem key={sub.title}>
                          <Link href={sub.url} className='w-full'>
                            <SidebarMenuButton className='flex w-full items-center justify-start gap-2'>
                              <span>{sub.title}</span>
                            </SidebarMenuButton>
                          </Link>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </AccordionContent>
                </AccordionItem>
              ) : (
                <SidebarMenuItem key={item.title}>
                  <Link
                    href={item.url}
                    passHref
                    legacyBehavior={false}
                    className='w-full'
                  >
                    <SidebarMenuButton
                      tooltip={item.title}
                      className='flex w-full items-center justify-start gap-2'
                    >
                      {item.icon && <item.icon size={18} />}
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              )
            )}
          </Accordion>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
