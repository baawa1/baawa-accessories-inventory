import React, { memo, useCallback } from 'react'
import { Row } from '@tanstack/react-table'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { flexRender } from '@tanstack/react-table'
import { TableRow, TableCell } from '@/components/ui/table'
import { DragHandle } from './DragHandle'

interface DraggableRowProps<T> {
  row: Row<T>
}

export const DraggableRow = memo(function DraggableRow<T>({ 
  row 
}: DraggableRowProps<T>) {
  const {
    attributes,
    listeners,
    transform,
    transition,
    setNodeRef,
    isDragging,
  } = useSortable({
    id: (row.original as any).id,
    disabled: false,
  })

  const renderCell = useCallback((cell: any) => {
    if (cell.column.id === 'drag') {
      return <DragHandle attributes={attributes} listeners={listeners} />
    }
    return flexRender(cell.column.columnDef.cell, cell.getContext())
  }, [attributes, listeners])

  return (
    <TableRow
      data-state={row.getIsSelected() && 'selected'}
      data-dragging={isDragging}
      ref={setNodeRef}
      className='relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80'
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {renderCell(cell)}
        </TableCell>
      ))}
    </TableRow>
  )
})
