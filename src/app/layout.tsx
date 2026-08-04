import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/providers/ClientProviders";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display-family",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

// CA-505: root defaults + title template so /main/* pages only need to set
// `title`/`description` and inherit metadataBase + OG/Twitter fallbacks.
export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${SITE_NAME} - Coaching Software for Solo Trainers`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} - Coaching Software for Solo Trainers`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - Coaching Software for Solo Trainers`,
    description: SITE_DESCRIPTION,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ZarcFit",
  },
};

// CA-201: manifest.ts (app/manifest.ts) is auto-linked by Next — themeColor
// lives here per the Next 14+ metadata split, not in `metadata` above.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#CB4A2A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans`}>
        <ClientProviders>
          {children}
        </ClientProviders>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
