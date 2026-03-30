"use client";

import { DashboardHeader } from "@/components/dashboard-header";
import { MobileMenuProvider } from "@/components/mobile-menu-provider";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useMobileMenu } from "@/components/mobile-menu-provider";
import dynamic from "next/dynamic";

const AppNav = dynamic(() => import("@/components/app-nav").then((mod) => mod.AppNav), {
  ssr: false,
});

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isOpen, setIsOpen } = useMobileMenu();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile Drawer */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <AppNav isMobile />
        </SheetContent>
      </Sheet>

      {/* Desktop/Tablet Sidebar - Hidden on mobile */}
      <div className="hidden md:block">
        <AppNav />
      </div>

      <main className="flex-1 flex flex-col overflow-y-auto bg-slate-50 dark:bg-slate-900">
        <DashboardHeader />
        {children}
      </main>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MobileMenuProvider>
      <LayoutContent>{children}</LayoutContent>
    </MobileMenuProvider>
  );
}
