import React from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface FormActionsProps {
  isLoading: boolean
  isEditing: boolean
  onCancel?: () => void
  submitText?: string
  cancelText?: string
}

export const FormActions: React.FC<FormActionsProps> = ({
  isLoading,
  isEditing,
  onCancel,
  submitText,
  cancelText = 'Cancel',
}) => {
  const defaultSubmitText = isEditing ? 'Update Product' : 'Save Product'

  return (
    <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
      <Button
        type="submit"
        disabled={isLoading}
        className="flex-1 sm:flex-none sm:min-w-[140px]"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isEditing ? 'Updating...' : 'Saving...'}
          </>
        ) : (
          submitText || defaultSubmitText
        )}
      </Button>

      {onCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 sm:flex-none sm:min-w-[100px]"
        >
          {cancelText}
        </Button>
      )}
    </div>
  )
}
