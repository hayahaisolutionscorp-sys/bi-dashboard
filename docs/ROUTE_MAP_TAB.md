# Route Map Tab — Feature Documentation

**System:** Ayahay BI Dashboard
**Module:** `ayahay-bi-dashboard` + `ayahay-client-api` (BI module) + `ayahay-client-api` / `ayahay-api-v2` (Routes module) + `ayahay-tms` (Route Management)
**Last Updated:** April 14, 2026

---

## 1. Feature Summary

### What It Is

The **Route Map Tab** is a real-time operational map view within the Ayahay BI Dashboard. It renders active shipping routes across the Philippine archipelago as animated, geographically-accurate sea paths overlaid on an interactive map. Each route displays live vessel positions (animated along the route polyline), active trip metadata (departure/arrival times, ETA, status), passenger utilization, and revenue figures.

The tab is distinct from **Route Management** — it does not allow CRUD operations. It is purely an **observational/analytical viewport** designed to give operations teams an at-a-glance picture of the entire fleet's activity at any moment.

### Purpose in the System

| Goal | Detail |
|---|---|
| Fleet visibility | See all vessels in motion across all active routes simultaneously |
| Operational awareness | Monitor trip status, ETA, and boarding counts without querying individual trips |
| Revenue context | See per-trip revenue and YTD route revenue alongside spatial data |
| Capacity monitoring | Passenger utilization percentage displayed per active trip |

### Who Uses It

| Role | Access | Purpose |
|---|---|---|
| **BI Viewer / Tenant Admin** | Full read access | Real-time fleet and revenue at-a-glance |
| **Operations Manager** | Full read access | Monitor active trips, ETAs, and anomalies |
| **Service Account (internal)** | API access via `x-service-key` | Automated monitoring integrations |

The endpoint is decorated `@Public()`, meaning no authentication token is required, but requests from the BI dashboard include an `x-service-key` header tied to the tenant's `api_base_url`, enforcing tenant isolation at the service layer.

### Key Business Value

- Reduces the need to open individual trip records to assess fleet-wide status
- Provides a compelling, always-on display for operations rooms or wall-mounted dashboards
- Surfaces revenue data spatially, enabling intuitive identification of high-value routes
- Auto-refreshes every 60 seconds — no manual intervention required

---

## 2. Architecture Overview

### Frontend

**Location:** `ayahay-bi-dashboard/`

```
app/[tenant_slug]/dashboard/route-map/
└── page.tsx                    ← Next.js page shell

components/maps/
└── fleet-map-component.tsx     ← Primary feature component (all map logic)
└── vessel-creator.tsx          ← Vessel marker/animation helper

services/
└── route-map.service.ts        ← API integration layer (fetch + type definitions)

constants/
└── index.ts                    ← ROUTE_MAP: "/bi/route-map" endpoint constant

mock-data/
└── route-service-2.ts          ← Fallback route coordinate shapes (used when API has no lat/lng)

public/
└── sea-routes.json             ← Pre-computed sea waypoints keyed by route name
```

**Page:** `app/[tenant_slug]/dashboard/route-map/page.tsx`
A thin Next.js server/client page. It renders a full-viewport `<FleetMapComponent />` inside a `calc(100vh - 4rem)` container, deferring all logic to the component layer.

**State Management:**
Entirely local React state via `useState` and `useRef`. No global state store is used for this tab. Key state atoms inside `FleetMapComponent`:

| State Variable | Type | Role |
|---|---|---|
| `apiTrips` | `RouteMapTrip[]` | Raw API response, updated every 60 seconds |
| `selectedRouteId` | `number` | Controls which route is highlighted |
| `showAllRoutes` | `boolean` | Toggles overlay of all route polylines |
| `vessels` | `any[]` | Animated vessel markers derived from `apiTrips` |
| `hoveredVesselId` | `string \| null` | Controls tooltip/popup display |
| `loading` | `boolean` | Drives loading skeleton |
| `seaRoutesData` | `Record<string, { coords, distance_km }> \| null` | Pre-loaded sea waypoints |

**Tenant awareness:** The component reads `activeTenant.api_base_url` and `activeTenant.service_key` from the `useTenant()` context provider before making API calls, enabling multi-tenant operation from a single deployment.

**API Integration:**
```ts
// services/route-map.service.ts
RouteMapService.getRouteMapData(baseUrl, serviceKey?)
// → GET {baseUrl}/bi/route-map
// → Headers: credentials: 'include', x-service-key: serviceKey (if present)
```

