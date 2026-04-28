# Reports Module — Comprehensive Documentation

> **Location:** `ayahay-client-api/src/modules/reports/`
> **Auth:** All endpoints require `JWT-auth` + `reports:manage` permission.

---

## 1. Core Domain Entities & Relationships

Understanding how data links together is essential for understanding every report.

### 1.1 Entity Map

```
auth.users (Teller / Staff)
  │
  ├─► booking.bookings              ← one booking per transaction
  │     │  booked_by_id → auth.users
  │     │  reference_no (BOL for cargo)
  │     │  payment_method, source
  │     │
  │     ├─► booking.booking_trips   ← one row per trip leg in the booking
  │     │     │  booking_id → bookings
  │     │     │  trip_id   → client.trips
  │     │     │
  │     │     ├─► booking.booking_trip_passengers (btp)
  │     │     │     passenger_id → booking.passengers
  │     │     │     cabin_type_name, discount_type
  │     │     │     booking_status (Confirmed | Refunded | Invalid)
  │     │     │     ticket_number
  │     │     │
  │     │     └─► booking.booking_trip_cargos (btc)
  │     │           cargo_id → booking.cargos
  │     │           booking_status
  │     │
  │     ├─► booking.booking_payments
  │     │     payment_method, amount
  │     │     (one booking can have MULTIPLE payment entries)
  │     │
  │     └─► booking.booking_payment_items (bpi)
  │           booking_trip_passenger_id | booking_trip_cargo_id
  │           category (FARE | CHARGES | TAXES)
  │           amount, is_credit
  │           (granular line items attributed to each passenger/cargo)
  │
  ├─► booking.passengers
  │     first_name, last_name, birthday, sex, nationality, address
  │
  └─► booking.cargos / booking.rolling_cargos
        description (vehicle_type), vehicle_plate_number

client.trips
  │  ship_id   → client.ships
  │  route_id  → client.routes
  │  voyage_id → client.voyage
  │  scheduled_departure
  │
  ├─► client.ships       (name, owner_name)
  ├─► client.routes      (src_port_id, dest_port_id → client.ports)
  ├─► client.voyage      (voyage_no)
  └─► client.disbursement
        trip_id → client.trips
        created_by → auth.users
        amount, date, official_receipt, paid_to, purpose

whitelabel.general_configs
  brand_name, logo  ← used for report headers
```

### 1.2 Key Relationships Explained

| Relationship | How they link | Why it matters for reports |
|---|---|---|
| **Booking → Trips** | `booking_trips.booking_id` + `booking_trips.trip_id` | A single booking can span multiple trip legs (round-trip). Each leg is a separate `booking_trip` row. |
| **Booking → Passengers** | `booking_trip_passengers.passenger_id` → `passengers` | Each passenger in a booking gets their own `btp` row per trip leg. This is the unit counted in the Pax Report. |
| **Booking → Cargo** | `booking_trip_cargos.cargo_id` → `cargos` | Each vehicle/loose cargo gets its own `btc` row. This is the unit counted in the Cargo Report. |
| **Booking → Payments** | `booking_payments.booking_id` | One booking can have multiple payment entries (split payment). The sequential fill algorithm distributes payment across passengers/cargo. |
| **Payment Items → Assignments** | `bpi.booking_trip_passenger_id` or `bpi.booking_trip_cargo_id` | Links a payment line item to a specific passenger or cargo slot. Used to compute the per-assignment price. |
| **Teller → Bookings** | `bookings.booked_by_id` = `auth.users.id` | Identifies which staff member created each booking. Used in Sales-Per-Teller report. |
| **Teller → Disbursements** | `disbursement.created_by` = `auth.users.id` | Links expenses recorded against a trip to a specific teller. |
| **Trip → Voyage** | `trips.voyage_id` → `voyage.voyage_no` | Voyage number shown on report headers. Optional — not all trips have a voyage. |

---

## 2. Data Sources by Report Type

### 2.1 Passenger (Pax) Report

**What it shows:** Every confirmed/refunded passenger on a trip, their accommodation, discount type, and how much they paid per payment method.

