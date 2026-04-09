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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var k = localStorage.getItem('dashboard-brand-theme');
                var themes = { blue:[0.52,0.20,240], indigo:[0.50,0.22,265], violet:[0.52,0.22,290],
                  rose:[0.52,0.22,10], orange:[0.60,0.20,40], amber:[0.68,0.18,72],
                  green:[0.55,0.18,142], teal:[0.55,0.16,180] };
                var t = themes[k] || themes.blue;
                var r = document.documentElement;
                r.style.setProperty('--brand-l', t[0]);
                r.style.setProperty('--brand-c', t[1]);
                r.style.setProperty('--brand-h', t[2]);
              } catch(e) {}
            `
          }}
        />
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
