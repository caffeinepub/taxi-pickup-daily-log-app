import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { useGetPickupsForDate } from '../hooks/useQueries';
import type { Pickup } from '../backend';
import { computeDailyTotals } from '../utils/totals';
import { nanosToTimeString } from '../utils/pickupGuards';
import { safeCurrency } from '../utils/numberFormat';
import { getErrorMessage } from '../utils/errorMessage';

interface PickupListProps {
    selectedDate: Date;
}

export default function PickupList({ selectedDate }: PickupListProps) {
    const { data: pickups = [], isLoading, isError, error } = useGetPickupsForDate(selectedDate);

    const sortedPickups = useMemo(() => {
        return [...pickups].sort((a, b) => {
            const timeA = Number(a.pickupTime);
            const timeB = Number(b.pickupTime);
            return timeA - timeB;
        });
    }, [pickups]);

    const totals = useMemo(() => {
        return computeDailyTotals(sortedPickups);
    }, [sortedPickups]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (isError) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    Failed to load pickups: {getErrorMessage(error)}
                </AlertDescription>
            </Alert>
        );
    }

    if (sortedPickups.length === 0) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                        No pickups recorded for this date
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                {sortedPickups.map((pickup) => (
                    <Card key={pickup.id}>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <img 
                                        src="/assets/generated/time-icon.dim_32x32.png" 
                                        alt="Time" 
                                        className="w-5 h-5"
                                    />
                                    {nanosToTimeString(pickup.pickupTime)}
                                </span>
                                <span className="text-primary font-bold">
                                    {safeCurrency(pickup.calculatedTotal)}
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Customer</p>
                                    <p className="font-medium">{pickup.customerName || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Phone</p>
                                    <p className="font-medium">{pickup.phoneNumber || 'N/A'}</p>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-2 text-sm">
                                <div className="flex items-start gap-2">
                                    <img 
                                        src="/assets/generated/pickup-location-icon.dim_32x32.png" 
                                        alt="Pickup" 
                                        className="w-4 h-4 mt-0.5"
                                    />
                                    <div>
                                        <p className="text-muted-foreground">Pickup</p>
                                        <p className="font-medium">{pickup.streetAddress}, {pickup.city}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <img 
                                        src="/assets/generated/destination-icon.dim_32x32.png" 
                                        alt="Destination" 
                                        className="w-4 h-4 mt-0.5"
                                    />
                                    <div>
                                        <p className="text-muted-foreground">Destination</p>
                                        <p className="font-medium">{pickup.destinationAddress}</p>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Meter Total</p>
                                    <p className="font-medium">
                                        {safeCurrency(pickup.meterTotal)} ({pickup.meterPaymentMethod})
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Tip</p>
                                    <p className="font-medium">
                                        {safeCurrency(pickup.tip)} ({pickup.tipPaymentMethod})
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="border-2 border-primary">
                <CardHeader>
                    <CardTitle>Daily Totals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-muted-foreground">Cash Meter</p>
                            <p className="font-medium">{safeCurrency(totals.cashMeter)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Credit Meter</p>
                            <p className="font-medium">{safeCurrency(totals.creditMeter)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Voucher Meter</p>
                            <p className="font-medium">{safeCurrency(totals.voucherMeter)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Total Meter</p>
                            <p className="font-medium">{safeCurrency(totals.totalMeter)}</p>
                        </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-muted-foreground">Cash Tips</p>
                            <p className="font-medium">{safeCurrency(totals.cashTips)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Credit Tips</p>
                            <p className="font-medium">{safeCurrency(totals.creditTips)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Voucher Tips</p>
                            <p className="font-medium">{safeCurrency(totals.voucherTips)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Total Tips</p>
                            <p className="font-medium">{safeCurrency(totals.totalTips)}</p>
                        </div>
                    </div>

                    <Separator />

                    <div className="flex justify-between items-center text-lg font-bold">
                        <span>Grand Total</span>
                        <span className="text-primary">{safeCurrency(totals.grandTotal)}</span>
                    </div>

                    <div className="flex justify-between items-center text-lg font-bold">
                        <span>Owed Driver</span>
                        <span className="text-green-600 dark:text-green-400">
                            {safeCurrency(totals.owedDriver)}
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