**Key tables queried:**
```
booking.booking_trip_passengers (btp)   ← one row per passenger slot
  JOIN booking.booking_trips (bt)        ON bt.id = btp.booking_trip_id
  JOIN booking.bookings (b)             ON b.id = bt.booking_id
  JOIN booking.passengers (p)           ON p.id = btp.passenger_id
  LEFT JOIN auth.users (u)              ON u.id = b.booked_by_id

WHERE bt.trip_id = :tripId
  AND btp.booking_status != 'Invalid'
```

**Fields consumed:**
- `UPPER(p.last_name + ', ' + p.first_name)` → `passenger_name`
- `COALESCE(u.email, b.source)` → `account` (teller email or booking source)
- `btp.ticket_number` → `reference_no`
- `btp.cabin_type_name` (cleaned via regex) → `accommodation`
- `UPPER(COALESCE(btp.discount_type, 'ADULT'))` → `discount_type`
- `b.payment_method` + `b.source` → determines payment label
- `btp.booking_status` → `Confirmed` or `Refunded`

**Discount Breakdown** (sub-summary table):
- Grouped by `discount_type | accommodation`
- Shows count of passengers + total amount per combination

**Payment Summary** (`ModeOfPaymentSummary`):
- `breakdown`: total per payment method label
- `gross_sales`: sum of all positive payment allocations
- `net_sales`: same as gross (refund field currently set to 0)
- `cash_on_hand`: total amount attributed to `Cash (OTC)`

---

### 2.2 Cargo Report

**What it shows:** Every confirmed/refunded vehicle/cargo on a trip, its vehicle type, plate number, and payment breakdown.

**Key tables queried:**
```
booking.booking_trip_cargos (btc)
  JOIN booking.booking_trips (bt)     ON bt.id = btc.booking_trip_id
  JOIN booking.bookings (b)           ON b.id = bt.booking_id
  JOIN booking.cargos (c)             ON c.id = btc.cargo_id
  LEFT JOIN booking.rolling_cargos (rc) ON rc.id = c.id
  LEFT JOIN auth.users (u)            ON u.id = b.booked_by_id

WHERE bt.trip_id = :tripId
  AND btc.booking_status != 'Invalid'
```

**Fields consumed:**
- `COALESCE(u.email, b.source)` → `account`
- `b.reference_no` → `bol` (Bill of Lading / booking reference)
- `rc.vehicle_plate_number` → `plate_number`
- `c.description` → `vehicle_type`
- `btc.booking_status` → status

**Vehicle Summary** (sub-summary table):
- Grouped by `vehicle_type`
- Shows count of vehicles + total amount per type

---

### 2.3 My Sales Report

**What it shows:** A teller's own bookings for a trip — summarized by accommodation/discount (passengers) and vehicle type (cargo), plus their own disbursements.

**How it differs from the Pax/Cargo Report:**
- Calls `getTripSalesData(db, tripId, userId)` — adds `.where('b.booked_by_id', '=', userId)` filter
- Disbursements also filtered by `userId`: `fetchDisbursements(db, tripId, userId)`
- Output is **grouped/summarized** (counts by accommodation + discount), not a flat list of individual passengers

**Data flow:**
```
getTripSalesData(db, tripId, userId)
  └─► Same pax + cargo queries, filtered by booked_by_id = userId

mapMySales(userTripSales)
  └─► Groups pax_rows by accommodation|discount_type → MySalesPassengerRow[]
  └─► Groups cargo_rows by vehicle_type → MySalesCargoRow[]

fetchDisbursements(db, tripId, userId)
  └─► client.disbursement WHERE trip_id = ? AND created_by = userId

MySalesResponseDto = {
  passenger_sales,    // non-refunded, grouped
  passenger_refunds,  // Refunded status, grouped
  cargo_sales,
  cargo_refunds,
  disbursements,      // teller's own expenses
  total_expenses      // sum of disbursement amounts
}
```

---

### 2.4 Profit & Loss Report

**What it shows:** Revenue by payment method (pax + cargo columns) cross-referenced with ALL disbursements for the trip to produce net income.

**Data flow:**
```
getTripSalesData(db, tripId)              ← no userId filter = ALL bookings
  └─► mapProfitLossRevenue(tripSales)
        For each pax_row.payments[method] → accumulate pax_total / pax_refund
        For each cargo_row.payments[method] → accumulate cargo_total / cargo_refund

fetchDisbursements(db, tripId)            ← no userId filter = ALL disbursements

ProfitLossResponseDto = {
  revenue_by_method[],   // per payment method: pax_total, pax_refund, cargo_total, cargo_refund
  gross_revenue,         // sum of all pax_total + cargo_total
  refund_total,          // sum of all pax_refund + cargo_refund
  net_revenue,           // gross - refund
  disbursements[],       // all trip expenses
  total_expenses,        // sum of disbursement amounts
  net_income             // net_revenue - total_expenses
}
```

