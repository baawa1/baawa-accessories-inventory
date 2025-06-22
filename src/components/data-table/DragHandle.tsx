import React, { memo } from 'react'
import { Button } from '@/components/ui/button'
import { IconGripVertical } from '@tabler/icons-react'

export interface DragHandleProps {
  attributes: any
  listeners: any
}

export const DragHandle = memo(function DragHandle({
  attributes,
  listeners,
}: DragHandleProps) {
  return (
    <Button
      {...attributes}
      {...listeners}
      variant='ghost'
      size='icon'
      className='text-muted-foreground size-7 hover:bg-transparent'
    >
      <IconGripVertical className='text-muted-foreground size-3' />
      <span className='sr-only'>Drag to reorder</span>
    </Button>
  )
})
