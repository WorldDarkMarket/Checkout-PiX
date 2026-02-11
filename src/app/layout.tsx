import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pagamento Seguro - PIX | Checkout Cacau Show",
  description: "Pagamento seguro via PIX. Ambiente criptografado com SSL, processamento instantâneo e proteção de dados. Realize seu pagamento de forma rápida e segura.",
  keywords: ["PIX", "Pagamento Seguro", "Pagamento Online", "Criptografia SSL", "Checkout", "Pagamento Rápido", "Transação Segura"],
  authors: [{ name: "Cacau Show" }],
  icons: {
    icon: "/logo-pix.jpg",
    apple: "/logo-pix.jpg",
  },
  openGraph: {
    title: "Pagamento Seguro - PIX | Cacau Show",
    description: "Realize seu pagamento de forma segura e rápida via PIX. Ambiente 100% criptografado e protegido.",
    url: "https://checkout.cacaushow.fun",
    siteName: "Cacau Show Checkout",
    type: "website",
    locale: "pt_BR",
    images: [
      {
        url: "/logo-pix.jpg",
        width: 1200,
        height: 630,
        alt: "Pagamento Seguro PIX - Cacau Show",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pagamento Seguro - PIX",
    description: "Pagamento seguro via PIX em ambiente criptografado. Processamento instantâneo.",
    images: ["/logo-pix.jpg"],
  },
  robots: {
    index: false,
    follow: false,
  },
  metadataBase: new URL('https://checkout.cacaushow.fun'),
  applicationName: "Cacau Show Checkout",
  category: "e-commerce",
}

export const viewport = {
  width: "device-width" as const,
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#00B37E" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
