# Executive Overview Documentation

System: Ayahay BI Dashboard
Repository: ayahay-bi-dashboard
Primary page: app/[tenant_slug]/dashboard/page.tsx
Related backends: ayahay-client-api, ayahay-api-v2 (route map only)
Last updated: April 24, 2026

---

## 1. Purpose

The Executive Overview page is the BI landing dashboard for tenant-level business and operational monitoring. It combines revenue KPIs, trend charts, route/vessel performance, source mix, and real-time widgets (activity, schedule, utilization heatmap, top agents).

This document explains:
- page architecture and rendering flow
- API contracts and tenant scoping
- frontend state model and data transformations
- chart/widget behavior
- error/loading behavior
- deployment and debugging guidance

---

## 2. Primary Entry Points

Frontend entry:
- app/[tenant_slug]/dashboard/page.tsx

Primary services:
- services/overview.service.ts
- services/dashboard-widgets.service.ts

Supporting types:
- types/overview.ts
- types/dashboard-widgets.ts

Supporting constants:
- constants/index.ts

Tenant context provider:
- components/providers/tenant-provider.tsx

Backend controller source (for reference):
- ayahay-client-api/src/modules/bi/bi.controller.ts

---

## 3. Feature Scope on Executive Overview

The page renders these sections in order:
1. KPI card row
- Sales Today
- MTD Revenue
- YTD Revenue
- Active Vessels

2. Period Comparison cards
- Today vs MTD Daily Average
- MTD vs YTD Monthly Average
- Passenger vs Cargo Revenue

3. Core chart grid
- Booking Revenue Trend (line)
- Revenue by Route (horizontal bar, paginated)
- Revenue per Vessel (vertical bar, paginated)
- Revenue Source Breakdown (stacked pie)

4. Operational insights cards
- Top Route
- Top Vessel
- Cancellations health
- Revenue mix

5. Live widgets
- Live Activity Feed
- Today Schedule Timeline
- Capacity Utilization Heatmap
- Top Travel Agents

---

## 4. Data Sources and Endpoint Mapping

### 4.1 Overview dataset

Frontend calls:
- GET {tenant.api_base_url}/bi/overview/today
- GET {tenant.api_base_url}/bi/overview/mtd
- GET {tenant.api_base_url}/bi/overview/ytd

Code path:
- overviewService.getOverview(baseUrl, period, serviceKey)
- URL pattern: `${baseUrl}${API_ENDPOINTS.OVERVIEW}/${period}`
- API_ENDPOINTS.OVERVIEW = /bi/overview

Response contract expected by frontend:
- envelope: `{ data: OverviewData }`
- shape defined in types/overview.ts

### 4.2 Widget datasets

Frontend calls:
- GET {tenant.api_base_url}/bi/recent-activity?limit=20
- GET {tenant.api_base_url}/bi/today-schedule
- GET {tenant.api_base_url}/bi/capacity-heatmap
- GET {tenant.api_base_url}/bi/top-agents?limit=10

Code path:
- dashboardWidgetsService (apiFetch helper)

Response contract expected by frontend:
- envelope: `{ data: [...] }`

### 4.3 Backend ownership

