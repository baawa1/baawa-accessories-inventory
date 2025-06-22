import { useState, useCallback } from 'react'

export interface ErrorState {
  message: string
  code?: string
  details?: any
}

export function useErrorHandler() {
  const [error, setError] = useState<ErrorState | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleError = useCallback((error: unknown, context?: string) => {
    console.error(`Error${context ? ` in ${context}` : ''}:`, error)
    
    if (error instanceof Error) {
      setError({
        message: error.message,
        details: error.stack,
      })
    } else if (typeof error === 'string') {
      setError({
        message: error,
      })
    } else {
      setError({
        message: 'An unexpected error occurred',
        details: error,
      })
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const executeWithErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T | null> => {
    setIsLoading(true)
    clearError()
    
    try {
      const result = await operation()
      return result
    } catch (error) {
      handleError(error, context)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [handleError, clearError])

  return {
    error,
    isLoading,
    handleError,
    clearError,
    executeWithErrorHandling,
  }
}

// Standard error messages
export const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your connection and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied. You do not have permission to access this resource.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
  SERVER: 'Server error. Please try again later.',
  UNKNOWN: 'An unexpected error occurred. Please try again.',
} as const

// Error type classification
export function classifyError(error: unknown): {
  message: string
  isRetryable: boolean
  category: keyof typeof ERROR_MESSAGES
} {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    
    if (message.includes('network') || message.includes('fetch')) {
      return {
        message: ERROR_MESSAGES.NETWORK,
        isRetryable: true,
        category: 'NETWORK'
      }
    }
    
    if (message.includes('unauthorized') || message.includes('401')) {
      return {
        message: ERROR_MESSAGES.UNAUTHORIZED,
        isRetryable: false,
        category: 'UNAUTHORIZED'
      }
    }
    
    if (message.includes('forbidden') || message.includes('403')) {
      return {
        message: ERROR_MESSAGES.FORBIDDEN,
        isRetryable: false,
        category: 'FORBIDDEN'
      }
    }
    
    if (message.includes('not found') || message.includes('404')) {
      return {
        message: ERROR_MESSAGES.NOT_FOUND,
        isRetryable: false,
        category: 'NOT_FOUND'
      }
    }
    
    if (message.includes('validation') || message.includes('400')) {
      return {
        message: ERROR_MESSAGES.VALIDATION,
        isRetryable: false,
        category: 'VALIDATION'
      }
    }
    
    if (message.includes('server') || message.includes('500')) {
      return {
        message: ERROR_MESSAGES.SERVER,
        isRetryable: true,
        category: 'SERVER'
      }
    }
  }
  
  return {
    message: ERROR_MESSAGES.UNKNOWN,
    isRetryable: true,
    category: 'UNKNOWN'
  }
}
