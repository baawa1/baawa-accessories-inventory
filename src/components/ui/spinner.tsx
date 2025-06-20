import { Loader2 } from 'lucide-react'
import React from 'react'

export function Spinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className='flex flex-col items-center justify-center w-full py-8'>
      <Loader2 className='animate-spin w-8 h-8 mb-2 text-gray-500' />
      <span>{label}</span>
    </div>
  )
}