### Backend

**Location:** `ayahay-client-api/src/modules/bi/`

```
bi/
├── bi.controller.ts        ← Route handler: GET /bi/route-map
├── bi.service.ts           ← getRouteMap() business logic
└── dto/bi-query.dto.ts     ← RouteMapTrip, RouteMapResponse interfaces
```

**Separate Route Management Backend** (not used by the map visualization, but defines the data the map visualizes):

```
ayahay-client-api/src/modules/routes/
├── routes.module.ts
├── routes.controller.ts              ← Protected: POST, GET, PATCH, DELETE /routes
├── public-routes.controller.ts       ← Public: GET /public/routes
├── route-ships.service.ts            ← Assign/unassign vessels to routes
└── dto/
    ├── create-route.dto.ts
    ├── update-route.dto.ts
    └── assign-ships.dto.ts

ayahay-api-v2/src/modules/routes/
├── routes.controller.ts              ← Admin/SuperAdmin protected
├── routes.tms.controller.ts          ← TMS staff protected
├── routes-public.controller.ts       ← Public read access
└── entities/route.entity.ts
```

---

## 3. Data Flow

### On Page Load

```
1. FleetMapPage renders → mounts FleetMapComponent
2. Component fires two parallel effects:
   a. fetch('/sea-routes.json') → loads pre-computed waypoints into seaRoutesData
   b. RouteMapService.getRouteMapData(activeTenant.api_base_url, serviceKey)
      → GET /bi/route-map
      → bi.controller.ts @Get('route-map') handler
      → biService.getRouteMap()
         → SQL: JOIN trips × routes × ships × ports × route_ships
         → Filters: TODAY's trips only (Asia/Manila timezone)
         → Returns: RouteMapTrip[]
3. response.trips stored in apiTrips state
4. useMemo fires → transforms apiTrips into DEFINED_ROUTES, ROUTE_LIST, apiVessels:
   a. Groups trips by route_name
   b. For each route group:
      i.   Check seaRoutesData[routeName] → use pre-computed waypoints if found
      ii.  Else use real port lat/lng if available in API response
      iii. Else fall back to mock coordinate data (mock-data/route-service-2.ts)
   c. Build animated vessel objects from boarded_count, total_seats, ETA
5. Map renders with route polylines, port markers, vessel markers
```

### Auto-Refresh

```
setInterval(fetchRoutes, 60_000)     // fires every 60 seconds
→ same flow as above, apiTrips overwritten
→ useMemo recalculates routes/vessels
→ MapGL re-renders changed polylines and markers
```

### User Selects a Route

```
User clicks route in sidebar list
→ setSelectedRouteId(id)
→ MapGL flyTo() animates camera to route bounds
→ Selected route polyline highlights (distinct color/weight)
→ Vessels on that route shown with full tooltip
```

### Vessel Hover

```
User hovers over a vessel marker
→ setHoveredVesselId(vesselId)
→ Popup renders with:
   - vessel_name, route_name, status
   - scheduled_departure / arrival
   - eta_minutes (live countdown)
   - boarded_count / total_seats
   - pax_utilization_pct
   - trip_revenue / route_ytd_revenue
→ Mouse leaves → setHoveredVesselId(null) → popup closes
```

### Error Handling Flow

```
API call fails
→ catch block: console.error("Failed to fetch route map data")
→ loading set to false
→ apiTrips remains [] (or previous value on refresh)
→ Component falls back to SERVICE_ROUTES from mock-data/route-service-2.ts
→ Map still renders — graceful degradation, not a blank page
```

---

## 4. Core Components Breakdown

### `FleetMapPage`

**File:** `app/[tenant_slug]/dashboard/route-map/page.tsx`

| Attribute | Detail |
|---|---|
| **Responsibility** | Next.js App Router page entry point; provides full-height viewport container |
| **Renders** | `<FleetMapComponent />` |
| **Props** | None (tenant resolved from URL segment `[tenant_slug]`) |
| **Notable** | Imports `maplibre-gl/dist/maplibre-gl.css` at page level to ensure styles load before the map mounts |

---

### `FleetMapComponent`

**File:** `components/maps/fleet-map-component.tsx`

