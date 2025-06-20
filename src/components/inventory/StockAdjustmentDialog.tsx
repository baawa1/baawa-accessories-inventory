import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'

interface StockAdjustmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string
  variantId?: number
  onSuccess?: (newQty: number) => void
}

export function StockAdjustmentDialog({
  open,
  onOpenChange,
  productId,
  variantId,
  onSuccess,
  suppliers = [], // Always use suppliers from props
}: StockAdjustmentDialogProps & {
  suppliers?: { id: string; name: string }[]
}) {
  const [quantity, setQuantity] = useState(1)
  const [restockDate, setRestockDate] = useState<Date | undefined>(new Date())
  const [supplierId, setSupplierId] = useState('')
  const [costPrice, setCostPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stock-adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          variant_id: variantId,
          adjustment_type: 'po_received', // Always add stock
          quantity_changed: quantity,
          reason: notes,
          restock_date: restockDate
            ? restockDate.toISOString().slice(0, 10)
            : undefined,
          supplier_id: supplierId,
          cost_price: costPrice ? Number(costPrice) : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Adjustment failed')
      if (onSuccess) onSuccess(data.newQty)
      onOpenChange(false)
      setQuantity(1)
      setNotes('')
      setSupplierId('')
      setCostPrice('')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Stock</DialogTitle>
        </DialogHeader>
        <div className='flex flex-col gap-4'>
          <div className='flex gap-4'>
            <div className='flex-1'>
              <label>Quantity *</label>
              <Input
                type='number'
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                placeholder='Enter quantity'
                required
              />
            </div>
            <div className='flex-1'>
              <label>Restock Date</label>
              <DatePicker date={restockDate} onChange={setRestockDate} />
            </div>
          </div>
          <div className='flex gap-4'>
            <div className='flex-1'>
              <label>Cost Price</label>
              <Input
                type='number'
                min={0}
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder='Enter cost price'
              />
            </div>
            <div className='flex-1'>
              <label>Supplier</label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder='Select supplier' />
                </SelectTrigger>
                <SelectContent>
                  {suppliers?.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label>Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder='Notes (optional)'
            />
          </div>
          {error && <div className='text-red-500 text-sm'>{error}</div>}
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={loading || quantity < 1}>
            {loading ? 'Saving...' : 'Add Stock'}
          </Button>
          <Button variant='ghost' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
