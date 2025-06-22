import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Rate limiting store (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limiting configuration
interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

export function rateLimit(config: RateLimitConfig) {
  return (req: NextRequest): boolean => {
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const key = `rate_limit:${clientIP}`
    const now = Date.now()
    
    const record = rateLimitStore.get(key)
    
    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      })
      return true
    }
    
    if (record.count >= config.maxRequests) {
      return false
    }
    
    record.count++
    return true
  }
}

// Request validation with Zod
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return async (req: NextRequest): Promise<{ isValid: boolean; data?: T; error?: string }> => {
    try {
      const body = await req.json()
      const data = schema.parse(body)
      return { isValid: true, data }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        return { isValid: false, error: errorMessages.join(', ') }
      }
      return { isValid: false, error: 'Invalid request format' }
    }
  }
}

// Authentication middleware (placeholder - implement based on your auth system)
export function requireAuth() {
  return async (req: NextRequest): Promise<{ isAuthenticated: boolean; user?: any; error?: string }> => {
    try {
      const authHeader = req.headers.get('authorization')
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { isAuthenticated: false, error: 'Missing or invalid authorization header' }
      }
      
      const token = authHeader.split(' ')[1]
      
      // TODO: Implement actual token validation logic
      // This is a placeholder - replace with your authentication system
      if (!token || token === 'invalid') {
        return { isAuthenticated: false, error: 'Invalid token' }
      }
      
      // Mock user for demonstration
      const user = { id: '1', email: 'user@example.com' }
      return { isAuthenticated: true, user }
    } catch (error) {
      return { isAuthenticated: false, error: 'Authentication failed' }
    }
  }
}

// Security headers
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Content-Security-Policy', "default-src 'self'")
  
  return response
}

// CORS configuration
export function configureCORS(allowedOrigins: string[] = []) {
  return (req: NextRequest, response: NextResponse): NextResponse => {
    const origin = req.headers.get('origin')
    
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    }
    
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Max-Age', '86400')
    
    return response
  }
}

// Combine all middleware
export function createSecureAPIHandler(config: {
  rateLimit?: RateLimitConfig
  requireAuth?: boolean
  allowedOrigins?: string[]
  validationSchema?: z.ZodSchema<any>
}) {
  return async function secureHandler(
    req: NextRequest,
    handler: (req: NextRequest, validatedData?: any, user?: any) => Promise<NextResponse>
  ): Promise<NextResponse> {
    try {
      // Rate limiting
      if (config.rateLimit) {
        const isAllowed = rateLimit(config.rateLimit)(req)
        if (!isAllowed) {
          return NextResponse.json(
            { error: 'Too many requests' },
            { status: 429 }
          )
        }
      }

      // Authentication
      let user: any = null
      if (config.requireAuth) {
        const authResult = await requireAuth()(req)
        if (!authResult.isAuthenticated) {
          return NextResponse.json(
            { error: authResult.error || 'Unauthorized' },
            { status: 401 }
          )
        }
        user = authResult.user
      }

      // Request validation
      let validatedData: any = null
      if (config.validationSchema && req.method !== 'GET') {
        const validationResult = await validateRequest(config.validationSchema)(req)
        if (!validationResult.isValid) {
          return NextResponse.json(
            { error: validationResult.error || 'Invalid request' },
            { status: 400 }
          )
        }
        validatedData = validationResult.data
      }

      // Execute the actual handler
      let response = await handler(req, validatedData, user)

      // Add security headers
      response = addSecurityHeaders(response)

      // Configure CORS
      if (config.allowedOrigins) {
        response = configureCORS(config.allowedOrigins)(req, response)
      }

      return response
    } catch (error) {
      console.error('API Handler Error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

// Common validation schemas
export const commonSchemas = {
  product: z.object({
    name: z.string().min(1, 'Name is required'),
    sku: z.string().min(1, 'SKU is required'),
    price: z.number().positive('Price must be positive'),
    quantity: z.number().int().min(0, 'Quantity cannot be negative'),
    category_id: z.string().optional(),
    brand_id: z.string().optional(),
    supplier_id: z.string().optional(),
  }),
  
  stockAdjustment: z.object({
    product_id: z.string().min(1, 'Product ID is required'),
    quantity_change: z.number().int(),
    reason: z.string().min(1, 'Reason is required'),
    notes: z.string().optional(),
  }),
  
  pagination: z.object({
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(20),
  }),
}

// Helper for error responses
export function errorResponse(message: string, status: number = 400): NextResponse {
  return NextResponse.json({ error: message }, { status })
}

// Helper for success responses
export function successResponse(data: any, status: number = 200): NextResponse {
  return NextResponse.json(data, { status })
}
