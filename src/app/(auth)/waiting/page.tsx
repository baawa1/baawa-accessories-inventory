'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

const WaitingPage = () => {
  const router = useRouter()

  return (
    <div className='flex min-h-screen flex-col items-center justify-center py-2'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <CardTitle className='text-xl'>Account Pending Approval</CardTitle>
        </CardHeader>
        <CardContent className='text-center'>
          <p>Your account is currently pending approval by an administrator.</p>
          <p>Please check back later or contact support for assistance.</p>
          <Button className='mt-4' onClick={() => router.push('/')}>
            Return to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default WaitingPage