---

### 2.5 Sales Per Teller (Aggregate)

**What it shows:** Across a date range, each teller's sales grouped by voyage, broken down by accommodation/vehicle type and payment method.

**Date filter logic:** Filters by `bookings.created_at` (booking date), NOT trip departure date.

**Data flow:**
```
GET /reports/tellers
  └─► getTellers(db)
        Finds auth.users who have at least one booking OR disbursement

POST /reports/sales-per-teller/pdf
  │  body: { start_date, end_date, teller_ids? }
  │
  └─► For each teller:
        fetchTellerVoyages(db, tellerId, startDate, endDate)
          │
          ├─1. booking.bookings JOIN booking_trips
          │    WHERE booked_by_id = tellerId
          │    AND created_at BETWEEN startDate AND endDate
          │    → builds tripId → [bookingId, ...] map
          │
          ├─2. client.trips JOIN ships, routes, ports, voyage
          │    WHERE t.id IN (tripIds)
          │    → trip metadata for report headers
          │
          ├─3. computePaymentAllocations(db, allBookingIds)
          │    → attributionMap: assignmentId → {method: amount}
          │    → assignmentTotalsMap: assignmentId → totalAmount
          │
          ├─4. booking_trip_passengers WHERE booking_id IN (bookingIds)
          │    → grouped by accommodation|discount_type per trip
          │    → separated into pax_sales / pax_refunds
          │
          ├─5. booking_trip_cargos WHERE booking_id IN (bookingIds)
          │    → grouped by vehicle_type per trip
          │    → separated into cargo_sales / cargo_refunds
          │
          └─6. client.disbursement WHERE trip_id IN (tripIds)
               AND created_by = tellerId

      SalesPerTellerEntry = {
        teller,
        voyages[]: { route, schedule, voyage_no, vessel_name,
                     pax_sales, pax_refunds, cargo_sales, cargo_refunds,
                     disbursements, payment_methods, subtotals },
        payment_methods,   // all methods across all voyages
        grand_totals       // accumulated across all voyages
      }
```

---

### 2.6 Revenue Reports (Aggregate Pax / Cargo / Profit-Loss)

**What it shows:** Multi-voyage summary filtered by date range, origin ports, destination ports, and/or ships.

**Date filter logic:** Filters by `trips.scheduled_departure` (trip date), NOT booking date.

**Data flow:**
```
POST /reports/revenue/pdf
  │  body: { start_date, end_date, type: 'pax'|'cargo'|'profit-loss',
  │          src_port_ids?, dest_port_ids?, ship_ids? }
  │
  └─► findTripsInDateRange(db, startDate, endDate, opts)
        client.trips JOIN routes
        WHERE scheduled_departure BETWEEN start AND end
        AND optional port/ship filters
        → [tripId, ...]

      For each tripId:
        getTripSalesData(db, tripId) + getTripMeta(db, tripId)
        → mapPaxReport() OR mapCargoReport() OR mapProfitLossRevenue()
        → fetchDisbursements() (only for profit-loss type)

      AggregateRevenueData = {
        date_range,
        filter_summary,
        voyages[]: { meta, pax? | cargo? | profit_loss? },
        totals: { gross_revenue, refund_total, net_revenue,
                  total_passengers?, total_cargo?,
                  total_expenses?, net_income? }
      }
```

---

## 3. The Payment Allocation Algorithm

This is the most complex part of the reports system. It answers: *"For a passenger who paid ₱1,500, how much of that was via Cash vs GCash?"*

### 3.1 Why it's needed

A single booking can have:
- Multiple passengers/cargo items (each with their own price)
- Multiple payment entries (e.g., ₱1,000 Cash + ₱500 GCash)

The system needs to attribute specific payment methods to specific assignments.

### 3.2 Algorithm Steps (`computePaymentAllocations`)

