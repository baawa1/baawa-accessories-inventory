import React from 'react'
import { X, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ExtendedProductImage } from './types'

interface ImageManagementSectionProps {
  allImages: ExtendedProductImage[]
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void
  onDragStart: (idx: number) => void
  onDragEnter: (idx: number) => void
  onDragEnd: () => void
  onRemoveImage: (idx: number) => void
  onAltChange: (idx: number, value: string) => void
}

export const ImageManagementSection: React.FC<ImageManagementSectionProps> = ({
  allImages,
  onImageChange,
  onDrop,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onRemoveImage,
  onAltChange,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Product Images</h3>
      
      {/* Image Upload Area */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={(e) => e.preventDefault()}
      >
        <div className="space-y-2">
          <p className="text-gray-600">
            Drag & drop images here, or click to select files
          </p>
          <p className="text-sm text-gray-500">
            Supports JPG, PNG, WEBP, GIF up to 5MB
          </p>
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={onImageChange}
            className="max-w-xs mx-auto"
          />
        </div>
      </div>

      {/* Image Preview Grid */}
      {allImages.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-md font-medium">Image Preview & Ordering</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allImages.map((image, idx) => (
              <div
                key={`${image.url}-${idx}`}
                className="relative group border rounded-lg overflow-hidden bg-white shadow-sm"
                draggable
                onDragStart={() => onDragStart(idx)}
                onDragEnter={() => onDragEnter(idx)}
                onDragEnd={onDragEnd}
                onDragOver={(e) => e.preventDefault()}
              >
                {/* Drag Handle */}
                <div className="absolute top-2 left-2 z-10 cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="h-5 w-5 text-white bg-black bg-opacity-50 rounded p-1" />
                </div>

                {/* Remove Button */}
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 z-10 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onRemoveImage(idx)}
                >
                  <X className="h-4 w-4" />
                </Button>

                {/* Image Display */}
                <div className="aspect-square relative">
                  <img
                    src={image.url}
                    alt={image.alt || `Product image ${idx + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {image.isNew && (
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-green-500 text-white text-xs rounded">
                      New
                    </div>
                  )}
                </div>

                {/* Alt Text Input */}
                <div className="p-3">
                  <Input
                    type="text"
                    placeholder="Alt text (optional)"
                    value={image.alt || ''}
                    onChange={(e) => onAltChange(idx, e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
          
          <p className="text-sm text-gray-500">
            💡 Tip: Drag images to reorder them. The first image will be the main product image.
          </p>
        </div>
      )}
    </div>
  )
}
