import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PLACEHOLDER_URL = 'https://placeholder.supabase.co'
const PLACEHOLDER_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTIwMDAsImV4cCI6MTk2MDc2ODAwMH0.placeholder'

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? ''
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? ''

  if (url && anonKey) {
    return { url, anonKey }
  }

  return { url: PLACEHOLDER_URL, anonKey: PLACEHOLDER_KEY }
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach(({ name, value }) => {
    to.cookies.set(name, value)
  })
}

export async function middleware(req: NextRequest) {
  let supabaseResponse = NextResponse.next({ request: req })

  const { url, anonKey } = getSupabaseEnv()
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request: req })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = req.nextUrl.pathname

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
    '/api',
  ]

  const isPublicPath = publicPaths.some(
    (publicPath) => path === publicPath || path.startsWith(publicPath + '/')
  )

  if (isPublicPath) {
    return supabaseResponse
  }

  if (!user) {
    const redirectUrl = new URL('/auth/login', req.url)
    redirectUrl.searchParams.set('redirectTo', path)
    const redirectResponse = NextResponse.redirect(redirectUrl)
    copyCookies(supabaseResponse, redirectResponse)
    return redirectResponse
  }

  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  const role = userRole?.role

  if (path === '/dashboard') {
    if (role === 'trainer') {
      const redirectResponse = NextResponse.redirect(new URL('/trainer/dashboard', req.url))
      copyCookies(supabaseResponse, redirectResponse)
      return redirectResponse
    }
    if (role === 'client') {
      const redirectResponse = NextResponse.redirect(new URL('/client/dashboard', req.url))
      copyCookies(supabaseResponse, redirectResponse)
      return redirectResponse
    }
    if (role === 'admin') {
      const redirectResponse = NextResponse.redirect(new URL('/admin', req.url))
      copyCookies(supabaseResponse, redirectResponse)
      return redirectResponse
    }
    return supabaseResponse
  }

  if (path.startsWith('/trainer') && role !== 'trainer') {
    const redirectResponse = NextResponse.redirect(new URL('/client/dashboard', req.url))
    copyCookies(supabaseResponse, redirectResponse)
    return redirectResponse
  }

  if (path.startsWith('/client') && role !== 'client') {
    const destination =
      role === 'trainer' ? '/trainer/dashboard' : '/client/dashboard'
    const redirectResponse = NextResponse.redirect(new URL(destination, req.url))
    copyCookies(supabaseResponse, redirectResponse)
    return redirectResponse
  }

  if (path.startsWith('/admin') && role !== 'admin') {
    let destination = '/'
    if (role === 'trainer') {
      destination = '/trainer/dashboard'
    } else if (role === 'client') {
      destination = '/client/dashboard'
    }
    const redirectResponse = NextResponse.redirect(new URL(destination, req.url))
    copyCookies(supabaseResponse, redirectResponse)
    return redirectResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
