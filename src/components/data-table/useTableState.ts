'use client'

import { useState, useEffect, useCallback } from 'react'
import { ProductRow, TableState, DEFAULT_VISIBLE_COLUMNS, COLUMN_VIS_KEY } from './types'

export const useTableState = (initialData: ProductRow[]) => {
  const [data, setData] = useState(() => initialData)
  const [tableState, setTableState] = useState<TableState>({
    rowSelection: {},
    columnVisibility: DEFAULT_VISIBLE_COLUMNS,
    columnFilters: [],
    sorting: [],
    pagination: {
      pageIndex: 0,
      pageSize: 10,
    },
    expandedRows: {},
  })

  // Sync local data state with prop changes
  useEffect(() => {
    setData(initialData)
  }, [initialData])

  // Load column visibility from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(COLUMN_VIS_KEY)
    if (saved) {
      setTableState(prev => ({
        ...prev,
        columnVisibility: JSON.parse(saved)
      }))
    }
  }, [])

  // Save column visibility to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(COLUMN_VIS_KEY, JSON.stringify(tableState.columnVisibility))
  }, [tableState.columnVisibility])

  const updateTableState = useCallback((updates: Partial<TableState>) => {
    setTableState(prev => ({ ...prev, ...updates }))
  }, [])

  const toggleRowExpansion = useCallback((id: string) => {
    setTableState(prev => ({
      ...prev,
      expandedRows: {
        ...prev.expandedRows,
        [id]: !prev.expandedRows[id]
      }
    }))
  }, [])

  const reorderData = useCallback((activeId: string, overId: string) => {
    setData(prev => {
      const oldIndex = prev.findIndex(item => item.id === activeId)
      const newIndex = prev.findIndex(item => item.id === overId)
      
      if (oldIndex === -1 || newIndex === -1) return prev
      
      const newData = [...prev]
      const [reorderedItem] = newData.splice(oldIndex, 1)
      newData.splice(newIndex, 0, reorderedItem)
      
      return newData
    })
  }, [])

  return {
    data,
    setData,
    tableState,
    updateTableState,
    toggleRowExpansion,
    reorderData,
  }
}
