"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import {
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
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";

interface NavSection {
  sectionLabel: string;
  items: NavItem[];
}
import { cn } from "@/lib/utils";
import { useMobileMenu } from "@/components/mobile-menu-provider";

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
  const { isCollapsed, toggleCollapse } = useMobileMenu();

  return (
    <aside 
      className={cn(
        "flex h-screen flex-col transition-all duration-300",
        "bg-sidebar/80 backdrop-blur-2xl",
        isMobile
          ? "w-full border-r border-sidebar-border"
        : isCollapsed
          ? "w-[82px] px-3 py-3"
          : "w-[272px] px-3 py-3"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "bi-panel bi-noise rounded-2xl",
          isCollapsed && !isMobile ? "px-2 py-2" : "px-3 py-3",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2.5",
            isCollapsed && !isMobile && "flex-col gap-2",
          )}
        >
          <div className={cn(
            "flex items-center gap-2.5 flex-1 min-w-0",
            isCollapsed && !isMobile && "justify-center"
          )}>
            <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-2xl border border-primary/25 bg-primary/15 shadow-[0_0_28px_var(--glow-color)]">
              <Image
                src="/images/logo/hayahai_logo_v2_nodp_nopropeller_final_300px.png"
                alt="Ayahay BI logo"
                width={28}
                height={28}
                className="object-contain"
              />
            </div>
            <div className={cn(
              "hidden min-w-0",
              !isCollapsed && "md:block",
              isMobile && "block"
            )}>
              <h1 className="text-sm font-semibold leading-tight text-sidebar-foreground tracking-tight truncate">HAYAHAI BI</h1>
              <p className="text-[10px] leading-tight text-muted-foreground uppercase tracking-[0.28em]">Analytics</p>
            </div>
          </div>
          {!isMobile && (
            <button
              onClick={toggleCollapse}
              className={cn(
                "shrink-0 rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-foreground",
                isCollapsed ? "grid size-8 place-items-center p-0" : "p-2",
              )}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-3 flex-1 overflow-y-auto rounded-2xl border border-sidebar-border/50 bg-background/20 px-2.5 py-3 shadow-inner shadow-black/10">
        {NAV_SECTIONS.map((section, sectionIdx) => {
          return (
            <div key={section.sectionLabel} className={sectionIdx > 0 ? "mt-5" : ""}>
              {(!isCollapsed || isMobile) && (
                <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/65">
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
                        "group relative flex h-10 items-center gap-3 overflow-hidden rounded-xl px-3 transition-all duration-200",
                        isCollapsed && !isMobile && "justify-center px-0",
                        isActive
                          ? "text-[var(--nav-active-text)] font-medium"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                      title={item.label}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="active-nav-pill"
                          className="absolute inset-0 rounded-xl border border-cyan-500/25 bg-gradient-to-r from-cyan-500/18 via-primary/10 to-transparent shadow-[0_0_30px_var(--glow-color)]"
                          transition={{ type: "spring", stiffness: 420, damping: 34 }}
                        />
                      )}
                      {isActive && (
                        <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_18px_var(--glow-color)]" />
                      )}
                      <item.icon className={cn(
                        "relative z-10 shrink-0 size-4 transition-transform group-hover:scale-110",
                        isActive ? "text-[var(--nav-active-text)]" : "text-muted-foreground group-hover:text-foreground"
                      )} />
                      <span className={cn("relative z-10 hidden truncate text-sm", !isCollapsed && "md:inline", isMobile && "inline")}>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="mt-4">
        {(!isCollapsed || isMobile) && (
          <div className="mb-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-cyan-700 shadow-[0_0_26px_var(--glow-color)] dark:text-cyan-200">
            <div className="flex items-center gap-2 text-xs font-medium">
              <Sparkles className="size-3.5" />
              AI sync operational
            </div>
            <p className="mt-1 text-[11px] leading-4 text-muted-foreground">Finance ledger, routes, and vessel telemetry are streaming.</p>
          </div>
        )}
      </div>
    </aside>
  );
}
