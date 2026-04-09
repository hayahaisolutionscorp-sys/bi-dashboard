"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useMobileMenu } from "@/components/mobile-menu-provider";
import { useTenant } from "@/components/providers/tenant-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Menu, Search, Bell, Ship } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { authService } from "@/services/auth.service";
import { Tenant, User } from "@/types/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function DashboardHeader() {
  const { activeTenant, tenants, setTenant } = useTenant();
  const [user, setUser] = useState<User | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
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
    <header className="sticky top-0 z-10 flex h-12 min-h-12 max-h-12 shrink-0 items-center justify-between overflow-hidden border-b border-border bg-card px-5">
      <div className="flex min-w-0 items-center gap-2 md:gap-3">
        {/* Hamburger Menu - Mobile Only */}
        <button 
          onClick={toggle}
          className="md:hidden p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="size-4" />
        </button>

        <div className="flex flex-col min-w-0">
          <h1 className="truncate whitespace-nowrap text-[15px] font-medium tracking-tight text-foreground leading-tight">{getPageTitle()}</h1>
          <p className="text-[11px] text-muted-foreground hidden sm:block">Hayahai Business Intelligence</p>
        </div>
      </div>
      
      <div className="flex shrink-0 items-center gap-1">
        <div className="hidden sm:block">
          {isMounted ? (
            <Select value={activeTenant?.name || ""} onValueChange={handleTenantChange}>
              <SelectTrigger className="w-auto min-w-[160px] max-w-[240px] h-8 text-xs bg-muted border-border text-foreground font-medium focus:ring-ring rounded-md">
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
            <div className="w-[160px] h-8 bg-muted border border-border rounded-md flex items-center px-3 gap-1.5">
              <Ship className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Loading...</span>
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-border hidden sm:block mx-1" />

        <ThemeToggle />

        <button className="p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors" aria-label="Search">
          <Search className="size-4" />
        </button>
        <button className="p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors relative" aria-label="Notifications">
          <Bell className="size-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full ring-1 ring-card"></span>
        </button>
      </div>
    </header>
  );
}
