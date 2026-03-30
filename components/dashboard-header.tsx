"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useMobileMenu } from "@/components/mobile-menu-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Ship } from "lucide-react";
import { authService } from "@/services/auth.service";
import { Tenant, User } from "@/types/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function DashboardHeader() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [shippingLine, setShippingLine] = useState<string>("");
  const [user, setUser] = useState<User | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const { toggle, toggleCollapse, isCollapsed } = useMobileMenu();

  useEffect(() => {
    setIsMounted(true);
    authService.syncFromCookies();
    
    const loadedTenants = authService.getTenants();
    const currentUser = authService.getCurrentUser();
    
    setTenants(loadedTenants);
    
    const selectedCompanyName = localStorage.getItem("selectedCompanyName");
    if (selectedCompanyName) {
      setShippingLine(selectedCompanyName);
    } else if (loadedTenants && loadedTenants.length > 0) {
      setShippingLine(loadedTenants[0].name);
    }
    setUser(currentUser);
  }, []);

  const handleTenantChange = (value: string) => {
    setShippingLine(value);
    const tenant = tenants.find(t => t.name === value);
    if (tenant) {
      localStorage.setItem('selectedCompanyName', tenant.name);
      localStorage.setItem('selectedBaseUrl', tenant.api_base_url);
      document.cookie = "service_key=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
      document.cookie = `service_key=${tenant.service_key}; path=/;`
      if (tenant.id !== undefined) {
        authService.setSelectedTenant(tenant.id);
      }
      
      let slug = (tenant as any).slug;
      if (!slug && tenant.name) {
          slug = tenant.name
              .toLowerCase()
              .trim()
              .replace(/[^\w\s-]/g, '') 
              .replace(/\s+/g, '-')      
              .replace(/-+/g, '-');      
      }
      window.location.href = `/${slug}/dashboard`;
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
    <header className="sticky top-0 z-10 flex h-16 min-h-16 max-h-16 shrink-0 items-center justify-between overflow-hidden border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 md:px-8">
      <div className="flex min-w-0 items-center gap-2 md:gap-4">
        {/* Hamburger Menu - Mobile Only */}
        <button 
          onClick={toggle}
          className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          aria-label="Toggle menu"
        >
          <span className="material-icons-outlined">menu</span>
        </button>

        <button
          onClick={toggleCollapse}
          className="hidden md:inline-flex p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          aria-label="Toggle sidebar"
        >
          <span className="material-icons-outlined">{isCollapsed ? "menu_open" : "menu"}</span>
        </button>
        
        <h1 className="truncate whitespace-nowrap text-lg font-semibold text-slate-800 dark:text-white md:text-xl">{getPageTitle()}</h1>
      </div>
      
      <div className="flex shrink-0 items-center gap-2 md:gap-4">
        <div className="hidden sm:block">
          {isMounted ? (
            <Select value={shippingLine} onValueChange={handleTenantChange}>
              <SelectTrigger className="w-auto min-w-[200px] max-w-[280px] h-9 bg-slate-50 border-slate-200 text-slate-700 font-medium focus:ring-blue-500">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Ship className="h-4 w-4 shrink-0 text-blue-600" />
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
                      >
                        {tenant.name}
                      </SelectItem>
                    ))
                ) : (
                  <SelectItem value="none" disabled>
                    No Shipping Lines Available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          ) : (
            <div className="w-[200px] h-9 bg-slate-50 border border-slate-200 rounded-md flex items-center px-3 justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <Ship className="h-4 w-4 shrink-0 text-blue-600" />
                <span className="text-sm text-slate-500 font-medium truncate">Loading...</span>
              </div>
            </div>
          )}
        </div>

        <div className="hidden sm:block mx-1 h-8 w-px bg-slate-200 dark:bg-slate-700"></div>

        <button className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
          <span className="material-icons-outlined">search</span>
        </button>
        <button className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full relative">
          <span className="material-icons-outlined">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
        </button>
      </div>
    </header>
  );
}