Executive Overview and widget endpoints are served by ayahay-client-api BI controller under /bi/*.

Important distinction:
- /trips/unified belongs to ayahay-api-v2 and is used for route-map flow, not Executive Overview KPI/widgets.

---

## 5. Tenant Scoping Model

Tenant context comes from useTenant() and provides:
- activeTenant.api_base_url
- activeTenant.service_key

All Executive Overview requests send:
- target host: activeTenant.api_base_url
- header: x-service-key (when available)
- credentials: include

This means overview data isolation depends on:
1. correct active tenant resolution in TenantProvider
2. correct x-service-key propagation
3. backend tenant resolution from auth/service key context

Notes:
- TenantProvider contains optional local-dev override via NEXT_PUBLIC_CLIENT_API_URL.
- In production, this override should be unset unless intentionally pointing all traffic to a fixed shared API host.

---

## 6. Frontend State and Fetch Lifecycle

In app/[tenant_slug]/dashboard/page.tsx:

Primary state:
- period: today | mtd | ytd
- data: OverviewData | null
- isLoading, error
- routePage, vesselPage (chart pagination)
- widget collections and widgetsLoading
- kpiTotals (persistent totals cache for stable card values)

Fetch behavior:
- Overview fetch runs on [period, activeTenant]
- Widget fetch runs once per activeTenant change (independent of period)
- Widget calls are parallelized with Promise.allSettled (partial success tolerated)

Why kpiTotals exists:
- Prevents KPI cards from visually resetting while switching period.
- Preserves today/mtd/ytd values as they become available.

---

## 7. Normalization and Data Hygiene

overview.service.ts applies two normalizers:

1. normalizeOverviewData(data)
- lowercases pax_breakdown keys
- lowercases cargo_breakdown keys
- normalizes by_source URL keys to readable labels like Website or Website (subdomain)
- merges duplicate normalized source labels

2. normalizeRoutes(data)
- ensures each revenue_by_route row has route_name
- fallback order: route_name -> canonical_route_name -> Unknown Route

Reason:
- backend responses may vary by environment/version (uppercase keys, canonical names, URL-like source keys).
- normalization keeps chart components stable and avoids case-sensitive lookup bugs.

---

## 8. Visualization Logic Details

### 8.1 KPI row

Cards are interactive period selectors (today/mtd/ytd). Active card shows breakdown items:
- passengers
- cargo units
- canceled
- total trips
- expenses

Active Vessels card uses revenue_by_vessel length.

### 8.2 Period comparisons

Computed values:
- dailyMtdAvg = mtd / day_of_month
- monthlyYtdAvg = ytd / month_index

Comparison card delta logic:
- above threshold: > 1%
- below threshold: < -1%
- otherwise: On track

### 8.3 Revenue trend line

Uses data.revenue_trend. Label granularity depends on backend period endpoint semantics:
- today: hourly trend
- mtd: daily trend
- ytd: monthly trend

### 8.4 Revenue by route / vessel

Sorted descending by total_revenue.

Pagination:
- routes: 3 rows/page
- vessels: 10 rows/page

### 8.5 Revenue source breakdown pie

Outer ring:
- Passengers
- Cargo

Inner ring:
- passenger classes from pax_breakdown
- cargo classes from cargo_breakdown

Tooltip/source drill details are built from:
- by_source (for passenger source detail)
- cargo_class_breakdown (rolling/loose class detail)

---

## 9. Insight Card Rules

Insights are derived client-side from OverviewData:

- Top Route:
  highest revenue_by_route total_revenue

- Top Vessel:
  highest revenue_by_vessel total_revenue

- Cancellation health:
  cancelRate = canceled_count / (total_trips + canceled_count)
  warning when cancelRate > 5%

- Revenue Mix:
  cargo share vs passenger share from passenger_vs_cargo totals

---

## 10. Loading, Error, and Resilience Behavior

Overview:
- loading: KPI and chart skeletons
- failure: full-page error block with retry suggestion text

Widgets:
- loaded independently from overview
- Promise.allSettled means one widget can fail while others still render
- on widget failure, only that widget remains empty/skeleton state

---

## 11. API Contracts (Current Frontend Expectation)

### 11.1 OverviewData (required high-level fields)
- kpi
- today_total_revenue
- mtd_total_revenue
- ytd_total_revenue
- revenue_trend[]
- revenue_by_route[]
- revenue_by_vessel[]
- passenger_vs_cargo

### 11.2 Widget contracts
- RecentActivityItem[]
- ScheduleTripItem[]
- CapacityHeatmapCell[]
- TopAgentItem[]

All are expected under `json.data` envelope.

---

## 12. Security and Multi-Tenant Considerations

Safe patterns currently used:
- tenant base URL is read from authenticated tenant context
- x-service-key attached to all overview/widget requests
- no tenant_id query override in frontend for overview endpoints

Risks to avoid:
- setting NEXT_PUBLIC_CLIENT_API_URL in production unintentionally
- stale tenant in localStorage causing wrong slug-to-tenant resolution
- missing service_key leading to backend fallback auth behavior

Recommended checks:
- validate activeTenant.slug and activeTenant.api_base_url alignment on page load
- validate x-service-key present in network requests
- audit backend for strict tenant resolution from service key/auth context

---

## 13. Deployment and Environment Variables

Relevant frontend env:
- NEXT_PUBLIC_API_V2_URL
- NEXT_PUBLIC_CLIENT_API_URL

For Executive Overview specifically:
- data host is activeTenant.api_base_url from login tenant payload
- NEXT_PUBLIC_API_V2_URL is not the primary host for /bi/overview endpoints

Operational reminder:
- NEXT_PUBLIC_* vars are build-time in Next.js
- changing them in Vercel requires a fresh redeploy

---

## 14. Known Implementation Notes

1. lib/overview-transformer.ts exists but is not currently used by the page.
- It provides a normalized chart/table model that can be adopted later for cleaner UI composition.

2. Backend BI controller methods are marked @Public() in ayahay-client-api for these routes.
- Tenant safety still relies on middleware/guards and service key context.

3. Period KPI stability is intentional via kpiTotals cache.
- This avoids card flicker while switching tabs.

---

## 15. Troubleshooting Checklist

If Executive Overview is blank or incorrect:

1. Confirm tenant context
- activeTenant is resolved
- activeTenant.api_base_url is non-empty
- activeTenant.service_key exists

2. Confirm network targets
- requests hit expected tenant host under /bi/*
- no localhost requests in production

3. Confirm response shape
- payload has top-level data
- required fields in OverviewData are present

4. Confirm key normalization assumptions
- pax/cargo keys may be uppercase or lowercase
- route may arrive as canonical_route_name

5. Confirm widget endpoint health
- /bi/recent-activity
- /bi/today-schedule
- /bi/capacity-heatmap
- /bi/top-agents

6. Confirm backend deploy parity
- ayahay-client-api serving the expected BI controller version

---

## 16. Suggested Future Improvements

1. Adopt lib/overview-transformer.ts in the page to reduce inline mapping logic.
2. Add runtime schema validation (zod) for OverviewData and widget payloads.
3. Add structured error boundaries per section (KPI, chart, widget) rather than one page-level error.
4. Add telemetry for endpoint latency and partial widget failures.
5. Add automated contract tests between BI dashboard and ayahay-client-api BI responses.

---

## 17. Quick Reference: File Map

- app/[tenant_slug]/dashboard/page.tsx
  Executive Overview UI, state orchestration, section rendering

- services/overview.service.ts
  Overview period fetch + payload normalization

- services/dashboard-widgets.service.ts
  Widget API clients and shared fetch helper

- types/overview.ts
  Overview response interfaces

- types/dashboard-widgets.ts
  Widget response interfaces

- components/providers/tenant-provider.tsx
  Active tenant resolution and optional local override behavior

- constants/index.ts
  Endpoint constants used by services

- ayahay-client-api/src/modules/bi/bi.controller.ts
  Backend endpoint definitions for overview and widgets