| Attribute | Detail |
|---|---|
| **Responsibility** | All map logic: data fetching, coordinate resolution, route rendering, vessel animation, sidebar, popups |
| **Map Library** | `react-map-gl/maplibre` + `maplibre-gl` |
| **Geospatial libs** | `@turf/turf` (bounding box, line interpolation), `searoute-js` (sea routing, no type declarations) |
| **Props** | None — self-contained; reads tenant from `useTenant()` context |

**Key outputs/events:**
- Route polylines rendered as GeoJSON `<Source>` + `<Layer>` in MapGL
- Port markers rendered as `<Marker>` components
- Vessel markers rendered as animated SVG `<Marker>` components (position interpolated along route coords using `@turf/along`)
- Sidebar list of routes — click triggers `selectedRouteId` change and map flyTo
- Zoom controls rendered using Lucide icons (`Plus`, `Minus`)
- Layer toggle (all routes vs. selected route)

---

### `VesselCreator`

**File:** `components/maps/vessel-creator.tsx`

| Attribute | Detail |
|---|---|
| **Responsibility** | Encapsulates vessel SVG marker appearance and animation frame logic |
| **Inputs** | Vessel object (position, heading, status, utilization) |
| **Outputs** | Animated marker element with directional heading indicator |

---

### `RouteMapService`

**File:** `services/route-map.service.ts`

| Attribute | Detail |
|---|---|
| **Responsibility** | Thin HTTP client; single method `getRouteMapData()` |
| **Authentication** | `credentials: 'include'` (cookie-based session) + optional `x-service-key` header |
| **Return type** | `RouteMapResponse` → `{ trips: RouteMapTrip[] }` |
| **Error handling** | Throws on non-ok response; caught by caller |

---

### Route Sidebar List

Rendered inline within `FleetMapComponent`. Displays:
- Route name (e.g., "Cebu - Manila")
- Active vessel count on that route
- YTD revenue snippet
- Click handler: camera flyTo + highlight

---

## 5. API Endpoints

### Route Map Visualization

| Method | URL | Auth | Purpose |
|---|---|---|---|
| `GET` | `/bi/route-map` | `@Public()` + optional `x-service-key` | Fetch all of today's active trips with route, vessel, and port data |

**Response format:**
```json
{
  "data": {
    "trips": [
      {
        "trip_id": "uuid",
        "vessel_name": "MV Example",
        "route_name": "Cebu - Manila",
        "scheduled_departure": "2026-04-14T06:00:00+08:00",
        "scheduled_arrival": "2026-04-14T18:00:00+08:00",
        "actual_departure": "2026-04-14T06:12:00+08:00",
        "eta_minutes": 340,
        "status": "Departed",
        "boarded_count": 312,
        "total_seats": 450,
        "pax_utilization_pct": 69.3,
        "trip_revenue": 187500.00,
        "route_ytd_revenue": 14200000.00,
        "src_port_latitude": 10.2931,
        "src_port_longitude": 123.9010,
        "dest_port_latitude": 14.5905,
        "dest_port_longitude": 120.9780
      }
    ]
  }
}
```

> **Known Gap:** The backend `RouteMapTrip` DTO in `bi-query.dto.ts` does not yet include the `src_port_latitude`, `src_port_longitude`, `dest_port_latitude`, `dest_port_longitude` fields, though the frontend interface already defines them. The backend `getRouteMap()` query must be updated to JOIN `client.ports` and return these coordinates for real coordinate-based routing to work without fallbacks.

---

### Route Management (CRUD)

**`ayahay-client-api` — Protected (requires `routes:manage` permission):**

| Method | URL | Auth | Purpose |
|---|---|---|---|
| `POST` | `/routes` | `@Permissions({ resource: 'routes', action: 'manage' })` | Create one or more routes (`CreateRoutesDto` — array) |
| `GET` | `/routes` | Same | Get all routes |
| `GET` | `/routes/:id` | Same | Get single route by ID |
| `PATCH` | `/routes/:id` | Same | Update route (`UpdateRouteDto` — partial, includes markup fields) |
| `DELETE` | `/routes/:id` | Same | Soft-delete route |
| `GET` | `/routes/:id/ships` | Same | Get ships assigned to route |
| `PUT` | `/routes/:id/ships` | Same | Assign ships to route (`AssignShipsDto`) |
| `DELETE` | `/routes/:id/ships` | Same | Unassign ships from route |

**`ayahay-client-api` — Public:**

