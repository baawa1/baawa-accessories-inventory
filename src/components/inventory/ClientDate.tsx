'use client'

import { useEffect, useState } from 'react'

export function ClientDate({ date }: { date: string | Date }) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  return <>{new Date(date).toLocaleDateString('en-GB')}</>
}
