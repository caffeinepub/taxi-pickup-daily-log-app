import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Navigation, User, Clock, Loader2, Phone, DollarSign, Calendar as CalendarIcon, CreditCard, Wallet } from 'lucide-react';
import { useGetPickupsForDate } from '../hooks/useQueries';
import { format } from 'date-fns';
import { PaymentMethod, Pickup } from '../backend';
import { useMemo } from 'react';
import { calculateOwedDriver } from '../utils/owedDriver';

interface PickupListProps {
    fromDate: bigint;
    toDate: bigint;
}

export default function PickupList({ fromDate, toDate }: PickupListProps) {
    const { data: pickups = [], isLoading } = useGetPickupsForDate(fromDate, toDate);

    // Deduplicate and sort pickups in strict chronological order
    const processedPickups = useMemo(() => {
        // Create a unique key for each pickup to identify duplicates
        const pickupMap = new Map<string, Pickup>();
        
        pickups.forEach((pickup) => {
            // Create a unique key based on all pickup properties
            const key = `${pickup.pickupTime}-${pickup.customerName}-${pickup.streetAddress}-${pickup.city}-${pickup.destinationAddress}-${pickup.meterTotal}-${pickup.tip}`;
            
            // Only add if not already present (keeps first occurrence)
            if (!pickupMap.has(key)) {
                pickupMap.set(key, pickup);
            }
        });

        // Convert to array and sort in strict chronological order (ascending by time)
        return Array.from(pickupMap.values()).sort((a, b) => {
            const timeA = Number(a.pickupTime);
            const timeB = Number(b.pickupTime);
            return timeA - timeB;
        });
    }, [pickups]);

    if (isLoading) {
        return (
            <Card>
                <CardContent className="py-12">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin mb-2" />
                        <p>Loading pickups...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (processedPickups.length === 0) {
        return (
            <Card>
                <CardContent className="py-12">
                    <div className="text-center text-muted-foreground">
                        <p className="text-lg font-medium mb-1">No pickups recorded yet</p>
                        <p className="text-sm">Start by recording your first pickup above</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Helper function to format payment method
    const formatPaymentMethod = (method: PaymentMethod): string => {
        switch (method) {
            case PaymentMethod.cash:
                return 'Cash';
            case PaymentMethod.credit:
                return 'Credit';
            case PaymentMethod.voucher:
                return 'Voucher';
            default:
                return 'Cash';
        }
    };

    // Calculate running totals by payment method using deduplicated pickups
    const meterTotalsByCash = processedPickups.filter(p => p.meterPaymentMethod === PaymentMethod.cash).reduce((sum, p) => sum + p.meterTotal, 0);
    const meterTotalsByCredit = processedPickups.filter(p => p.meterPaymentMethod === PaymentMethod.credit).reduce((sum, p) => sum + p.meterTotal, 0);
    const meterTotalsByVoucher = processedPickups.filter(p => p.meterPaymentMethod === PaymentMethod.voucher).reduce((sum, p) => sum + p.meterTotal, 0);
    
    const tipTotalsByCash = processedPickups.filter(p => p.tipPaymentMethod === PaymentMethod.cash).reduce((sum, p) => sum + p.tip, 0);
    const tipTotalsByCredit = processedPickups.filter(p => p.tipPaymentMethod === PaymentMethod.credit).reduce((sum, p) => sum + p.tip, 0);
    const tipTotalsByVoucher = processedPickups.filter(p => p.tipPaymentMethod === PaymentMethod.voucher).reduce((sum, p) => sum + p.tip, 0);

    const totalMeter = meterTotalsByCash + meterTotalsByCredit + meterTotalsByVoucher;
    const totalTip = tipTotalsByCash + tipTotalsByCredit + tipTotalsByVoucher;
    const totalCalculated = totalMeter + totalTip;

    const calculatedTotalsByCash = meterTotalsByCash + tipTotalsByCash;
    const calculatedTotalsByCredit = meterTotalsByCredit + tipTotalsByCredit;
    const calculatedTotalsByVoucher = meterTotalsByVoucher + tipTotalsByVoucher;

    // Calculate Owed Driver using the shared utility function
    const owedDriver = calculateOwedDriver(
        meterTotalsByCash,
        meterTotalsByCredit,
        meterTotalsByVoucher,
        tipTotalsByCash,
        tipTotalsByCredit,
        tipTotalsByVoucher
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-sm">
                    {processedPickups.length} {processedPickups.length === 1 ? 'pickup' : 'pickups'} recorded
                </Badge>
            </div>

            <div className="space-y-3">
                {processedPickups.map((pickup) => {
                    const pickupDate = new Date(Number(pickup.pickupDate) / 1000000);
                    const pickupTime = new Date(Number(pickup.pickupTime) / 1000000);
                    // Create a unique key for React rendering
                    const uniqueKey = `${pickup.pickupTime}-${pickup.customerName}-${pickup.streetAddress}-${pickup.city}-${pickup.destinationAddress}`;
                    
                    return (
                        <Card key={uniqueKey} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0 space-y-1">
                                            {pickup.customerName && (
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-primary shrink-0" />
                                                    <span className="font-semibold truncate">
                                                        {pickup.customerName}
                                                    </span>
                                                </div>
                                            )}
                                            {pickup.phoneNumber && (
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Phone className="h-3.5 w-3.5 shrink-0" />
                                                    <span>{pickup.phoneNumber}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-1 text-sm text-muted-foreground shrink-0">
                                            <div className="flex items-center gap-2">
                                                <CalendarIcon className="h-3.5 w-3.5" />
                                                <span>{format(pickupDate, 'MMM d, yyyy')}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-3.5 w-3.5" />
                                                <span>{format(pickupTime, 'h:mm a')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="space-y-2">
                                        <div className="flex items-start gap-2">
                                            <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-muted-foreground mb-0.5">
                                                    Pickup
                                                </p>
                                                <p className="text-sm break-words">
                                                    {pickup.streetAddress}
                                                    {pickup.city && `, ${pickup.city}`}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-2">
                                            <Navigation className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-muted-foreground mb-0.5">
                                                    Destination
                                                </p>
                                                <p className="text-sm break-words">
                                                    {pickup.destinationAddress}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="h-4 w-4 text-primary shrink-0" />
                                            <div className="flex-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                                                <div>
                                                    <span className="text-muted-foreground">Meter: </span>
                                                    <span className="font-medium">${pickup.meterTotal.toFixed(2)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Tip: </span>
                                                    <span className="font-medium">${pickup.tip.toFixed(2)}</span>
                                                </div>
                                                <div className="sm:ml-auto">
                                                    <span className="text-muted-foreground">Total: </span>
                                                    <span className="font-semibold text-primary">${pickup.calculatedTotal.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="h-4 w-4 text-primary shrink-0" />
                                            <div className="flex-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                                                <div>
                                                    <span className="text-muted-foreground">Meter: </span>
                                                    <span className="font-medium">{formatPaymentMethod(pickup.meterPaymentMethod)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Tip: </span>
                                                    <span className="font-medium">{formatPaymentMethod(pickup.tipPaymentMethod)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Running Totals Section */}
            <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6">
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="h-5 w-5 text-primary" />
                            <h3 className="text-lg font-bold">Daily Totals</h3>
                        </div>
                        <Separator className="bg-primary/20" />
                        
                        {/* Grand Totals */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground font-medium">Total Meter</p>
                                <p className="text-2xl font-bold text-foreground">${totalMeter.toFixed(2)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground font-medium">Total Tips</p>
                                <p className="text-2xl font-bold text-foreground">${totalTip.toFixed(2)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground font-medium">Grand Total</p>
                                <p className="text-2xl font-bold text-primary">${totalCalculated.toFixed(2)}</p>
                            </div>
                        </div>

                        <Separator className="bg-primary/20" />

                        {/* Owed Driver */}
                        <div className="p-4 rounded-lg bg-accent/50 border-2 border-accent">
                            <div className="flex items-center gap-3">
                                <Wallet className="h-6 w-6 text-primary" />
                                <div className="flex-1">
                                    <p className="text-sm text-muted-foreground font-medium mb-1">Owed Driver</p>
                                    <p className={`text-3xl font-bold ${owedDriver >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                                        {owedDriver >= 0 ? '+' : ''}{owedDriver.toFixed(2)} USD
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Separator className="bg-primary/20" />

                        {/* Breakdown by Payment Method */}
                        <div className="space-y-4">
                            <h4 className="text-base font-semibold text-foreground">Breakdown by Payment Method</h4>
                            
                            {/* Cash */}
                            <div className="space-y-2 p-4 rounded-lg bg-background/50 border border-border/50">
                                <div className="flex items-center gap-2 mb-2">
                                    <CreditCard className="h-4 w-4 text-primary" />
                                    <h5 className="font-semibold text-foreground">Cash</h5>
                                </div>
                                <div className="grid grid-cols-3 gap-3 text-sm">
                                    <div>
                                        <p className="text-muted-foreground text-xs mb-1">Meter</p>
                                        <p className="font-semibold">${meterTotalsByCash.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs mb-1">Tips</p>
                                        <p className="font-semibold">${tipTotalsByCash.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs mb-1">Total</p>
                                        <p className="font-semibold text-primary">${calculatedTotalsByCash.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Credit */}
                            <div className="space-y-2 p-4 rounded-lg bg-background/50 border border-border/50">
                                <div className="flex items-center gap-2 mb-2">
                                    <CreditCard className="h-4 w-4 text-primary" />
                                    <h5 className="font-semibold text-foreground">Credit</h5>
                                </div>
                                <div className="grid grid-cols-3 gap-3 text-sm">
                                    <div>
                                        <p className="text-muted-foreground text-xs mb-1">Meter</p>
                                        <p className="font-semibold">${meterTotalsByCredit.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs mb-1">Tips</p>
                                        <p className="font-semibold">${tipTotalsByCredit.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs mb-1">Total</p>
                                        <p className="font-semibold text-primary">${calculatedTotalsByCredit.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Voucher */}
                            <div className="space-y-2 p-4 rounded-lg bg-background/50 border border-border/50">
                                <div className="flex items-center gap-2 mb-2">
                                    <CreditCard className="h-4 w-4 text-primary" />
                                    <h5 className="font-semibold text-foreground">Voucher</h5>
                                </div>
                                <div className="grid grid-cols-3 gap-3 text-sm">
                                    <div>
                                        <p className="text-muted-foreground text-xs mb-1">Meter</p>
                                        <p className="font-semibold">${meterTotalsByVoucher.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs mb-1">Tips</p>
                                        <p className="font-semibold">${tipTotalsByVoucher.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs mb-1">Total</p>
                                        <p className="font-semibold text-primary">${calculatedTotalsByVoucher.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
