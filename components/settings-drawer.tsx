"use client";

import { Settings } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandThemePicker } from "@/components/brand-theme-picker";

export function SettingsDrawer() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className="p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors"
          aria-label="Open settings"
        >
          <Settings className="size-4" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[320px] bg-card border-l border-border p-0">
        <SheetHeader className="px-5 py-4 border-b border-border">
          <SheetTitle className="text-sm font-medium text-foreground">Settings</SheetTitle>
        </SheetHeader>

        <div className="px-5 py-5 space-y-6">
          {/* Appearance */}
          <section className="space-y-3">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              Appearance
            </p>

            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Color mode</span>
              <ThemeToggle />
            </div>
          </section>

          <div className="h-px bg-border" />

          {/* Brand color */}
          <section className="space-y-3">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              Brand Color
            </p>
            <BrandThemePicker />
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
