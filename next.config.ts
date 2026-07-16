import type { NextConfig } from "next";

if (process.env.NODE_ENV === 'production') {
  const required = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    console.warn(
      `[ZarcFit] Missing production env vars: ${missing.join(', ')}. Auth and data fetching may fail.`
    );
  }
}

const nextConfig: NextConfig = {  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
    ],
  },
  async redirects() {
    return [
      // Legacy dashboard routes were duplicated under /client during the
      // trainer-platform restructure. /client is now canonical; keep old
      // links working by redirecting here.
      { source: '/dashboard', destination: '/client', permanent: false },
      { source: '/dashboard/:path*', destination: '/client/:path*', permanent: false },
      { source: '/main/programs', destination: '/main/plans', permanent: false },
      { source: '/main/coaching', destination: '/main/plans', permanent: false },
    ];
  },
};

export default nextConfig;
