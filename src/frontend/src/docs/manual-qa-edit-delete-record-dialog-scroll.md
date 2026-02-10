# Manual QA Checklist: Edit/Delete Record Dialog Scrolling

## Purpose
This checklist verifies that the Edit/Delete Record dialog scrolling behavior works correctly on Android Chrome, including:
- Background page scroll lock when dialog is open
- In-dialog scrolling for pickup list and edit form
- Dropdown → dialog transitions (hamburger menu)
- Popover/select stacking inside dialogs

## Test Environment
- Device: Android phone or tablet
- Browser: Chrome (latest stable version)
- Network: Any (local or deployed)

## Prerequisites
- At least 10 pickup records in the last 30 days (to enable scrolling in the pickup list)
- At least one pickup record selected for editing (to enable scrolling in the edit form)

## Test Cases

### 1. Background Scroll Lock
**Goal:** Verify that the background page does not scroll when the dialog is open.

**Steps:**
1. Open the app on Android Chrome
2. Open the hamburger menu (three horizontal lines in the header)
3. Tap "Edit/Delete Record"
4. Try to scroll the background page (the main app content behind the dialog)

**Expected:**
- ✅ Background page does not scroll
- ✅ Dialog remains centered and visible

**Failure indicators:**
- ❌ Background page scrolls when dialog is open
- ❌ Dialog moves or disappears when trying to scroll

---

### 2. Pickup List Scrolling
**Goal:** Verify that the pickup list (left side of the dialog) scrolls smoothly with touch gestures.

**Steps:**
1. Open the "Edit/Delete Record" dialog
2. Swipe up/down on the pickup list (left side)

**Expected:**
- ✅ Pickup list scrolls smoothly
- ✅ Momentum scrolling works (list continues scrolling after finger is lifted)
- ✅ Scroll stops at the top/bottom of the list

**Failure indicators:**
- ❌ Pickup list does not scroll
- ❌ Scrolling is jerky or unresponsive
- ❌ Momentum scrolling does not work

---

### 3. Edit Form Scrolling
**Goal:** Verify that the edit form (right side of the dialog) scrolls smoothly with touch gestures.

**Steps:**
1. Open the "Edit/Delete Record" dialog
2. Select a pickup record to edit
3. Swipe up/down on the edit form (right side)

**Expected:**
- ✅ Edit form scrolls smoothly
- ✅ Momentum scrolling works
- ✅ All form fields are accessible by scrolling

**Failure indicators:**
- ❌ Edit form does not scroll
- ❌ Scrolling is jerky or unresponsive
- ❌ Some form fields are not accessible

---

### 4. Hamburger Menu → Dialog Transition
**Goal:** Verify that opening the dialog from the hamburger menu closes the dropdown cleanly without leaving invisible blocking layers.

**Steps:**
1. Open the hamburger menu
2. Tap "Edit/Delete Record"
3. Observe the transition

**Expected:**
- ✅ Hamburger menu closes immediately
- ✅ Dialog opens smoothly
- ✅ No invisible layer blocks touch/scroll interactions

**Failure indicators:**
- ❌ Hamburger menu remains visible behind the dialog
- ❌ Touch/scroll interactions are blocked after dialog opens

---

### 5. In-Dialog Popover/Select Stacking
**Goal:** Verify that popovers and selects inside the dialog appear above the dialog content and are fully opaque.

**Steps:**
1. Open the "Edit/Delete Record" dialog
2. Select a pickup record to edit
3. Tap the "Pickup Date" field to open the date picker popover
4. Observe the popover

**Expected:**
- ✅ Date picker popover appears above the dialog content
- ✅ Popover is fully opaque (not see-through)
- ✅ Popover is positioned correctly relative to the date field

**Failure indicators:**
- ❌ Popover is hidden behind the dialog content
- ❌ Popover is see-through
- ❌ Popover is mispositioned

---

### 6. Post-Dialog Scroll Behavior
**Goal:** Verify that closing the dialog does not leave the page frozen/unscrollable.

**Steps:**
1. Open the "Edit/Delete Record" dialog
2. Close it by tapping the X button or pressing the back button
3. Try to scroll the main page up and down with touch gestures

**Expected:**
- ✅ Page scrolls normally
- ✅ No invisible layer blocks touch/scroll interactions

**Failure indicators:**
- ❌ Page is frozen and does not respond to scroll gestures
- ❌ Touch events are blocked

---

## Regression Prevention
Run this checklist after any changes to:
- `frontend/src/components/EditDeleteRecordDialog.tsx`
- `frontend/src/index.css` (especially `.edit-delete-dialog` and `.edit-form-scroll` classes)
- `frontend/src/hooks/useRadixOverlayCleanup.ts`

## Related Documentation
- [Android Chrome Overlay & Scroll Regression Checklist](./manual-qa-android-chrome-overlays-and-scroll.md)
