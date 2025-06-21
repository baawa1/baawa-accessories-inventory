'use client'

import { Reconciliation } from '../../lib/types'
import { columns } from '@/components/inventory/reconciliation-columns'
import { GenericDataTable } from '@/components/generic-data-table'

interface ReconciliationsListProps {
  reconciliations: Reconciliation[]
}

export default function ReconciliationsList({
  reconciliations,
}: ReconciliationsListProps) {
  return (
    <div>
      <GenericDataTable columns={columns} data={reconciliations} />
    </div>
  )
}
