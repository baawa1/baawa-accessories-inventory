import { redirect } from 'next/navigation'

export default function Home() {
  // Redirect to the dashboard page by default
  // This can be changed later to a landing page or login page as needed
  redirect('/dashboard')

  // Keep a minimal placeholder if direct access to root is ever needed
  // or if redirect doesn't happen for some reason (e.g. during build)
  return (
    <div className='flex flex-col items-center justify-center min-h-screen p-8'>
      <h1 className='text-2xl font-bold'>BaaWA Accessories</h1>
      <p>Loading...</p>
    </div>
  )
}
