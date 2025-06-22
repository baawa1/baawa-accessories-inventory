'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, ExternalLink, Copy } from 'lucide-react'

interface SetupErrorProps {
  error: Error
}

export function SetupError({ error }: SetupErrorProps) {
  const isSupabaseError = error.message.includes('SUPABASE')
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (isSupabaseError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-2xl w-full bg-white border border-gray-200 rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Supabase Configuration Required
            </h1>
            <p className="text-gray-600">
              The application needs to be configured with your Supabase project credentials.
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Error Details:</h3>
              <p className="text-sm text-red-600 font-mono bg-red-50 p-2 rounded">
                {error.message}
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Setup Instructions:</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <div>
                    <p className="font-medium">Create a Supabase project</p>
                    <p className="text-gray-600">Go to <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">https://app.supabase.com <ExternalLink className="h-3 w-3" /></a> and create a new project</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <div>
                    <p className="font-medium">Get your project credentials</p>
                    <p className="text-gray-600">In your Supabase dashboard, go to Settings → API to find your URL and anonymous key</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <div>
                    <p className="font-medium">Create environment file</p>
                    <p className="text-gray-600 mb-2">Create a <code className="bg-gray-100 px-1 rounded">.env.local</code> file in your project root with:</p>
                    <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-xs relative">
                      <pre>{`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here`}</pre>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2 h-6 w-6 p-0 text-gray-400 hover:text-white"
                        onClick={() => copyToClipboard(`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here`)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                  <div>
                    <p className="font-medium">Set up your database</p>
                    <p className="text-gray-600">Run the SQL migrations from the <code className="bg-gray-100 px-1 rounded">db/</code> folder in your Supabase SQL editor</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">5</span>
                  <div>
                    <p className="font-medium">Restart the development server</p>
                    <p className="text-gray-600">After creating the .env.local file, restart your development server</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full"
              >
                I've completed the setup - Reload page
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Fallback for other setup errors
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-lg w-full bg-white border border-gray-200 rounded-lg shadow-lg p-8 text-center">
        <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Configuration Error
        </h1>
        <p className="text-gray-600 mb-4">
          There's an issue with the application setup.
        </p>
        <div className="bg-red-50 p-4 rounded-lg mb-6">
          <p className="text-sm text-red-600 font-mono">
            {error.message}
          </p>
        </div>
        <Button 
          onClick={() => window.location.reload()} 
          className="w-full"
        >
          Reload page
        </Button>
      </div>
    </div>
  )
}
