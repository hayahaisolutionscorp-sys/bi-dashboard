# Client API BI and Financial Tracking Architecture (Implementation-Ready)

## 1) Scope and Ground Truth

This document is based on current backend implementation in `ayahay-client-api`.
It is intended as an implementation-ready reference for BI/reporting and financial tracking.

Primary source modules reviewed:
- `src/modules/bookings/bookings.service.ts`
- `src/modules/bookings/services/bookings-price.service.ts`
- `src/modules/bookings/services/bookings-lifecycle.service.ts`
- `src/modules/payments/paymongo/paymongo.controller.ts`
- `src/modules/payments/maya/maya.controller.ts`
- `src/modules/payment-providers/payment-providers.service.ts`
- `src/modules/bi/bi.controller.ts`
- `src/modules/bi/bi.service.ts`
- `src/database/db.d.ts`
- `src/database/migrations/20260304120000_create_payment_gateway_tables.ts`
- `src/database/migrations/20260401123532_fix_bi_salesreport_view_include_trips_name.ts`

BI-facing views and tables used in service logic:
- `bi_dashboard.overview_view`
- `bi_dashboard.sales_report_view`
- `bi_dashboard.expenses_report_view`
- `bi_dashboard.passenger_per_trip_view`
- `bi_dashboard.cargo_per_trip_view`
- `bi_dashboard.status_report_view`
- `booking.booking_payment_items`
- `booking.booking_payments`
- `booking.payment_transactions`
- `booking.payment_gateway_webhooks`
- `booking.payment_refunds`
- `booking.bookings`

---

## 2) Core Domain Entities (Operational System)

### Booking and trip entities
- `booking.bookings`
  - Header-level booking record.
  - Key fields for BI: `id`, `created_at`, `booking_status`, `booking_type`, `source`, `reference_no`, `booked_by_id`, `booked_by_travel_agent_id`.
- `booking.booking_trips`
  - Trip legs under a booking.
  - Key fields: `booking_id`, `trip_id`, `sequence`, `triptype`.
- `booking.booking_trip_passengers`
  - Passenger line entities with status lifecycle.
  - Key BI fields: `id`, `booking_trip_id`, `discount_type`, `booking_status`, `deleted_at`, `total_price`, `price_without_markup`.
- `booking.booking_trip_cargos`
  - Cargo line entities (rolling + loose) with status lifecycle.
  - Key BI fields: `id`, `booking_trip_id`, `cargo_id`, `booking_status`, `deleted_at`, `total_price`, `price_without_markup`.

### Financial entities
- `booking.booking_payment_items` (most granular financial truth)
  - Financial ledger-like line items created during pricing and adjustments.
  - Categories observed: `FARE`, `CHARGES`, `TAXES`.
  - Adjustment semantics:
    - Refund/invalidation entries are inserted as `is_credit = true` and `charge_code = 'REFUND'`.
  - This table is where pricing, refund credits, rebooking credits/debits are materialized.

- `booking.booking_payments` (payment instrument/status snapshot)
  - One or more payment rows per booking (multi-payment supported).
  - Stores top-level payment method/status and gateway shortcuts.
  - Current create flow often initializes payment rows as `payment_status = 'completed'`.
  - Gateway flow may later set status `pending/completed/failed/refunded`.

- `booking.payment_transactions` (gateway attempt lifecycle)
  - One row per gateway checkout/payment attempt.
  - Key fields: `gateway_code`, `checkout_session_id`, `checkout_url`, `amount`, `status`, `gateway_response`.

- `booking.payment_gateway_webhooks` (gateway event audit and idempotency)
  - Stores raw webhook events and processing status.
  - Uses unique `event_id` to prevent duplicate processing.

- `booking.payment_refunds` (designed gateway refund registry)
  - Intended table for refund tracking tied to payment transactions.
  - Exists in schema and migrations.
  - Important gap: operational refund path is currently mostly recorded as credits in `booking.booking_payment_items`; direct writes into `payment_refunds` were not found in app flow modules reviewed.

### Routing and vessel dimensions
- `client.trips`, `client.routes`, `client.ports`, `client.ships`
  - Used to derive route names, vessel names, and capacity/utilization context in BI views/services.

---

## 3) Relationship Map

High-level cardinality:
- `booking.bookings (1) -> (N) booking.booking_trips`
- `booking.booking_trips (1) -> (N) booking.booking_trip_passengers`
- `booking.booking_trips (1) -> (N) booking.booking_trip_cargos`
- `booking.bookings (1) -> (N) booking.booking_payments`
- `booking.bookings (1) -> (N) booking.booking_payment_items`
- `booking.booking_payments (1) -> (N) booking.payment_transactions`
- `booking.payment_transactions (1) -> (N) booking.payment_gateway_webhooks`
- `booking.payment_transactions (1) -> (N) booking.payment_refunds` (designed model)

