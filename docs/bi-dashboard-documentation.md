# Ayahay / HAYAHAI BI Dashboard — Comprehensive Technical Documentation

**System:** HAYAHAI BI Dashboard  
**Repository:** `ayahay-bi-dashboard`  
**Related Services:** `ayahay-client-api`, `ayahay-api-v2`  
**Last Updated:** April 28, 2026 (Frontend Executive Intelligence + Renewed BI Analytics)  
**Document Audience:** Developers, data analysts, product owners, and executive stakeholders

---

## Table of Contents

1. [Overview](#1-overview)
2. [System Integration](#2-system-integration)
3. [Data Architecture](#3-data-architecture)
4. [Data Usage](#4-data-usage)
5. [Dashboard Structure](#5-dashboard-structure)
   - 5A. [Executive](#5a-executive)
   - 5B. [Financials](#5b-financials)
   - 5C. [Sales & Channels](#5c-sales--channels)
   - 5D. [Demand](#5d-demand)
   - 5E. [Operations](#5e-operations)
   - 5F. [Assets](#5f-assets)
6. [Technical Considerations](#6-technical-considerations)
7. [Future Improvements](#7-future-improvements)

---

## 1. Overview

### 1.1 Purpose

The HAYAHAI BI Dashboard is a **multi-tenant, executive-grade business intelligence platform** built specifically for ferry and maritime shipping operators. It consolidates operational, financial, and demand-side data into a single analytics interface, enabling leadership and business teams to:

- Monitor revenue health across all routes and vessels in real time
- Identify booking trends, demand patterns, and channel performance
- Analyze passenger and cargo utilization at a granular level
- Track operational events, trip statuses, and fleet activity on a live map
- Export structured financial reports for reconciliation and audit purposes

The dashboard is not a transactional system. It is a **read-optimized, reporting-focused interface** that queries purpose-built BI views and projections from the backend services.

### 1.2 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    HAYAHAI BI Dashboard                          │
│               (Next.js 15, App Router, TypeScript)               │
│                                                                  │
│  ┌─────────────┐   ┌──────────────┐   ┌─────────────────────┐  │
│  │  Executive  │   │  Analytics   │   │  Operations/Assets  │  │
│  │  Overview   │   │  (Sales,     │   │  (Route Map, Fleet) │  │
│  │  page.tsx   │   │   Expenses,  │   │                     │  │
│  │             │   │   Trends)    │   │                     │  │
│  └──────┬──────┘   └──────┬───────┘   └──────────┬──────────┘  │
│         │                 │                       │             │
│         └─────────────────┴───────────────────────┘             │
│                           │                                     │
│              Service Layer (services/*.service.ts)              │
│         fetch() + x-service-key header per request              │
└───────────────────────────┬──────────────────────────────────────┘
                            │ REST (HTTPS)
            ┌───────────────┴────────────────┐
            │                                │
  ┌─────────▼──────────┐         ┌───────────▼──────────┐
  │  ayahay-client-api │         │    ayahay-api-v2      │
  │  (NestJS)          │         │    (NestJS)           │
  │                    │         │                       │
  │  /bi/* endpoints   │         │  /trips/unified       │
  │  BI views, reports │         │  Tenant read          │
  │  auth, export      │         │  projection for       │
  │                    │         │  Route Map            │
  └─────────┬──────────┘         └───────────┬───────────┘
            │                                │
  ┌─────────▼────────────────────────────────▼───────────┐
  │            PostgreSQL (multi-tenant schema)           │
  │   booking.*, bi_dashboard.*, client.*, tenant.*       │
  └──────────────────────────────────────────────────────┘
```

### 1.3 Key Stakeholders and Users

| Role | Primary Use Cases |
|---|---|
| **Executive / C-Suite** | Revenue KPIs, daily/MTD/YTD comparisons, top-line performance |
| **Finance Team** | Gross/net revenue analysis, refund tracking, expense reconciliation |
| **Operations Team** | Live route monitor, trip status, schedule adherence |
| **Sales / Channel Team** | Booking source breakdown, travel agent performance, channel trends |
| **Data Analysts** | Drill-down reports, export to Excel, trend comparisons |
| **Developers / Integrators** | API contracts, service-key-based tenant access |

---

## 2. System Integration

### 2.1 Frontend–Backend Integration Overview

The BI dashboard is a **Next.js 15 application** using the App Router. All data fetching is done client-side via the native `fetch()` API from within React components, using service modules located in `services/`. There is no server-side data fetching layer (no `getServerSideProps` or Server Actions for BI data); all API calls are made from the browser.

The dashboard communicates with **two backend services**:

| Backend | Base URL Environment Variable | Primary Role |
|---|---|---|
| `ayahay-client-api` | `NEXT_PUBLIC_CLIENT_API_URL` | All BI reports, financial data, auth, export |
| `ayahay-api-v2` | `NEXT_PUBLIC_API_V2_URL` | Unified trip/route projection for the Route Map |

### 2.2 API Conventions

BI endpoints follow a hybrid contract pattern:

- **Method:** `GET` (read-only for reports/analytics)
- **Content-Type:** `application/json`
- **Authentication:** `x-service-key` header + HTTP-only session cookie (see Section 2.4)
- **Date filtering:** `?from=YYYY-MM-DD&to=YYYY-MM-DD` query parameters
- **Date anchor mode (analytics endpoints):** `date_type=booking|departure` (default `booking`)

**Legacy BI endpoints (`/bi/*`) response contract:**

```json
{
  "data": { ... }
}
```

The legacy service layer unwraps `data` before returning to components. Example:

```typescript
const json: SalesReportApiResponse = await response.json();
return json.data;  // Only the payload, not the wrapper
```

**Renewed analytics endpoints (`/bi/analytics/*`) response contract:**

```json
{
  "summary": { ... },
  "breakdown": [ ... ],
  "trends": [ ... ],
  "meta": {
    "filters_applied": { ... },
    "generated_at": "...",
    "trip_count": 0
  }
}
```

For analytics endpoints, frontend `biService` reads the payload directly (no `data` envelope unwrap).

### 2.3 Full API Endpoint Reference

The dashboard currently uses a hybrid of renewed analytics endpoints and legacy executive/widget endpoints.

| Endpoint | Service | Description |
|---|---|---|
| `POST /bi/auth/login` | client-api | Authenticate and retrieve tenant list |
| `GET /bi/overview/finance/:period` | client-api | Legacy finance-accurate executive overview (today/mtd/ytd) |
| `GET /bi/analytics/executive/overview` | client-api | Executive totals, route breakdown, daily trends |
| `GET /bi/analytics/executive/kpis` | client-api | Executive KPI set |
| `GET /bi/analytics/executive/forecast` | client-api | Forecast trends and monthly summary |
| `GET /bi/analytics/financials/revenue` | client-api | Revenue breakdown (route/vessel/trip/method) |
| `GET /bi/analytics/financials/profitability` | client-api | Profitability breakdown |
| `GET /bi/analytics/financials/expenses` | client-api | Expense summary, lines, trends |
| `GET /bi/analytics/financials/reconciliation` | client-api | Payment-item reconciliation summary + discrepancies |
| `GET /bi/analytics/sales/overview` | client-api | Sales summary, top routes, daily trend |
| `GET /bi/analytics/sales/channels` | client-api | Channel performance |
| `GET /bi/analytics/sales/insights` | client-api | Booking insights summary |
| `GET /bi/analytics/demand/passengers` | client-api | Passenger demand summary + segments |
| `GET /bi/analytics/demand/cargo` | client-api | Cargo demand summary + segments |
| `GET /bi/analytics/demand/trends` | client-api | Daily demand trend points |
| `GET /bi/analytics/operations/schedule` | client-api | Schedule utilization summary/trend |
| `GET /bi/analytics/operations/live` | client-api | Live bookings + live trips feed |
| `GET /bi/analytics/assets/vessels` | client-api | Vessel asset and performance analytics |
| `GET /bi/comparison-trend/entities` | client-api | Entity lookup for route/vessel/trip comparison charts |
| `GET /bi/comparison-trend` | client-api | Cross-dimensional trend comparison (route/vessel/trip) |
| `GET /bi/recent-activity` | client-api | Live booking activity feed (widget) |
| `GET /bi/today-schedule` | client-api | Today's schedule (widget) |
| `GET /bi/capacity-heatmap` | client-api | Capacity utilization heatmap (widget) |
| `GET /bi/top-agents` | client-api | Top travel agents (widget) |
| `GET /trips/unified` | api-v2 | Unified route map and trip projection |
| `GET /public/routes/sea-paths` | client-api | Sea route geometry (GeoJSON fallback) |

### 2.4 Authentication and Authorization

The dashboard uses a **dual-token model**:

1. **HTTP-only Session Cookie** — set by `ayahay-client-api` at login; attached automatically on all `fetch()` calls via `credentials: 'include'`.
2. **`x-service-key` Header** — a per-tenant service key returned in the login response. It is stored in `localStorage` and `document.cookie`, then sent on all BI API calls to scope the request to the correct tenant.

**Login flow:**

```
1. User submits credentials to POST /bi/auth/login
2. Server validates and returns:
   - HTTP-only session cookie (auto-managed by browser)
   - { data: { user: User, tenants: Tenant[] } }
3. Frontend stores tenants[] and user in localStorage
4. service_key from tenants[0] is written to document.cookie
5. All subsequent API calls include:
   - credentials: 'include'  (sends session cookie)
   - x-service-key header    (tenant scoping)
```

> **Security note:** The `service_key` is used by the backend to resolve the tenant on every request. The dashboard must **not** send a `tenant_id` parameter for the unified route endpoint (`/trips/unified`). Tenant resolution is enforced server-side from the service key, preventing cross-tenant data leakage.

**Multi-tenant routing:**

The URL structure is `/{tenant_slug}/dashboard/...`. The `tenant_slug` is parsed from `pathname.split("/")[1]` and passed as display context only; actual tenant enforcement is always server-side via the `x-service-key`.

### 2.5 Data Flow Diagram

```
Browser (BI Dashboard)
  │
  │  1. User logs in → POST /bi/auth/login
  │     ← session cookie + { tenants, user }
  │
  │  2. Store service_key → localStorage + cookie
  │
  │  3. Page load triggers service calls
  │     → GET /bi/overview?from=...&to=...
  │        Headers: x-service-key: <key>
  │        Cookies: <session>
  │     ← { data: { kpi, revenue_trend, ... } }
  │
  │  4. Service layer unwraps data → React state
  │
  │  5. Components render charts/tables from state
```

---

## 3. Data Architecture

### 3.1 Data Sources

| Source | Layer | Description |
|---|---|---|
| `booking.bookings` | Operational | Booking header records |
| `booking.booking_trips` | Operational | Trip legs per booking |
| `booking.booking_trip_passengers` | Operational | Passenger line items |
| `booking.booking_trip_cargos` | Operational | Cargo line items |
| `booking.booking_payment_items` | Financial (source of truth) | Line-level financial ledger |
| `booking.booking_payments` | Financial | Payment instrument snapshots |
| `booking.payment_transactions` | Financial | Gateway checkout lifecycle |
| `booking.payment_gateway_webhooks` | Financial | Raw webhook event audit log |
| `booking.payment_refunds` | Financial | Designed gateway refund registry |
| `client.trips` | Reference | Operational trip records |
| `client.routes` | Reference | Route definitions |
| `client.ports` | Reference | Port coordinates and metadata |
| `client.ships` | Reference | Vessel definitions |
| `bi_dashboard.overview_view` | BI View | Pre-aggregated overview metrics |
| `bi_dashboard.sales_report_view` | BI View | Sales report with route names |
| `bi_dashboard.expenses_report_view` | BI View | Expense aggregations |
| `bi_dashboard.passenger_per_trip_view` | BI View | Per-trip passenger breakdown |
| `bi_dashboard.cargo_per_trip_view` | BI View | Per-trip cargo breakdown |
| `bi_dashboard.status_report_view` | BI View | Booking status and health |
| `tenant.tenant_trips` | BI Projection | Unified trip projection (api-v2) |

### 3.2 Data Models and Schema Overview

#### Core Financial Entity: `booking.booking_payment_items`

This is the **most granular, authoritative financial source** used by BI. Each row represents a single priced line item.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `booking_id` | UUID | Parent booking |
| `booking_trip_passenger_id` | UUID \| null | Links to a passenger line |
| `booking_trip_cargo_id` | UUID \| null | Links to a cargo line |
| `amount` | Decimal | Absolute monetary value |
| `is_credit` | Boolean | `true` = deduction (refund/credit) |
| `charge_code` | String | `FARE`, `CHARGES`, `TAXES`, `REFUND` |
| `deleted_at` | Timestamp \| null | Soft-delete |

#### Booking Header: `booking.bookings`

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `created_at` | Timestamp | Booking creation time (Asia/Manila) |
| `booking_status` | String | `Confirmed`, `Cancelled`, `Draft`, etc. |
| `booking_type` | String | `Passenger`, `Cargo`, `Mixed` |
| `source` | String | Booking channel (OTC, URL, agent code) |
| `reference_no` | String | Human-readable booking reference |
| `booked_by_travel_agent_id` | UUID \| null | Links to travel agent if applicable |

#### BI Overview View: `bi_dashboard.overview_view`

The pre-aggregated view used by the Executive Overview endpoint. It joins booking, trip, route, vessel, and payment data to produce daily revenue summaries.

### 3.3 Money Flow and Financial Model

```
Booking Created
      │
      ▼
BookingsPriceService.calculateBookingPricing()
      │
      ├─ Insert FARE rows → booking_payment_items (is_credit=false)
      ├─ Insert CHARGES rows → booking_payment_items (is_credit=false)
      └─ Insert TAXES rows → booking_payment_items (is_credit=false)
      │
      ▼
payment_status = 'completed' (OTC) or 'pending' (gateway)
      │
      ▼
Gateway Webhook (PayMongo / Maya)
      │
      ├─ payment_gateway_webhooks (audit, idempotent by event_id)
      ├─ payment_transactions.status = 'succeeded' | 'failed'
      └─ booking_payments.payment_status = 'completed' | 'failed'
      │
      ▼
Refund / Invalidation
      │
      └─ Insert REFUND rows → booking_payment_items (is_credit=true, charge_code='REFUND')
```

> **Finance note:** The authoritative refund signal for BI is `is_credit=true` rows in `booking_payment_items`. The `payment_refunds` table exists in schema but is not consistently written to by the main operational flow. Do not rely solely on `payment_refunds` for refund totals in finance-grade reporting.

### 3.4 Trip Sync Architecture (Route Map)

The Route Map section uses a **separate read projection** maintained by `ayahay-api-v2`:

```
ayahay-client-api           ayahay-api-v2             BI Dashboard
──────────────────          ─────────────────         ────────────
Trip mutations     ──►  Outbox events   ──►  tenant.tenant_trips
(create/update/         (event type:               ▼
 cancel/status)          CREATE/UPDATE/       GET /trips/unified
                         DELETE)                    ▼
                                              route-map.service.ts
                                                    ▼
                                             Fleet Map / Route UI
```

**Fallback:** If the unified endpoint returns data without renderable geometry (no `route_coords` and no port coordinates), the service automatically falls back to `GET /bi/route-map` on `ayahay-client-api`.

### 3.5 Data Refresh Frequency

| Data Domain | Refresh Type | Typical Latency |
|---|---|---|
| Financial KPIs (overview) | On-demand (page load / date filter) | Near real-time (seconds) |
| Sales / Expenses reports | On-demand | Near real-time |
| Passenger / Cargo analytics | On-demand | Near real-time |
| Live Activity Feed | Polling (configurable limit) | ~1 second lag |
| Today's Schedule | On-demand | Near real-time |
| Route Map trip projection | Event-driven sync (outbox) | Seconds to minutes |
| Capacity Heatmap | On-demand | Aggregated; near real-time |

### 3.6 Renewed BI Analytics Backend Architecture

The renewed analytics backend in `ayahay-client-api` is organized as a modular pipeline under `src/modules/bi`:

- `bi.controller.ts`
  - Exposes renewed endpoints under `/bi/analytics/*`.
  - Keeps legacy `/bi/*` endpoints active for backwards compatibility.
- `bi-analytics.service.ts`
  - Central orchestration service for analytics domains (executive, financials, sales, demand, operations, assets).
  - Loads normalized trip bundles, then delegates aggregation to domain aggregators.
- `dto/bi-analytics.dto.ts`
  - Defines filter contract and analytics response/meta shapes.
  - Includes `date_type` support (`booking` | `departure`).
- `aggregators/*`
  - `executive.aggregator.ts`
  - `financials.aggregator.ts`
  - `sales.aggregator.ts`
  - `demand.aggregator.ts`
  - `operations.aggregator.ts`
  - `assets.aggregator.ts`
- `utils/bi-queries.util.ts`
  - BI-specific DB query helpers, including booking-date trip discovery.

**Trip loading behavior (`loadTripBundles`)**

- If `date_type=departure`: trips are discovered via trip departure date range.
- If `date_type=booking` (default): trips are discovered via booking creation date range.
- After trip IDs are resolved, trip metadata, sales data, and disbursements are fetched and composed into a `TripBundle` for aggregation.

This allows the same analytics endpoint to answer both commercial (booking-driven) and operational (departure-driven) reporting needs without duplicating endpoint surfaces.

---

## 4. Data Usage

### 4.1 Data Processing and Transformation

The BI service layer performs several normalization steps before data reaches the chart components:

**Source label normalization** (`overview.service.ts`):  
Booking sources can be raw URLs (`https://tenant.hayahai.com`) or shorthand labels (`OTC`). The service normalizes all URL-based sources to `"Website"` or `"Website (subdomain)"` and merges duplicate labels:

```typescript
if (/^https?:\/\//i.test(key)) {
  const hostname = new URL(key).hostname;
  label = "Website";
  const sub = hostname.split(".")[0];
  if (sub && sub !== "www") label = `Website (${sub})`;
}
```

**Case normalization for breakdown keys:**  
Passenger and cargo breakdown keys can arrive in uppercase (`"ADULT"`) or lowercase (`"adult"`) depending on the environment. The service forces all keys to lowercase before rendering.

**Route map geometry fallback:**  
The `hasRenderableGeometry()` function checks whether any trip or route in the API response has either `route_coords` (preferred sea-route polyline) or both source and destination port coordinates. If neither is present, the client-api fallback is triggered.

### 4.2 Aggregations and Calculations

**Gross Revenue:**
```sql
SUM(CASE WHEN bpi.is_credit THEN 0 ELSE bpi.amount END)
```

**Net Revenue:**
```sql
SUM(CASE WHEN bpi.is_credit THEN -bpi.amount ELSE bpi.amount END)
```

**Refund Amount (operational, recommended):**
```sql
SUM(CASE WHEN bpi.is_credit = true AND bpi.charge_code = 'REFUND'
         THEN bpi.amount ELSE 0 END)
```

**Total Bookings:**
```sql
COUNT(DISTINCT b.id)
WHERE b.booking_status NOT IN ('Cancelled', 'Draft')
  AND b.deleted_at IS NULL
```

**Load Factor (Passenger Utilization):**
```
pax_utilization_pct = boarded_count / total_seats × 100
```

**Profit Margin:**
```
profit_margin = (net_revenue - expenses) / gross_revenue
```

### 4.3 KPI Definitions

| KPI | Definition | Source |
|---|---|---|
| **Gross Revenue** | Sum of all non-credit payment items | `booking_payment_items.is_credit = false` |
| **Net Revenue** | Gross minus credit/refund items | Signed sum of `booking_payment_items.amount` |
| **Refund Amount** | Sum of credit items with `charge_code = 'REFUND'` | `booking_payment_items` |
| **Total Bookings** | Distinct confirmed booking count | `booking.bookings` |
| **Total Passengers** | Count of confirmed passenger lines | `booking_trip_passengers` |
| **Total Cargo Units** | Count of confirmed cargo lines | `booking_trip_cargos` |
| **Total Trips** | Count of non-cancelled trip records | `client.trips` |
| **Active Vessels** | Ships with at least one trip today | `client.ships` |
| **Today Revenue** | Gross revenue with `created_at::date = today` | `bi_dashboard.overview_view` |
| **MTD Revenue** | Revenue from the 1st of the current month | `bi_dashboard.overview_view` |
| **YTD Revenue** | Revenue from January 1st of the current year | `bi_dashboard.overview_view` |
| **Avg Advance Window** | Mean days between booking creation and departure | `advance_booking` endpoint |
| **Critical Voyages** | Active trips with pax utilization ≥ 80% | `advance_booking` endpoint |
| **Pacing Status** | `ahead` / `on-track` / `behind` vs MTD target | `finance_overview.forecast` |
| **Profit Class** | `high` (>30% margin) / `low` (0–30%) / `loss` (<0%) | `revenue_by_route` |
| **Top Route** | Route with highest net revenue in period | Derived from `revenue_by_route` |
| **Top Vessel** | Vessel with highest revenue in period | Derived from `revenue_by_vessel` |

---

## 5. Dashboard Structure

The navigation is organized into six top-level sections. Each section maps to one or more routes under `/{tenant_slug}/dashboard/...`.

---

### 5A. Executive

#### Executive Overview

**Route:** `/{tenant_slug}/dashboard`  
**Service:** `overview.service.ts`, `dashboard-widgets.service.ts`, `use-executive-intelligence.ts`  
**Backend endpoint:** `GET /bi/overview`, `GET /bi/overview/finance`

**Purpose:**  
The primary landing page for leadership and executives. It provides a full-spectrum view of business health — from top-line KPI cards to live operational feeds — without requiring drill-down navigation.

**Key Metrics / KPIs:**

| Metric | Description |
|---|---|
| Sales Today | Gross revenue recorded today (Asia/Manila timezone) |
| MTD Revenue | Month-to-date gross revenue |
| YTD Revenue | Year-to-date gross revenue |
| Active Vessels | Number of vessels with at least one trip today |
| Gross Revenue | Total revenue before refunds |
| Net Revenue | Revenue after refund deductions |
| Refund Amount | Total value of refunded bookings |
| Profit Margin | Net margin percentage |
| Today vs MTD Avg | Day-over-day comparison card |
| MTD vs YTD Monthly Avg | Month-over-month comparison card |
| Passenger vs Cargo Split | Revenue and unit breakdown by type |

**Data Sources:**
- `bi_dashboard.overview_view` — pre-aggregated daily revenue
- `booking.booking_payment_items` — ledger-accurate financial layer (finance tab)
- `bi_dashboard.status_report_view` — cancellation health data

**Visualizations (Current Frontend Layout):**
- Upper section:
  - KPI row for Net Revenue Today, MTD Net Revenue, YTD Net Revenue, and Active Vessels
  - Comparison strip cards: Yesterday, Last Week, Last Month
  - Forecast pacing card
  - Revenue Trend (Gross vs Net)
  - Revenue by Channel
  - Route Profitability
  - Reconciliation
  - Revenue per Vessel
  - Live Activity Feed
  - Today's Schedule
  - Capacity Utilization Heatmap
  - Top Travel Agents
- Lower section:
  - Executive Decision Intelligence Layer (decision cards + strategic selectors + AI summary + route intelligence map)

**Example use cases:**
- CEO opens the dashboard each morning to check yesterday's revenue and MTD pacing.
- COO reviews the live activity feed to spot unusual booking volumes on specific routes.
- Finance analyst switches to the Finance tab to cross-check net revenue against the ledger model.

**Example API response (overview KPI block):**
```json
{
  "data": {
    "kpi": {
      "total_revenue": 1284500.00,
      "passenger_revenue": 945200.00,
      "cargo_revenue": 339300.00,
      "total_passengers": 3812,
      "total_cargo_units": 148,
      "total_trips": 62,
      "total_expenses": 210000.00,
      "canceled_count": 7
    },
    "today_total_revenue": 84200.00,
    "mtd_total_revenue": 1284500.00,
    "ytd_total_revenue": 9840000.00
  }
}
```

---

#### Performance & KPIs *(Finance Tab on Executive Overview)*

**Route:** `/{tenant_slug}/dashboard` (Finance tab)  
**Backend endpoint:** `GET /bi/overview/finance`

**Purpose:**  
A ledger-accurate view of performance using signed `booking_payment_items` rather than the simplified overview view. Designed for finance teams who need refund-adjusted net revenue, channel metrics, and pacing data.

**Key Metrics / KPIs:**

| Metric | Description |
|---|---|
| Gross Revenue | Sum of non-credit payment items |
| Net Revenue | Gross minus all credit entries |
| Refund Amount | Sum of `is_credit=true, charge_code='REFUND'` entries |
| Profit Margin | `(net_revenue - expenses) / gross_revenue` |
| Revenue by Route | Per-route gross, net, refund, expense, margin, and profit class |
| Revenue by Channel | OTC / Online / OTA / Travel Agency split |
| Period Comparisons | Yesterday, last week, last month delta % |
| Forecast / Pacing | Projected today and MTD with `ahead/on-track/behind` status |
| Reconciliation Flags | Payment mismatches, refund mismatches, webhook failures |

**Visualizations:**
- Finance KPI summary cards
- Revenue trend line chart (gross vs net with previous-period overlay)
- Route performance table with profit class badges
- Channel breakdown table / bar chart

---

#### Forecast & Targets

**Purpose:**  
Surfaced via the `forecast` object on the Finance Overview endpoint. Provides a forward-looking revenue estimate for the current day and the remainder of the month.

**Key Metrics / KPIs:**

| Metric | Description |
|---|---|
| Today Projection | Estimated end-of-day revenue based on current pace |
| MTD Projection | Estimated end-of-month revenue |
| Pacing Status | `ahead` / `on-track` / `behind` relative to historical average |
| Elapsed % | What fraction of the current period has elapsed |

**Example API response:**
```json
{
  "forecast": {
    "today_projection": 95000.00,
    "mtd_projection": 1420000.00,
    "pacing_status": "ahead",
    "elapsed_pct": 0.73
  }
}
```

---

### 5B. Financials

#### Revenue Analytics (Sales Analytics)

**Route:** `/{tenant_slug}/dashboard/analytics/sales`  
**Service:** `services/bi/bi.service.ts` + `services/bi/bi.hooks.ts`  
**Backend endpoints:** `GET /bi/analytics/sales/overview`, `GET /bi/analytics/sales/channels`, `GET /bi/analytics/sales/insights`

**Purpose:**  
A detailed sales analytics view filterable by global BI date range. Shows passenger/cargo revenue, booking count, channel distribution, route ranking, and daily revenue trend from backend-computed summaries.

**Key Metrics / KPIs:**

| Metric | Description |
|---|---|
| Passenger Revenue | Net passenger-side revenue |
| Cargo Revenue | Net cargo-side revenue |
| Total Bookings | Confirmed booking count |
| Avg Booking Value | Revenue-per-booking aggregate |

**Data Sources:**
- BI analytics aggregators in client-api (`/bi/analytics/sales/*`)

**Visualizations:**
- Daily revenue trend line chart
- Revenue by channel pie/donut with always-visible labels
- Top routes by net revenue table/bar
- KPI cards for passenger revenue, cargo revenue, bookings, and average booking value

**Example use case:**
- Sales manager selects "This Month" filter and compares OTC vs Online revenue to evaluate channel strategy.

---

#### Profitability

**Purpose:**  
Derived from the Finance Overview's `revenue_by_route` array. Ranks routes by profit margin and classifies each as `high`, `low`, or `loss`.

**Key Metrics / KPIs:**

| Metric | Description |
|---|---|
| Gross Revenue | Pre-refund revenue per route |
| Net Revenue | Post-refund revenue per route |
| Expenses | Allocated expense for the route |
| Profit Margin | `(net - expenses) / gross` |
| Profit Class | `high` / `low` / `loss` classification |
| Booking Count | Confirmed bookings per route |

**Visualizations:**
- Route profitability table with color-coded profit class
- Horizontal bar chart: routes ranked by net revenue

---

#### Expenses

**Route:** `/{tenant_slug}/dashboard/analytics/expenses`  
**Service:** `services/bi/bi.service.ts` + `services/bi/bi.hooks.ts`  
**Backend endpoints:** `GET /bi/analytics/financials/expenses`, `GET /bi/analytics/financials/reconciliation`

**Purpose:**  
Tracks operational expenses and reconciliation health for the selected BI filter range.

**Key Metrics / KPIs:**

| Metric | Description |
|---|---|
| Total Expenses | Sum of all expense records in period |
| Expense Line Count | Number of expense rows in period |
| Discrepancy Count | Number of bookings with payment vs item delta above tolerance |
| Net Discrepancy | Aggregate payment-total minus item-total |

**Data Sources:**
- BI analytics financial aggregators and reconciliation query path

**Visualizations:**
- Expense breakdown table and trend
- Reconciliation discrepancy table (booking_id, payment_total, item_total, delta)
- Reconciliation KPI summary cards

**Note:**
Excel import/export operational flows remain available in legacy endpoints, but the analytics page itself is now driven by `/bi/analytics/financials/*`.

**Example use case:**
- Finance officer uploads monthly fuel and crew expense records via Excel, then reviews the category chart to compare against last month.

---

#### Reconciliation

**Purpose:**  
Exposed in legacy executive overview and renewed financial analytics flows. Surfaces data integrity signals to identify mismatches between gateway/payment records and financial ledger entries.

**Key Metrics / KPIs:**

| Metric | Description |
|---|---|
| Payment Mismatch Count | Booking payment status vs gateway transaction status mismatches |
| Refund Mismatch Amount | Sum of per-booking absolute deltas (gateway refund rows vs refund credit items) |
| Refund Mismatch Booking Count | Number of bookings with refund delta > 0 |
| Webhook Failures | Count of failed `payment_gateway_webhooks` events |
| Unmatched Items Count | Truly orphan payment items with no booking/trip/passenger/cargo linkage |

> **Current calculation details:**
> - Refund mismatch is scoped to gateway-related bookings.
> - Credit-side codes include `REFUND` and `REBOOK_REFUND`.
> - The metric reconciles per booking (not global total-vs-total) to avoid offset masking.

---

### 5C. Sales & Channels

#### Sales Analytics

*(See [Revenue Analytics](#revenue-analytics-sales-analytics) above — this is the same page, accessible from the Sales & Channels nav section.)*

---

#### Channel Performance (Trends & Comparison)

**Route:** `/{tenant_slug}/dashboard/analytics/trends`  
**Service:** `sales.service.ts` (comparison trend methods)  
**Backend endpoints:** `GET /bi/comparison-trend`, `GET /bi/comparison-trend/entities`

**Purpose:**  
Allows analysts to select multiple routes, vessels, or trips and overlay their revenue trends on a shared time axis. Supports granularity switching between daily, weekly, and monthly views.

**Key Metrics / KPIs:**

| Metric | Description |
|---|---|
| Total Sales | Per-entity gross revenue over time |
| Gross Revenue | Per-entity gross with comparison period |
| Total Bookings | Booking count per entity per period |
| Total Passengers | Passenger count per entity |
| Load Factor | Passenger load % per trip (when comparing trips) |

**Data Sources:**
- `bi_dashboard.sales_report_view`
- `client.trips`, `client.routes`, `client.ships`

**Visualizations:**
- Multi-series line chart — each entity as a distinct color series
- Entity selector with search (routes, vessels, or trips)
- Granularity selector (daily / weekly / monthly)
- Date range picker

**Example use case:**
- Regional manager compares revenue trends for Route A vs Route B over the past 90 days to determine which route warrants a capacity increase.

---

#### Booking Insights (Schedule + Live)

**Route:** `/{tenant_slug}/dashboard/analytics/booking`  
**Service:** `services/bi/bi.service.ts` + `services/bi/bi.hooks.ts`  
**Backend endpoints:** `GET /bi/analytics/operations/schedule`, `GET /bi/analytics/operations/live`

**Purpose:**  
Operational booking monitoring view that combines schedule utilization with live trips/bookings feed.

**Key Metrics / KPIs:**

| Metric | Description |
|---|---|
| Total Trips | Trips in selected period |
| Trips / Day | Average trips per day |
| Avg Pax / Trip | Mean passenger load per trip |
| Live Trips | Near-real-time trip feed from operations live endpoint |

**Data Sources:**
- BI analytics operations aggregators (`schedule` + `live`)

**Visualizations:**
- Daily trips trend chart
- Trips-by-route chart
- Route schedule detail table (avg pax/cargo per trip)
- Live trips list and recent live bookings feed

**Example API response:**
```json
{
  "overall_metrics": {
    "total_forward_revenue": 2840000.00,
    "avg_advance_window": 4.2,
    "peak_demand_date": "2026-05-03",
    "critical_voyages_count": 3
  },
  "capacity_alerts": [
    {
      "trip_id": "trip-uuid-001",
      "vessel_name": "MV Esperanza",
      "departure_date": "2026-05-01",
      "pax_utilization_pct": 87.5,
      "max_pax_capacity": 320,
      "cargo_utilization_pct": 45.0
    }
  ]
}
```

---

#### Executive Decision Intelligence (Lower Section)

**Route:** `/{tenant_slug}/dashboard`  
**Frontend selectors:** `hooks/use-executive-intelligence.ts`  
**Rendered block location:** lower section of Executive page (after core KPI/revenue/widgets sections)

**Purpose:**
Transforms finance overview and widget data into decision-ready executive cards that answer:

- What is happening right now?
- Which routes drive or drag performance?
- How risky are current operations?
- What should leadership prioritize next?

**Core selectors and outputs:**

| Selector | Output |
|---|---|
| `useRouteInsights()` | Decision cards, top route contributors, at-risk routes, growth contributors, route-layer map rows |
| `useExecutiveKPIs()` | Strategic KPI set + operational efficiency index |
| `useForecastMetrics()` | Confidence band (low/expected/high), route projection drivers, risk tier, benchmark comparison table |
| `useFleetAnalytics()` | Average utilization, intraday pace, day-of-week text insight |
| `useExecutiveAISummary()` | Consolidated executive summary sentence, top route contributor, most at-risk route, risk badge |

**Decision cards currently shown:**

- Revenue Anomaly Detection
- Underperforming Routes
- Overperforming Routes
- Fleet Efficiency Alert
- Operational Risk

**Strategic KPI cards currently shown:**

- Revenue Growth Rate
- Revenue / Vessel
- Revenue / Passenger
- Contribution Margin Proxy
- Load Factor Avg
- Operational Efficiency Index

**Important implementation notes:**

- The AI summary is deterministic/rule-based from selector outputs (not an LLM call).
- Domain language was updated for maritime context:
  - `Top route contributor`
  - `Most at-risk route`
- Alert banner is content-sized (`inline-flex w-fit max-w-full`) and does not stretch full width.

**Backend dependency:**
- This layer is computed from existing frontend state sourced from:
  - `GET /bi/overview/finance/:period`
  - `GET /bi/recent-activity`
  - `GET /bi/today-schedule`
  - `GET /bi/capacity-heatmap`
  - `GET /bi/top-agents`
- It does not yet require a dedicated executive-intelligence endpoint.

---

### 5D. Demand

#### Passenger Analytics

**Route:** `/{tenant_slug}/dashboard/analytics/passengers`  
**Service:** `services/bi/bi.service.ts` + `services/bi/bi.hooks.ts`  
**Backend endpoint:** `GET /bi/analytics/demand/passengers`

**Purpose:**  
Provides passenger demand summary and segmentation for the selected BI filter range.

**Key Metrics / KPIs:**

| Metric | Description |
|---|---|
| Total Passengers | Count of confirmed passenger lines |
| Refunded Passengers | Number of refunded passenger rows |
| Accommodation Mix | Passenger distribution by accommodation segment |
| Discount Mix | Passenger distribution by discount segment |

**Data Sources:**
- BI analytics demand aggregators (`/bi/analytics/demand/passengers`)

**Visualizations:**
- KPI summary cards with trend indicators
- Accommodation distribution pie chart
- Discount-type distribution chart
- KPI summary cards (total + refunded)

**Example use case:**
- Marketing team analyzes the PWD and student discount share to evaluate government mandate compliance and plan targeted promotions.

---

#### Cargo Analytics

**Route:** `/{tenant_slug}/dashboard/analytics/cargo`  
**Service:** `services/bi/bi.service.ts` + `services/bi/bi.hooks.ts`  
**Backend endpoint:** `GET /bi/analytics/demand/cargo`

**Purpose:**  
Analyzes cargo demand by vehicle type and refund signal for the selected BI filter range.

**Key Metrics / KPIs:**

| Metric | Description |
|---|---|
| Total Cargo Units | Count of confirmed cargo line items |
| Refunded Cargo | Number of refunded cargo rows |
| Vehicle Type Mix | Cargo distribution by vehicle type |

**Data Sources:**
- BI analytics demand aggregators (`/bi/analytics/demand/cargo`)

**Visualizations:**
- KPI summary cards
- Vehicle-type distribution pie chart
- Cargo-by-vehicle-type bar chart
- KPI summary cards (total + refunded)

**Example use case:**
- Operations manager notices a spike in rolling cargo (trucks) on a specific route and requests a cargo deck extension for peak season.

---

#### Demand Trends *(Status Report)*

**Route:** `/{tenant_slug}/dashboard/operations/status` (partially)  
**Service:** `statusService`  
**Backend endpoint:** `GET /bi/status-report`

**Purpose:**  
Tracks booking confirmation and cancellation trends over time. Helps identify systemic cancellation spikes, discount class demand patterns, and overall booking health.

**Key Metrics / KPIs:**

| Metric | Description |
|---|---|
| Confirmed Bookings | Count of bookings in `Confirmed` status |
| Cancelled Bookings | Count of cancelled bookings |
| Cancellation Rate | `cancelled / (confirmed + cancelled)` |
| Passenger Class Mix | Demographic breakdown of booked passengers |

**Data Sources:**
- `bi_dashboard.status_report_view`

**Visualizations:**
- KPI summary cards
- Passenger class distribution pie chart
- Booking trend stacked bar chart (confirmed vs cancelled per day)

---

### 5E. Operations

#### Live Route Monitor

**Route:** `/{tenant_slug}/dashboard/operations/routes`  
**Service:** `route-map.service.ts`, `route-paths.service.ts`  
**Backend endpoints:** `GET /trips/unified` (primary), `GET /bi/route-map` (fallback), `GET /public/routes/sea-paths`

**Purpose:**  
Renders a real-time interactive map of all active routes and vessel positions. Shows trips in progress, scheduled departures, and port markers for the tenant's entire network.

**Key Metrics / KPIs:**

| Metric | Description |
|---|---|
| Trip Status | `scheduled`, `departed`, `completed`, `cancelled` |
| Pax Utilization % | `boarded_count / total_seats × 100` |
| Trip Revenue | Confirmed revenue for the specific trip |
| Route YTD Revenue | Cumulative revenue for the route this year |
| ETA (minutes) | Configured vessel travel time |
| Distance (nm) | Sea route distance in nautical miles |

**Data Sources:**
- `tenant.tenant_trips` (api-v2 projection)
- Sea route geometry computed by `searoute-js`
- `client.ports` for coordinates

**Visualizations:**
- MapLibre GL interactive map with:
  - Port markers (source and destination)
  - Sea route polylines (curved sea paths, not straight lines)
  - Vessel position markers with status colors
  - Route selection and highlighting
  - Trip info popups on hover/click

**Tenant safety:**  
The route map sends only `x-service-key` in the header. The backend resolves the tenant from the key. No `tenant_id` parameter is ever sent by the dashboard.

**Fallback behavior:**  
If the unified endpoint returns trips or routes without geometry, the service automatically calls `GET /bi/route-map` on `ayahay-client-api` and then attempts to enrich with sea-path geometry from `/public/routes/sea-paths`.

**Example use case:**
- Dispatcher monitors the map at 6 AM to confirm all vessels have departed on schedule and flags any that show `scheduled` status past their departure time.

---

#### Live Status Monitor

**Route:** `/{tenant_slug}/dashboard/operations/status`  
**Service:** `statusService`  
**Backend endpoint:** `GET /bi/status-report`

**Purpose:**  
A operations-level view of booking confirmation health, recent status changes, and booking trend curves to support real-time dispatch decisions.

**Key Metrics / KPIs:**
- Confirmed vs cancelled booking counts
- Cancellation rate
- Booking trend (confirmed vs cancelled over time)
- Passenger class distribution

**Visualizations:**
- KPI cards
- Booking trend area/bar chart
- Passenger class pie chart

---

#### Capacity Utilization Heatmap

**Route:** `/{tenant_slug}/dashboard` (Executive page widget)  
**Service:** `dashboardWidgetsService`  
**Backend endpoint:** `GET /bi/capacity-heatmap`

**Purpose:**
Displays route-by-date passenger utilization in a compact matrix view.

**Current fallback behavior:**
- If `from`/`to` is provided, the endpoint uses that exact range.
- If no date is provided, it first tries the current month.
- If the current month has no rows, it automatically falls back to the latest month that has data.

This fallback prevents an empty widget when operational data exists only in a future/other month.

---

### 5F. Assets

#### Vessel Analytics

**Route:** `/{tenant_slug}/dashboard/assets/vessels`  
**Service:** `services/bi/bi.service.ts` + `services/bi/bi.hooks.ts`  
**Backend endpoint:** `GET /bi/analytics/assets/vessels`

**Purpose:**  
Fleet-level analytics covering vessel utilization, revenue efficiency per trip, trip density, and cancellation rates per vessel. Enables fleet managers to identify underperforming vessels and optimize deployment.

**Key Metrics / KPIs:**

| Metric | Description |
|---|---|
| Fleet Load Factor | Pax and cargo utilization % per vessel |
| Avg Revenue per Trip | Mean trip revenue per vessel |
| Total Trips Operated | Count of operated trips per vessel |
| Trip Density | Trip frequency heatmap by vessel and date |
| Successful vs Cancelled Trips | Time series of trip outcomes per vessel |

**Data Sources:**
- `bi_dashboard.overview_view` (vessel dimension)
- `client.ships`, `client.trips`
- Booking and revenue data joined via trip IDs

**Visualizations:**
- KPI summary cards with trend indicators (total fleet metrics)
- Fleet Load Factor grouped bar chart (pax utilization vs cargo utilization per vessel)
- Trip Efficiency bar chart (avg revenue per trip, ranked)
- Trip Density calendar heatmap (vessel × date, shade = trip count)
- Successful vs Cancelled Trips line/area chart per vessel

**Example use case:**
- Fleet manager notices MV Kapitan has a 92% pax load factor but only 30% cargo utilization, prompting a review of cargo deck marketing for that route.

---

## 6. Technical Considerations

### 6.1 Technology Stack

| Layer | Technology |
|---|---|
| Frontend framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| Charting | Recharts (bar, line, pie, area) |
| Maps | MapLibre GL JS |
| PWA | `@ducanh2912/next-pwa` (service worker, offline support) |
| Package manager | pnpm |
| Linting | ESLint |

### 6.2 Performance Optimization

- **On-demand data fetching:** Most dashboard surfaces are fetched on page load and filter changes.
- **Targeted polling only where needed:** live operations hooks use timed refresh (for example, operations live monitoring) instead of global page polling.
- **Memoized executive selectors:** Executive intelligence cards are computed with `useMemo` in `use-executive-intelligence.ts` to prevent heavy recomputation on each render.
- **Pagination:** Revenue by Route and Revenue by Vessel charts support pagination (top N items rendered) to avoid rendering hundreds of bar segments.
- **PWA caching:** The Next.js PWA configuration enables aggressive front-end navigation caching via Workbox, reducing repeat API calls for static assets.
- **Pre-aggregated BI views:** The backend serves data from purpose-built database views (`bi_dashboard.*`) rather than ad-hoc joins on the raw transactional tables, ensuring query response times remain predictable even at high data volumes.
- **Lazy URL normalization:** The `normalizeBaseUrl()` utility ensures protocol-relative URLs are resolved without re-fetching.

### 6.3 Scalability

- **Multi-tenant isolation:** Each request is scoped to a tenant via `x-service-key`. The backend resolves and enforces the tenant boundary; the frontend does not participate in tenant data isolation beyond passing the key.
- **Stateless service layer:** Service functions are stateless utilities (not singletons with internal state), allowing concurrent usage across multiple components on the same page.
- **Horizontal scaling:** The Next.js app is containerized (Dockerfile present) and deployable to Azure Container Apps or similar PaaS. The stateless design supports multiple replicas behind a load balancer.
- **Warehouse-ready data model:** The financial architecture document defines a layered bronze/silver/gold warehouse model to support eventual migration to a dedicated analytics warehouse if the OLTP-backed BI views reach performance limits.

### 6.4 Error Handling

The service layer follows a consistent error propagation pattern:

```typescript
if (!response.ok) {
  const errorData = await response.json().catch(() => ({}));
  throw new Error(errorData.message || `Failed to fetch data (${response.status})`);
}
```

- **HTTP errors** (4xx, 5xx) are caught and rethrown with a descriptive message.
- **Contract-aware parsing:** frontend distinguishes legacy `{ data }` endpoints vs direct analytics payload endpoints.
- **Route Map fallback:** If the primary unified endpoint returns empty/unusable geometry, the service silently falls back to the client-api route-map endpoint without surfacing an error to the user.
- **Tenant projection degradation:** If `tenant.tenant_trips` is empty or the projection is not yet ready (e.g., after a migration), the unified endpoint returns empty `trips[]` and `routes[]` rather than a 500 error, allowing the map to render in an empty state.
- **Source parsing errors:** URL-based booking source keys that fail `new URL()` parsing are caught and the original key is used as the label, preventing chart render failures.

### 6.5 Logging and Monitoring

- All service errors are logged to the browser console via `console.error()` with context (tenant slug, date range, endpoint).
- The `payment_gateway_webhooks` table on the backend provides an audit trail for all gateway events, including failed or duplicate webhook deliveries.
- The reconciliation block on the Finance Overview endpoint surfaces counts of data integrity anomalies (mismatches, failures) for operational monitoring.
- Azure Pipelines CI/CD configuration is present (`azure-pipelines.yml`, `cd.yml`) for build and deployment monitoring.

---

## 7. Future Improvements

### 7.1 Suggested Enhancements

| Area | Improvement | Rationale |
|---|---|---|
| **Booking Source** | Introduce a `dim_booking_source` dimension table to normalize raw URL and shorthand source values at the database level | Current URL → label mapping in the frontend is a workaround; a canonical dimension eliminates per-deploy inconsistencies |
| **Refund Tracking** | Unify the refund write path to write consistently to both `booking_payment_items` and `payment_refunds` | Reconciliation metrics currently show non-zero mismatch amounts due to split write paths |
| **Real-time Refresh** | Add configurable auto-refresh intervals for live widgets (activity feed, schedule) | Currently requires manual page reload for updates beyond initial load |
| **Drill-through Navigation** | Enable click-through from chart data points to filtered report views (e.g., clicking a route bar opens the Sales Analytics filtered to that route) | Reduces manual re-filtering steps for analysts |
| **Alerts and Notifications** | Add configurable threshold alerts (e.g., notify when cancellation rate exceeds X% or a vessel exceeds 90% utilization) | Proactive alerting reduces reliance on manual monitoring |
| **Report Scheduling** | Allow scheduled email delivery of PDF/Excel exports at set intervals | Executives frequently request periodic report delivery |
| **Dark Mode** | Full dark mode implementation (theme variables are partially defined via CSS custom properties) | Sidebar and nav theming is in place; chart and map components need dark-mode passes |
| **Mobile Optimization** | Improve chart responsiveness on tablet/mobile viewport sizes | The PWA is installable but some chart components clip on small screens |

### 7.2 Potential Integrations

| Integration | Purpose |
|---|---|
| **Analytics Data Warehouse** (e.g., BigQuery, Redshift, Snowflake) | Migrate BI read layer from OLTP-backed views to a dedicated warehouse for historical scale and complex window functions |
| **dbt (Data Build Tool)** | Formalize the bronze/silver/gold model defined in the finance architecture document; enable version-controlled, testable data transformations |
| **Weather / Maritime APIs** | Overlay weather and sea-state data on the Route Map to contextualize cancellations and schedule delays |
| **Vessel AIS Tracking** | Integrate AIS (Automatic Identification System) vessel position feeds for true real-time vessel location on the fleet map |
| **ERP / Accounting System** | Bi-directional sync with finance software (e.g., QuickBooks, SAP) to automate reconciliation and reduce manual export/import cycles |
| **Notification Services** (e.g., Slack, Teams, email) | Route alert and threshold triggers to operational Slack channels or email distribution lists |
| **Power BI / Tableau Embed** | Embed external BI tools in specific sections for ad-hoc analyst exploration without rebuilding every chart type in-house |
