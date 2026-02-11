# Manual QA Checklist: Version 103 Regression Verification

This checklist verifies that the pickup creation, listing, editing, deletion, and daily report functionality has been restored after the v103 regression.

## Prerequisites
- User is logged in with Internet Identity
- User has completed profile setup
- Backend actor is initialized and ready

---

## Test 1: Create a New Pickup

### Steps:
1. Navigate to the main app page
2. Fill in all required fields in the pickup form:
   - Pickup Date: Select today's date
   - Pickup Time: Enter a valid time (e.g., 14:30)
   - Customer Name: Enter "Test Customer"
   - Street Address: Enter "123 Test St"
   - City: Enter "Test City"
   - Phone Number: Enter "555-1234"
   - Destination Address: Enter "456 Destination Ave"
   - Meter Total: Enter "25.00"
   - Meter Payment Method: Select "Credit"
   - Tip: Enter "5.00"
   - Tip Payment Method: Select "Cash"
3. Click "Record Pickup"

### Expected Results:
- ✅ Form submits successfully without validation errors
- ✅ Success toast appears: "Pickup recorded successfully"
- ✅ Form fields are cleared after submission
- ✅ No "Please fill in all required fields" error when all fields are filled

---

## Test 2: Create Pickup with Zero Tip

### Steps:
1. Fill in all required fields as in Test 1
2. Set Tip to "0" (zero)
3. Click "Record Pickup"

### Expected Results:
- ✅ Form submits successfully
- ✅ Zero tip value is accepted (no validation error)
- ✅ Success toast appears
- ✅ Pickup is recorded with $0.00 tip

---

## Test 3: View Pickups for Selected Date

### Steps:
1. After creating pickups in Tests 1 and 2, verify the pickup list updates
2. Check that the pickup list shows the newly created pickups without requiring a page refresh

### Expected Results:
- ✅ Pickup list displays all pickups for the selected date
- ✅ Each pickup card shows correct customer name, address, time, meter total, tip, and calculated total
- ✅ Daily totals section shows correct aggregated values
- ✅ "Owed Driver" calculation is correct
- ✅ No backend error messages appear
- ✅ If no pickups exist for a date, the empty state message appears (not an error)

---

## Test 4: Daily Report for Same-Day Range

### Steps:
1. Open the Daily Report dialog from the hamburger menu
2. Set "From Date" to today
3. Set "To Date" to today (same day)
4. Verify the report loads

### Expected Results:
- ✅ Report fetches successfully for same-day range
- ✅ Daily breakdown card appears for today's date
- ✅ Breakdown shows correct meter totals (cash, credit, voucher)
- ✅ Breakdown shows correct tip totals (cash, credit, voucher)
- ✅ Daily total and "Owed Driver" values match the pickups created
- ✅ Summary section shows correct aggregated totals
- ✅ No empty report when pickups exist

---

## Test 5: Daily Report for Multi-Day Range

### Steps:
1. Create pickups on at least two different dates (e.g., today and yesterday)
2. Open the Daily Report dialog
3. Set "From Date" to 7 days ago
4. Set "To Date" to today
5. Verify the report loads

### Expected Results:
- ✅ Report fetches successfully for multi-day range
- ✅ Daily breakdown cards appear for each date with pickups
- ✅ Each daily card shows correct totals for that date
- ✅ Summary section aggregates all days correctly
- ✅ Dates are sorted chronologically

---

## Test 6: Daily Report Multi-Day Import and Scrolling

### Steps:
1. Import a backup file containing many pickups across many days (e.g., 134 records spanning multiple weeks or months)
2. Open the Daily Report dialog from the hamburger menu
3. Set "From Date" to cover the earliest imported pickup date
4. Set "To Date" to cover the latest imported pickup date
5. Verify the report loads and displays multiple daily breakdown cards
6. Scroll through the entire report using:
   - Mouse wheel / trackpad (desktop)
   - Touch scrolling (mobile)
7. Verify you can reach the Summary section at the end

### Expected Results:
- ✅ Report displays one card per day that has pickups (no duplicate or collapsed days)
- ✅ All days with data are visible (e.g., if 134 pickups span 20 days, 20 daily cards appear)
- ✅ Days without pickups are not displayed
- ✅ Daily cards are sorted chronologically (earliest to latest)
- ✅ Scrolling works smoothly on both desktop and mobile
- ✅ The Summary section is reachable at the end of the list
- ✅ Summary totals match the sum of all displayed daily totals
- ✅ No content is cut off or unreachable

---

## Test 7: Edit an Existing Pickup

### Steps:
1. Open the "Edit or Delete Record" dialog from the hamburger menu
2. Select a pickup from the recent pickups list (last 30 days)
3. Click "Edit"
4. Modify the customer name to "Updated Customer"
5. Modify the meter total to "30.00"
6. Click "Save Changes"

### Expected Results:
- ✅ Pickup details load correctly in the edit form
- ✅ Form validation works (same as create form)
- ✅ Success toast appears: "Pickup updated successfully"
- ✅ Updated pickup appears in the pickup list with new values
- ✅ No backend errors during update

---

## Test 8: Delete a Pickup

### Steps:
1. Open the "Edit or Delete Record" dialog
2. Select a pickup from the recent pickups list
3. Click "Delete"
4. Confirm the deletion in the confirmation dialog

### Expected Results:
- ✅ Confirmation dialog appears
- ✅ Success toast appears: "Pickup deleted successfully"
- ✅ Deleted pickup no longer appears in the pickup list
- ✅ Deleted pickup no longer appears in the recent pickups list
- ✅ Daily totals update to reflect the deletion

---

## Test 9: Validation Error Handling

### Steps:
1. Try to submit the pickup form with one or more required fields empty
2. Try to submit with invalid numeric values (e.g., "abc" in meter total)
3. Try to submit with whitespace-only values in text fields

### Expected Results:
- ✅ Appropriate validation error messages appear
- ✅ "Please fill in all required fields" for missing fields
- ✅ "Please enter a valid meter total" for invalid meter total
- ✅ "Please enter a valid tip amount" for invalid tip
- ✅ Form does not submit when validation fails

---

## Test 10: Backend Error Handling

### Steps:
1. Simulate a backend failure (e.g., by disconnecting network temporarily)
2. Try to create a pickup
3. Try to load the pickup list
4. Try to load the daily report

### Expected Results:
- ✅ Actionable English error messages appear (not "Actor not initialized")
- ✅ Error messages distinguish between connection issues and data issues
- ✅ Empty pickup list shows an error alert (not an empty state message)
- ✅ Daily report shows an error alert (not an all-zero report)

---

## Test 11: False "Required Fields" Regression Check

### Steps:
1. Fill in all required fields in the pickup form, including:
   - Meter Total: "0" (zero)
   - Tip: "0" (zero)
2. Click "Record Pickup"

### Expected Results:
- ✅ Form submits successfully
- ✅ No "Please fill in all required fields" error appears
- ✅ Pickup is recorded with zero values where entered
- ✅ This confirms the false-negative validation bug is fixed

---

## Summary

All tests should pass without errors. If any test fails, document the failure and investigate the root cause before deploying to production.

**Key Regression Points Verified:**
- Pickup creation with all field types (including zero values)
- Pickup listing without silent backend failures
- Daily report retrieval for same-day and multi-day ranges
- Daily report multi-day display and scrolling after import
- Edit and delete flows
- Proper error handling and user-facing messages
