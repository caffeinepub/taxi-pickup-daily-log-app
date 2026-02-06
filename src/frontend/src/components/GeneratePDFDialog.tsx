import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Download, Loader2 } from 'lucide-react';

interface GeneratePDFDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function GeneratePDFDialog({ open, onOpenChange }: GeneratePDFDialogProps) {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGeneratePDF = () => {
        setIsGenerating(true);

        // Create a new window with the specification content
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow pop-ups to generate the PDF');
            setIsGenerating(false);
            return;
        }

        const specificationContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Taxi Pickup Daily Log - Application Specifications</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            background: white;
        }
        h1 {
            color: #f59e0b;
            border-bottom: 3px solid #f59e0b;
            padding-bottom: 10px;
            margin-top: 0;
        }
        h2 {
            color: #d97706;
            border-bottom: 2px solid #fbbf24;
            padding-bottom: 8px;
            margin-top: 30px;
        }
        h3 {
            color: #92400e;
            margin-top: 20px;
        }
        h4 {
            color: #78350f;
            margin-top: 15px;
        }
        ul, ol {
            margin-left: 20px;
        }
        li {
            margin-bottom: 8px;
        }
        .formula {
            background: #fef3c7;
            padding: 10px;
            border-left: 4px solid #f59e0b;
            margin: 15px 0;
            font-family: 'Courier New', monospace;
        }
        .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        .field-list {
            background: #f9fafb;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
        }
        .note {
            background: #dbeafe;
            padding: 10px;
            border-left: 4px solid #3b82f6;
            margin: 15px 0;
        }
        @media print {
            body {
                padding: 0;
            }
            .no-print {
                display: none;
            }
            h2 {
                page-break-before: always;
            }
            h2:first-of-type {
                page-break-before: avoid;
            }
        }
    </style>