**Step 1 — Compute clean amount per assignment:**
```
booking_payment_items (bpi)
  → for each item: resolveReportItemBuckets(category, chargeCode, amount, isCredit)
    - FARE category  → counted in fare bucket
    - CHARGES/TAXES  → excluded (= 0)
    → cleanAmount = fare + chargesAndTaxes
  → assignmentTotalsMap[assignmentId] = total clean amount
```

**Step 2 — Fetch and sort booking payments:**
```
booking_payments
  → getPaymentLabel(payment_method):
      'CASH'            → 'Cash (OTC)'
      'EPAYMENT'        → 'EPay'
      'COLLECT'         → 'Collect'
      'ADVANCE_PAYMENT' → 'Advance Payment'
      'CHEQUE'          → 'Cheque'
      'MULTIPLE'        → skipped (split into components)
  → Sort: Cash (OTC) first, then by amount descending
```

**Step 3 — Sequential fill (drain queue):**
```
For each booking:
  paymentQueue = sorted payments for that booking
  For each assignment in booking:
    remaining = assignmentTotalAmount
    For each payment in queue:
      take = min(remaining, queueEntry.amount)
      payments[method] += take
      queueEntry.amount -= take
      remaining -= take
    attributionMap[assignmentId] = payments
```

**Special cases:**
- **Online bookings** (`b.source = 'online'`): skip allocation → always `{ Online: price }`
- **No attribution found**: fallback to `{ 'Cash (OTC)': price }`
- **Multiple payment method**: skipped during label resolution, underlying components are used instead

---

## 4. Report Meta (Header Data)

Every report includes a `ReportMeta` object populated by `getTripMeta()`:

```typescript
interface ReportMeta {
  tenant_name: string;       // whitelabel.general_configs.brand_name ?? ship.owner_name
  tenant_logo_url: string | null;  // whitelabel logo (light preferred)
  vessel_name: string;       // client.ships.name
  voyage_no: number | null;  // client.voyage.voyage_no (optional)
  route: string;             // "SourcePort to DestPort"
  schedule: string;          // formatted scheduled_departure
  printed_by: string;        // authenticated user email
  printed_at: string;        // current date at PDF generation time
}
```

**Tables joined for meta:**
```
client.trips (t)
  JOIN client.ships (s)         ON s.id = t.ship_id
  JOIN client.routes (r)        ON r.id = t.route_id
  LEFT JOIN client.ports (sp)   ON sp.id = r.src_port_id
  LEFT JOIN client.ports (dp)   ON dp.id = r.dest_port_id
  LEFT JOIN client.voyage (v)   ON v.id = t.voyage_id
  + whitelabel.general_configs  (separate query)
```

---

## 5. How to Get the Right Data — API Guide

### 5.1 Single Trip Reports (all 4 types in one call)

```
GET /reports/trip/:tripId/all
Authorization: Bearer <JWT>

Response:
{
  "data": {
    "meta": { ... },           // ReportMeta
    "pax": { ... },            // PaxReportResponseDto
    "cargo": { ... },          // CargoReportResponseDto
    "my_sales": { ... },       // MySalesResponseDto (filtered by logged-in user)
    "profit_loss": { ... }     // ProfitLossResponseDto
  }
}
```

> **Design decision:** This endpoint fetches ALL data in parallel with `Promise.all`, so the frontend caches the full payload and calls the PDF endpoint without any re-query.

### 5.2 Generate PDF from pre-fetched data

```
POST /reports/trip/:tripId/generate-pdf
Content-Type: application/json

{
  "type": "pax" | "cargo" | "my-sales" | "profit-loss",
  "meta": { ...ReportMeta },
  "data": { ...matching DTO for chosen type },
  "printedBy": "teller@email.com"   // optional, falls back to JWT email
}

Response: application/pdf (binary stream)
```

### 5.3 Sales Per Teller PDF

```
POST /reports/sales-per-teller/pdf
Content-Type: application/json

{
  "start_date": "2025-01-01",    // booking created_at range
  "end_date":   "2025-01-31",
  "teller_ids": ["uuid1", "uuid2"]  // optional, defaults to ALL tellers
}

Response: application/pdf
```

### 5.4 Aggregate Revenue PDF (multi-voyage)