Reference integrity notes:
- `booking.booking_payment_items` links to either passenger/cargo line items through:
  - `booking_trip_passenger_id` or `booking_trip_cargo_id`
- Booking-level charges/fees can have both IDs null.

---

## 4) Money Flow (As Implemented)

## 4.1 Booking creation and pricing
1. Booking header/legs/passenger/cargo lines are created.
2. Pricing engine computes totals in `BookingsPriceService.calculateBookingPricing()`.
3. Breakdown rows inserted into `booking.booking_payment_items` via `createPaymentBreakdown()`:
   - `FARE` base fare for passenger/cargo lines
   - `CHARGES` and `TAXES` as applicable
4. Optional markups (e.g., TA markup, seat markup) inserted as additional payment items.
5. `booking.booking_payments` rows are created (single or multi-payment mode).

Operational implication:
- For BI and reconciliation, `booking.booking_payment_items` is the safest event-level financial source.

## 4.2 Gateway online payment flow (PayMongo/Maya)
1. Checkout/payment intent is created.
2. `booking.payment_transactions` row inserted with `status='pending'`.
3. `booking.booking_payments` updated with gateway fields and `payment_status='pending'`.
4. Webhook arrives, saved to `booking.payment_gateway_webhooks` with idempotent `event_id`.
5. On success:
   - `payment_transactions.status='succeeded'`
   - `booking_payments.payment_status='completed'`
6. On failure:
   - `payment_transactions.status='failed'`
   - `booking_payments.payment_status='failed'`

## 4.3 Refund/invalidation flow
- Bulk and line-level invalidation/refund logic calls `calculateAndRecordRefund()`.
- This inserts credit lines into `booking.booking_payment_items`:
  - `is_credit=true`
  - `charge_code='REFUND'`
  - categories typically mirror original item categories.
- Booking/line statuses updated to `Invalid` or `Refunded`.
- `booking.booking_payments.total_price` is recalculated from payment-item net sum.
- If fully refunded, booking payment status is set to `refunded`.

Important behavior:
- Double-refund prevention exists by checking existing credit entries per item scope.

---

## 5) Booking Source Tracking Model

Current source-of-truth field:
- `booking.bookings.source`

Input behavior:
- `CreateBookingDto.bookingSource` is required and allows enum-like values or URL origin (whitelabel tracking).
- Example value pattern: `https://jomalia.com` or channel labels.

BI usage:
- BI service and views use `COALESCE(b.source, 'OTC')` in several places.
- Source breakdowns are exposed in:
  - Sales trends per source
  - Passenger/Cargo source distributions
  - Route-level source charts

Implementation recommendation:
- Keep raw source in bronze layer.
- Build a normalized channel mapping dimension in warehouse (`dim_booking_source`) to avoid inconsistent labels from URL-based sources.

---

## 6) BI Metric Definitions (SQL-Ready)

The formulas below follow current implementation patterns while addressing observed data risks.

## 6.1 Canonical revenue components

Gross booked amount (before credits):
```sql
SUM(CASE WHEN bpi.is_credit THEN 0 ELSE bpi.amount END)
```

Credit adjustments (refunds/invalidation/rebook credits):
```sql
SUM(CASE WHEN bpi.is_credit THEN bpi.amount ELSE 0 END)
```

Net amount from payment items:
```sql
SUM(CASE WHEN bpi.is_credit THEN -bpi.amount ELSE bpi.amount END)
```

Refund amount (operational, recommended):
```sql
SUM(CASE WHEN bpi.is_credit = true AND bpi.charge_code = 'REFUND' THEN bpi.amount ELSE 0 END)
```

Refund amount (gateway refund registry, if consistently populated):
```sql
SUM(CASE WHEN pr.status IN ('succeeded', 'Completed') THEN pr.amount ELSE 0 END)
```

## 6.2 Core KPI definitions

Total Sales (potential pre-discount model used in current BI KPI logic):
- Based on item sums + add-back logic by discount type for base fare.
- Current service applies custom add-back rules for `PWD/CHILD/SENIOR/STUDENT/RESIDENT/PROMO`.

Gross Revenue (after deductions) currently modeled as:
```sql
(item_sum + gov_receivable_add_back)
- refunds
- disbursements
```

Total Bookings:
```sql
COUNT(DISTINCT b.id)
```
with status filters similar to:
```sql
b.booking_status NOT IN ('Cancelled', 'Draft')
AND b.deleted_at IS NULL
```

