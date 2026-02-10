# Android Chrome Overlay & Scroll Regression Checklist

## Purpose
Verify that Radix UI overlays (dropdowns, popovers, selects, dialogs) render with fully opaque surfaces and correct backdrop visibility on Android Chrome after CSS token format changes.

## Test Environment
- **Device**: Android phone (physical device preferred)
- **Browser**: Chrome (latest stable version)
- **Modes**: Test in both light and dark mode

## Critical Scenarios

### 1. Hamburger Dropdown Menu Opacity
**Steps**:
1. Open the app on Android Chrome
2. Tap the hamburger menu icon (☰) in the header
3. Observe the dropdown menu surface

**Expected**:
- Menu surface is fully opaque (solid white in light mode, solid dark in dark mode)
- No underlying page content visible through the menu
- Menu items are clearly readable
- Border and shadow are visible

**Actual** (record result):
- [ ] Pass
- [ ] Fail (describe issue):

---

### 2. User Dropdown Menu Opacity
**Steps**:
1. Tap the user profile icon in the header
2. Observe the dropdown menu surface

**Expected**:
- Menu surface is fully opaque
- No transparency or see-through effect
- All menu items clearly visible

**Actual** (record result):
- [ ] Pass
- [ ] Fail (describe issue):

---

### 3. Customer Lookup Popover Opacity
**Steps**:
1. Navigate to the pickup form
2. Tap the "Customer Lookup" field
3. Type a few characters to trigger suggestions
4. Observe the popover surface

**Expected**:
- Popover surface is fully opaque
- Suggestions are clearly readable
- No underlying form content visible through the popover

**Actual** (record result):
- [ ] Pass
- [ ] Fail (describe issue):

---

### 4. Select Dropdown Opacity (Payment Method)
**Steps**:
1. In the pickup form, tap the "Meter Payment Method" select
2. Observe the dropdown surface

**Expected**:
- Select dropdown is fully opaque
- Options are clearly readable
- No transparency

**Actual** (record result):
- [ ] Pass
- [ ] Fail (describe issue):

---

### 5. Dialog Backdrop Visibility (from Hamburger Menu)
**Steps**:
1. Tap the hamburger menu icon
2. Tap "Daily Report" to open a dialog
3. Immediately observe the backdrop/overlay behind the dialog

**Expected**:
- Semi-transparent dark backdrop appears immediately
- Backdrop covers the full viewport
- Backdrop is visible (not transparent)
- Dialog content is clearly distinct from the backdrop

**Actual** (record result):
- [ ] Pass
- [ ] Fail (describe issue):

---

### 6. Dialog Backdrop Stability (Repeated Open/Close)
**Steps**:
1. Open the hamburger menu
2. Open "Daily Report" dialog
3. Close the dialog
4. Repeat steps 1-3 at least 5 times
5. Observe backdrop visibility on each open

**Expected**:
- Backdrop remains consistently visible on every open
- No flickering or disappearing backdrop
- Backdrop opacity remains stable

**Actual** (record result):
- [ ] Pass
- [ ] Fail (describe issue):

---

### 7. In-Dialog Popover Opacity (Date Picker)
**Steps**:
1. Open "Daily Report" dialog
2. Tap the "From Date" field to open the calendar popover
3. Observe the calendar popover surface

**Expected**:
- Calendar popover is fully opaque
- Calendar is clearly readable
- Popover sits above the dialog content (z-index correct)

**Actual** (record result):
- [ ] Pass
- [ ] Fail (describe issue):

---

### 8. In-Dialog Select Opacity (Edit Record)
**Steps**:
1. Record a pickup
2. Tap the pickup to open "Edit/Delete Record" dialog
3. Tap "Meter Payment Method" select
4. Observe the select dropdown surface

**Expected**:
- Select dropdown is fully opaque
- Options are clearly readable
- Dropdown sits above the dialog content

**Actual** (record result):
- [ ] Pass
- [ ] Fail (describe issue):

---

### 9. Light/Dark Mode Consistency
**Steps**:
1. Test scenarios 1-8 in light mode
2. Switch to dark mode (tap theme toggle in header)
3. Repeat scenarios 1-8 in dark mode

**Expected**:
- All surfaces remain fully opaque in both modes
- Backdrop visibility consistent in both modes
- No transparency issues in either mode

**Actual** (record result):
- [ ] Pass
- [ ] Fail (describe issue):

---

### 10. OKLCH Token Format Validation
**Steps**:
1. Open browser DevTools (if possible on Android)
2. Inspect any Radix overlay element (dropdown, popover, dialog)
3. Check computed styles for `background-color`

**Expected**:
- If browser supports OKLCH: `background-color` uses `oklch(...)` format
- If browser does not support OKLCH: `background-color` uses `rgb(...)` fallback
- No `transparent` or `rgba(0, 0, 0, 0)` values on overlay surfaces

**Actual** (record result):
- [ ] Pass
- [ ] Fail (describe issue):

---

## Regression Checks

### Scroll Lock (from previous fixes)
**Steps**:
1. Open hamburger menu
2. Close it
3. Try scrolling the page

**Expected**:
- Page scrolls normally after closing dropdown

**Actual** (record result):
- [ ] Pass
- [ ] Fail (describe issue):

---

### Edit/Delete Dialog Scroll (from previous fixes)
**Steps**:
1. Record a pickup
2. Tap to open "Edit/Delete Record" dialog
3. Try scrolling the edit form

**Expected**:
- Form scrolls smoothly with touch

**Actual** (record result):
- [ ] Pass
- [ ] Fail (describe issue):

---

## Summary
- **Total scenarios**: 12
- **Passed**: ___
- **Failed**: ___
- **Critical issues**: (list any blocking issues)

## Notes
(Add any additional observations, screenshots, or context here)
