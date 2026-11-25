import type { Metadata, Viewport } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-cairo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'لَمّة | تواصل عائلي دافئ',
  description: 'مساحة عائلية خاصة ومبسطة للتواصل اليومي ومشاركة اللحظات والتذكيرات المهمة',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'لَمّة',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#1B0C1A',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="min-h-full h-full bg-[#1B0C1A] text-[#FADCD5] font-cairo antialiased selection:bg-[#6D3C52] selection:text-[#FADCD5] overflow-hidden select-none sm:select-auto">
        {children}
      </body>
    </html>
  );
}