```
POST /reports/revenue/pdf
Content-Type: application/json

{
  "start_date":    "2025-01-01",   // trip scheduled_departure range
  "end_date":      "2025-01-31",
  "type":          "pax" | "cargo" | "profit-loss",
  "src_port_ids":  [1, 2],         // optional origin port filter
  "dest_port_ids": [3],            // optional destination port filter
  "ship_ids":      [5]             // optional vessel filter
}

Response: application/pdf
```

### 5.5 List Available Tellers

```
GET /reports/tellers

Response:
{
  "data": [
    { "id": "uuid", "email": "teller@email.com", "name": "Juan Cruz" }
  ]
}
```

A **teller** is defined as any `auth.users` record that has at least one booking (`booking.bookings.booked_by_id`) OR at least one disbursement (`client.disbursement.created_by`).

---

## 6. Payment Methods — Labels & Ordering

| Raw DB value | Display label | Order in reports |
|---|---|---|
| `CASH` | Cash (OTC) | 1st |
| `online` source | Online | 2nd |
| `EPAYMENT` | EPay | 3rd |
| `COLLECT` | Collect | 4th |
| `ADVANCE_PAYMENT` | Advance Payment | 5th |
| `CHEQUE` | Cheque | 6th |
| `MULTIPLE` | Multiple | 7th (skipped in allocation) |

Payment method columns in all PDF reports are sorted in this canonical order.

---

## 7. Booking Statuses in Reports

| Status | Included in reports? | Behavior |
|---|---|---|
| `Confirmed` | ✅ Yes | Counted as a sale |
| `Refunded` | ✅ Yes | Counted as a refund (separate section) |
| `Invalid` | ❌ Excluded | Filtered out at query level with `WHERE booking_status != 'Invalid'` |
| `Pending` | ✅ (not explicitly filtered) | Treated as confirmed unless `Invalid` |

---

## 8. PDF Generation Pipeline

```
Frontend                    Backend (ReportsController)
  │                                │
  ├─ GET /reports/trip/:id/all ──► getTripReportData()
  │   (receives full JSON payload)   │
  │                                  ├─ getTripSalesData() × 2 (all + by user)
  │                                  ├─ getTripMeta()
  │                                  ├─ mapPaxReport()
  │                                  ├─ mapCargoReport()
  │                                  ├─ mapMySales()
  │                                  ├─ mapProfitLossRevenue()
  │                                  └─ fetchDisbursements() × 2
  │
  ├─ User selects report type ──► POST /reports/trip/:id/generate-pdf
  │   (sends cached meta + data)     │
  │                                  ├─ buildPdfDocument(type, meta, data)
  │                                  │   ├─ buildPaxReportDocument()
  │                                  │   ├─ buildCargoReportDocument()
  │                                  │   ├─ buildMySalesDocument()
  │                                  │   └─ buildProfitLossDocument()
  │                                  │
  │                                  └─ generatePdf(ReactElement) → Buffer
  │
  └─ Downloads PDF file
```

**Template files** (all in `reports/templates/`):
- `pax-report.template.ts` — individual passenger list
- `cargo-report.template.ts` — vehicle/cargo list
- `my-sales.template.ts` — teller's own grouped summary
- `profit-loss.template.ts` — revenue vs expenses P&L
- `sales-per-teller.template.ts` — cross-voyage teller summary
- `aggregate-pax.template.ts` — multi-voyage pax totals
- `aggregate-cargo.template.ts` — multi-voyage cargo totals
- `aggregate-profit-loss.template.ts` — multi-voyage P&L

---

## 9. Disbursements

Disbursements are trip-level expenses recorded by tellers (e.g., fuel, port fees, crew allowances).

**Table:** `client.disbursement`

| Field | Description |
|---|---|
| `trip_id` | Links expense to a specific trip |
| `created_by` | Teller who recorded it (→ `auth.users`) |
| `date` | Date of expense |
| `official_receipt` | OR number |
| `paid_to` | Payee name |
| `purpose` | Description of expense |
| `amount` | Amount in pesos |

**Usage in reports:**
- **My Sales** → only the logged-in teller's disbursements for that trip
- **Profit & Loss** → ALL disbursements for that trip
- **Sales Per Teller** → only that teller's disbursements per voyage

**Impact on financials:**
```
cash_on_hand = Cash(OTC) collected - total_expenses
net_income   = net_revenue - total_expenses
```

---

## 10. How Passengers Are Identified

A passenger in the system can be identified through multiple paths:

