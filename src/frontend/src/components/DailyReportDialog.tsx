import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2, Wallet, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useGetPickupsForDate } from '../hooks/useQueries';
import { cn } from '@/lib/utils';
import type { DailyTotals } from '../backend';
import { PaymentMethod } from '../backend';
import { calculateOwedDriver } from '../utils/owedDriver';

interface DailyReportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function DailyReportDialog({ open, onOpenChange }: DailyReportDialogProps) {
    const [fromDate, setFromDate] = useState<Date>();
    const [toDate, setToDate] = useState<Date>();
    const [showReport, setShowReport] = useState(false);

    const fromDateTimestamp = fromDate ? BigInt(new Date(fromDate.setHours(0, 0, 0, 0)).getTime() * 1000000) : undefined;
    const toDateTimestamp = toDate ? BigInt(new Date(toDate.setHours(23, 59, 59, 999)).getTime() * 1000000) : undefined;

    // Fetch actual pickups directly - this is our source of truth
    const { data: actualPickups = [], isLoading } = useGetPickupsForDate(
        fromDateTimestamp || BigInt(0),
        toDateTimestamp || BigInt(0)
    );

    // Process pickups: deduplicate by pickup ID and group by date
    const processedReport = useMemo(() => {
        if (!showReport || actualPickups.length === 0) {
            return {
                dailyTotals: [],
                summary: {
                    totalMeter: 0,
                    totalCash: 0,
                    totalCredit: 0,
                    totalVoucher: 0,
                    totalTips: 0,
                    totalCashTips: 0,
                    totalCreditTips: 0,
                    totalVoucherTips: 0,
                    totalCalculated: 0,
                    totalOwedDriver: 0,
                },
            };
        }

        // First, deduplicate pickups by ID to ensure each pickup only appears once
        const uniquePickupsMap = new Map();
        actualPickups.forEach((pickup) => {
            const pickupId = pickup.id.toString();
            if (!uniquePickupsMap.has(pickupId)) {
                uniquePickupsMap.set(pickupId, pickup);
            }
        });
        const uniquePickups = Array.from(uniquePickupsMap.values());

        // Group pickups by date and calculate daily totals from unique pickup data
        const dailyTotalsMap = new Map<string, DailyTotals>();
        
        uniquePickups.forEach((pickup) => {
            const dateKey = pickup.pickupDate.toString();
            
            if (!dailyTotalsMap.has(dateKey)) {
                // Initialize daily totals for this date
                dailyTotalsMap.set(dateKey, {
                    date: pickup.pickupDate,
                    meterTotal: 0,
                    cashTotal: 0,
                    creditTotal: 0,
                    voucherTotal: 0,
                    tipTotal: 0,
                    cashTipTotal: 0,
                    creditTipTotal: 0,
                    voucherTipTotal: 0,
                    calculatedTotal: 0,
                    owedDriver: 0,
                });
            }
            
            const daily = dailyTotalsMap.get(dateKey)!;
            
            // Accumulate meter totals by payment method
            daily.meterTotal += pickup.meterTotal;
            if (pickup.meterPaymentMethod === PaymentMethod.cash) {
                daily.cashTotal += pickup.meterTotal;
            } else if (pickup.meterPaymentMethod === PaymentMethod.credit) {
                daily.creditTotal += pickup.meterTotal;
            } else if (pickup.meterPaymentMethod === PaymentMethod.voucher) {
                daily.voucherTotal += pickup.meterTotal;
            }
            
            // Accumulate tip totals by payment method
            daily.tipTotal += pickup.tip;
            if (pickup.tipPaymentMethod === PaymentMethod.cash) {
                daily.cashTipTotal += pickup.tip;
            } else if (pickup.tipPaymentMethod === PaymentMethod.credit) {
                daily.creditTipTotal += pickup.tip;
            } else if (pickup.tipPaymentMethod === PaymentMethod.voucher) {
                daily.voucherTipTotal += pickup.tip;
            }
            
            // Update calculated total
            daily.calculatedTotal = daily.meterTotal + daily.tipTotal;
            
            // Calculate owed driver using the shared utility function
            daily.owedDriver = calculateOwedDriver(
                daily.cashTotal,
                daily.creditTotal,
                daily.voucherTotal,
                daily.cashTipTotal,
                daily.creditTipTotal,
                daily.voucherTipTotal
            );
        });

        // Convert to array and sort chronologically (earliest date first)
        const uniqueDailyTotals = Array.from(dailyTotalsMap.values()).sort((a, b) => {
            const dateA = Number(a.date);
            const dateB = Number(b.date);
            return dateA - dateB;
        });

        // Recalculate summary totals from daily totals
        let totalMeter = 0;
        let totalCash = 0;
        let totalCredit = 0;
        let totalVoucher = 0;
        let totalTips = 0;
        let totalCashTips = 0;
        let totalCreditTips = 0;
        let totalVoucherTips = 0;
        let totalCalculated = 0;

        uniqueDailyTotals.forEach((daily) => {
            totalMeter += daily.meterTotal;
            totalCash += daily.cashTotal;
            totalCredit += daily.creditTotal;
            totalVoucher += daily.voucherTotal;
            totalTips += daily.tipTotal;
            totalCashTips += daily.cashTipTotal;
            totalCreditTips += daily.creditTipTotal;
            totalVoucherTips += daily.voucherTipTotal;
            totalCalculated += daily.calculatedTotal;
        });

        // Calculate total owed driver using the shared utility function
        const totalOwedDriver = calculateOwedDriver(
            totalCash,
            totalCredit,
            totalVoucher,
            totalCashTips,
            totalCreditTips,
            totalVoucherTips
        );

        return {
            dailyTotals: uniqueDailyTotals,
            summary: {
                totalMeter,
                totalCash,
                totalCredit,
                totalVoucher,
                totalTips,
                totalCashTips,
                totalCreditTips,
                totalVoucherTips,
                totalCalculated,
                totalOwedDriver,
            },
        };
    }, [actualPickups, showReport]);

