"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { authService } from "@/services/auth.service";
import { User } from "@/types/auth";
import { ChevronsUpDown, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useMobileMenu } from "@/components/mobile-menu-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_ITEMS = [
  { label: "Overview", icon: "dashboard", href: "/dashboard" },
  { label: "Sales Report", icon: "bar_chart", href: "/dashboard/sales-report" },
  { label: "Expenses Report", icon: "receipt_long", href: "/dashboard/expenses-report" },
  { label: "Passenger per Trip", icon: "groups", href: "/dashboard/passengers-per-trip" },
  { label: "Cargo per Trip", icon: "local_shipping", href: "/dashboard/cargo-per-trip" },
  { label: "Status", icon: "notification_important", href: "/dashboard/status"},
  { label: "Vessels", icon: "sailing", href: "/dashboard/vessels" },
  { label: "Advance Booking", icon: "event_available", href: "/dashboard/advance-booking" },
  { label: "Route Map", icon: "map", href: "/dashboard/route-map" },
];

interface AppNavProps {
  isMobile?: boolean;
}

export function AppNav({ isMobile }: AppNavProps) {
  const pathname = usePathname();
  const tenantSlug = pathname.split("/")[1] || "tenant-1";
  const router = useRouter();
  const { isCollapsed } = useMobileMenu();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(authService.getCurrentUser());
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    router.push("/login"); // Use router.push for client-side navigation
  };

  return (
    <aside 
      className={cn(
        "bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen transition-all duration-300",
        isMobile ? "w-full" : isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header */}
      <div className="h-16 border-b border-slate-200 px-4 dark:border-slate-800">
        <div
          className={cn(
            "flex h-full items-center gap-3",
            isCollapsed && !isMobile ? "justify-center" : "justify-start"
          )}
        >
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg p-1">
            <img
              src="/images/logo/hayahai_logo_v2_nodp_nopropeller_final_300px.png"
              alt="Ayahay BI logo"
              className="h-full w-full object-contain"
            />
          </div>
          <div className={cn(
            "hidden",
            !isCollapsed && "md:block",
            isMobile && "block"
          )}>
            <h1 className="text-base font-bold leading-tight text-slate-900 dark:text-white">HAYAHAI BI</h1>
            <p className="text-[10px] leading-tight text-slate-500 dark:text-slate-400">Operations Executive</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 lg:px-4 space-y-1 py-4">
        {NAV_ITEMS.map((item) => {
          const fullHref = `/${tenantSlug}${item.href}`;
          const isActive = item.href === "/dashboard" 
            ? pathname === `/${tenantSlug}/dashboard`
            : pathname.startsWith(`/${tenantSlug}${item.href}`);
          
          return (
            <Link
              key={item.label}
              href={fullHref}
              className={cn(
                "flex items-center gap-3 px-3 lg:px-4 py-3 rounded-lg transition-all",
                isActive && "bg-blue-100 text-blue-600",
                !isActive && "text-neutral-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
              title={item.label}
            >
              <span className="material-icons-outlined text-sm shrink-0">{item.icon}</span>
              <span className={cn("font-medium hidden", !isCollapsed && "md:inline", isMobile && "inline")}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {/* <div className="p-2 lg:p-4 border-t border-slate-200 dark:border-slate-800">
        <Link
          href={`/${tenantSlug}/dashboard/settings`}
          className="flex items-center gap-3 px-3 lg:px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
          title="Settings"
        >
          <span className="material-icons-outlined text-sm shrink-0">settings</span>
          <span className={cn("font-medium hidden", !isCollapsed && "md:inline", isMobile && "inline")}>Settings</span>
        </Link>
      </div> */}

      {/* User Profile Dropdown */}
      <div className="p-2 lg:p-4 border-t border-slate-200 dark:border-slate-800">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 px-2 py-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
              <Avatar className="size-10 rounded-full shrink-0">
                <AvatarImage src={user?.email === "admin@ayahay.com" ? "https://lh3.googleusercontent.com/aida-public/AB6AXuARVrNVO7BNdOULCPAUPGEjeVDRD9yeFmcbvwCRRhx3AUZzmvt_rR1RG9PhiL0UJ7QvUvjltX0GmzWPX7ApIvlpskLNZHlJ5QGsoALBl5rp87XuL_civpgJU1EVTDjE8VNX_g8rB6tzgUKuhFA418qe8MTSvy_xuLvXZme7H8WHxOasrOiE8-bQN9kMmLzWd1su-wQ7HEF2VPD7kp2rvB40GLemOquKndY9fq4vzWgbYKjB0vH89_saV2KN8SRyjKZ-oDHUbqSv-A" : ""} />
                <AvatarFallback>{(user?.first_name?.[0] || "") + (user?.last_name?.[0] || "") || "US"}</AvatarFallback>
              </Avatar>
              <div className={cn("hidden flex-1 flex-col overflow-hidden text-left", !isCollapsed && "md:flex", isMobile && "flex")}>
                <p className="text-sm font-bold truncate text-slate-900 dark:text-white">
                  {user?.first_name ? `${user.first_name} ${user.last_name || ""}` : (user?.name || "User")}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">{user?.role || "Executive"}</p>
              </div>
              {!isCollapsed || isMobile ? <ChevronsUpDown className="ml-auto size-4 text-slate-400 shrink-0" /> : null}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" side="right" sideOffset={8}>
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user?.email === "admin@ayahay.com" ? "https://lh3.googleusercontent.com/aida-public/AB6AXuARVrNVO7BNdOULCPAUPGEjeVDRD9yeFmcbvwCRRhx3AUZzmvt_rR1RG9PhiL0UJ7QvUvjltX0GmzWPX7ApIvlpskLNZHlJ5QGsoALBl5rp87XuL_civpgJU1EVTDjE8VNX_g8rB6tzgUKuhFA418qe8MTSvy_xuLvXZme7H8WHxOasrOiE8-bQN9kMmLzWd1su-wQ7HEF2VPD7kp2rvB40GLemOquKndY9fq4vzWgbYKjB0vH89_saV2KN8SRyjKZ-oDHUbqSv-A" : ""} alt={user?.name || "User"} />
                  <AvatarFallback className="rounded-lg">{(user?.first_name?.[0] || "") + (user?.last_name?.[0] || "") || "US"}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {user?.first_name ? `${user.first_name} ${user.last_name || ""}` : (user?.name || "User")}
                  </span>
                  <span className="truncate text-xs">{user?.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
