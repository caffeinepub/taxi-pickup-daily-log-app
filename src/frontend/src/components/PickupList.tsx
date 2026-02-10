import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { useGetPickupsForDate } from '../hooks/useQueries';
import type { Pickup } from '../backend';
import { calculateOwedDriver } from '../utils/owedDriver';
import { nanosToDate, nanosToTimeString } from '../utils/pickupGuards';
import { safeCurrency, safeFixed } from '../utils/numberFormat';

interface PickupListProps {
    selectedDate: Date;
}

export default function PickupList({ selectedDate }: PickupListProps) {
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: pickups = [], isLoading } = useGetPickupsForDate(
        BigInt(startOfDay.getTime()) * BigInt(1000000),
        BigInt(endOfDay.getTime()) * BigInt(1000000)
    );

    const sortedPickups = useMemo(() => {
        return [...pickups].sort((a, b) => {
            const timeA = Number(a.pickupTime);
            const timeB = Number(b.pickupTime);
            return timeA - timeB;
        });
    }, [pickups]);

    const totals = useMemo(() => {
        let meterTotal = 0;
        let cashMeter = 0;
        let creditMeter = 0;
        let voucherMeter = 0;
        let tipTotal = 0;
        let cashTips = 0;
        let creditTips = 0;
        let voucherTips = 0;
        let calculatedTotal = 0;

        sortedPickups.forEach((pickup) => {
            meterTotal += pickup.meterTotal || 0;
            tipTotal += pickup.tip || 0;
            calculatedTotal += pickup.calculatedTotal || 0;

            switch (pickup.meterPaymentMethod) {
                case 'cash':
                    cashMeter += pickup.meterTotal || 0;
                    break;
                case 'credit':
                    creditMeter += pickup.meterTotal || 0;
                    break;
                case 'voucher':
                    voucherMeter += pickup.meterTotal || 0;
                    break;
            }

            switch (pickup.tipPaymentMethod) {
                case 'cash':
                    cashTips += pickup.tip || 0;
                    break;
                case 'credit':
                    creditTips += pickup.tip || 0;
                    break;
                case 'voucher':
                    voucherTips += pickup.tip || 0;
                    break;
            }
        });

        const owed = calculateOwedDriver(cashMeter, creditMeter, voucherMeter, cashTips, creditTips, voucherTips);

        return {
            meterTotal,
            cashMeter,
            creditMeter,
            voucherMeter,
            tipTotal,
            cashTips,
            creditTips,
            voucherTips,
            calculatedTotal,
            owedDriver: owed,
        };
    }, [sortedPickups]);

    const formatTime = (timestamp: bigint): string => {
        return nanosToTimeString(timestamp);
    };

    const formatDate = (timestamp: bigint): string => {
        const date = nanosToDate(timestamp);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (sortedPickups.length === 0) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                        No pickups recorded for {formatDate(BigInt(selectedDate.getTime()) * BigInt(1000000))}
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Pickup Records */}
            <Card>
                <CardHeader>
                    <CardTitle>Pickup Records - {formatDate(BigInt(selectedDate.getTime()) * BigInt(1000000))}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {sortedPickups.map((pickup) => (
                            <div key={pickup.id.toString()} className="border rounded-lg p-4 space-y-2">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <p className="font-semibold text-lg">
                                            {pickup.streetAddress}
                                        </p>
                                        {pickup.city && (
                                            <p className="text-sm text-muted-foreground">
                                                {pickup.city}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-muted-foreground">
                                            {formatTime(pickup.pickupTime)}
                                        </p>
                                    </div>
                                </div>

                                <Separator />

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Customer</p>
                                        <p className="font-medium">{pickup.customerName || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Phone</p>
                                        <p className="font-medium">{pickup.phoneNumber || 'N/A'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-muted-foreground">Destination</p>
                                        <p className="font-medium">{pickup.destinationAddress}</p>
                                    </div>
                                </div>

                                <Separator />

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Meter ({pickup.meterPaymentMethod})</p>
                                        <p className="font-medium">{safeCurrency(pickup.meterTotal)}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Tip ({pickup.tipPaymentMethod})</p>
                                        <p className="font-medium">{safeCurrency(pickup.tip)}</p>
                                    </div>
                                </div>

                                <div className="pt-2 border-t">
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold">Total</span>
                                        <span className="text-xl font-bold text-primary">
                                            {safeCurrency(pickup.calculatedTotal)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Daily Totals */}
            <Card>
                <CardHeader>
                    <CardTitle>Daily Totals</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Meter Breakdown */}
                        <div>
                            <h3 className="font-semibold mb-2">Meter Breakdown</h3>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Cash:</span>
                                    <span className="font-medium">{safeCurrency(totals.cashMeter)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Credit:</span>
                                    <span className="font-medium">{safeCurrency(totals.creditMeter)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Voucher:</span>
                                    <span className="font-medium">{safeCurrency(totals.voucherMeter)}</span>
                                </div>
                                <div className="flex justify-between font-semibold">
                                    <span>Total Meter:</span>
                                    <span>{safeCurrency(totals.meterTotal)}</span>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Tips Breakdown */}
                        <div>
                            <h3 className="font-semibold mb-2">Tips Breakdown</h3>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Cash:</span>
                                    <span className="font-medium">{safeCurrency(totals.cashTips)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Credit:</span>
                                    <span className="font-medium">{safeCurrency(totals.creditTips)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Voucher:</span>
                                    <span className="font-medium">{safeCurrency(totals.voucherTips)}</span>
                                </div>
                                <div className="flex justify-between font-semibold">
                                    <span>Total Tips:</span>
                                    <span>{safeCurrency(totals.tipTotal)}</span>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Grand Total */}
                        <div className="flex justify-between items-center text-lg font-bold">
                            <span>Grand Total:</span>
                            <span className="text-primary">{safeCurrency(totals.calculatedTotal)}</span>
                        </div>

                        <Separator />

                        {/* Owed Driver */}
                        <div className="flex justify-between items-center text-lg font-bold">
                            <span>Owed Driver:</span>
                            <span className="text-green-600 dark:text-green-400">
                                {safeCurrency(totals.owedDriver)}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