| Path | When used | Fields |
|---|---|---|
| `booking.passengers` record | All bookings | `first_name`, `last_name`, `birthday`, `sex`, `nationality`, `address` |
| `btp.ticket_number` | As unique reference per leg | Used as `reference_no` in Pax Report |
| `btp.cabin_type_name` | Accommodation label | Cleaned by regex to remove "Cabin (XXX)" suffix |
| `btp.discount_type` | Passenger class | `Adult`, `Child`, `Senior`, `PWD`, `Student`, `Infant`, etc. |
| `b.booked_by_id` | Teller who booked | Used to filter by teller in My Sales |
| `b.source` | Origin of booking | `'online'` = marketplace; anything else = OTC/TMS |
| Passenger Manifest | Physical boarding | `btp.check_in_date` (boarded), separate manifest endpoint |
| `hayahaiId` | Marketplace identity | Hayahai platform user, linked at booking creation |

---

## 11. How Cargo/Vehicles Are Identified

| Path | When used | Fields |
|---|---|---|
| `booking.cargos` | Base cargo record | `description` (= vehicle_type display name) |
| `booking.rolling_cargos` | Vehicle-specific data | `vehicle_plate_number` |
| `b.reference_no` (BOL) | Bill of Lading | Used as cargo `bol` in Cargo Report |
| `btc.booking_status` | Status per trip leg | `Confirmed`, `Refunded`, `Invalid` |
| `BookingVehicleDto` | At booking creation | `plateNumber`, `make`, `modelName`, `vehicleTypeId`, `cargoClassCode`, dimensions |
| `LooseCargoDto` | Non-rolling cargo | `description`, `quantity`, `weight`, `volume`, `commodityId` |
| Vehicle Manifest | Physical boarding | `btc.check_in_date`, `btc.onboard_date` |

---

## 12. How Schedules & Trips Are Identified

| Concept | Table | Key fields |
|---|---|---|
| **Trip** | `client.trips` | `id` (UUID), `scheduled_departure`, `ship_id`, `route_id`, `voyage_id` |
| **Route** | `client.routes` | `src_port_id`, `dest_port_id` |
| **Schedule** | `client.schedules` (referenced via `CreateTripItemDto.schedule_id`) | `schedule_id`, `departure_time` |
| **Voyage** | `client.voyage` | `voyage_no` (displayed on report headers) |
| **Ship** | `client.ships` | `name`, `owner_name` |
| **Port** | `client.ports` | `name` (e.g., "Cebu City", "Bohol") |

**Trip creation** (`CreateTripsDto`) generates trips from:
- A date range + allowed days of week
- A schedule template OR manual `route_id` + `ship_id` + `departure_time`

**Finding trips for reports:**
- Single trip: provide `tripId` directly
- Date range (revenue report): `findTripsInDateRange()` filters by `scheduled_departure`
- Teller date range: `findTellerBookingsByDateRange()` filters by booking `created_at`

---

## 13. Module File Structure

```
reports/
├── reports.controller.ts      # HTTP endpoints
├── reports.service.ts         # Orchestration logic
├── reports.module.ts          # NestJS module wiring
│
├── dto/
│   ├── report.dto.ts           # Trip-level report DTOs + ReportMeta
│   └── aggregate-report.dto.ts # Multi-voyage + teller report DTOs
│
├── mappers/
│   ├── pax-report.mapper.ts    # TripSalesData → PaxReportResponseDto
│   ├── cargo-report.mapper.ts  # TripSalesData → CargoReportResponseDto
│   ├── my-sales.mapper.ts      # TripSalesData → MySalesResponseDto (grouped)
│   ├── profit-loss.mapper.ts   # TripSalesData → P&L revenue sections
│   └── shared.mapper.ts        # buildPaymentSummary, sortPaymentMethods
│
├── utils/
│   ├── report-queries.util.ts  # All DB queries (Kysely)
│   └── report-format.util.ts   # Payment label resolution, PDF router
│
└── templates/
    ├── pax-report.template.ts
    ├── cargo-report.template.ts
    ├── my-sales.template.ts
    ├── profit-loss.template.ts
    ├── sales-per-teller.template.ts
    ├── aggregate-pax.template.ts
    ├── aggregate-cargo.template.ts
    └── aggregate-profit-loss.template.ts
```
message.txt
26 KB