    // Validate calculations against actual pickup records
    const validationResult = useMemo(() => {
        if (!processedReport || !showReport || actualPickups.length === 0) {
            return { isValid: true, errors: [] };
        }

        const errors: string[] = [];

        // Deduplicate pickups by ID for validation
        const uniquePickupsMap = new Map();
        actualPickups.forEach((pickup) => {
            const pickupId = pickup.id.toString();
            if (!uniquePickupsMap.has(pickupId)) {
                uniquePickupsMap.set(pickupId, pickup);
            }
        });
        const uniquePickups = Array.from(uniquePickupsMap.values());

        // Calculate totals from unique actual pickups
        let actualMeterCash = 0;
        let actualMeterCredit = 0;
        let actualMeterVoucher = 0;
        let actualTipCash = 0;
        let actualTipCredit = 0;
        let actualTipVoucher = 0;

        uniquePickups.forEach((pickup) => {
            // Meter totals by payment method
            if (pickup.meterPaymentMethod === PaymentMethod.cash) {
                actualMeterCash += pickup.meterTotal;
            } else if (pickup.meterPaymentMethod === PaymentMethod.credit) {
                actualMeterCredit += pickup.meterTotal;
            } else if (pickup.meterPaymentMethod === PaymentMethod.voucher) {
                actualMeterVoucher += pickup.meterTotal;
            }

            // Tip totals by payment method
            if (pickup.tipPaymentMethod === PaymentMethod.cash) {
                actualTipCash += pickup.tip;
            } else if (pickup.tipPaymentMethod === PaymentMethod.credit) {
                actualTipCredit += pickup.tip;
            } else if (pickup.tipPaymentMethod === PaymentMethod.voucher) {
                actualTipVoucher += pickup.tip;
            }
        });

        const actualTotalMeter = actualMeterCash + actualMeterCredit + actualMeterVoucher;
        const actualTotalTips = actualTipCash + actualTipCredit + actualTipVoucher;
        const actualTotalCalculated = actualTotalMeter + actualTotalTips;
        
        // Calculate actual owed driver using the shared utility function
        const actualOwedDriver = calculateOwedDriver(
            actualMeterCash,
            actualMeterCredit,
            actualMeterVoucher,
            actualTipCash,
            actualTipCredit,
            actualTipVoucher
        );

        // Compare with report summary (with tolerance for floating point precision)
        const tolerance = 0.01;

        if (Math.abs(processedReport.summary.totalCash - actualMeterCash) > tolerance) {
            errors.push(`Cash meter mismatch: Report shows ${processedReport.summary.totalCash.toFixed(2)}, actual is ${actualMeterCash.toFixed(2)}`);
        }
        if (Math.abs(processedReport.summary.totalCredit - actualMeterCredit) > tolerance) {
            errors.push(`Credit meter mismatch: Report shows ${processedReport.summary.totalCredit.toFixed(2)}, actual is ${actualMeterCredit.toFixed(2)}`);
        }
        if (Math.abs(processedReport.summary.totalVoucher - actualMeterVoucher) > tolerance) {
            errors.push(`Voucher meter mismatch: Report shows ${processedReport.summary.totalVoucher.toFixed(2)}, actual is ${actualMeterVoucher.toFixed(2)}`);
        }
        if (Math.abs(processedReport.summary.totalMeter - actualTotalMeter) > tolerance) {
            errors.push(`Total meter mismatch: Report shows ${processedReport.summary.totalMeter.toFixed(2)}, actual is ${actualTotalMeter.toFixed(2)}`);
        }
        if (Math.abs(processedReport.summary.totalCashTips - actualTipCash) > tolerance) {
            errors.push(`Cash tips mismatch: Report shows ${processedReport.summary.totalCashTips.toFixed(2)}, actual is ${actualTipCash.toFixed(2)}`);
        }
        if (Math.abs(processedReport.summary.totalCreditTips - actualTipCredit) > tolerance) {
            errors.push(`Credit tips mismatch: Report shows ${processedReport.summary.totalCreditTips.toFixed(2)}, actual is ${actualTipCredit.toFixed(2)}`);
        }
        if (Math.abs(processedReport.summary.totalVoucherTips - actualTipVoucher) > tolerance) {
            errors.push(`Voucher tips mismatch: Report shows ${processedReport.summary.totalVoucherTips.toFixed(2)}, actual is ${actualTipVoucher.toFixed(2)}`);
        }
        if (Math.abs(processedReport.summary.totalTips - actualTotalTips) > tolerance) {
            errors.push(`Total tips mismatch: Report shows ${processedReport.summary.totalTips.toFixed(2)}, actual is ${actualTotalTips.toFixed(2)}`);
        }
        if (Math.abs(processedReport.summary.totalCalculated - actualTotalCalculated) > tolerance) {
            errors.push(`Total calculated mismatch: Report shows ${processedReport.summary.totalCalculated.toFixed(2)}, actual is ${actualTotalCalculated.toFixed(2)}`);
        }
        if (Math.abs(processedReport.summary.totalOwedDriver - actualOwedDriver) > tolerance) {
            errors.push(`Owed driver mismatch: Report shows ${processedReport.summary.totalOwedDriver.toFixed(2)}, actual is ${actualOwedDriver.toFixed(2)}`);
        }

        // Deduplicate pickups by ID for count
        const uniquePickupCount = uniquePickups.length;

        return {
            isValid: errors.length === 0,
            errors,
            uniquePickupCount,
            actualValues: {
                meterCash: actualMeterCash,
                meterCredit: actualMeterCredit,
                meterVoucher: actualMeterVoucher,
                tipCash: actualTipCash,
                tipCredit: actualTipCredit,
                tipVoucher: actualTipVoucher,
                totalMeter: actualTotalMeter,
                totalTips: actualTotalTips,
                totalCalculated: actualTotalCalculated,
                owedDriver: actualOwedDriver,
            },
        };
    }, [processedReport, actualPickups, showReport]);