Revenue per source per day:
```sql
SELECT
  transaction_date,
  booking_source,
  SUM(net_revenue) AS source_revenue,
  COUNT(DISTINCT booking_id) AS source_bookings
FROM ...
GROUP BY transaction_date, booking_source
```

## 6.3 Recommended canonical finance query (warehouse layer)

```sql
WITH base AS (
  SELECT
    b.id AS booking_id,
    (b.created_at AT TIME ZONE 'Asia/Manila')::date AS transaction_date,
    COALESCE(NULLIF(TRIM(b.source), ''), 'OTC') AS booking_source
  FROM booking.bookings b
  WHERE b.deleted_at IS NULL
    AND b.booking_status NOT IN ('Cancelled', 'Draft')
),
items AS (
  SELECT
    bpi.booking_id,
    SUM(CASE WHEN bpi.is_credit THEN 0 ELSE bpi.amount END) AS gross_amount,
    SUM(CASE WHEN bpi.is_credit THEN bpi.amount ELSE 0 END) AS credits_amount,
    SUM(CASE WHEN bpi.is_credit THEN -bpi.amount ELSE bpi.amount END) AS net_amount,
    SUM(CASE WHEN bpi.is_credit = true AND bpi.charge_code = 'REFUND' THEN bpi.amount ELSE 0 END) AS refund_amount
  FROM booking.booking_payment_items bpi
  WHERE bpi.deleted_at IS NULL
  GROUP BY bpi.booking_id
)
SELECT
  base.transaction_date,
  base.booking_source,
  COUNT(DISTINCT base.booking_id) AS bookings,
  COALESCE(SUM(items.gross_amount), 0) AS gross_amount,
  COALESCE(SUM(items.refund_amount), 0) AS refund_amount,
  COALESCE(SUM(items.net_amount), 0) AS net_amount
FROM base
LEFT JOIN items ON items.booking_id = base.booking_id
GROUP BY base.transaction_date, base.booking_source
ORDER BY base.transaction_date;
```

---

## 7) Warehouse Schema Blueprint

## 7.1 Layered model

Bronze (raw, append-first):
- `br_booking_bookings`
- `br_booking_trips`
- `br_booking_trip_passengers`
- `br_booking_trip_cargos`
- `br_booking_payment_items`
- `br_booking_payments`
- `br_payment_transactions`
- `br_payment_gateway_webhooks`
- `br_payment_refunds`

Silver (cleaned/conformed):
- `sl_booking` (normalized statuses/source)
- `sl_booking_item_finance` (line-level finance with signed amount)
- `sl_payment_attempt` (gateway attempt lifecycle)
- `sl_refund_event` (unified refund event from credits + refund table)
- `sl_trip_dim_link` (booking to route/vessel/date)

Gold marts:
- `fact_finance_daily`
- `fact_sales_by_route_daily`
- `fact_sales_by_vessel_daily`
- `fact_sales_by_source_daily`
- `fact_passenger_mix_daily`
- `fact_cargo_mix_daily`
- `fact_capacity_utilization_daily`
- `dim_route`
- `dim_vessel`
- `dim_booking_source`
- `dim_discount_type`

## 7.2 Suggested keys and grain
- `fact_finance_daily` grain: `date x booking_source x route x vessel`
- `fact_sales_by_source_daily` grain: `date x source`
- `fact_sales_by_route_daily` grain: `date x route`
- Always carry `tenant_id`/tenant key at every fact grain for strict multi-tenant safety.

---

## 8) Pipeline Design (ETL/ELT)

## 8.1 Ingestion strategy
- Incremental extraction windows:
  - Bookings and payments: by `created_at`, `updated_at`
  - Payment items: by `created_at`, `updated_at`, `deleted_at`
  - Webhooks/transactions: by `created_at` and processing timestamps
- Late-arrival handling:
  - Reprocess rolling window (e.g., last 7-14 days) to catch delayed webhooks and post-booking adjustments.

## 8.2 Transform strategy
1. Build signed amounts in silver:
   - `signed_amount = CASE WHEN is_credit THEN -amount ELSE amount END`
2. Build refund event abstraction:
   - Source A: payment-item credits with `charge_code='REFUND'`
   - Source B: `payment_refunds` rows
3. Deduplicate webhook events using `event_id`.
4. Normalize source labels to canonical channel taxonomy.
5. Aggregate into daily facts with Manila timezone date boundaries.

## 8.3 Data quality checks (must-have)
- `fact_net_amount = fact_gross_amount - fact_credits_amount` per grain.
- Booking-level parity check:
  - Sum of payment-item signed amounts vs booking payment totals.
