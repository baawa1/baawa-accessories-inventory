import { useState, useEffect, useCallback } from 'react'
import { useErrorHandler } from './use-error-handler'
import { SupabaseRepository } from '@/lib/supabase-repository'

export interface UseDataFetchOptions {
  immediate?: boolean
  dependencies?: any[]
}

export function useDataFetch<T>(
  repository: SupabaseRepository<T>,
  options: UseDataFetchOptions = {}
) {
  const { immediate = true, dependencies = [] } = options
  const [data, setData] = useState<T[] | null>(null)
  const [loading, setLoading] = useState(immediate)
  const { error, handleError, clearError } = useErrorHandler()

  const fetchData = useCallback(async (filters?: Record<string, any>) => {
    setLoading(true)
    clearError()

    const result = await repository.findAll(filters)
    
    if (result.error) {
      handleError(result.error, 'data fetch')
    } else {
      setData(result.data)
    }
    
    setLoading(false)
  }, [repository, handleError, clearError])

  const refetch = useCallback((filters?: Record<string, any>) => {
    return fetchData(filters)
  }, [fetchData])

  useEffect(() => {
    if (immediate) {
      fetchData()
    }
  }, dependencies)

  return {
    data,
    loading,
    error,
    fetchData,
    refetch,
    clearError,
  }
}

export function useEntityById<T>(
  repository: SupabaseRepository<T>,
  id: string | number | null
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(!!id)
  const { error, handleError, clearError } = useErrorHandler()

  const fetchEntity = useCallback(async (entityId: string | number) => {
    setLoading(true)
    clearError()

    const result = await repository.findById(entityId)
    
    if (result.error) {
      handleError(result.error, 'entity fetch')
    } else {
      setData(result.data)
    }
    
    setLoading(false)
  }, [repository, handleError, clearError])

  useEffect(() => {
    if (id) {
      fetchEntity(id)
    } else {
      setData(null)
      setLoading(false)
    }
  }, [id, fetchEntity])

  return {
    data,
    loading,
    error,
    refetch: id ? () => fetchEntity(id) : undefined,
    clearError,
  }
}

export function useCreateEntity<T>(repository: SupabaseRepository<T>) {
  const [loading, setLoading] = useState(false)
  const { error, handleError, clearError } = useErrorHandler()

  const createEntity = useCallback(async (data: Partial<T>) => {
    setLoading(true)
    clearError()

    const result = await repository.create(data)
    setLoading(false)
    
    if (result.error) {
      handleError(result.error, 'entity creation')
      return null
    }
    
    return result.data
  }, [repository, handleError, clearError])

  return {
    createEntity,
    loading,
    error,
    clearError,
  }
}

export function useUpdateEntity<T>(repository: SupabaseRepository<T>) {
  const [loading, setLoading] = useState(false)
  const { error, handleError, clearError } = useErrorHandler()

  const updateEntity = useCallback(async (id: string | number, data: Partial<T>) => {
    setLoading(true)
    clearError()

    const result = await repository.update(id, data)
    setLoading(false)
    
    if (result.error) {
      handleError(result.error, 'entity update')
      return null
    }
    
    return result.data
  }, [repository, handleError, clearError])

  return {
    updateEntity,
    loading,
    error,
    clearError,
  }
}

export function useDeleteEntity<T>(repository: SupabaseRepository<T>) {
  const [loading, setLoading] = useState(false)
  const { error, handleError, clearError } = useErrorHandler()

  const deleteEntity = useCallback(async (id: string | number) => {
    setLoading(true)
    clearError()

    const result = await repository.delete(id)
    setLoading(false)
    
    if (result.error) {
      handleError(result.error, 'entity deletion')
      return false
    }
    
    return true
  }, [repository, handleError, clearError])

  return {
    deleteEntity,
    loading,
    error,
    clearError,
  }
}
