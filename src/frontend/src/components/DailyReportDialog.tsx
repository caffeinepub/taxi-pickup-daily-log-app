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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Loader2, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useGetDailyReport } from '../hooks/useQueries';
import { safeCurrency } from '../utils/numberFormat';
import { calculateOwedDriver } from '../utils/owedDriver';

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

    const { data: report, isLoading } = useGetDailyReport(
        BigInt(fromDateCopy.getTime()) * BigInt(1000000),
        BigInt(toDateCopy.getTime()) * BigInt(1000000)
    );

    // Deduplicate daily totals by date
    const uniqueDailyTotals = report?.dailyTotals
        ? Array.from(
              new Map(
                  report.dailyTotals.map((daily) => [daily.date.toString(), daily])
              ).values()
          ).sort((a, b) => Number(a.date - b.date))
        : [];

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
                ) : (
                    <ScrollArea className="flex-1 min-h-0">
                        <div className="space-y-6 pr-4">
                            {uniqueDailyTotals.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                    No pickups found for the selected date range
                                </p>
                            ) : (
                                <>
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-lg">Daily Breakdown</h3>
                                        {uniqueDailyTotals.map((daily) => {
                                            const date = new Date(Number(daily.date) / 1000000);
                                            const owedDriver = calculateOwedDriver(
                                                daily.cashTotal,
                                                daily.creditTotal,
                                                daily.voucherTotal,
                                                daily.cashTipTotal,
                                                daily.creditTipTotal,
                                                daily.voucherTipTotal
                                            );

                                            return (
                                                <div key={daily.date.toString()} className="border rounded-lg p-4 space-y-2">
                                                    <h4 className="font-medium">{format(date, 'PPPP')}</h4>
                                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                                        <div>
                                                            <span className="text-muted-foreground">Meter Total:</span>
                                                            <span className="ml-2 font-medium">{safeCurrency(daily.meterTotal)}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground">Tips:</span>
                                                            <span className="ml-2 font-medium">{safeCurrency(daily.tipTotal)}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground">Cash:</span>
                                                            <span className="ml-2 font-medium">{safeCurrency(daily.cashTotal)}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground">Credit:</span>
                                                            <span className="ml-2 font-medium">{safeCurrency(daily.creditTotal)}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground">Voucher:</span>
                                                            <span className="ml-2 font-medium">{safeCurrency(daily.voucherTotal)}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground">Total:</span>
                                                            <span className="ml-2 font-medium">{safeCurrency(daily.calculatedTotal)}</span>
                                                        </div>
                                                        <div className="col-span-2 pt-2 border-t">
                                                            <span className="text-muted-foreground">Owed to Driver:</span>
                                                            <span className="ml-2 font-semibold text-primary">{safeCurrency(owedDriver)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <Separator />

                                    {report?.summary && (
                                        <div className="space-y-4">
                                            <h3 className="font-semibold text-lg">Summary</h3>
                                            <div className="border rounded-lg p-4 space-y-2 bg-muted/50">
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div>
                                                        <span className="text-muted-foreground">Total Meter:</span>
                                                        <span className="ml-2 font-medium">{safeCurrency(report.summary.totalMeter)}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Total Tips:</span>
                                                        <span className="ml-2 font-medium">{safeCurrency(report.summary.totalTips)}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Total Cash:</span>
                                                        <span className="ml-2 font-medium">{safeCurrency(report.summary.totalCash)}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Total Credit:</span>
                                                        <span className="ml-2 font-medium">{safeCurrency(report.summary.totalCredit)}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Total Voucher:</span>
                                                        <span className="ml-2 font-medium">{safeCurrency(report.summary.totalVoucher)}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Grand Total:</span>
                                                        <span className="ml-2 font-medium">{safeCurrency(report.summary.totalCalculated)}</span>
                                                    </div>
                                                    <div className="col-span-2 pt-2 border-t">
                                                        <span className="text-muted-foreground">Total Owed to Driver:</span>
                                                        <span className="ml-2 font-bold text-primary text-lg">{safeCurrency(report.summary.totalOwedDriver)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </ScrollArea>
                )}
            </DialogContent>
        </Dialog>
    );
}