- Status consistency checks:
  - `booking_payments.payment_status` vs latest successful/failed payment transaction outcome.
- Refund consistency checks:
  - If booking/payment status is refunded but no corresponding refund event, flag anomaly.

---

## 9) Known Risks and Gaps

## High-severity data risks
1. Refund source mismatch across code paths.
- BI SQL in service/migrations subtracts from `booking.payment_refunds` in multiple places.
- Operational refund logic primarily writes credits into `booking.booking_payment_items`.
- Result: under/overstated net revenue depending on which table is used.

2. Refund status mismatch.
- `payment_refunds` migration constraint uses statuses: `pending/succeeded/failed`.
- BI SQL references `status = 'Completed'` in some queries/migrations.
- Result: refund deductions may evaluate to zero unexpectedly.

3. Payment status semantics overlap.
- Booking creation sets payment rows to completed in some paths.
- Gateway flow later transitions payment status pending/completed/failed.
- Result: dashboards that rely only on `booking_payments.payment_status` may misclassify payment lifecycle.

## Medium-severity risks
1. Source cardinality explosion.
- Raw source can be URL origins; without normalization channel charts fragment.

2. Multi-payment duplication risk.
- Joining booking header with payment rows naively can duplicate booking-level aggregates.

3. Soft delete handling.
- All marts must enforce deleted filters where applicable.

---

## 10) Dashboard Implementation Recommendations

## 10.1 Financial truth model
- Use `booking_payment_items` as primary fact for revenue, deductions, refunds, and rebooking impacts.
- Use `payment_transactions` + `payment_gateway_webhooks` for payment success/failure funnel and reconciliation.
- Use `payment_refunds` as supplemental signal until write-path consistency is implemented.

## 10.2 KPI stack (recommended)
- Gross Sales
- Credits/Refunds
- Net Revenue
- Cash Collected (gateway succeeded + approved offline payment logic)
- Booking Count
- AOV (net/bookings)
- Refund Rate (refund amount / gross)
- Payment Success Rate by gateway

## 10.3 Reconciliation dashboard widgets
- Booking payment state vs latest gateway transaction state mismatch count.
- Webhook processing lag and failed webhook count.
- Revenue variance:
  - `payment_items_net` vs `sales_report_view.total_net_revenue`.
- Refund parity:
  - credit-based refunds vs payment_refunds table deductions.

## 10.4 Operational BI widgets
- Channel/source trend with normalized source taxonomy.
- Route and vessel profitability net of disbursements and refunds.
- Lead-time and capacity utilization from BI service outputs.

---

## 11) Suggested Immediate Backend Improvements

1. Unify refund event persistence.
- Whenever `calculateAndRecordRefund()` inserts credit rows, also create corresponding `payment_refunds` records (or stop relying on `payment_refunds` for BI calculations).

2. Standardize refund status constants.
- Use one canonical status enum (e.g., `pending/succeeded/failed`) everywhere, including BI SQL.

3. Add a canonical finance view.
- Create `bi_dashboard.finance_ledger_view` based directly on `booking_payment_items` signed logic.

4. Add a source normalization table.
- `platform.booking_source_mapping` with regex/domain-to-channel mappings.

5. Introduce automated reconciliation jobs.
- Daily checks for state drift between booking/payment/gateway/webhook/refund entities.

---

## 12) Endpoint Inventory for BI Consumers

Main BI endpoints currently available under `/bi`:
- Overview:
  - `/overview`
  - `/overview/today`
  - `/overview/mtd`
  - `/overview/ytd`
- Sales:
  - `/sales-report`
  - `/sales-report/kpi`
  - `/sales-report/routes`
  - `/sales-report/revenue-per-bookings`
  - `/sales-report/charts`
  - `/sales-report/export`
- Expenses:
  - `/expenses-report`
  - `/expenses-report/export`
- Operations:
  - `/passengers-per-trip`
  - `/cargo-per-trip`
  - `/status-report`
  - `/vessels-report`
  - `/advance-booking`
  - `/route-map`
  - `/comparison-trend`
  - `/capacity-heatmap`
  - `/recent-activity`
  - `/today-schedule`
  - `/top-agents`

---

## 13) Executive Summary

Current implementation is strong on event capture and operational flexibility, especially around booking lifecycle and gateway webhook handling. The main blocker for finance-grade BI accuracy is refund modeling inconsistency between credit-based ledger entries and `payment_refunds`-based BI deductions. Stabilizing refund semantics and standardizing status constants will materially improve trust in net revenue metrics across all dashboards.
