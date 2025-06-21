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

interface Product {
  id: string
  name: string
  quantity_on_hand: number
  selling_price: number
  variants?: { sku_variant: string }[]
}

interface ReconProduct extends Product {
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
    const res = await fetch('/api/stock-reconciliations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const result = await res.json()
    if (res.ok) {
      onOpenChange(false)
    } else {
      alert(result.error || 'Failed to save reconciliation')
    }
  }

  const handleBack = () => {
    onOpenChange(false)
  }

  // Move ReconTableRow outside of StockReconciliationDialog
  function ReconTableRow({
    p,
    onPhysicalChange,
    onReasonChange,
    onRemove,
    discrepancyReasons,
  }: {
    p: ReconProduct
    onPhysicalChange: (id: string, value: string) => void
    onReasonChange: (id: string, value: string) => void
    onRemove: (id: string) => void
    discrepancyReasons: string[]
  }) {
    return (
      <tr key={p.id}>
        <td className='px-2 py-1 border'>{p.name}</td>
        <td className='px-2 py-1 border'>
          {p.variants?.map((v) => v.sku_variant).join(', ') || '-'}
        </td>
        <td className='px-2 py-1 border'>{p.quantity_on_hand} unit</td>
        <td className='px-2 py-1 border'>
          <Input
            type='number'
            min='0'
            value={p.physicalCount}
            onChange={(e) => onPhysicalChange(p.id, e.target.value)}
            className='w-24'
            placeholder='Enter value'
          />
        </td>
        <td
          className={`px-2 py-1 border ${
            p.discrepancy < 0 ? 'text-red-500' : 'text-green-600'
          }`}
        >
          {p.discrepancy} unit
        </td>
        <td
          className={`px-2 py-1 border ${
            p.estimatedImpact < 0 ? 'text-red-500' : 'text-green-600'
          }`}
        >
          {p.estimatedImpact === 0
            ? '₦0.00'
            : `₦${p.estimatedImpact.toLocaleString()}`}
        </td>
        <td className='px-2 py-1 border'>
          <Select
            value={p.reason}
            onValueChange={(val) => onReasonChange(p.id, val)}
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
        </td>
        <td className='px-2 py-1 border text-center'>
          <Button size='icon' variant='ghost' onClick={() => onRemove(p.id)}>
            ×
          </Button>
        </td>
      </tr>
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Stock Reconciliation</DialogTitle>
          <p className='text-sm text-gray-500'>
            Compare and adjust your inventory records with your physical
            inventory counts here.
          </p>
        </DialogHeader>

        <div className='flex flex-col gap-4 py-2'>
          {/* Combobox to add products */}
          <div className='relative w-full'>
            {/* --- Absolute Command Combobox (popover style) --- */}
            <div className='flex items-end w-full gap-8'>
              <div className='pt-4 relative w-full max-w-md'>
                <label className='block mb-1 text-sm font-medium'>
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
                    className='absolute left-0 z-50 mt-1 w-full bg-background border rounded-md shadow-lg max-h-64 overflow-auto'
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
              <div className='flex gap-2 ml-auto'>
                <Button variant='outline' onClick={handleBack}>
                  Back
                </Button>
                <Button
                  variant='secondary'
                  onClick={() => handleSaveOrSubmit('draft')}
                >
                  Save
                </Button>
                <Button
                  variant='default'
                  onClick={() => handleSaveOrSubmit('pending')}
                >
                  Submit
                </Button>
              </div>
            </div>
          </div>

          <div className='overflow-x-auto min-h-[200px] flex items-center justify-center'>
            {loading ? (
              <Spinner label='Loading reconciliation data...' />
            ) : selectedProducts.length === 0 ? (
              <div className='text-center w-full py-8 text-gray-400'>
                No products added. Use the search above to add products for
                reconciliation.
              </div>
            ) : (
              <table className='min-w-full border text-xs'>
                <thead>
                  <tr className='bg-gray-100'>
                    <th className='px-2 py-1 border'>Product Name</th>
                    <th className='px-2 py-1 border'>Variant</th>
                    <th className='px-2 py-1 border'>System count</th>
                    <th className='px-2 py-1 border'>Physical Count</th>
                    <th className='px-2 py-1 border'>Discrepancies</th>
                    <th className='px-2 py-1 border'>Estimated Impact</th>
                    <th className='px-2 py-1 border'>Discrepancy Reason</th>
                    <th className='px-2 py-1 border'>Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProducts.map((p) => (
                    <ReconTableRow
                      key={p.id}
                      p={p}
                      onPhysicalChange={handlePhysicalCountChange}
                      onReasonChange={handleReasonChange}
                      onRemove={handleRemoveProduct}
                      discrepancyReasons={discrepancyReasons}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