| Method | URL | Purpose |
|---|---|---|
| `GET` | `/public/routes` | List routes for marketplace/booking flow |
| `GET` | `/public/routes/:id` | Get single public route |
| `GET` | `/public/routes/:id/ships` | Get ships for a route (public) |

**`ayahay-api-v2` — Admin/TMS:**

| Method | URL | Auth | Purpose |
|---|---|---|---|
| `POST` | `/routes` | `SuperAdmin`, `Admin` | Admin bulk create (`AdminCreateRoutesDto`) |
| `GET` | `/routes` | `SuperAdmin`, `Admin` | Admin list all routes across tenants |
| `PATCH` | `/routes/:id` | `SuperAdmin`, `Admin` | Admin update |
| `DELETE` | `/routes/:id` | `SuperAdmin`, `Admin` | Admin delete |
| `POST` | `/tms/routes` | TMS staff | TMS operator creates routes |
| `GET` | `/tms/routes` | TMS staff | TMS operator lists routes |
| `PATCH` | `/tms/routes/:id` | TMS staff | TMS operator updates routes |

---

## 6. Data Model

### `RouteMapTrip` (BI Visualization layer)

The runtime shape consumed by `FleetMapComponent`:

| Field | Type | Source | Notes |
|---|---|---|---|
| `trip_id` | `string` | `client.trips.id` | UUID |
| `vessel_name` | `string` | `client.ships.name` | Display label |
| `route_name` | `string` | Computed: `src_port_name + ' - ' + dest_port_name` | e.g., `"Cebu - Manila"` |
| `scheduled_departure` | `string` | `client.trips.scheduled_departure` | ISO 8601 |
| `scheduled_arrival` | `string` | `client.trips.scheduled_arrival` | ISO 8601 |
| `actual_departure` | `string \| null` | `client.trips.actual_departure` | Null if not yet departed |
| `eta_minutes` | `number` | `client.route_ships.eta_minutes` | Configured per vessel-route pairing |
| `status` | `string` | `client.trips.status` | e.g., `Departed`, `Arrived`, `Cancelled` |
| `boarded_count` | `number` | Aggregated from `booking.booking_trip_passengers` | Live boarding count |
| `total_seats` | `number` | `client.ships` capacity field | Max passenger capacity |
| `pax_utilization_pct` | `number` | `(boarded_count / total_seats) * 100` | Calculated |
| `trip_revenue` | `number` | Aggregated from `booking.booking_payment_items` | Current trip revenue |
| `route_ytd_revenue` | `number` | From `bi_dashboard.overview_view` | Year-to-date route revenue |
| `src_port_latitude` | `number \| null` | `client.ports.latitude` | **Not yet in backend DTO — pending implementation** |
| `src_port_longitude` | `number \| null` | `client.ports.longitude` | **Not yet in backend DTO — pending implementation** |
| `dest_port_latitude` | `number \| null` | `client.ports.latitude` | **Not yet in backend DTO — pending implementation** |
| `dest_port_longitude` | `number \| null` | `client.ports.longitude` | **Not yet in backend DTO — pending implementation** |

---

### Route Entity (Management layer)

**`ayahay-client-api` (tenant-scoped):**

| Field | Type | Notes |
|---|---|---|
| `id` | `number` | Primary key |
| `src_port_id` | `number` | FK → `client.ports` |
| `dest_port_id` | `number` | FK → `client.ports` |
| `route_code` | `string` | Short identifier (e.g., `"CEB-MNL"`) |
| `max_flat_passenger_markup` | `number \| null` | Markup cap for passenger fares |
| `max_flat_cargo_markup` | `number \| null` | Markup cap for cargo fares |
| `deleted_at` | `timestamp \| null` | Soft delete |
| `created_at` | `timestamp` | — |
| `updated_at` | `timestamp` | — |

**`ayahay-api-v2` (platform-level):**

| Field | Type | Notes |
|---|---|---|
| `id` | `number` | Primary key |
| `clientId` | `number` | FK → tenant |
| `originCode` | `string` | Port code |
| `originId` | `number` | FK → ports |
| `destinationCode` | `string` | Port code |
| `destinationId` | `number` | FK → ports |

**Route-Ship Assignment (`route_ships`):**

