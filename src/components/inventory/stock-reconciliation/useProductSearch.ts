import { useState, useEffect, useRef } from 'react'
import { Product } from './types'

export const useProductSearch = (products: Product[], selectedProducts: any[]) => {
  const [productSearch, setProductSearch] = useState('')
  const [commandSearch, setCommandSearch] = useState('')
  const [commandComboOpen, setCommandComboOpen] = useState(false)
  
  const commandTriggerRef = useRef<HTMLInputElement>(null)
  const commandBoxRef = useRef<HTMLDivElement>(null)

  // Filter products that aren't already selected
  const filteredProducts = products.filter(
    (p) =>
      !selectedProducts.some((sp) => sp.id === p.id) &&
      p.name.toLowerCase().includes(productSearch.toLowerCase())
  )

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

  const resetSearch = () => {
    setProductSearch('')
    setCommandSearch('')
    setCommandComboOpen(false)
  }

  return {
    productSearch,
    setProductSearch,
    commandSearch,
    setCommandSearch,
    commandComboOpen,
    setCommandComboOpen,
    commandTriggerRef,
    commandBoxRef,
    filteredProducts,
    resetSearch,
  }
}
