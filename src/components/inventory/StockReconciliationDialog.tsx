import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from '@/components/ui/command'
import { Reconciliation } from '@/lib/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Product {
  id: string
  name: string
  quantity_on_hand: number
  selling_price: number
  variants?: { sku_variant: string }[]
}

export interface ReconProduct extends Product {
  physicalCount: string | number
  discrepancy: number
  estimatedImpact: number
  reason: string
}

interface StockReconciliationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: Product[]
  reconciliationData?: Reconciliation // Accept Reconciliation type
}

const discrepancyReasons = [
  'Fraud',
  'Lost',
  'Data Entry Error',
  'Expired',
  'Others',
  'Supplier Error',
  'Overstocking',
  'Understocking',
]

export function StockReconciliationDialog({
  open,
  onOpenChange,
  products,
  loading,
  reconciliationData,
}: StockReconciliationDialogProps & { loading?: boolean }) {
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data?.user?.id || null)
    })
  }, [])

  const [selectedProducts, setSelectedProducts] = useState<ReconProduct[]>(
    reconciliationData?.data
      ? (typeof reconciliationData.data === 'string'
          ? JSON.parse(reconciliationData.data)
          : reconciliationData.data
        ).map((product: any) => ({
          id: product.id,
          name: product.name,
          quantity_on_hand: product.quantity_on_hand || 0,
          selling_price: product.selling_price || 0,
          physicalCount: product.physicalCount || '',
          discrepancy: product.discrepancy || 0,
          estimatedImpact: product.estimatedImpact || 0,
          reason: product.reason || '',
        }))
      : []
  )

  useEffect(() => {
    if (open && !reconciliationData) {
      setSelectedProducts([])
    }
  }, [open, reconciliationData])

  const [productSearch, setProductSearch] = useState('')
  const filteredProducts = products.filter(
    (p) =>
      !selectedProducts.some((sp) => sp.id === p.id) &&
      p.name.toLowerCase().includes(productSearch.toLowerCase())
  )
  const [selectedProductId, setSelectedProductId] = useState<
    string | undefined
  >(undefined)

  const handleAddProduct = (product: Product) => {
    if (selectedProducts.some((p) => p.id === product.id)) return
    setSelectedProducts((prev) => [
      ...prev,
      {
        ...product,
        physicalCount: '',
        discrepancy: 0,
        estimatedImpact: 0,
        reason: '',
      },
    ])
  }

  const handleRemoveProduct = (id: string) => {
    setSelectedProducts((prev) => prev.filter((p) => p.id !== id))
  }

  const handlePhysicalCountChange = (id: string, value: string) => {
    setSelectedProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const physical = value === '' ? '' : parseInt(value, 10)
        const discrepancy =
          physical === '' ? 0 : (physical as number) - p.quantity_on_hand
        const estimatedImpact = discrepancy * (p.selling_price || 0)
        return { ...p, physicalCount: value, discrepancy, estimatedImpact }
      })
    )
  }
  const handleReasonChange = (id: string, value: string) => {
    setSelectedProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, reason: value } : p))
    )
  }

  async function handleSaveOrSubmit(status: 'draft' | 'pending') {
    const payload = {
      created_by: null,
      status,
      notes: '',
      data: selectedProducts,
    }

    const url = reconciliationData
      ? `/api/stock-reconciliations/${reconciliationData.id}` // Update existing reconciliation
      : '/api/stock-reconciliations' // Create new reconciliation

    const method = reconciliationData ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Failed to save reconciliation: ${errorText}`)
      }

      const result = await res.json()
      onOpenChange(false)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unexpected error occurred'
      alert(errorMessage)
    }
  }

  const handleBack = () => {
    onOpenChange(false)
  }

  async function handleApprovalOrRejection(action: 'approve' | 'reject') {
    if (!reconciliationData) return

    const payload = {
      status: action === 'approve' ? 'approved' : 'rejected',
      approval_notes: '',
      data: selectedProducts,
    }

    const url = `/api/stock-reconciliations/${reconciliationData.id}`

    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const supabaseResponse = await res.json()

      if (!res.ok) {
        console.error('Supabase response:', supabaseResponse)
        console.error('Supabase query failed:', {
          table: 'stock_reconciliations',
          update: payload,
          filter: { id: reconciliationData.id },
        })
        const errorText = await res.text()
        throw new Error(`Failed to ${action} reconciliation: ${errorText}`)
      }

      if (action === 'approve') {
        // Update product quantities to match physical count
        for (const product of selectedProducts) {
          const productUpdateUrl = `/api/products/${product.id}`
          const productPayload = {
            quantity_on_hand: product.physicalCount,
          }

          const productRes = await fetch(productUpdateUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productPayload),
          })

          if (!productRes.ok) {
            console.error('Failed to update product:', product)
          }
        }
      }

      onOpenChange(false)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unexpected error occurred'
      alert(errorMessage)
    }
  }

  // Move ReconTableRow outside of StockReconciliationDialog
  function ReconTableRow({
    p,
    onPhysicalChange,
    onReasonChange,
    onRemove,
    discrepancyReasons,
    isDisabled,
  }: {
    p: ReconProduct
    onPhysicalChange: (id: string, value: string) => void
    onReasonChange: (id: string, value: string) => void
    onRemove: (id: string) => void
    discrepancyReasons: string[]
    isDisabled: boolean
  }) {
    return (
      <TableRow key={p.id}>
        <TableCell>{p.name}</TableCell>
        <TableCell>
          {p.variants?.map((v) => v.sku_variant).join(', ') || '-'}
        </TableCell>
        <TableCell>{p.quantity_on_hand} unit</TableCell>
        <TableCell>
          <Input
            type='number'
            min='0'
            value={p.physicalCount}
            onChange={(e) => onPhysicalChange(p.id, e.target.value)}
            className='w-24'
            placeholder='Enter value'
            disabled={isDisabled}
          />
        </TableCell>
        <TableCell
          className={`{ p.discrepancy < 0 ? 'text-red-500' : 'text-green-600' }`}
        >
          {p.discrepancy} unit
        </TableCell>
        <TableCell
          className={`{ p.estimatedImpact < 0 ? 'text-red-500' : 'text-green-600' }`}
        >
          {p.estimatedImpact === 0
            ? '₦0.00'
            : `₦${p.estimatedImpact.toLocaleString()}`}
        </TableCell>
        <TableCell>
          <Select
            value={p.reason}
            onValueChange={(val) => onReasonChange(p.id, val)}
            disabled={isDisabled}
          >
            <SelectTrigger className='w-32'>
              <SelectValue placeholder='Select' />
            </SelectTrigger>
            <SelectContent>
              {discrepancyReasons.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell>
          <Button size='icon' variant='ghost' onClick={() => onRemove(p.id)}>
            ×
          </Button>
        </TableCell>
      </TableRow>
    )
  }

  const [commandSearch, setCommandSearch] = useState('')
  const [commandComboOpen, setCommandComboOpen] = useState(false)
  const commandTriggerRef = React.useRef<HTMLInputElement>(null)
  const commandBoxRef = React.useRef<HTMLDivElement>(null)

  // Close combobox on click outside
  useEffect(() => {
    if (!commandComboOpen) return
    function handleClick(e: MouseEvent) {
      if (
        commandBoxRef.current &&
        !commandBoxRef.current.contains(e.target as Node) &&
        commandTriggerRef.current &&
        !commandTriggerRef.current.contains(e.target as Node)
      ) {
        setCommandComboOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [commandComboOpen])

  // Update UI to disable buttons and fields based on status
  const isDisabled =
    reconciliationData?.status === 'approved' ||
    reconciliationData?.status === 'rejected'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-4xl'>
        <DialogHeader>
          <DialogTitle>Stock Reconciliation</DialogTitle>
          <p className='text-sm text-gray-500'>
            Compare and adjust your inventory records with your physical
            inventory counts here.
          </p>
        </DialogHeader>

        <div className='flex flex-col gap-4 overflow-hidden py-2'>
          {/* Combobox to add products */}
          <div className='relative w-full'>
            {/* --- Absolute Command Combobox (popover style) --- */}
            <div className='flex w-full items-end gap-8'>
              <div className='relative w-full max-w-md pt-4'>
                <label className='mb-1 block text-sm font-medium'>
                  Add Product
                </label>
                <Input
                  ref={commandTriggerRef}
                  placeholder='Type to search products...'
                  value={commandSearch}
                  onFocus={() => setCommandComboOpen(true)}
                  onChange={(e) => {
                    setCommandSearch(e.target.value)
                    if (!commandComboOpen) setCommandComboOpen(true)
                  }}
                  className='w-full'
                  autoComplete='off'
                />
                {commandComboOpen && (
                  <div
                    ref={commandBoxRef}
                    className='bg-background absolute left-0 z-50 mt-1 max-h-64 w-full overflow-auto rounded-md border shadow-lg'
                  >
                    <Command className='w-full border-0 shadow-none'>
                      <CommandList className='max-h-64 overflow-auto'>
                        {products.filter(
                          (p) =>
                            !selectedProducts.some((sp) => sp.id === p.id) &&
                            p.name
                              .toLowerCase()
                              .includes(commandSearch.toLowerCase())
                        ).length === 0 ? (
                          <CommandEmpty>No products found</CommandEmpty>
                        ) : (
                          products
                            .filter(
                              (p) =>
                                !selectedProducts.some(
                                  (sp) => sp.id === p.id
                                ) &&
                                p.name
                                  .toLowerCase()
                                  .includes(commandSearch.toLowerCase())
                            )
                            .map((product) => (
                              <CommandItem
                                key={product.id}
                                value={product.name}
                                onSelect={() => {
                                  handleAddProduct(product)
                                  setCommandSearch('')
                                  setCommandComboOpen(false)
                                  commandTriggerRef.current?.blur()
                                }}
                              >
                                {product.name}{' '}
                                {product.variants?.length
                                  ? `(${product.variants.map((v) => v.sku_variant).join(', ')})`
                                  : ''}
                              </CommandItem>
                            ))
                        )}
                      </CommandList>
                    </Command>
                  </div>
                )}
              </div>

              {/* Action buttons at the top */}
              <div className='ml-auto flex gap-2'>
                <Button
                  variant='outline'
                  onClick={handleBack}
                  disabled={isDisabled}
                >
                  Back
                </Button>
                <Button
                  variant='secondary'
                  onClick={() => handleApprovalOrRejection('approve')}
                  disabled={isDisabled}
                >
                  Approve
                </Button>
                <Button
                  variant='default'
                  onClick={() => handleApprovalOrRejection('reject')}
                  disabled={isDisabled}
                >
                  Reject
                </Button>
              </div>
            </div>
          </div>

          <div className='flex min-h-[200px] items-center justify-center overflow-x-auto'>
            {loading ? (
              <Spinner label='Loading reconciliation data...' />
            ) : selectedProducts.length === 0 ? (
              <div className='w-full py-8 text-center text-gray-400'>
                No products added. Use the search above to add products for
                reconciliation.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Variant</TableHead>
                    <TableHead>System count</TableHead>
                    <TableHead>Physical Count</TableHead>
                    <TableHead>Discrepancies</TableHead>
                    <TableHead>Estimated Impact</TableHead>
                    <TableHead>Discrepancy Reason</TableHead>
                    <TableHead>Remove</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedProducts.map((p) => (
                    <ReconTableRow
                      key={p.id}
                      p={p}
                      onPhysicalChange={handlePhysicalCountChange}
                      onReasonChange={handleReasonChange}
                      onRemove={handleRemoveProduct}
                      discrepancyReasons={discrepancyReasons}
                      isDisabled={isDisabled}
                    />
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
