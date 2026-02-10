# Specification

## Summary
**Goal:** Fix the Edit/Delete Record regression where selecting a pickup to edit/delete causes a blank screen, and make the edit flow resilient to malformed pickup data.

**Planned changes:**
- Identify and fix the runtime error causing a blank screen when a pickup is selected from the Edit/Delete Record list, ensuring the UI reliably transitions to the edit form.
- Add defensive rendering/formatting in the Edit/Delete Record list and edit form for nullable/empty pickup fields (e.g., date/time parsing, numeric formatting like `toFixed`) so malformed data cannot crash the screen.
- Verify end-to-end edit/delete behavior remains intact: Save updates via `updatePickup` and returns to the pickup list; Delete removes via `deletePickup` and returns to the pickup list; failures show an English error toast without blanking the UI.

**User-visible outcome:** Selecting any pickup in the Edit/Delete Record dialog opens a populated edit form without a blank screen; editing and saving or deleting works reliably and returns to the pickup list, with errors shown via toast instead of crashing.
