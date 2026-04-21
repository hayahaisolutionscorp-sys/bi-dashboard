"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { authService } from "@/services/auth.service";
import { User } from "@/types/auth";
import {
  ChevronsUpDown,
  LogOut,
  LayoutDashboard,
  BarChart2,
  Receipt,
  Users,
  Truck,
  BellRing,
  Ship,
  CalendarCheck,
  Map,
  TrendingUp,
  PanelLeftClose,
  PanelLeft,
  type LucideIcon,
} from "lucide-react";

interface NavSection {
  sectionLabel: string;
  items: NavItem[];
}
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

interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
}

const NAV_SECTIONS: NavSection[] = [
  {
    sectionLabel: "Executive",
    items: [
      { label: "Executive Overview", icon: LayoutDashboard, href: "/dashboard" },
    ],
  },
  {
    sectionLabel: "Analytics",
    items: [
      { label: "Sales Analytics",      icon: BarChart2,     href: "/dashboard/analytics/sales" },
      { label: "Trends & Comparison",  icon: TrendingUp,    href: "/dashboard/analytics/trends" },
      { label: "Expense Analytics",    icon: Receipt,       href: "/dashboard/analytics/expenses" },
    ],
  },
  {
    sectionLabel: "Demand",
    items: [
      { label: "Passenger Analytics",       icon: Users,        href: "/dashboard/analytics/passengers" },
      { label: "Cargo Analytics",           icon: Truck,        href: "/dashboard/analytics/cargo" },
      { label: "Advance Booking Insights",  icon: CalendarCheck, href: "/dashboard/analytics/booking" },
    ],
  },
  {
    sectionLabel: "Operations",
    items: [
      { label: "Live Route Monitor",   icon: Map,     href: "/dashboard/operations/routes" },
      { label: "Live Status Monitor", icon: BellRing, href: "/dashboard/operations/status" },
    ],
  },
  {
    sectionLabel: "Assets",
    items: [
      { label: "Vessel Analytics", icon: Ship, href: "/dashboard/assets/vessels" },
    ],
  },
];

interface AppNavProps {
  isMobile?: boolean;
}