| Field | Type | Notes |
|---|---|---|
| `id` | `number` | PK |
| `route_id` | `number` | FK → routes |
| `ship_id` | `number` | FK → ships |
| `eta_minutes` | `number` | Expected transit time for this vessel on this route |
| `created_at` | `timestamp` | — |
| `updated_at` | `timestamp` | — |

---

## 7. UI/UX Behavior

### Layout

The Route Map Tab occupies the full browser viewport minus the 4rem top navigation bar (`calc(100vh - 4rem)`). No scrollbars. The map canvas fills 100% of this area.

A **left sidebar panel** overlaps the map (absolutely positioned) and contains:
- Route list with vessel count and revenue figures
- "Show All Routes" toggle
- Per-route revenue trend indicator

A **top search bar** enables filtering routes by name.

**Zoom controls** (+ / −) are rendered as floating buttons, mapped to `mapRef.current.zoomIn()` / `zoomOut()`.

**Layer toggle** switches between "selected route only" and "all routes visible" mode.

### Map Interactions

| Interaction | Behavior |
|---|---|
| Click route in sidebar | Camera flyTo route midpoint; route polyline highlights with thicker stroke and brighter color |
| Hover vessel marker | Popup card appears: vessel name, status, ETA, boarded/seats, utilization %, revenue |
| Leave vessel marker | Popup dismisses |
| "Show All Routes" ON | All route polylines render simultaneously; selected route remains visually prominent |
| "Show All Routes" OFF | Only selected route polyline renders |

### Route Rendering Priority

The component resolves route geometry in this order:

1. **Pre-computed sea routes** (`/sea-routes.json`) keyed by `route_name` — highest fidelity, follows actual shipping lanes
2. **Real port coordinates** from API response (`src_port_lat/lng`, `dest_port_lat/lng`) drawn as a straight line — pending backend implementation
3. **Mock coordinate data** from `mock-data/route-service-2.ts` — fallback for development or missing data

### Loading State

While `loading === true`, the fleet list sidebar displays skeleton placeholders. The MapGL canvas initializes immediately (map tiles load independently); data overlays appear once the API resolves.

### Empty State

If `apiTrips` is empty after a successful API call (no trips today), `SERVICE_ROUTES` mock data is used to populate the route list and polylines. Vessel markers are absent. A console warning indicates the fallback is active.

### Error State

On API failure, the `catch` block logs the error. The UI does not display an error banner (current behavior). The map degrades gracefully to mock route shapes and zero vessel markers.

---

## 8. Business Logic

### Route Geometry Resolution

The system uses a **three-tier fallback** to ensure the map always renders something meaningful:

1. Pre-computed sea routes (stored in `/public/sea-routes.json`) are the authoritative source. These are offline-computed polylines using marine routing algorithms that respect coastlines and shipping lanes.
2. If absent, straight-line segments between real port lat/lng coordinates are used (pending backend DTO update).
3. If absent, hardcoded mock shapes from the seed file are used.

### Vessel Animation

Vessels are animated along route coordinate arrays using `@turf/along`, which given a line geometry and a distance in km, returns the interpolated point. The animation loop uses `requestAnimationFrame` and advances each vessel's position based on elapsed time and `eta_minutes` to simulate real-time progression.

### Route Grouping

The `useMemo` hook groups `RouteMapTrip[]` by `route_name`. Multiple trips on the same route result in multiple vessel markers animated along the same polyline, each with their own independent position and popup data.

### Utilization Calculation

```
pax_utilization_pct = (boarded_count / total_seats) * 100
```

Calculated at the database/service layer and returned pre-computed. Color thresholds can be applied client-side (e.g., green < 60%, yellow 60–80%, red > 80%).

### Route Creation Rules (TMS/Admin layer)

- A route requires exactly one `src_port_id` and one `dest_port_id`
- Ports must exist in `client.ports` before a route can reference them
- A `route_code` must be provided and should be unique per tenant
- Bidirectional routes (A→B and B→A) are created as **separate records** — the TMS create form explicitly supports this via `CreateRoutesForm`
- `max_flat_passenger_markup` and `max_flat_cargo_markup` cap the additional fare a tenant can apply above the base price

### Ship Assignment Rules

- A ship can be assigned to multiple routes
- Each assignment carries an `eta_minutes` value — the expected transit time for that specific vessel on that route
- Unassigning a ship removes its ETA from the route but does not affect historical trips

---

## 9. Edge Cases & Error Handling

