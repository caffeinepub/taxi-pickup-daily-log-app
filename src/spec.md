# Specification

## Summary
**Goal:** Ensure the app always computes and displays the driver’s primary owed total (“Period Total” / per-day total) using the canonical formula, and make voucher tips optional across import and data entry.

**Planned changes:**
- Update backend daily report aggregation so per-day totals and the summary “Period Total” are derived from: ((credit meter + voucher meter − cash meter) ÷ 2) + credit tips + voucher tips, while keeping existing meter/tip breakdowns by payment method.
- Update frontend Daily Report (summary and per-day rows/cards) to display the canonical-formula totals as the primary totals and avoid substituting meter+tips totals in those locations.
- Make voucher tips supported but optional: allow voucher tip entry/selection, and make imports succeed when tip fields are missing by defaulting missing tip amount to 0 (and applying a sensible default tip payment method).

**User-visible outcome:** Daily Report “Period Total” and per-day totals consistently match the canonical owed-total formula, and voucher tips can be included when present but are not required for importing or saving entries.
