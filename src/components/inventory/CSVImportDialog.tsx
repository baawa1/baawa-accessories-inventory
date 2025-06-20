import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface CSVImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onFileSelected: (file: File) => void
  uploading: boolean
  error?: string
}

export function CSVImportDialog({
  open,
  onOpenChange,
  onFileSelected,
  uploading,
  error,
}: CSVImportDialogProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
      onFileSelected(e.target.files[0])
    }
  }

  const handleDialogClose = () => {
    setSelectedFile(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Products from CSV</DialogTitle>
        </DialogHeader>
        <div className='space-y-2'>
          <p>
            Download the{' '}
            <a
              href='/product-import-template.csv'
              className='text-blue-600 underline'
              target='_blank'
              rel='noopener noreferrer'
            >
              CSV template
            </a>{' '}
            and fill in your product data. Then upload your completed file
            below.
          </p>
          <Input
            type='file'
            accept='.csv'
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={uploading}
          />
          {selectedFile && (
            <div className='text-sm text-gray-600'>
              Selected: {selectedFile.name}
            </div>
          )}
          {error && <div className='text-sm text-red-500'>{error}</div>}
        </div>
        <DialogFooter>
          <Button
            variant='outline'
            onClick={handleDialogClose}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            onClick={() => selectedFile && onFileSelected(selectedFile)}
            disabled={!selectedFile || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