| Scenario | Current Behavior | Recommended Improvement |
|---|---|---|
| No trips today (rest day, early morning) | Mock data renders, no vessels animate | Show "No active trips today" notice in sidebar |
| API returns trips but no port coordinates | Falls back to mock geometry for route path | Backend should always return port lat/lng (pending DTO fix) |
| `sea-routes.json` missing from `/public/` | `console.warn` logged; falls back to coord-based or mock paths | Include file in Docker build; add warning banner |
| API call fails entirely | `console.error`; map renders with mock data | Surface a dismissible error toast to the user |
| Route name not found in `sea-routes.json` | Falls back to straight-line or mock — no crash | Auto-compute via `searoute-js` at runtime as live fallback |
| Tenant has no `api_base_url` | `fetchRoutes` returns early (guards on `activeTenant?.api_base_url`) | Show "tenant not configured" empty state |
| Very large number of trips (50+) | All render simultaneously — no pagination | Implement route clustering or viewport-based culling |
| Vessel at 100% utilization | Utilization shown in popup; no visual alert on marker | Color-code marker (red) when `pax_utilization_pct >= 95` |
| Network timeout (slow connection) | 60s interval may fire before previous request resolves | Cancel in-flight fetch with `AbortController` before re-fetching |

---

## 10. Role-Based Access

### Route Map Visualization (BI Dashboard)

The visualization endpoint is `@Public()`. Tenant isolation is enforced by:
- The frontend reading `activeTenant.api_base_url` — scoping all requests to the correct tenant's API
- The backend's database schema (`client.*` tables) — naturally scoped to tenant data
- Optional `x-service-key` header for programmatic consumer access

| Role | Can View Map | Can Export Data | Can Modify Routes |
|---|---|---|---|
| Public viewer | Yes (if tenant URL known) | No | No |
| BI Tenant Admin | Yes | No (export not on this tab) | No |
| Service Key consumer | Yes, via API | Yes, via API | No |

### Route Management (TMS / Admin)

| Role | Create Routes | Edit Routes | Delete Routes | Assign Ships |
|---|---|---|---|---|
| `SuperAdmin` (api-v2) | Yes | Yes | Yes | — |
| `Admin` (api-v2) | Yes | Yes | Yes | — |
| TMS Staff (`tms/routes`) | Yes | Yes | No | — |
| Client API user with `routes:manage` | Yes | Yes | Yes | Yes |
| Public | Read only | No | No | No |

---

## 11. Performance Considerations

### Polling

The component polls `GET /bi/route-map` every **60 seconds** via `setInterval`. The interval is cleared on component unmount (cleanup function returned from `useEffect`). For high-traffic tenants, this creates a constant low-frequency load. Consider:

- Server-Sent Events (SSE) or WebSocket for push-based updates
- Staggered polling per client to avoid thundering herd on shared infrastructure

### Coordinate Resolution

The three-tier fallback (sea routes JSON → real coords → mock) is evaluated inside a `useMemo` with `[apiTrips, seaRoutesData]` dependencies. This prevents recomputation on unrelated state changes. However, if `apiTrips` contains 50+ trips, the `routeGroups` map iteration and coordinate lookup may become measurable — profile if trip counts grow.

### Map Rendering

`react-map-gl/maplibre` renders route polylines as WebGL layers (GeoJSON `Source` + `Layer`). This is GPU-accelerated and handles hundreds of polylines efficiently. Vessel markers rendered as DOM `<Marker>` nodes (not WebGL) — these are more expensive. If vessel counts exceed ~50, switch to a WebGL symbol layer approach.

### AnimationFrame Loop

Vessel position interpolation uses `requestAnimationFrame`. The `animationRef` stores the frame ID for proper cancellation. Ensure that when `apiTrips` updates, the previous animation loop is cancelled before starting a new one to avoid multiple concurrent animation loops.

### `sea-routes.json`

Served as a static JSON file from `/public/`. For large numbers of routes, this file may grow to several MB. Consider:
- Splitting into per-route files loaded on demand
- Serving via CDN with cache headers
- Compressing coordinates to reduce file size (quantize to 5 decimal places)

### Map Tile Performance

MapLibre renders vector tiles. Ensure the tile provider has appropriate caching headers. For offline or air-gapped environments, host tiles locally.

---

## 12. Testing Strategy

### Unit Tests

**Frontend (`ayahay-bi-dashboard`):**

