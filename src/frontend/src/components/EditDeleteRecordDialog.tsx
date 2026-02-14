import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CalendarIcon, AlertCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useGetPickupsInRange, useUpdatePickup, useDeletePickup } from '../hooks/useQueries';
import { PaymentMethod, type Pickup } from '../backend';
import { toast } from 'sonner';
import TimePicker12h from './TimePicker12h';
import { useActorReady } from '../hooks/useActorReady';
import { safeParseFloat } from '../utils/numberFormat';
import { getErrorMessage } from '../utils/errorMessage';
import { nanosToDate, nanosTo12HourParts, pacificTimeToNanos, getPacificDayGrouping } from '../utils/pickupGuards';

interface EditDeleteRecordDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function EditDeleteRecordDialog({ open, onOpenChange }: EditDeleteRecordDialogProps) {
    const [selectedPickup, setSelectedPickup] = useState<Pickup | null>(null);
    const [pickupDate, setPickupDate] = useState<Date>(new Date());
    const [pickupTime, setPickupTime] = useState({ hour: 12, minute: 0, isPM: false });
    const [customerName, setCustomerName] = useState('');
    const [streetAddress, setStreetAddress] = useState('');
    const [city, setCity] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [destinationAddress, setDestinationAddress] = useState('');
    const [meterTotal, setMeterTotal] = useState('');
    const [meterPaymentMethod, setMeterPaymentMethod] = useState<PaymentMethod>(PaymentMethod.cash);
    const [tip, setTip] = useState('');
    const [tipPaymentMethod, setTipPaymentMethod] = useState<PaymentMethod>(PaymentMethod.cash);

    const { isReady } = useActorReady();
    const updatePickupMutation = useUpdatePickup();
    const deletePickupMutation = useDeletePickup();

    // Fetch last 30 days of pickups
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const fromDateNanos = BigInt(thirtyDaysAgo.getTime()) * BigInt(1000000);
    const toDateNanos = BigInt(today.getTime()) * BigInt(1000000);

    const { data: pickups = [], isLoading, isError, error } = useGetPickupsInRange(fromDateNanos, toDateNanos);

    const sortedPickups = [...pickups].sort((a, b) => Number(b.pickupTime) - Number(a.pickupTime));

    useEffect(() => {
        if (selectedPickup) {
            const date = nanosToDate(selectedPickup.pickupTime);
            setPickupDate(date);
            setPickupTime(nanosTo12HourParts(selectedPickup.pickupTime));
            setCustomerName(selectedPickup.customerName);
            setStreetAddress(selectedPickup.streetAddress);
            setCity(selectedPickup.city);
            setPhoneNumber(selectedPickup.phoneNumber);
            setDestinationAddress(selectedPickup.destinationAddress);
            setMeterTotal(selectedPickup.meterTotal.toString());
            setMeterPaymentMethod(selectedPickup.meterPaymentMethod);
            setTip(selectedPickup.tip.toString());
            setTipPaymentMethod(selectedPickup.tipPaymentMethod);
        }
    }, [selectedPickup]);

    const handleUpdate = async () => {
        if (!selectedPickup) return;

        // Validate only required fields
        const missingFields: string[] = [];
        
        if (!streetAddress.trim()) {
            missingFields.push('Street Address');
        }
        if (!city.trim()) {
            missingFields.push('City');
        }
        if (!destinationAddress.trim()) {
            missingFields.push('Destination Address');
        }

        if (missingFields.length > 0) {
            toast.error(`Please fill in the following required fields: ${missingFields.join(', ')}`);
            return;
        }

        const parsedMeterTotal = meterTotal.trim() === '' ? 0 : safeParseFloat(meterTotal);
        const parsedTip = tip.trim() === '' ? 0 : safeParseFloat(tip);

        if (meterTotal.trim() !== '' && isNaN(parsedMeterTotal)) {
            toast.error('Please enter a valid meter total');
            return;
        }

        if (tip.trim() !== '' && isNaN(parsedTip)) {
            toast.error('Please enter a valid tip amount');
            return;
        }

        try {
            // Convert 12-hour time to Pacific time nanoseconds
            const pickupTimeNanos = pacificTimeToNanos(
                pickupDate,
                pickupTime.hour,
                pickupTime.minute,
                pickupTime.isPM
            );

            // Get the Pacific day grouping for this pickup
            const pickupDateNanos = getPacificDayGrouping(pickupTimeNanos);

            await updatePickupMutation.mutateAsync({
                pickupId: selectedPickup.id,
                pickupDate: pickupDateNanos,
                streetAddress: streetAddress.trim(),
                city: city.trim(),
                customerName: customerName.trim() || '',
                phoneNumber: phoneNumber.trim() || '',
                pickupTime: pickupTimeNanos,
                destinationAddress: destinationAddress.trim(),
                meterTotal: parsedMeterTotal,
                paymentMethod: meterPaymentMethod,
                tip: parsedTip,
                tipPaymentMethod,
            });

            toast.success('Pickup updated successfully');
            setSelectedPickup(null);
        } catch (error: unknown) {
            const errorMsg = getErrorMessage(error);
            toast.error(errorMsg || 'Failed to update pickup');
        }
    };

