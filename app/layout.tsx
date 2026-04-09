import { PWAPrompt } from "@/components/pwa-prompt";
import { Toaster } from "@/components/ui/sonner";
import { TenantProvider } from "@/components/providers/tenant-provider";
import { ThemeProvider } from "next-themes";
import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hayahai BI",
  description: "Hayahai BI Dashboard",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
      </head>
      <body
        className={`${inter.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          storageKey="dashboard-theme"
        >
          <TenantProvider>
            {children}
          </TenantProvider>
          <Toaster />
          <PWAPrompt />
        </ThemeProvider>
      </body>
    </html>
  );
}
