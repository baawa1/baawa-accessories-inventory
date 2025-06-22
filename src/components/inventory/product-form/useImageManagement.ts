'use client'

import { useState, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { ProductImage, ExtendedProductImage } from './types'

export const useImageManagement = (
  existingImagesProp?: ProductImage[]
) => {
  // Initialize existing images
  const getInitialExistingImages = useCallback(() => {
    if (existingImagesProp && existingImagesProp.length > 0) {
      return existingImagesProp
    }
    return []
  }, [existingImagesProp])

  const [allImages, setAllImages] = useState<ExtendedProductImage[]>(() => 
    getInitialExistingImages().map(img => ({ ...img, isNew: false }))
  )
  
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [imageAlts, setImageAlts] = useState<string[]>([])
  const [uploadProgress, setUploadProgress] = useState<number[]>([])
  
  const dragItem = useRef<number | null>(null)
  const dragOverItem = useRef<number | null>(null)

  // Enhanced image validation
  const validateImage = (file: File): string | null => {
    const maxSize = 5 * 1024 * 1024 // 5MB
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    
    if (!validTypes.includes(file.type)) {
      return 'Only JPG, PNG, WEBP, or GIF images are allowed.'
    }
    if (file.size > maxSize) {
      return 'Image size must be under 5MB.'
    }
    return null
  }

  // Enhanced image change handler with validation
  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const errors: string[] = []
    const validFiles: File[] = []
    const previews: string[] = []

    files.forEach((file) => {
      const error = validateImage(file)
      if (error) {
        errors.push(`${file.name}: ${error}`)
      } else {
        validFiles.push(file)
        previews.push(URL.createObjectURL(file))
      }
    })

    if (errors.length) {
      toast(errors.join('\n'), {
        description: 'Image validation error',
        className: 'bg-red-100 text-red-800',
      })
    }

    validFiles.forEach((file, i) => {
      setAllImages((prev) => [
        ...prev,
        {
          url: previews[i],
          alt: '',
          isNew: true,
          file,
          preview: previews[i],
        },
      ])
    })

    setImageFiles((prev) => [...prev, ...validFiles])
    setImagePreviews((prev) => [...prev, ...previews])
    setImageAlts((prev) => [...prev, ...validFiles.map(() => '')])
    setUploadProgress((prev) => [...prev, ...validFiles.map(() => 0)])
  }, [])

  // Drag-and-drop handlers
  const handleDragStart = useCallback((idx: number) => {
    dragItem.current = idx
  }, [])

  const handleDragEnter = useCallback((idx: number) => {
    dragOverItem.current = idx
  }, [])

  const handleDragEnd = useCallback(() => {
    const from = dragItem.current
    const to = dragOverItem.current
    if (from === null || to === null || from === to) return

    const reordered = [...allImages]
    reordered.splice(to, 0, reordered.splice(from, 1)[0])
    setAllImages(reordered)
    dragItem.current = null
    dragOverItem.current = null
  }, [allImages])

  // Remove image
  const handleRemoveImage = useCallback((idx: number, onRemove?: (id: string) => void) => {
    setAllImages((prev) => {
      const removed = prev[idx]
      if (removed?.id && onRemove) {
        onRemove(removed.id)
      }
      return prev.filter((_, i) => i !== idx)
    })
  }, [])

  // Alt text editing
  const handleAltChange = useCallback((idx: number, value: string) => {
    setAllImages((prev) =>
      prev.map((img, i) => (i === idx ? { ...img, alt: value } : img))
    )
  }, [])

  // Drag-and-drop area
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    const errors: string[] = []
    const validFiles: File[] = []
    const previews: string[] = []

    files.forEach((file) => {
      const error = validateImage(file)
      if (error) {
        errors.push(`${file.name}: ${error}`)
      } else {
        validFiles.push(file)
        previews.push(URL.createObjectURL(file))
      }
    })

    if (errors.length) {
      toast(errors.join('\n'), {
        description: 'Image validation error',
        className: 'bg-red-100 text-red-800',
      })
    }

    validFiles.forEach((file, i) => {
      setAllImages((prev) => [
        ...prev,
        {
          url: previews[i],
          alt: '',
          isNew: true,
          file,
          preview: previews[i],
        },
      ])
    })

    setImageFiles((prev) => [...prev, ...validFiles])
    setImagePreviews((prev) => [...prev, ...previews])
    setImageAlts((prev) => [...prev, ...validFiles.map(() => '')])
    setUploadProgress((prev) => [...prev, ...validFiles.map(() => 0)])
  }, [])

  const resetImages = useCallback(() => {
    setAllImages([])
    setImageFiles([])
    setImagePreviews([])
    setImageAlts([])
    setUploadProgress([])
  }, [])

  return {
    allImages,
    setAllImages,
    imageFiles,
    imagePreviews,
    imageAlts,
    uploadProgress,
    handleImageChange,
    handleDragStart,
    handleDragEnter,
    handleDragEnd,
    handleRemoveImage,
    handleAltChange,
    handleDrop,
    resetImages,
  }
}
