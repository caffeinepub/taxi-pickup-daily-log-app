# Specification

## Summary
**Goal:** Fix the Daily Report regression so multi-day ranges show one aggregated record per day with pickups, the dialog scrolls correctly, and the end-of-period summary is present and accurate.

**Planned changes:**
- Update Daily Report backend/frontend aggregation/rendering so returned results produce one daily breakdown card per calendar day with pickups (no collapsing of distinct days), sorted chronologically.
- Fix the Daily Report dialog layout/styles so the breakdown list and final summary are scrollable and reachable on desktop and mobile.
- Restore/keep the end-of-period “Summary” section and ensure its totals equal the sum of the displayed daily breakdown totals; keep the existing empty state when there is no data.
- Add/extend a manual regression check entry to verify: after importing multi-day data, Daily Report shows all days with data and the dialog scrolls to the end summary.

**User-visible outcome:** When running a Daily Report over a date range, users see a separate card for each day that has pickups (in date order), can scroll through all days on any device, and see an accurate summary at the end (or the normal empty state if no pickups exist).