export function AppNav({ isMobile }: AppNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tenantSlug = pathname.split("/")[1] || "tenant-1";
  const router = useRouter();
  const { isCollapsed, toggleCollapse } = useMobileMenu();
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
        "bg-sidebar border-r border-sidebar-border flex flex-col h-screen transition-all duration-300",
        isMobile ? "w-full" : isCollapsed ? "w-16" : "w-[220px]"
      )}
    >
      {/* Header */}
      <div className="h-12 border-b border-sidebar-border px-3">
        <div className="flex h-full items-center gap-2.5">
          <div className={cn(
            "flex items-center gap-2.5 flex-1 min-w-0",
            isCollapsed && !isMobile && "justify-center"
          )}>
            {(!isCollapsed || isMobile) && (
              <div className="h-7 w-7 shrink-0 overflow-hidden rounded-md bg-primary/10 p-1">
                <img
                  src="/images/logo/hayahai_logo_v2_nodp_nopropeller_final_300px.png"
                  alt="Ayahay BI logo"
                  className="h-full w-full object-contain"
                />
              </div>
            )}
            <div className={cn(
              "hidden min-w-0",
              !isCollapsed && "md:block",
              isMobile && "block"
            )}>
              <h1 className="text-sm font-medium leading-tight text-sidebar-foreground tracking-tight truncate">HAYAHAI BI</h1>
              <p className="text-[10px] leading-tight text-muted-foreground uppercase tracking-widest">Analytics</p>
            </div>
          </div>
          {!isMobile && (
            <button
              onClick={toggleCollapse}
              className="shrink-0 p-1.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground rounded-md transition-colors"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        {NAV_SECTIONS.map((section, sectionIdx) => {
          return (
            <div key={section.sectionLabel} className={sectionIdx > 0 ? "mt-4" : ""}>
              {(!isCollapsed || isMobile) && (
                <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                  {section.sectionLabel}
                </p>
              )}
              {isCollapsed && !isMobile && sectionIdx > 0 && (
                <div className="mx-auto my-2 h-px w-6 bg-border" />
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const queryString = searchParams.toString();
                  const fullHref = `/${tenantSlug}${item.href}${queryString ? `?${queryString}` : ""}`;
                  const isActive = item.href === "/dashboard"
                    ? pathname === `/${tenantSlug}/dashboard`
                    : pathname.startsWith(`/${tenantSlug}${item.href}`);

                  return (
                    <Link
                      key={item.label}
                      href={fullHref}
                      className={cn(
                        "flex h-9 items-center gap-2.5 px-3 rounded-md transition-all duration-[120ms] group",
                        isCollapsed && !isMobile && "justify-center px-0",
                        isActive
                          ? "bg-[var(--nav-active-bg)] text-[var(--nav-active-text)] font-medium"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      )}
                      title={item.label}
                    >
                      <item.icon className={cn(
                        "shrink-0 size-4",
                        isActive ? "text-[var(--nav-active-text)]" : "text-muted-foreground group-hover:text-foreground"
                      )} />
                      <span className={cn("text-sm hidden truncate", !isCollapsed && "md:inline", isMobile && "inline")}>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User Profile Dropdown */}
      <div className="p-2 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className={cn(
              "flex items-center gap-2 px-2 py-2 cursor-pointer hover:bg-muted/60 rounded-md transition-colors",
              isCollapsed && !isMobile && "justify-center"
            )}>
              <Avatar className="size-7 rounded-md shrink-0">
                <AvatarImage src={user?.email === "admin@ayahay.com" ? "https://lh3.googleusercontent.com/aida-public/AB6AXuARVrNVO7BNdOULCPAUPGEjeVDRD9yeFmcbvwCRRhx3AUZzmvt_rR1RG9PhiL0UJ7QvUvjltX0GmzWPX7ApIvlpskLNZHlJ5QGsoALBl5rp87XuL_civpgJU1EVTDjE8VNX_g8rB6tzgUKuhFA418qe8MTSvy_xuLvXZme7H8WHxOasrOiE8-bQN9kMmLzWd1su-wQ7HEF2VPD7kp2rvB40GLemOquKndY9fq4vzWgbYKjB0vH89_saV2KN8SRyjKZ-oDHUbqSv-A" : ""} />
                <AvatarFallback className="rounded-md bg-primary/10 text-primary text-[11px] font-medium">{(user?.first_name?.[0] || "") + (user?.last_name?.[0] || "") || "US"}</AvatarFallback>
              </Avatar>
              <div className={cn("hidden flex-1 min-w-0 text-left", !isCollapsed && "md:block", isMobile && "block")}>
                <p className="text-xs font-medium truncate text-foreground">
                  {user?.first_name
                    ? `${user.first_name}${user.last_name ? ` ${user.last_name}` : ''}`
                    : (user?.name || user?.email || 'User')}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">{user?.role || "Executive"}</p>
              </div>
              {(!isCollapsed || isMobile) && <ChevronsUpDown className="ml-auto size-3 text-muted-foreground shrink-0" />}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" side="right" sideOffset={8}>
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-7 w-7 rounded-md">
                  <AvatarImage src={user?.email === "admin@ayahay.com" ? "https://lh3.googleusercontent.com/aida-public/AB6AXuARVrNVO7BNdOULCPAUPGEjeVDRD9yeFmcbvwCRRhx3AUZzmvt_rR1RG9PhiL0UJ7QvUvjltX0GmzWPX7ApIvlpskLNZHlJ5QGsoALBl5rp87XuL_civpgJU1EVTDjE8VNX_g8rB6tzgUKuhFA418qe8MTSvy_xuLvXZme7H8WHxOasrOiE8-bQN9kMmLzWd1su-wQ7HEF2VPD7kp2rvB40GLemOquKndY9fq4vzWgbYKjB0vH89_saV2KN8SRyjKZ-oDHUbqSv-A" : ""} alt={user?.first_name ? `${user.first_name}${user.last_name ? ` ${user.last_name}` : ''}` : (user?.email || 'User')} />
                  <AvatarFallback className="rounded-md">{(user?.first_name?.[0] || "") + (user?.last_name?.[0] || "") || "US"}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {user?.first_name
                      ? `${user.first_name}${user.last_name ? ` ${user.last_name}` : ''}`
                      : (user?.name || user?.email || 'User')}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive focus:bg-destructive/10">
              <LogOut className="mr-2 size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