    const handleGenerateReport = () => {
        if (fromDate && toDate) {
            setShowReport(true);
        }
    };

    const handleDialogChange = (newOpen: boolean) => {
        if (!newOpen) {
            setShowReport(false);
            setFromDate(undefined);
            setToDate(undefined);
        }
        onOpenChange(newOpen);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    return (
        <Dialog open={open} onOpenChange={handleDialogChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Daily Report</DialogTitle>
                    <DialogDescription>
                        Select a date range to view your pickup totals and payment breakdowns
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <label className="text-sm font-medium mb-2 block">From Date</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            'w-full justify-start text-left font-normal',
                                            !fromDate && 'text-muted-foreground'
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {fromDate ? format(fromDate, 'PPP') : 'Pick a date'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={fromDate}
                                        onSelect={setFromDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="flex-1">
                            <label className="text-sm font-medium mb-2 block">To Date</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            'w-full justify-start text-left font-normal',
                                            !toDate && 'text-muted-foreground'
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {toDate ? format(toDate, 'PPP') : 'Pick a date'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={toDate}
                                        onSelect={setToDate}
                                        initialFocus
                                        disabled={(date) => fromDate ? date < fromDate : false}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <Button
                        onClick={handleGenerateReport}
                        disabled={!fromDate || !toDate || isLoading}
                        className="w-full"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating Report...
                            </>
                        ) : (
                            'Generate Report'
                        )}
                    </Button>

                    {showReport && !validationResult.isValid && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Calculation Validation Errors</AlertTitle>
                            <AlertDescription>
                                <ul className="list-disc list-inside space-y-1 mt-2">
                                    {validationResult.errors.map((error, index) => (
                                        <li key={index} className="text-sm">{error}</li>
                                    ))}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}

                    {showReport && processedReport && (
                        <div className="space-y-6 border-t pt-6">
                            {processedReport.dailyTotals.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>No pickups found for the selected date range</p>
                                </div>
                            ) : (
                                <>
                                    {/* Daily Breakdown */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold">Daily Breakdown</h3>
                                        {processedReport.dailyTotals.map((daily) => {
                                            const date = new Date(Number(daily.date) / 1000000);
                                            return (
                                                <div key={daily.date.toString()} className="border rounded-lg p-4 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-semibold">{format(date, 'EEEE, MMMM d, yyyy')}</h4>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                                                        <div>
                                                            <p className="text-muted-foreground text-xs">Meter Total</p>
                                                            <p className="font-semibold">{formatCurrency(daily.meterTotal)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground text-xs">Tips Total</p>
                                                            <p className="font-semibold">{formatCurrency(daily.tipTotal)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground text-xs">Grand Total</p>
                                                            <p className="font-semibold text-primary">{formatCurrency(daily.calculatedTotal)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground text-xs">Owed Driver</p>
                                                            <p className={`font-semibold ${daily.owedDriver >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                                                                {formatCurrency(daily.owedDriver)}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-3 pt-2 border-t text-sm">
                                                        <div>
                                                            <p className="text-muted-foreground text-xs mb-1">Cash</p>
                                                            <p className="text-xs">Meter: {formatCurrency(daily.cashTotal)}</p>
                                                            <p className="text-xs">Tips: {formatCurrency(daily.cashTipTotal)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground text-xs mb-1">Credit</p>
                                                            <p className="text-xs">Meter: {formatCurrency(daily.creditTotal)}</p>
                                                            <p className="text-xs">Tips: {formatCurrency(daily.creditTipTotal)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground text-xs mb-1">Voucher</p>
                                                            <p className="text-xs">Meter: {formatCurrency(daily.voucherTotal)}</p>
                                                            <p className="text-xs">Tips: {formatCurrency(daily.voucherTipTotal)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Summary Section */}
                                    <div className="border-t pt-6 space-y-4">
                                        <h3 className="text-lg font-semibold">Summary</h3>
                                        
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                            <div className="space-y-1">
                                                <p className="text-sm text-muted-foreground">Total Meter</p>
                                                <p className="text-xl font-bold">{formatCurrency(processedReport.summary.totalMeter)}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm text-muted-foreground">Total Tips</p>
                                                <p className="text-xl font-bold">{formatCurrency(processedReport.summary.totalTips)}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm text-muted-foreground">Grand Total</p>
                                                <p className="text-xl font-bold text-primary">{formatCurrency(processedReport.summary.totalCalculated)}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm text-muted-foreground">Total Owed Driver</p>
                                                <p className={`text-xl font-bold ${processedReport.summary.totalOwedDriver >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                                                    {formatCurrency(processedReport.summary.totalOwedDriver)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                                            <div className="space-y-2">
                                                <h4 className="font-semibold text-sm">Cash</h4>
                                                <div className="text-sm space-y-1">
                                                    <p>Meter: {formatCurrency(processedReport.summary.totalCash)}</p>
                                                    <p>Tips: {formatCurrency(processedReport.summary.totalCashTips)}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="font-semibold text-sm">Credit</h4>
                                                <div className="text-sm space-y-1">
                                                    <p>Meter: {formatCurrency(processedReport.summary.totalCredit)}</p>
                                                    <p>Tips: {formatCurrency(processedReport.summary.totalCreditTips)}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="font-semibold text-sm">Voucher</h4>
                                                <div className="text-sm space-y-1">
                                                    <p>Meter: {formatCurrency(processedReport.summary.totalVoucher)}</p>
                                                    <p>Tips: {formatCurrency(processedReport.summary.totalVoucherTips)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Owed Driver Highlight */}
                                        <div className="p-4 rounded-lg bg-accent/50 border-2 border-accent mt-4">
                                            <div className="flex items-center gap-3">
                                                <Wallet className="h-6 w-6 text-primary" />
                                                <div className="flex-1">
                                                    <p className="text-sm text-muted-foreground font-medium mb-1">Total Owed Driver</p>
                                                    <p className={`text-3xl font-bold ${processedReport.summary.totalOwedDriver >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                                                        {processedReport.summary.totalOwedDriver >= 0 ? '+' : ''}{processedReport.summary.totalOwedDriver.toFixed(2)} USD
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