</head>
<body>
    <h1>Taxi Pickup Daily Log Application</h1>
    <p><strong>Comprehensive Application Specifications</strong></p>
    <p><em>Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</em></p>

    <div class="section">
        <h2>1. Application Overview</h2>
        <p>The Taxi Pickup Daily Log is a comprehensive daily logging application designed specifically for taxi drivers to record and manage their passenger pickups throughout the day. The application provides secure authentication, detailed pickup tracking, customer management, and comprehensive reporting capabilities.</p>
        
        <h3>Key Features</h3>
        <ul>
            <li>Secure Internet Identity authentication</li>
            <li>Daily pickup recording with comprehensive data fields</li>
            <li>Customer information management and auto-population</li>
            <li>Real-time running totals with payment method breakdowns</li>
            <li>Multi-day reporting with detailed analytics</li>
            <li>Individual record editing and deletion</li>
            <li>Bulk data management capabilities</li>
            <li>Cycle balance monitoring for canister resources</li>
        </ul>
    </div>

    <div class="section">
        <h2>2. Authentication & User Management</h2>
        
        <h3>2.1 Internet Identity Login</h3>
        <ul>
            <li>Users must sign in with Internet Identity to access the application</li>
            <li>Unauthenticated users cannot view or record any pickup data</li>
            <li>Secure authentication flow with Internet Identity integration</li>
            <li>After successful authentication, the system automatically checks if the user has a profile</li>
            <li>If no profile exists, users are automatically redirected to the account setup flow</li>
            <li>Clear guidance for new users to complete account creation after authentication</li>
        </ul>

        <h3>2.2 Account Setup</h3>
        <ul>
            <li>First-time users are automatically offered the account setup flow after successful authentication</li>
            <li>Profile setup includes driver name and contact information</li>
            <li>Account setup is required before accessing main application features</li>
            <li>Profile information can be updated later</li>
            <li>Seamless transition from login to account setup for new users</li>
        </ul>
    </div>

    <div class="section">
        <h2>3. Pickup Recording</h2>
        
        <h3>3.1 Required Fields</h3>
        <div class="field-list">
            <ul>
                <li><strong>Pickup Date:</strong> Calendar date picker, defaults to today's date, clearly marked as mandatory with red asterisk</li>
                <li><strong>Street Address:</strong> Text input for pickup location, required field</li>
                <li><strong>Pickup Time:</strong> Time input with default set to 20 minutes after current time, manually adjustable, required field marked with red asterisk</li>
                <li><strong>Destination Address:</strong> Text input for drop-off location, required field</li>
            </ul>
        </div>

        <h3>3.2 Optional Fields</h3>
        <div class="field-list">
            <ul>
                <li><strong>City:</strong> Text input for pickup city</li>
                <li><strong>Customer Name:</strong> Text input with auto-population from customer database</li>
                <li><strong>Phone Number:</strong> Text input with auto-population capabilities</li>
                <li><strong>Meter Total:</strong> Number input for the fare amount</li>
                <li><strong>Payment Method:</strong> Dropdown selection (Cash, Credit, Voucher)</li>
                <li><strong>Tip:</strong> Number input for tip amount</li>
                <li><strong>Tip Payment Method:</strong> Dropdown selection (Cash, Credit, Voucher), defaults to meter payment method</li>
                <li><strong>Calculated Total:</strong> Read-only field showing sum of meter total and tip</li>
            </ul>
        </div>

        <h3>3.3 Form Validation</h3>
        <ul>
            <li>Form validation prevents submission if pickup date or pickup time is missing</li>
            <li>Display helpful error messages when required fields are not filled</li>
            <li>Visual indicators (red asterisks) mark required fields</li>
            <li>The pickup time entered by the user must be accurately captured and saved exactly as entered</li>
        </ul>

        <h3>3.4 Customer Auto-Population</h3>
        <ul>
            <li>Auto-populate customer name when matching street address and city combination is found</li>
            <li>Auto-populate customer name, street address, and city when matching phone number is entered</li>
            <li>Enhanced customer lookup with improved search functionality</li>
        </ul>
    </div>

    <div class="section">
        <h2>4. Customer Management</h2>
        
        <h3>4.1 Customer Lookup</h3>
        <ul>
            <li>Search functionality when entering names, street addresses, cities, or phone numbers</li>
            <li>Suggest existing customers from previous pickups based on any matching field</li>
            <li>Allow creation of new customers if not found</li>
        </ul>

        <h3>4.2 Customer Data Storage</h3>
        <ul>
            <li>Store customer information including names, street addresses, cities, and phone numbers</li>
            <li>Maintain pickup history for each customer</li>
            <li>Customer data is user-specific and private to each authenticated driver</li>
        </ul>
    </div>

    <div class="section">
        <h2>5. Daily Log Display</h2>
        
        <h3>5.1 Pickup List</h3>
        <ul>
            <li>Display chronological list of all pickups for the date currently selected in the pickup date field</li>
            <li>When pickup date field is changed, the list automatically updates to show only pickups for the newly selected date</li>
            <li>Show all pickup details including pickup date, pickup time (exactly as entered), phone numbers, street address, city, meter total, payment method, tip, tip payment method, and calculated total</li>
            <li>Clear visual separation between different pickup entries</li>
            <li>Existing pickup records retain their original pickup date regardless of date picker changes</li>
        </ul>

        <h3>5.2 Running Totals</h3>
        <p>Display running totals beneath the list of pickups for the selected date showing:</p>
        <ul>
            <li>Total meter amount broken down by payment method (Cash, Credit, Voucher)</li>
            <li>Total tip amount broken down by tip payment method (Cash, Credit, Voucher)</li>
            <li>Total calculated amount (meter + tips) broken down by payment method combination</li>
            <li>Grand totals for meter, tip, and calculated amounts across all payment methods</li>
            <li>Owed Driver calculation (see formula below)</li>
        </ul>

        <div class="formula">
            <strong>Owed Driver Formula:</strong><br>
            ((meter credit + meter voucher) - meter cash) / 2 + credit tips + voucher tips
        </div>

        <div class="note">
            <strong>Note:</strong> Running totals are clearly labeled and visually distinct for easy review. Daily totals must use the exact same pickup records that are displayed in the pickup list for the selected date.
        </div>
    </div>

    <div class="section">
        <h2>6. Edit/Delete Record</h2>
        
        <h3>6.1 Access and Selection</h3>
        <ul>
            <li>Accessible through the hamburger menu as "Edit/Delete Record"</li>
            <li>Display a date picker control defaulting to today's date</li>
            <li>After date selection, show list of all pickup records for that date</li>
            <li>Each record displays key identifying information (pickup time, street address, customer name if available)</li>
            <li>Allow user to select a specific record from the list</li>
        </ul>

        <h3>6.2 Edit Functionality</h3>
        <ul>
            <li>Open edit form pre-populated with all current field values from the selected pickup record</li>
            <li>Allow modification of any field including pickup date, pickup time, street address, city, customer name, phone number, destination address, meter total, payment method, tip, and tip payment method</li>
            <li>Edit dialog has fixed layout structure with scrollable content area for form fields</li>
            <li>Fixed footer containing action buttons remains visible at all times</li>
            <li>"Save" button includes save icon and helpful text "Save Changes"</li>
            <li>"Cancel" button includes cancel/close icon and helpful text "Cancel Changes"</li>
            <li>Both buttons are larger in size with clear, helpful icons and messaging</li>
            <li>"Save" button submits changes and updates the existing record in the backend</li>
            <li>"Cancel" button discards changes and closes the edit form without saving</li>
            <li>Display confirmation messaging upon successful save or error messaging if save fails</li>
        </ul>

        <h3>6.3 Delete Functionality</h3>
        <ul>
            <li>Display confirmation dialog asking user to confirm deletion of the specific pickup record</li>
            <li>Show key details of the record being deleted (pickup time, street address, customer name)</li>
            <li>If confirmed, delete the specific pickup record from the backend</li>
            <li>If cancelled, return to the record list without making changes</li>
            <li>Update the record list display after successful deletion</li>
        </ul>
    </div>

    <div class="section">
        <h2>7. Daily Report</h2>
        
        <h3>7.1 Report Generation</h3>
        <ul>
            <li>Accessible through the hamburger menu as "Daily Report"</li>
            <li>Display modal with from/to date picker controls</li>
            <li>Allow users to select custom date range for reporting</li>
        </ul>

        <h3>7.2 Report Contents</h3>
        <p>Generate comprehensive reports showing daily totals for the selected date range including:</p>
        <ul>
            <li>Daily breakdown of meter totals by payment method (Cash, Credit, Voucher)</li>
            <li>Daily breakdown of tip totals by payment method (Cash, Credit, Voucher)</li>
            <li>Daily breakdown of calculated totals (meter + tips)</li>
            <li>Payment method breakdowns for each day in the selected range</li>
            <li>Daily Owed Driver calculation for each day</li>
            <li>Summary totals across the entire selected date range with accurate Owed Driver calculation</li>
        </ul>

        <h3>7.3 Daily Detail Section</h3>
        <ul>
            <li>Displays each day's records in strict chronological order (sorted by pickup time from earliest to latest)</li>
            <li>Each pickup record appears exactly once per day with absolutely no duplicate entries</li>
            <li>Shows street address and city separately</li>
            <li>Report data includes accurate pickup times for each record exactly as originally entered</li>
        </ul>

        <h3>7.4 Data Integrity</h3>
        <ul>
            <li>Daily report must use the exact same pickup records and calculation logic as the daily totals displayed in the main pickup list view</li>
            <li>Both daily totals and daily report query the same backend data source with identical filtering criteria</li>
            <li>Backend implements robust deduplication logic to ensure each pickup record appears only once per day</li>
            <li>Frontend implements strict record grouping by date to prevent duplicate display</li>
            <li>Comprehensive validation ensures daily report totals exactly match the sum of all underlying unique pickup records</li>
        </ul>

        <div class="formula">
            <strong>Daily Owed Driver Formula:</strong><br>
            ((meter credit + meter voucher) - meter cash) / 2 + credit tips + voucher tips<br><br>
            <strong>Summary Owed Driver Formula:</strong><br>
            ((total meter credit + total meter voucher) - total meter cash) / 2 + total credit tips + total voucher tips
        </div>
    </div>

    <div class="section">
        <h2>8. Cycle Balance Monitoring</h2>
        
        <h3>8.1 Access and Display</h3>
        <ul>
            <li>Accessible through the hamburger menu as "Cycle Balance"</li>
            <li>Display the current cycle balance (remaining computational resources) for the canister</li>
            <li>Present the cycle balance in a user-friendly format with clear labeling</li>
            <li>Show the balance in a readable format (e.g., "1.2T cycles" for trillions)</li>
        </ul>

        <h3>8.2 Functionality</h3>
        <ul>
            <li>Include explanatory text about what cycles represent (computational resources)</li>
            <li>Refresh capability to get the most current balance information</li>
            <li>Only accessible to authenticated users</li>
            <li>Query the canister's current cycle balance from the backend</li>
        </ul>

        <div class="note">
            <strong>About Cycles:</strong> Cycles are the computational resources used to power this application on the Internet Computer. The balance shown represents the remaining cycles available for the canister to process requests.
        </div>
    </div>

    <div class="section">
        <h2>9. Delete All Records</h2>
        <ul>
            <li>Accessible through the hamburger menu as "Delete All Records"</li>
            <li>Display confirmation dialog asking user to confirm deletion of all pickup records and customer data</li>
            <li>Confirmation dialog clearly warns that this action cannot be undone</li>
            <li>If confirmed, delete all pickup records and customer data for the authenticated user</li>
            <li>After successful deletion, update UI to reflect empty state (no pickups displayed, running totals reset to zero)</li>
            <li>If cancelled, close dialog without making any changes</li>
            <li>Only affects data for the authenticated user</li>
        </ul>
    </div>

    <div class="section">
        <h2>10. Data Storage</h2>
        
        <h3>10.1 Backend Storage</h3>
        <ul>
            <li>Store user profiles with driver information linked to Internet Identity principals</li>
            <li>Store all pickup records with unique identifiers and complete pickup information</li>
            <li>Each pickup record has a unique identifier to enable individual record editing and deletion</li>
            <li>Backend receives and stores the exact pickup time value provided by the user</li>
            <li>Maintain customer database with names, street addresses, cities, phone numbers, and pickup history</li>
            <li>Persist data across sessions and days</li>
            <li>Ensure data isolation between different users</li>
        </ul>

        <h3>10.2 Data Operations</h3>
        <ul>
            <li>Authenticate users with Internet Identity</li>
            <li>Check if authenticated user has an existing profile</li>
            <li>Create and update user profiles</li>
            <li>Query the canister's current cycle balance and return it in a readable format</li>
            <li>Save new pickup records with all field data for authenticated users</li>
            <li>Retrieve customer suggestions based on partial matches</li>
            <li>Auto-populate customer fields when matching data is found</li>
            <li>Fetch all pickups for a specific date for the authenticated user</li>
            <li>Fetch pickups for a specified date range to generate daily reports</li>
            <li>Backend uses consistent data retrieval logic for both daily totals and daily report queries</li>
            <li>Backend implements unified pickup retrieval functions that guarantee the same set of unique records</li>
            <li>Backend implements robust deduplication mechanisms</li>
            <li>Retrieve specific pickup record by unique identifier for editing</li>
            <li>Update existing pickup record with modified field values</li>
            <li>Delete specific pickup record by unique identifier</li>
            <li>Create new customer entries when needed</li>
            <li>Delete all pickup records and customer data for authenticated user when requested</li>
            <li>Calculate Owed Driver amounts using the specified formula</li>
        </ul>
    </div>

    <div class="section">
        <h2>11. Calculation Formulas</h2>
        
        <h3>11.1 Calculated Total</h3>
        <div class="formula">
            Calculated Total = Meter Total + Tip
        </div>

        <h3>11.2 Owed Driver (Daily)</h3>
        <div class="formula">
            Owed Driver = ((Meter Credit + Meter Voucher) - Meter Cash) / 2 + Credit Tips + Voucher Tips
        </div>
        <p><em>This formula may result in positive or negative values.</em></p>

        <h3>11.3 Owed Driver (Multi-Day Summary)</h3>
        <div class="formula">
            Total Owed Driver = ((Total Meter Credit + Total Meter Voucher) - Total Meter Cash) / 2 + Total Credit Tips + Total Voucher Tips
        </div>
        <p><em>Calculated across the entire selected date range based on unique records only.</em></p>
    </div>

    <div class="section">
        <h2>12. User Interface Components</h2>
        
        <h3>12.1 Navigation</h3>
        <ul>
            <li>App header with taxi logo and title</li>
            <li>Hamburger menu button for accessing additional features</li>
            <li>Hamburger menu contains: Daily Report, Edit/Delete Record, Delete All Records, Generate PDF Report, Cycle Balance</li>
            <li>Theme toggle button (light/dark mode)</li>
            <li>User dropdown menu showing profile information and sign-out option</li>
        </ul>

        <h3>12.2 Forms and Inputs</h3>
        <ul>
            <li>Calendar date picker for pickup date selection</li>
            <li>Time input with smart default timing (20 minutes after current time)</li>
            <li>Text inputs for addresses, names, and phone numbers</li>
            <li>Number inputs for meter total and tip amounts</li>
            <li>Dropdown selects for payment methods</li>
            <li>Customer lookup combobox with auto-complete functionality</li>
            <li>Required field indicators (red asterisks)</li>
            <li>Form validation with error messages</li>
        </ul>

        <h3>12.3 Display Components</h3>
        <ul>
            <li>Pickup list with chronological ordering</li>
            <li>Running totals section with payment method breakdowns</li>
            <li>Daily report modal with date range selection</li>
            <li>Edit/delete record dialog with scrollable form and fixed footer</li>
            <li>Cycle balance dialog with refresh capability</li>
            <li>Confirmation dialogs for destructive actions</li>
            <li>Toast notifications for success/error messages</li>
        </ul>

        <h3>12.4 Design Features</h3>
        <ul>
            <li>Clean, mobile-friendly interface suitable for use in vehicles</li>
            <li>Responsive design for various screen sizes</li>
            <li>Taxi-themed visual elements with warm amber/yellow colors</li>
            <li>Clear section headings and well-spaced layout</li>
            <li>Improved layout spacing and typography for better readability</li>
            <li>Visual indicators for required fields and validation errors</li>
            <li>Authentication-protected routes and components</li>
        </ul>
    </div>

    <div class="section">
        <h2>13. Validation Rules</h2>
        
        <h3>13.1 Required Field Validation</h3>
        <ul>
            <li>Pickup date must be selected before form submission</li>
            <li>Pickup time must be entered before form submission</li>
            <li>Street address must be provided</li>
            <li>Destination address must be provided</li>
            <li>Form displays error messages when required fields are missing</li>
        </ul>

        <h3>13.2 Data Integrity Validation</h3>
        <ul>
            <li>Pickup time value must be correctly captured from form input and transmitted to backend</li>
            <li>Backend must receive and store exact pickup time value as entered by user</li>
            <li>Backend must return exact pickup time as originally stored when fetching records</li>
            <li>Frontend must display pickup time exactly as it was entered by user</li>
        </ul>

        <h3>13.3 Calculation Validation</h3>
        <ul>
            <li>Daily totals must use exact same pickup records displayed in pickup list</li>
            <li>Daily report must use exact same pickup records and calculation logic as daily totals</li>
            <li>Both daily totals and daily report must query same backend data source</li>
            <li>Each pickup record must appear exactly once per day with no duplicate entries</li>
            <li>Comprehensive validation ensures daily report totals exactly match sum of underlying unique pickup records</li>
            <li>All calculation logic thoroughly validated to prevent mismatch errors in production</li>
        </ul>
    </div>

    <div class="section">
        <h2>14. User Flows</h2>
        
        <h3>14.1 New User Flow</h3>
        <ol>
            <li>User visits application</li>
            <li>User clicks "Sign in with Internet Identity"</li>
            <li>User completes Internet Identity authentication</li>
            <li>System checks for existing profile</li>
            <li>If no profile exists, user is automatically redirected to account setup</li>
            <li>User enters driver name and contact information</li>
            <li>User submits profile</li>
            <li>User is redirected to main application</li>
        </ol>

        <h3>14.2 Returning User Flow</h3>
        <ol>
            <li>User visits application</li>
            <li>User clicks "Sign in with Internet Identity"</li>
            <li>User completes Internet Identity authentication</li>
            <li>System checks for existing profile</li>
            <li>Profile found, user is directed to main application</li>
        </ol>

        <h3>14.3 Recording a Pickup Flow</h3>
        <ol>
            <li>User selects pickup date (defaults to today)</li>
            <li>User enters street address (auto-population may occur)</li>
            <li>User optionally enters city</li>
            <li>User optionally enters or selects customer name</li>
            <li>User optionally enters phone number (auto-population may occur)</li>
            <li>User adjusts pickup time (defaults to 20 minutes from now)</li>
            <li>User enters destination address</li>
            <li>User optionally enters meter total and selects payment method</li>
            <li>User optionally enters tip and selects tip payment method</li>
            <li>User submits form</li>
            <li>System validates required fields</li>
            <li>If valid, pickup is saved and appears in daily log</li>
            <li>Running totals are automatically updated</li>
        </ol>

        <h3>14.4 Editing a Record Flow</h3>
        <ol>
            <li>User opens hamburger menu</li>
            <li>User selects "Edit/Delete Record"</li>
            <li>User selects date to view records</li>
            <li>User selects specific record from list</li>
            <li>User clicks "Edit" button</li>
            <li>Edit form opens with pre-populated data</li>
            <li>User modifies desired fields</li>
            <li>User clicks "Save Changes"</li>
            <li>System updates record in backend</li>
            <li>Success message is displayed</li>
            <li>Record list is updated</li>
        </ol>

        <h3>14.5 Generating Daily Report Flow</h3>
        <ol>
            <li>User opens hamburger menu</li>
            <li>User selects "Daily Report"</li>
            <li>User selects from date</li>
            <li>User selects to date</li>
            <li>User clicks "Generate Report"</li>
            <li>System fetches all pickups in date range</li>
            <li>System calculates daily totals for each day</li>
            <li>System calculates summary totals across all days</li>
            <li>Report is displayed with daily breakdowns and summary</li>
            <li>User can review all details and calculations</li>
        </ol>

        <h3>14.6 Checking Cycle Balance Flow</h3>
        <ol>
            <li>User opens hamburger menu</li>
            <li>User selects "Cycle Balance"</li>
            <li>System queries canister's current cycle balance</li>
            <li>Balance is displayed in user-friendly format</li>
            <li>User can click "Refresh" to get updated balance</li>
            <li>User can close dialog when finished</li>
        </ol>
    </div>

    <div class="section">
        <h2>15. Technical Implementation</h2>
        
        <h3>15.1 Frontend Technology</h3>
        <ul>
            <li>React with TypeScript</li>
            <li>Tailwind CSS for styling</li>
            <li>shadcn/ui component library</li>
            <li>React Query for state management</li>
            <li>Internet Identity for authentication</li>
        </ul>

        <h3>15.2 Backend Technology</h3>
        <ul>
            <li>Motoko programming language</li>
            <li>Internet Computer blockchain platform</li>
            <li>Canister-based architecture</li>
            <li>Query calls for read-only operations</li>
            <li>Update calls for state-changing operations</li>
        </ul>

        <h3>15.3 Data Structures</h3>
        <ul>
            <li>UserProfile: driverName, contactInfo</li>
            <li>Pickup: id, pickupDate, streetAddress, city, customerName, phoneNumber, pickupTime, destinationAddress, meterTotal, meterPaymentMethod, tip, tipPaymentMethod, calculatedTotal</li>
            <li>Customer: name, streetAddress, city, phoneNumber, pickupHistory</li>
            <li>PaymentMethod: cash, credit, voucher</li>
            <li>DailyTotals: date, meterTotal, cashTotal, creditTotal, voucherTotal, tipTotal, cashTipTotal, creditTipTotal, voucherTipTotal, calculatedTotal, owedDriver</li>
            <li>ReportSummary: totalMeter, totalCash, totalCredit, totalVoucher, totalTips, totalCashTips, totalCreditTips, totalVoucherTips, totalCalculated, totalOwedDriver</li>
        </ul>
    </div>

    <div class="section">
        <h2>16. Deployment</h2>
        <ul>
            <li>Application is deployed to production environment for live use</li>
            <li>Ready for real taxi drivers to use in their daily operations</li>
            <li>Stable and permanent deployment suitable for production workloads</li>
            <li>Current version pushed to live production environment for permanent availability</li>
            <li>Application is live and accessible to real users</li>
            <li>Secure authentication system integrated for user privacy and data protection</li>
            <li>All calculation logic thoroughly tested and validated for production accuracy</li>
            <li>Multi-day report calculations validated and tested to ensure accurate totals</li>
            <li>Cycle balance monitoring functionality deployed and ready for production use</li>
            <li>Latest version with all recent features and fixes deployed to production</li>
        </ul>
    </div>

    <div class="section">
        <h2>17. Future Considerations</h2>
        <ul>
            <li>Export functionality for reports (CSV, Excel)</li>
            <li>Advanced filtering and search capabilities</li>
            <li>Statistical analysis and trends</li>
            <li>Mobile app versions (iOS, Android)</li>
            <li>Integration with mapping services</li>
            <li>Automated backup and restore functionality</li>
            <li>Multi-language support</li>
            <li>Cycle balance alerts and notifications</li>
        </ul>
    </div>

    <div class="no-print" style="margin-top: 40px; padding: 20px; background: #f3f4f6; border-radius: 8px; text-align: center;">
        <p style="margin-bottom: 15px;"><strong>To save this document as PDF:</strong></p>
        <p>Use your browser's print function (Ctrl+P or Cmd+P) and select "Save as PDF" as the destination.</p>
    </div>

    <footer style="margin-top: 50px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280;">
        <p>© 2025 Taxi Pickup Daily Log Application</p>
        <p>Built with ❤️ using <a href="https://caffeine.ai" style="color: #f59e0b; text-decoration: none;">caffeine.ai</a></p>
    </footer>
</body>
</html>
        `;

        printWindow.document.write(specificationContent);
        printWindow.document.close();

        // Wait a moment for content to load, then trigger print dialog
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            setIsGenerating(false);
        }, 500);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Generate PDF Report
                    </DialogTitle>
                    <DialogDescription>
                        Generate a comprehensive PDF document containing the complete application specifications,
                        including all features, data fields, user flows, validation rules, and calculation formulas.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="rounded-lg border bg-muted/50 p-4">
                        <h4 className="font-semibold mb-2">PDF Contents Include:</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                            <li>• Application overview and features</li>
                            <li>• Authentication and user management</li>
                            <li>• Pickup recording process and fields</li>
                            <li>• Customer management functionality</li>
                            <li>• Daily log display and running totals</li>
                            <li>• Edit/Delete record operations</li>
                            <li>• Daily report generation</li>
                            <li>• Cycle balance monitoring</li>
                            <li>• Calculation formulas (including Owed Driver)</li>
                            <li>• Validation rules and user flows</li>
                            <li>• Technical implementation details</li>
                        </ul>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isGenerating}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleGeneratePDF}
                            disabled={isGenerating}
                            className="gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Download className="h-4 w-4" />
                                    Generate PDF
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
