import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
