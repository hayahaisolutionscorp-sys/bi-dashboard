"use client";

import { DashboardHeader } from "@/components/dashboard-header";
import { MobileMenuProvider } from "@/components/mobile-menu-provider";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMobileMenu } from "@/components/mobile-menu-provider";
import dynamic from "next/dynamic";
import { BiFilterProvider } from "@/components/providers/bi-filter-provider";

const AppNav = dynamic(() => import("@/components/app-nav").then((mod) => mod.AppNav), {
  ssr: false,
});

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isOpen, setIsOpen } = useMobileMenu();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile Drawer */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-sidebar border-sidebar-border">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
            <SheetDescription>
              Browse dashboard sections and switch between analytics views.
            </SheetDescription>
          </SheetHeader>
          <AppNav isMobile />
        </SheetContent>
      </Sheet>

      {/* Desktop/Tablet Sidebar - Hidden on mobile */}
      <div className="hidden md:block">
        <AppNav />
      </div>

      <main className="flex-1 min-w-0 flex flex-col overflow-y-auto bg-background">
        <DashboardHeader />
        <div className="flex-1 min-w-0">
          {children}
        </div>
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
    <BiFilterProvider>
      <MobileMenuProvider>
        <LayoutContent>{children}</LayoutContent>
      </MobileMenuProvider>
    </BiFilterProvider>
  );
}
