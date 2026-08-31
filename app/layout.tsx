import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'Low-Voltage Contractor in Maryland | SW Low Volt',
    template: '%s | SW Low Volt',
  },
  description:
    'Structured cabling, network infrastructure, and security and access cabling for commercial, residential, and subcontract projects throughout Maryland.',
  keywords: [
    'low voltage contractor Maryland',
    'structured cabling Maryland',
    'network cabling Ocean City MD',
    'Cat6 installation Maryland',
    'commercial cabling contractor Maryland',
  ],
  openGraph: {
    type: 'website',
    siteName: 'SW Low Volt',
    title: 'Low-Voltage Contractor in Maryland | SW Low Volt',
    description:
      'Structured cabling, network infrastructure, security cabling, and connectivity solutions throughout Maryland.',
    images: [
      {
        url: '/og.jpg',
        width: 1200,
        height: 630,
        alt: 'SW Low Volt — Low-Voltage Systems Built Right.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Low-Voltage Contractor in Maryland | SW Low Volt',
    description:
      'Structured cabling, network infrastructure, security cabling, and connectivity solutions.',
    images: ['/og.jpg'],
  },
  icons: {
    icon: '/sw-low-volt-logo-1000.png',
    apple: '/sw-low-volt-logo-1000.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
