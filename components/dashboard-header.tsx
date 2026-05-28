"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMobileMenu } from "@/components/mobile-menu-provider";
import { useTenant } from "@/components/providers/tenant-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bot, CalendarDays, Command, LogOut, Menu, Plus, Search, Bell, Ship, Radio } from "lucide-react";
import { SettingsDrawer } from "@/components/settings-drawer";
import { authService } from "@/services/auth.service";
import { User } from "@/types/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DashboardHeader() {
  const { activeTenant, tenants, setTenant } = useTenant();
  const [user, setUser] = useState<User | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { toggle } = useMobileMenu();

  useEffect(() => {
    setIsMounted(true);
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
  }, []);

  const handleTenantChange = (value: string) => {
    const tenant = tenants.find(t => t.name === value);
    if (tenant) {
      setTenant(tenant);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    router.push("/login");
  };
  
  // Extract page title from pathname
  const getPageTitle = () => {
    const segments = pathname.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    
    if (lastSegment === 'dashboard' || segments.length === 2) {
      return 'Executive Dashboard';
    }
    
    // Convert kebab-case to Title Case
    return lastSegment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <header className="sticky top-0 z-30 shrink-0 px-3 py-2.5 sm:px-5">
      <div className="bi-panel flex min-h-14 items-center justify-between gap-3 rounded-2xl px-3 py-2 sm:px-4">
      <div className="flex min-w-0 items-center gap-2 md:gap-3">
        {/* Hamburger Menu - Mobile Only */}
        <button 
          onClick={toggle}
          className="md:hidden rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Toggle menu"
        >
          <Menu className="size-4" />
        </button>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate whitespace-nowrap text-base font-semibold tracking-tight text-foreground leading-tight">{getPageTitle()}</h1>
            <span className="hidden rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-200 md:inline-flex">
              Executive
            </span>
          </div>
          <p className="hidden text-xs text-muted-foreground sm:block">HAYAHAI BI Analytics command center</p>
        </div>
      </div>
      
      <div className="hidden min-w-[260px] max-w-[430px] flex-1 items-center gap-2 rounded-2xl border border-border/60 bg-muted/35 px-3 py-2 text-muted-foreground shadow-inner shadow-black/10 focus-within:border-cyan-500/40 focus-within:shadow-[0_0_28px_rgba(0,209,255,0.12)] lg:flex">
        <Search className="size-4 shrink-0" />
        <span className="truncate text-sm">Search vessels, routes, bookings...</span>
        <span className="ml-auto hidden items-center gap-1 rounded-lg border border-border/70 bg-background/40 px-1.5 py-0.5 text-[10px] xl:flex">
          <Command className="size-3" /> K
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <div className="hidden sm:block">
          {isMounted ? (
            <Select value={activeTenant?.name || ""} onValueChange={handleTenantChange}>
              <SelectTrigger className="h-10 w-auto min-w-[190px] max-w-[280px] rounded-2xl border-border/70 bg-muted/35 text-xs font-medium text-foreground focus:ring-ring">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <Ship className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div className="truncate text-left">
                    <SelectValue placeholder="Select Shipping Line" />
                  </div>
                </div>
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(tenants) && tenants.length > 0 ? (
                  tenants
                    .filter((tenant) => tenant && tenant.name)
                    .map((tenant, idx) => (
                      <SelectItem 
                        key={tenant.id || idx} 
                        value={tenant.name}
                        className="text-xs"
                      >
                        {tenant.name}
                      </SelectItem>
                    ))
                ) : (
                  <SelectItem value="none" disabled className="text-xs">
                    No Shipping Lines Available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          ) : (
            <div className="flex h-10 w-[190px] items-center gap-1.5 rounded-2xl border border-border bg-muted px-3">
              <Ship className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Loading...</span>
            </div>
          )}
        </div>

        <div className="hidden h-9 items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300 xl:flex">
          <Radio className="size-3.5 animate-pulse" />
          Live
        </div>

        <Button variant="ghost" size="sm" className="hidden h-9 gap-2 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-3 text-cyan-700 hover:bg-cyan-500/15 dark:text-cyan-200 xl:inline-flex">
          <Bot className="size-4" />
          AI Insights
        </Button>

        <Button variant="ghost" size="icon" className="hidden h-9 w-9 rounded-2xl border border-border/60 bg-muted/25 text-muted-foreground hover:text-foreground sm:inline-flex" aria-label="Date range">
          <CalendarDays className="size-4" />
        </Button>

        <Button variant="ghost" size="icon" className="hidden h-9 w-9 rounded-2xl border border-border/60 bg-muted/25 text-muted-foreground hover:text-foreground xl:inline-flex" aria-label="Quick actions">
          <Plus className="size-4" />
        </Button>

        <SettingsDrawer />

        <button className="rounded-2xl p-2.5 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden" aria-label="Search">
          <Search className="size-4" />
        </button>
        <button className="relative rounded-2xl p-2.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Notifications">
          <Bell className="size-4" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-card"></span>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="hidden rounded-2xl outline-none ring-offset-background transition-transform hover:scale-[1.03] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:block" aria-label="Open user menu">
              <Avatar className="size-10 rounded-2xl border border-primary/20">
                <AvatarImage src={user?.email === "admin@ayahay.com" ? "https://lh3.googleusercontent.com/aida-public/AB6AXuARVrNVO7BNdOULCPAUPGEjeVDRD9yeFmcbvwCRRhx3AUZzmvt_rR1RG9PhiL0UJ7QvUvjltX0GmzWPX7ApIvlpskLNZHlJ5QGsoALBl5rp87XuL_civpgJU1EVTDjE8VNX_g8rB6tzgUKuhFA418qe8MTSvy_xuLvXZme7H8WHxOasrOiE8-bQN9kMmLzWd1su-wQ7HEF2VPD7kp2rvB40GLemOquKndY9fq4vzWgbYKjB0vH89_saV2KN8SRyjKZ-oDHUbqSv-A" : ""} />
                <AvatarFallback className="rounded-2xl bg-primary/10 text-xs font-semibold text-primary">{(user?.first_name?.[0] || "") + (user?.last_name?.[0] || "") || "US"}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-60" align="end" sideOffset={10}>
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-xl">
                  <AvatarImage src={user?.email === "admin@ayahay.com" ? "https://lh3.googleusercontent.com/aida-public/AB6AXuARVrNVO7BNdOULCPAUPGEjeVDRD9yeFmcbvwCRRhx3AUZzmvt_rR1RG9PhiL0UJ7QvUvjltX0GmzWPX7ApIvlpskLNZHlJ5QGsoALBl5rp87XuL_civpgJU1EVTDjE8VNX_g8rB6tzgUKuhFA418qe8MTSvy_xuLvXZme7H8WHxOasrOiE8-bQN9kMmLzWd1su-wQ7HEF2VPD7kp2rvB40GLemOquKndY9fq4vzWgbYKjB0vH89_saV2KN8SRyjKZ-oDHUbqSv-A" : ""} alt={user?.first_name ? `${user.first_name}${user.last_name ? ` ${user.last_name}` : ""}` : (user?.email || "User")} />
                  <AvatarFallback className="rounded-xl bg-primary/10 text-xs font-semibold text-primary">{(user?.first_name?.[0] || "") + (user?.last_name?.[0] || "") || "US"}</AvatarFallback>
                </Avatar>
                <div className="grid min-w-0 flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-medium">
                    {user?.first_name
                      ? `${user.first_name}${user.last_name ? ` ${user.last_name}` : ""}`
                      : (user?.name || user?.email || "User")}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">{user?.email || user?.role || "Executive"}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
              <LogOut className="mr-2 size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      </div>
    </header>
  );
}
