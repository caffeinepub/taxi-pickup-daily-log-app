import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';

interface GeneratePDFDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function GeneratePDFDialog({ open, onOpenChange }: GeneratePDFDialogProps) {
    const handleGeneratePDF = () => {
        const pdfContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Taxi Pickup Daily Log App - Specification</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; border-bottom: 2px solid #95a5a6; padding-bottom: 5px; }
        h3 { color: #7f8c8d; margin-top: 20px; }
        ul { margin-left: 20px; }
        .section { margin-bottom: 30px; }
        .formula { background-color: #ecf0f1; padding: 10px; border-left: 4px solid #3498db; margin: 10px 0; }
        @media print {
            body { margin: 0; padding: 15px; }
            h1 { page-break-before: avoid; }
            .section { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <h1>Taxi Pickup Daily Log Application</h1>
    <p><strong>Comprehensive Specification Document</strong></p>
    
    <div class="section">
        <h2>1. Application Overview</h2>
        <p>The Taxi Pickup Daily Log App is a comprehensive tool designed for taxi drivers to track daily pickups, manage customer information, and generate detailed reports. The application runs on the Internet Computer blockchain, providing secure, decentralized data storage.</p>
    </div>

    <div class="section">
        <h2>2. Core Features</h2>
        <h3>2.1 Pickup Recording</h3>
        <ul>
            <li><strong>Pickup Date:</strong> Date of the pickup (required)</li>
            <li><strong>Pickup Time:</strong> Time of the pickup (required)</li>
            <li><strong>Customer Name:</strong> Name of the passenger (required)</li>
            <li><strong>Street Address:</strong> Pickup location street address (required)</li>
            <li><strong>City:</strong> Pickup location city (required)</li>
            <li><strong>Phone Number:</strong> Customer contact number (required)</li>
            <li><strong>Destination Address:</strong> Drop-off location (required)</li>
            <li><strong>Meter Total:</strong> Fare amount from the meter (required, numeric)</li>
            <li><strong>Meter Payment Method:</strong> Cash, Credit, or Voucher (required)</li>
            <li><strong>Tip:</strong> Tip amount (required, numeric, can be 0)</li>
            <li><strong>Tip Payment Method:</strong> Cash, Credit, or Voucher (required)</li>
        </ul>

        <h3>2.2 Customer Management</h3>
        <ul>
            <li><strong>Customer Lookup:</strong> Search existing customers by name, address, or phone number</li>
            <li><strong>Auto-fill:</strong> Automatically populate customer details from previous pickups</li>
            <li><strong>Pickup History:</strong> Track all pickups for each customer</li>
        </ul>

        <h3>2.3 Daily View</h3>
        <ul>
            <li><strong>Date Selection:</strong> View pickups for any specific date</li>
            <li><strong>Pickup List:</strong> Chronological list of all pickups for the selected date</li>
            <li><strong>Daily Totals:</strong> Automatic calculation of daily totals including:
                <ul>
                    <li>Total meter amount</li>
                    <li>Total tips</li>
                    <li>Cash total</li>
                    <li>Credit total</li>
                    <li>Voucher total</li>
                    <li>Amount owed to driver</li>
                </ul>
            </li>
        </ul>

        <h3>2.4 Reporting</h3>
        <ul>
            <li><strong>Daily Report:</strong> Generate reports for any date range showing:
                <ul>
                    <li>Daily breakdown of all metrics</li>
                    <li>Summary totals across the entire range</li>
                    <li>Payment method breakdowns</li>
                </ul>
            </li>
        </ul>

        <h3>2.5 Record Management</h3>
        <ul>
            <li><strong>Edit Records:</strong> Modify any previously recorded pickup</li>
            <li><strong>Delete Records:</strong> Remove individual pickup records</li>
            <li><strong>Delete All Records:</strong> Clear all data (with confirmation)</li>
        </ul>

        <h3>2.6 Data Management</h3>
        <ul>
            <li><strong>Export Data:</strong> Download all data as JSON file for backup</li>
            <li><strong>Import Data:</strong> Restore data from a previous export</li>
        </ul>

        <h3>2.7 System Features</h3>
        <ul>
            <li><strong>User Profile:</strong> Driver name, contact info, and optional email</li>
            <li><strong>Cycle Balance:</strong> Monitor Internet Computer computational resources</li>
            <li><strong>Theme Toggle:</strong> Switch between light and dark modes</li>
            <li><strong>Internet Identity:</strong> Secure authentication using Internet Computer's identity system</li>
        </ul>
    </div>

    <div class="section">
        <h2>3. Calculations</h2>
        <h3>3.1 Owed to Driver Formula</h3>
        <div class="formula">
            <strong>Owed to Driver = ((Credit Meter + Voucher Meter - Cash Meter) / 2) + Credit Tips + Voucher Tips</strong>
        </div>
        <p><strong>Explanation:</strong></p>
        <ul>
            <li>The driver typically splits non-cash meter amounts with the company (50/50)</li>
            <li>Cash meter amounts are kept by the driver</li>
            <li>All credit and voucher tips go to the driver</li>
            <li>Cash tips are kept by the driver immediately</li>
        </ul>

        <h3>3.2 Calculated Total</h3>
        <div class="formula">
            <strong>Calculated Total = Meter Total + Tip</strong>
        </div>
    </div>

    <div class="section">
        <h2>4. User Flows</h2>
        <h3>4.1 First-Time User</h3>
        <ol>
            <li>User clicks "Login" on the login page</li>
            <li>User authenticates with Internet Identity</li>
            <li>System detects no profile exists</li>
            <li>User is prompted to create profile (name, contact info, optional email)</li>
            <li>User is taken to the main application</li>
        </ol>

        <h3>4.2 Recording a Pickup</h3>
        <ol>
            <li>User selects pickup date (defaults to today)</li>
            <li>User enters pickup time</li>
            <li>User searches for existing customer or enters new customer details</li>
            <li>User enters destination address</li>
            <li>User enters meter total and selects payment method</li>
            <li>User enters tip amount and selects payment method</li>
            <li>User clicks "Record Pickup"</li>
            <li>System saves the pickup and updates the daily view</li>
        </ol>

        <h3>4.3 Viewing Daily Report</h3>
        <ol>
            <li>User opens hamburger menu</li>
            <li>User selects "Daily Report"</li>
            <li>User selects date range (from date and to date)</li>
            <li>System displays daily breakdown and summary totals</li>
        </ol>

        <h3>4.4 Editing a Record</h3>
        <ol>
            <li>User opens hamburger menu</li>
            <li>User selects "Edit/Delete Record"</li>
            <li>User selects a pickup from the list (last 30 days)</li>
            <li>User clicks "Edit"</li>
            <li>User modifies the desired fields</li>
            <li>User clicks "Save Changes"</li>
            <li>System updates the record</li>
        </ol>
    </div>

    <div class="section">
        <h2>5. Data Validation</h2>
        <ul>
            <li>All required fields must be filled before submission</li>
            <li>Numeric fields (meter total, tip) must be valid numbers</li>
            <li>Dates must be valid dates</li>
            <li>Time must be in valid HH:MM format</li>
            <li>Payment methods must be one of: Cash, Credit, or Voucher</li>
        </ul>
    </div>

    <div class="section">
        <h2>6. Security & Privacy</h2>
        <ul>
            <li>All data is stored on the Internet Computer blockchain</li>
            <li>Each user's data is isolated and accessible only to them</li>
            <li>Authentication is handled via Internet Identity (no passwords)</li>
            <li>All backend operations require authentication</li>
        </ul>
    </div>

    <div class="section">
        <h2>7. Technical Architecture</h2>
        <h3>7.1 Frontend</h3>
        <ul>
            <li>React with TypeScript</li>
            <li>Tailwind CSS for styling</li>
            <li>Shadcn/ui component library</li>
            <li>React Query for state management</li>
            <li>TanStack Router for navigation</li>
        </ul>

        <h3>7.2 Backend</h3>
        <ul>
            <li>Motoko smart contract on Internet Computer</li>
            <li>Stable storage for data persistence</li>
            <li>Role-based access control</li>
        </ul>
    </div>

    <div class="section">
        <h2>8. Contact Information</h2>
        <p><strong>Developer:</strong> Gene Townsend</p>
        <p><strong>Email:</strong> genetownend@gmail.com</p>
        <p><strong>Copyright:</strong> © 2025 All rights reserved</p>
    </div>
</body>
</html>
        `;

        const newWindow = window.open('', '_blank');
        if (newWindow) {
            newWindow.document.write(pdfContent);
            newWindow.document.close();
        }

        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-card text-card-foreground border border-border shadow-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <img 
                            src="/assets/generated/pdf-icon-transparent.dim_32x32.png" 
                            alt="PDF" 
                            className="w-6 h-6"
                        />
                        Generate PDF Report
                    </DialogTitle>
                    <DialogDescription>
                        Generate a comprehensive specification document
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <p className="text-sm text-muted-foreground">
                        This will generate a detailed PDF specification document containing:
                    </p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                        <li>Application overview and features</li>
                        <li>Data fields and validation rules</li>
                        <li>Calculation formulas</li>
                        <li>User flows and workflows</li>
                        <li>Technical architecture</li>
                        <li>Contact information</li>
                    </ul>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleGeneratePDF}>
                        <FileDown className="mr-2 h-4 w-4" />
                        Generate PDF
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
