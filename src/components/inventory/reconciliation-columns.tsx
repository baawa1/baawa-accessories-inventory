'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Reconciliation, Product } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table-column-header'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { StockReconciliationDialog } from './StockReconciliationDialog'
import { useAuth } from '@/contexts/AuthContext'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const ActionCell = ({ row }: { row: any }) => {
  const { supabase } = useAuth()
  const reconciliationData = row.original
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    async function fetchProducts() {
      if (!supabase) return
      const { data, error } = await supabase.from('products').select('*')
      if (!error) {
        setProducts(data || [])
      }
    }

    fetchProducts()
  }, [supabase])

  const openEditDialog = () => {
    setEditDialogOpen(true)
  }

  const openViewDialog = () => {
    setViewDialogOpen(true)
  }

  return (
    <div className='flex gap-2'>
      <Button variant='secondary' onClick={openEditDialog}>
        Edit
      </Button>
      <Button variant='outline' onClick={openViewDialog}>
        View
      </Button>

      {editDialogOpen && (
        <StockReconciliationDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          products={products}
          reconciliationData={reconciliationData}
        />
      )}

      {viewDialogOpen && (
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reconciliation Details</DialogTitle>
            </DialogHeader>
            <div>
              {/* Render reconciliation details here */}
              <Button variant='default'>Approve</Button>
              <Button variant='destructive'>Reject</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export const columns: ColumnDef<Reconciliation>[] = [
  {
    accessorKey: 'created_at',
    header: 'Created At',
    cell: ({ row }) => {
      const createdAt = row.getValue('created_at')
      return createdAt
        ? new Intl.DateTimeFormat('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }).format(new Date(String(createdAt)))
        : 'N/A'
    },
  },
  {
    accessorKey: 'user_id',
    header: 'Created By',
    cell: ({ row }) => 'User Full Name (Future Implementation)',
  },
  {
    accessorKey: 'approved_by',
    header: 'Approved By',
    cell: ({ row }) => 'Approver Full Name (Future Implementation)',
  },
  {
    accessorKey: 'approval_notes',
    header: 'Approval Notes',
    cell: ({ row }) => row.getValue('approval_notes') || 'None',
  },
  {
    accessorKey: 'notes',
    header: 'Notes',
  },
  {
    accessorKey: 'approved_at',
    header: 'Approval Date',
    cell: ({ row }) => {
      const approvedAt = row.getValue('approved_at')
      return approvedAt
        ? new Intl.DateTimeFormat('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }).format(new Date(String(approvedAt)))
        : 'Pending'
    },
  },
  {
    accessorKey: 'discrepancies',
    header: 'Discrepancies',
    cell: ({ row }) => row.getValue('discrepancies') || 'N/A',
  },
  {
    accessorKey: 'estimated_impact',
    header: 'Estimated Impact',
    cell: ({ row }) => {
      const impact = Number(row.getValue('estimated_impact'))
      const variant = impact >= 0 ? 'default' : 'destructive'
      return <Badge variant={variant}>₦{impact.toLocaleString()}</Badge>
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      let variant: 'default' | 'secondary' | 'destructive' | 'outline' =
        'secondary'
      if (status === 'approved') variant = 'default'
      if (status === 'rejected') variant = 'destructive'
      if (status === 'pending') variant = 'outline'

      return <Badge variant={variant}>{status}</Badge>
    },
  },
  {
    accessorKey: 'action',
    header: 'Action',
    cell: ({ row }) => <ActionCell row={row} />,
  },
]
