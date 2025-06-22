import { toast as sonnerToast } from 'sonner'

export interface ToastProps {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

export const useToast = () => {
  const toast = (props: ToastProps | string) => {
    if (typeof props === 'string') {
      sonnerToast(props)
    } else {
      const { title, description, variant = 'default', duration } = props
      
      if (variant === 'destructive') {
        sonnerToast.error(title || description, {
          description: title ? description : undefined,
          duration,
        })
      } else {
        sonnerToast(title || description, {
          description: title ? description : undefined,
          duration,
        })
      }
    }
  }

  return { toast }
}
