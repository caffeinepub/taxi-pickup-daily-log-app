import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CalendarIcon, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useGetDailyReport } from '../hooks/useQueries';
import { safeCurrency } from '../utils/numberFormat';
import { getErrorMessage } from '../utils/errorMessage';
import type { DailyTotals, ReportSummary } from '../backend';

interface DailyReportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function DailyReportDialog({ open, onOpenChange }: DailyReportDialogProps) {
    const [fromDate, setFromDate] = useState<Date>(new Date());
    const [toDate, setToDate] = useState<Date>(new Date());

    const fromDateCopy = new Date(fromDate);
    fromDateCopy.setHours(0, 0, 0, 0);
    const toDateCopy = new Date(toDate);
    toDateCopy.setHours(23, 59, 59, 999);

    const { data: report, isLoading, isError, error } = useGetDailyReport(
        BigInt(fromDateCopy.getTime()) * BigInt(1000000),
        BigInt(toDateCopy.getTime()) * BigInt(1000000)
    );

    // Filter to only days with data (non-zero totals) and sort chronologically
    const daysWithData = report?.dailyTotals
        ? report.dailyTotals
              .filter((daily) => daily.calculatedTotal > 0)
              .sort((a, b) => Number(a.date - b.date))
        : [];

    // Compute period summary from displayed days only
    const periodSummary: ReportSummary | null = daysWithData.length > 0
        ? daysWithData.reduce(
              (acc, daily) => ({
                  totalMeter: acc.totalMeter + daily.meterTotal,
                  totalCash: acc.totalCash + daily.cashTotal,
                  totalCredit: acc.totalCredit + daily.creditTotal,
                  totalVoucher: acc.totalVoucher + daily.voucherTotal,
                  totalTips: acc.totalTips + daily.tipTotal,
                  totalCashTips: acc.totalCashTips + daily.cashTipTotal,
                  totalCreditTips: acc.totalCreditTips + daily.creditTipTotal,
                  totalVoucherTips: acc.totalVoucherTips + daily.voucherTipTotal,
                  totalCalculated: acc.totalCalculated + daily.calculatedTotal,
                  totalOwedDriver: acc.totalOwedDriver + daily.owedDriver,
              }),
              {
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
              }
          )
        : null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col bg-card text-card-foreground border border-border shadow-lg">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <img 
                            src="/assets/generated/calendar-icon.dim_32x32.png" 
                            alt="Calendar" 
                            className="w-6 h-6"
                        />
                        Daily Report
                    </DialogTitle>
                    <DialogDescription>
                        View your daily totals and summary for a date range
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-shrink-0 grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                    <div className="space-y-2">
                        <Label>From Date</Label>
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
                                    {fromDate ? format(fromDate, 'PPP') : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 radix-in-dialog-overlay bg-popover text-popover-foreground border border-border shadow-lg" align="start">
                                <Calendar
                                    mode="single"
                                    selected={fromDate}
                                    onSelect={(date) => date && setFromDate(date)}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <Label>To Date</Label>
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
                                    {toDate ? format(toDate, 'PPP') : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 radix-in-dialog-overlay bg-popover text-popover-foreground border border-border shadow-lg" align="start">
                                <Calendar
                                    mode="single"
                                    selected={toDate}
                                    onSelect={(date) => date && setToDate(date)}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : isError ? (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Failed to load report: {getErrorMessage(error)}
                        </AlertDescription>
                    </Alert>
                ) : (
                    <div className="flex-1 min-h-0 overflow-y-auto daily-report-scroll">
                        <div className="space-y-6 pr-4 pb-4">
                            {daysWithData.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                    No pickups found for the selected date range
                                </p>
                            ) : (
                                <>
                                    <div className="space-y-4">
                                        {daysWithData.map((daily) => {
                                            const date = new Date(Number(daily.date) / 1000000);
                                            const formattedDate = date.toLocaleDateString('en-US', {
                                                weekday: 'short',
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                            });

                                            return (
                                                <div key={daily.date.toString()} className="border rounded-lg p-4 space-y-3">
                                                    <h3 className="font-semibold text-lg">{formattedDate}</h3>
                                                    <Separator />

                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <p className="text-muted-foreground">Cash Meter</p>
                                                            <p className="font-medium">{safeCurrency(daily.cashTotal)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">Credit Meter</p>
                                                            <p className="font-medium">{safeCurrency(daily.creditTotal)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">Voucher Meter</p>
                                                            <p className="font-medium">{safeCurrency(daily.voucherTotal)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">Total Meter</p>
                                                            <p className="font-medium">{safeCurrency(daily.meterTotal)}</p>
                                                        </div>
                                                    </div>

                                                    <Separator />

                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <p className="text-muted-foreground">Cash Tips</p>
                                                            <p className="font-medium">{safeCurrency(daily.cashTipTotal)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">Credit Tips</p>
                                                            <p className="font-medium">{safeCurrency(daily.creditTipTotal)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">Voucher Tips</p>
                                                            <p className="font-medium">{safeCurrency(daily.voucherTipTotal)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">Total Tips</p>
                                                            <p className="font-medium">{safeCurrency(daily.tipTotal)}</p>
                                                        </div>
                                                    </div>

                                                    <Separator />

                                                    <div className="flex justify-between items-center">
                                                        <span className="font-semibold">Daily Total</span>
                                                        <span className="text-lg font-bold text-primary">
                                                            {safeCurrency(daily.calculatedTotal)}
                                                        </span>
                                                    </div>

                                                    <div className="flex justify-between items-center">
                                                        <span className="font-semibold">Owed Driver</span>
                                                        <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                                            {safeCurrency(daily.owedDriver)}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {periodSummary && (
                                        <>
                                            <Separator className="my-6" />

                                            <div className="border-2 border-primary rounded-lg p-6 space-y-4 bg-primary/5">
                                                <h3 className="font-bold text-xl">Summary</h3>
                                                <Separator />

                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <p className="text-muted-foreground">Total Cash Meter</p>
                                                        <p className="font-medium">{safeCurrency(periodSummary.totalCash)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground">Total Credit Meter</p>
                                                        <p className="font-medium">{safeCurrency(periodSummary.totalCredit)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground">Total Voucher Meter</p>
                                                        <p className="font-medium">{safeCurrency(periodSummary.totalVoucher)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground">Total Meter</p>
                                                        <p className="font-medium">{safeCurrency(periodSummary.totalMeter)}</p>
                                                    </div>
                                                </div>

                                                <Separator />

                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <p className="text-muted-foreground">Total Cash Tips</p>
                                                        <p className="font-medium">{safeCurrency(periodSummary.totalCashTips)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground">Total Credit Tips</p>
                                                        <p className="font-medium">{safeCurrency(periodSummary.totalCreditTips)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground">Total Voucher Tips</p>
                                                        <p className="font-medium">{safeCurrency(periodSummary.totalVoucherTips)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground">Total Tips</p>
                                                        <p className="font-medium">{safeCurrency(periodSummary.totalTips)}</p>
                                                    </div>
                                                </div>

                                                <Separator />

                                                <div className="flex justify-between items-center text-xl font-bold">
                                                    <span>Grand Total</span>
                                                    <span className="text-primary">{safeCurrency(periodSummary.totalCalculated)}</span>
                                                </div>

                                                <div className="flex justify-between items-center text-xl font-bold">
                                                    <span>Total Owed Driver</span>
                                                    <span className="text-green-600 dark:text-green-400">
                                                        {safeCurrency(periodSummary.totalOwedDriver)}
                                                    </span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