| Test | File | What to verify |
|---|---|---|
| `RouteMapService.getRouteMapData` | `services/route-map.service.test.ts` | Correct URL construction, `x-service-key` header inclusion, response parsing, error throw on non-ok |
| Coordinate resolution logic | `fleet-map-component.test.ts` | Given `seaRoutesData` with route, uses sea coords; given no sea coords but real lat/lng, uses straight line; given neither, uses mock |
| `useMemo` trip grouping | `fleet-map-component.test.ts` | Trips with same `route_name` grouped correctly; YTD revenue from first trip |

**Backend (`ayahay-client-api`):**

| Test | Location | What to verify |
|---|---|---|
| `BiService.getRouteMap()` | `bi.service.spec.ts` | Returns `RouteMapTrip[]`; filters to today's trips; handles empty result |
| `BiController GET /bi/route-map` | `bi.controller.spec.ts` | Returns 200 with `{ data: { trips } }`; no auth required |

### Integration Tests

| Scenario | Approach |
|---|---|
| `GET /bi/route-map` returns today's trips | Seed DB with trip records for today; call endpoint; assert response structure matches `RouteMapResponse` |
| Empty today → empty trips array | Seed DB with trips for yesterday only; assert `trips: []` |
| Tenant isolation | Use two tenants' tokens; assert cross-tenant data does not leak |
| `POST /routes` creates bidirectional pair | Create both A→B and B→A; assert both records exist; assert `GET /routes` returns both |
| Ship assignment | `PUT /routes/:id/ships` with `AssignShipsDto`; assert `GET /routes/:id/ships` returns assigned ships |

### E2E Scenarios (Playwright / Cypress)

| Scenario | Steps |
|---|---|
| Load Route Map tab | Navigate to `/[tenant]/dashboard/route-map`; assert map container renders; assert at least one route in sidebar |
| Select a route | Click route in sidebar; assert camera animates; assert route polyline highlights |
| Vessel hover popup | Hover over animated vessel marker; assert popup shows vessel name, ETA, utilization |
| Auto-refresh | Intercept `/bi/route-map` network call; wait 61 seconds; assert second call fires |
| No trips today (mock) | Stub API to return `{ trips: [] }`; assert map still renders with fallback routes; assert no vessel markers |

---

## 13. Future Improvements

### Short-Term (High Impact, Low Effort)

| Improvement | Detail |
|---|---|
| **Backend lat/lng fix** | Update `getRouteMap()` SQL to JOIN `client.ports` and return `src_port_latitude`, `src_port_longitude`, `dest_port_latitude`, `dest_port_longitude` — eliminates reliance on mock data for real tenants |
| **Error toast on API failure** | Replace silent `console.error` with a dismissible UI notification |
| **Utilization color coding** | Color vessel markers by utilization threshold (green/yellow/red) for instant operational awareness |
| **AbortController for polling** | Cancel in-flight requests before re-fetching to prevent race conditions on slow networks |

### Medium-Term

| Improvement | Detail |
|---|---|
| **Real-time updates via SSE or WebSocket** | Replace 60s polling; push trip status changes instantly |
| **Port detail sidebar** | Click a port marker → show all trips departing/arriving at that port today |
| **Route performance panel** | Click a route → expand panel with YTD revenue, load factor trend chart, on-time performance |
| **Historical playback** | Date-picker to replay a past day's vessel movements (animate historical `actual_departure` data) |

### Long-Term

| Improvement | Detail |
|---|---|
| **Weather overlay** | Integrate a maritime weather API (e.g., Open-Meteo, Windy) to overlay wind/wave conditions on the route map |
| **Automatic sea route computation** | Replace `sea-routes.json` with on-demand routing via `searoute-js` or a dedicated maritime routing microservice; cache computed routes per route-pair |
| **AI-based delay prediction** | Feed ETA + weather + historical delay data into an ML model; surface predicted delay risk per active trip |
| **Vessel tracking integration** | Connect to AIS (Automatic Identification System) feed to show real vessel GPS positions instead of animated estimates |
| **Route analytics dashboard** | Dedicated sub-view showing load factor bands, revenue per nautical mile, on-time performance by route over selectable periods |
| **Offline map support** | Bundle tile data for the Philippine archipelago for operations in areas with intermittent connectivity |

---

*This document was generated from live codebase analysis of the Ayahay V2 monorepo as of April 14, 2026. Refer to the linked source files for the authoritative implementation.*
