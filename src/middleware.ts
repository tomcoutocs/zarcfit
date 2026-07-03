import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  const { data: { session } } = await supabase.auth.getSession()
  
  const path = req.nextUrl.pathname
  
  // Public routes that don't require authentication
  const publicPaths = [
    '/auth/login',
    '/auth/signup', 
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/email-verification',
    '/auth/callback',
    '/auth/accept-invitation',
    '/main',
    '/',
    '/api'
  ]
  
  // Check if current path is public
  const isPublicPath = publicPaths.some(publicPath => 
    path === publicPath || path.startsWith(publicPath + '/')
  )
  
  // Allow public paths without authentication
  if (isPublicPath) {
    return res
  }
  
  // Require authentication for all other routes
  if (!session) {
    const redirectUrl = new URL('/auth/login', req.url)
    redirectUrl.searchParams.set('redirectTo', path)
    return NextResponse.redirect(redirectUrl)
  }
  
  // Get user role for authenticated users
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', session.user.id)
    .single()
  
  const role = userRole?.role
  
  // Handle /dashboard redirect based on role
  if (path === '/dashboard') {
    if (role === 'trainer') {
      return NextResponse.redirect(new URL('/trainer/dashboard', req.url))
    } else if (role === 'client') {
      return NextResponse.redirect(new URL('/client/dashboard', req.url))
    } else if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin', req.url))
    }
    // If no role yet, stay on /dashboard (shouldn't happen but safe fallback)
    return res
  }
  
  // Protect trainer routes
  if (path.startsWith('/trainer')) {
    if (role !== 'trainer') {
      return NextResponse.redirect(new URL('/client/dashboard', req.url))
    }
  }
  
  // Protect client routes
  if (path.startsWith('/client')) {
    if (role !== 'client') {
      // If trainer tries to access client routes, redirect to trainer dashboard
      if (role === 'trainer') {
        return NextResponse.redirect(new URL('/trainer/dashboard', req.url))
      }
      return NextResponse.redirect(new URL('/client/dashboard', req.url))
    }
  }
  
  // Protect admin routes
  if (path.startsWith('/admin')) {
    if (role !== 'admin') {
      // Redirect based on their actual role
      if (role === 'trainer') {
        return NextResponse.redirect(new URL('/trainer/dashboard', req.url))
      } else if (role === 'client') {
        return NextResponse.redirect(new URL('/client/dashboard', req.url))
      }
      return NextResponse.redirect(new URL('/', req.url))
    }
  }
  
  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