    const handleDelete = async () => {
        if (!selectedPickup) return;

        if (!confirm('Are you sure you want to delete this pickup record?')) {
            return;
        }

        try {
            await deletePickupMutation.mutateAsync(selectedPickup.id);
            toast.success('Pickup deleted successfully');
            setSelectedPickup(null);
        } catch (error: unknown) {
            const errorMsg = getErrorMessage(error);
            toast.error(errorMsg || 'Failed to delete pickup');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col bg-card text-card-foreground border border-border shadow-lg">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <img 
                            src="/assets/generated/edit-icon-transparent.dim_32x32.png" 
                            alt="Edit" 
                            className="w-6 h-6"
                        />
                        Edit / Delete Record
                    </DialogTitle>
                    <DialogDescription>
                        Select a pickup to edit or delete (showing last 30 days)
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : isError ? (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Failed to load pickups: {getErrorMessage(error)}
                        </AlertDescription>
                    </Alert>
                ) : (
                    <div className="flex-1 min-h-0 overflow-y-auto">
                        <div className="space-y-4 pr-4">
                            {sortedPickups.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                    No pickups found in the last 30 days
                                </p>
                            ) : !selectedPickup ? (
                                <div className="space-y-2">
                                    {sortedPickups.map((pickup) => {
                                        const date = nanosToDate(pickup.pickupTime);
                                        const time = nanosTo12HourParts(pickup.pickupTime);
                                        const timeStr = `${time.hour}:${String(time.minute).padStart(2, '0')} ${time.isPM ? 'PM' : 'AM'}`;
                                        
                                        return (
                                            <button
                                                key={pickup.id}
                                                onClick={() => setSelectedPickup(pickup)}
                                                className="w-full text-left p-4 border rounded-lg hover:bg-accent transition-colors"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-semibold">
                                                            {format(date, 'PPP')} - {timeStr}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {pickup.streetAddress}, {pickup.city} → {pickup.destinationAddress}
                                                        </p>
                                                    </div>
                                                    <p className="font-bold text-primary">
                                                        ${pickup.calculatedTotal.toFixed(2)}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <Button
                                        variant="outline"
                                        onClick={() => setSelectedPickup(null)}
                                        className="mb-4"
                                    >
                                        ← Back to List
                                    </Button>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Pickup Date</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            'w-full justify-start text-left font-normal',
                                                            !pickupDate && 'text-muted-foreground'
                                                        )}
                                                        disabled={!isReady}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {pickupDate ? format(pickupDate, 'PPP') : <span>Pick a date</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 radix-in-dialog-overlay bg-popover text-popover-foreground border border-border shadow-lg" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={pickupDate}
                                                        onSelect={(date) => date && setPickupDate(date)}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Pickup Time *</Label>
                                            <TimePicker12h
                                                value={pickupTime}
                                                onChange={setPickupTime}
                                                disabled={!isReady}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="edit-customerName">Customer Name</Label>
                                        <Input
                                            id="edit-customerName"
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                            disabled={!isReady}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-streetAddress">Street Address *</Label>
                                            <Input
                                                id="edit-streetAddress"
                                                value={streetAddress}
                                                onChange={(e) => setStreetAddress(e.target.value)}
                                                disabled={!isReady}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="edit-city">City *</Label>
                                            <Input
                                                id="edit-city"
                                                value={city}
                                                onChange={(e) => setCity(e.target.value)}
                                                disabled={!isReady}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="edit-phoneNumber">Phone Number</Label>
                                        <Input
                                            id="edit-phoneNumber"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            disabled={!isReady}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="edit-destinationAddress">Destination Address *</Label>
                                        <Input
                                            id="edit-destinationAddress"
                                            value={destinationAddress}
                                            onChange={(e) => setDestinationAddress(e.target.value)}
                                            disabled={!isReady}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-meterTotal">Meter Total</Label>
                                            <Input
                                                id="edit-meterTotal"
                                                type="number"
                                                step="0.01"
                                                value={meterTotal}
                                                onChange={(e) => setMeterTotal(e.target.value)}
                                                disabled={!isReady}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="edit-meterPaymentMethod">Meter Payment Method</Label>
                                            <Select
                                                value={meterPaymentMethod}
                                                onValueChange={(value) => setMeterPaymentMethod(value as PaymentMethod)}
                                                disabled={!isReady}
                                            >
                                                <SelectTrigger id="edit-meterPaymentMethod">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value={PaymentMethod.cash}>Cash</SelectItem>
                                                    <SelectItem value={PaymentMethod.credit}>Credit</SelectItem>
                                                    <SelectItem value={PaymentMethod.voucher}>Voucher</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-tip">Tip</Label>
                                            <Input
                                                id="edit-tip"
                                                type="number"
                                                step="0.01"
                                                value={tip}
                                                onChange={(e) => setTip(e.target.value)}
                                                disabled={!isReady}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="edit-tipPaymentMethod">Tip Payment Method</Label>
                                            <Select
                                                value={tipPaymentMethod}
                                                onValueChange={(value) => setTipPaymentMethod(value as PaymentMethod)}
                                                disabled={!isReady}
                                            >
                                                <SelectTrigger id="edit-tipPaymentMethod">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value={PaymentMethod.cash}>Cash</SelectItem>
                                                    <SelectItem value={PaymentMethod.credit}>Credit</SelectItem>
                                                    <SelectItem value={PaymentMethod.voucher}>Voucher</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <Separator />

                                    <DialogFooter className="flex-col sm:flex-row gap-2">
                                        <Button
                                            variant="destructive"
                                            onClick={handleDelete}
                                            disabled={deletePickupMutation.isPending || !isReady}
                                            className="w-full sm:w-auto"
                                        >
                                            {deletePickupMutation.isPending ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Deleting...
                                                </>
                                            ) : (
                                                <>
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            onClick={handleUpdate}
                                            disabled={updatePickupMutation.isPending || !isReady}
                                            className="w-full sm:w-auto"
                                        >
                                            {updatePickupMutation.isPending ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Updating...
                                                </>
                                            ) : (
                                                'Update Pickup'
                                            )}
                                        </Button>
                                    </DialogFooter>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
