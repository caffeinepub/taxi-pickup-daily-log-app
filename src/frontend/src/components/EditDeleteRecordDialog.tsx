import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Loader2, CalendarIcon, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useGetPickupsForDate, useUpdatePickup, useDeletePickup } from '../hooks/useQueries';
import { useActorReady } from '../hooks/useActorReady';
import type { Pickup, PaymentMethod } from '../backend';

interface EditDeleteRecordDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function EditDeleteRecordDialog({ open, onOpenChange }: EditDeleteRecordDialogProps) {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedPickup, setSelectedPickup] = useState<Pickup | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Form state
    const [pickupDate, setPickupDate] = useState<Date>(new Date());
    const [streetAddress, setStreetAddress] = useState('');
    const [city, setCity] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [pickupTime, setPickupTime] = useState('');
    const [destinationAddress, setDestinationAddress] = useState('');
    const [meterTotal, setMeterTotal] = useState('');
    const [meterPaymentMethod, setMeterPaymentMethod] = useState<PaymentMethod>('cash' as PaymentMethod);
    const [tip, setTip] = useState('');
    const [tipPaymentMethod, setTipPaymentMethod] = useState<PaymentMethod>('cash' as PaymentMethod);

    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: pickups = [], isLoading } = useGetPickupsForDate(
        BigInt(startOfDay.getTime()) * BigInt(1000000),
        BigInt(endOfDay.getTime()) * BigInt(1000000)
    );

    const updatePickupMutation = useUpdatePickup();
    const deletePickupMutation = useDeletePickup();
    const { isReady } = useActorReady();

    useEffect(() => {
        if (selectedPickup) {
            const pickupDateObj = new Date(Number(selectedPickup.pickupDate));
            setPickupDate(pickupDateObj);
            setStreetAddress(selectedPickup.streetAddress);
            setCity(selectedPickup.city);
            setCustomerName(selectedPickup.customerName);
            setPhoneNumber(selectedPickup.phoneNumber);

            const pickupTimeObj = new Date(Number(selectedPickup.pickupTime));
            const hours = String(pickupTimeObj.getHours()).padStart(2, '0');
            const minutes = String(pickupTimeObj.getMinutes()).padStart(2, '0');
            setPickupTime(`${hours}:${minutes}`);

            setDestinationAddress(selectedPickup.destinationAddress);
            setMeterTotal(selectedPickup.meterTotal.toString());
            setMeterPaymentMethod(selectedPickup.meterPaymentMethod);
            setTip(selectedPickup.tip.toString());
            setTipPaymentMethod(selectedPickup.tipPaymentMethod);
        }
    }, [selectedPickup]);

    const handleSelectPickup = (pickup: Pickup) => {
        setSelectedPickup(pickup);
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!selectedPickup) return;

        try {
            const pickupDateCopy = new Date(pickupDate);
            pickupDateCopy.setHours(0, 0, 0, 0);
            const pickupDateTimestamp = BigInt(pickupDateCopy.getTime()) * BigInt(1000000);

            const [hours, minutes] = pickupTime.split(':').map(Number);
            const pickupDateTime = new Date(pickupDate);
            pickupDateTime.setHours(hours, minutes, 0, 0);
            const pickupTimeTimestamp = BigInt(pickupDateTime.getTime()) * BigInt(1000000);

            await updatePickupMutation.mutateAsync({
                pickupId: selectedPickup.id,
                pickupDate: pickupDateTimestamp,
                streetAddress: streetAddress.trim(),
                city: city.trim(),
                customerName: customerName.trim(),
                phoneNumber: phoneNumber.trim(),
                pickupTime: pickupTimeTimestamp,
                destinationAddress: destinationAddress.trim(),
                meterTotal: parseFloat(meterTotal) || 0,
                meterPaymentMethod,
                tip: parseFloat(tip) || 0,
                tipPaymentMethod,
            });

            toast.success('Pickup updated successfully');
            setIsEditing(false);
            setSelectedPickup(null);
        } catch (error) {
            toast.error('Failed to update pickup');
            console.error('Error updating pickup:', error);
        }
    };

    const handleDelete = async () => {
        if (!selectedPickup) return;

        try {
            await deletePickupMutation.mutateAsync(selectedPickup.id);
            toast.success('Pickup deleted successfully');
            setIsEditing(false);
            setSelectedPickup(null);
        } catch (error) {
            toast.error('Failed to delete pickup');
            console.error('Error deleting pickup:', error);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setSelectedPickup(null);
    };

    const formatTime = (timestamp: bigint): string => {
        const date = new Date(Number(timestamp));
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const calculatedTotal = (parseFloat(meterTotal) || 0) + (parseFloat(tip) || 0);
    const isFormDisabled = updatePickupMutation.isPending || deletePickupMutation.isPending || !isReady;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <img 
                            src="/assets/generated/edit-icon-transparent.dim_32x32.png" 
                            alt="Edit" 
                            className="h-6 w-6"
                        />
                        Edit/Delete Record
                    </DialogTitle>
                    <DialogDescription>
                        Select a date to view pickups, then choose a record to edit or delete.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col gap-4">
                    {/* Date Selector */}
                    <div className="space-y-2">
                        <Label>Select Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        'w-full justify-start text-left font-normal',
                                        !selectedDate && 'text-muted-foreground'
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={(date) => {
                                        if (date) {
                                            setSelectedDate(date);
                                            setIsEditing(false);
                                            setSelectedPickup(null);
                                        }
                                    }}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {!isEditing ? (
                        /* Pickup List */
                        <div className="flex-1 overflow-hidden flex flex-col">
                            <Label className="mb-2">Pickups on {format(selectedDate, 'PPP')}</Label>
                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : pickups.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No pickups found for this date
                                </div>
                            ) : (
                                <ScrollArea className="flex-1 border rounded-md">
                                    <div className="p-4 space-y-2">
                                        {pickups.map((pickup) => (
                                            <Button
                                                key={pickup.id.toString()}
                                                variant="outline"
                                                className="w-full justify-start text-left h-auto py-3"
                                                onClick={() => handleSelectPickup(pickup)}
                                                disabled={isFormDisabled}
                                            >
                                                <div className="flex flex-col gap-1 w-full">
                                                    <div className="flex justify-between items-start">
                                                        <span className="font-semibold">
                                                            {pickup.streetAddress}
                                                            {pickup.city && `, ${pickup.city}`}
                                                        </span>
                                                        <span className="text-sm text-muted-foreground">
                                                            {formatTime(pickup.pickupTime)}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {pickup.customerName || 'No customer name'} → {pickup.destinationAddress}
                                                    </div>
                                                    <div className="text-sm font-medium">
                                                        Total: ${pickup.calculatedTotal.toFixed(2)}
                                                    </div>
                                                </div>
                                            </Button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                        </div>
                    ) : (
                        /* Edit Form */
                        <div className="flex-1 overflow-y-auto">
                            <ScrollArea className="h-full pr-4">
                                <div className="space-y-4">
                                    {/* Pickup Date */}
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
                                                    disabled={isFormDisabled}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {pickupDate ? format(pickupDate, 'PPP') : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={pickupDate}
                                                    onSelect={(date) => date && setPickupDate(date)}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    {/* Pickup Time */}
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-pickupTime">Pickup Time</Label>
                                        <Input
                                            id="edit-pickupTime"
                                            type="time"
                                            value={pickupTime}
                                            onChange={(e) => setPickupTime(e.target.value)}
                                            disabled={isFormDisabled}
                                        />
                                    </div>

                                    <Separator />

                                    {/* Street Address */}
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-streetAddress">Street Address</Label>
                                        <Input
                                            id="edit-streetAddress"
                                            value={streetAddress}
                                            onChange={(e) => setStreetAddress(e.target.value)}
                                            disabled={isFormDisabled}
                                        />
                                    </div>

                                    {/* City */}
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-city">City</Label>
                                        <Input
                                            id="edit-city"
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
                                            disabled={isFormDisabled}
                                        />
                                    </div>

                                    {/* Customer Name */}
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-customerName">Customer Name</Label>
                                        <Input
                                            id="edit-customerName"
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                            disabled={isFormDisabled}
                                        />
                                    </div>

                                    {/* Phone Number */}
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-phoneNumber">Phone Number</Label>
                                        <Input
                                            id="edit-phoneNumber"
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            disabled={isFormDisabled}
                                        />
                                    </div>

                                    {/* Destination Address */}
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-destinationAddress">Destination Address</Label>
                                        <Input
                                            id="edit-destinationAddress"
                                            value={destinationAddress}
                                            onChange={(e) => setDestinationAddress(e.target.value)}
                                            disabled={isFormDisabled}
                                        />
                                    </div>

                                    <Separator />

                                    {/* Meter Total */}
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-meterTotal">Meter Total</Label>
                                        <Input
                                            id="edit-meterTotal"
                                            type="number"
                                            step="0.01"
                                            value={meterTotal}
                                            onChange={(e) => setMeterTotal(e.target.value)}
                                            disabled={isFormDisabled}
                                        />
                                    </div>

                                    {/* Meter Payment Method */}
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-meterPaymentMethod">Meter Payment Method</Label>
                                        <Select
                                            value={meterPaymentMethod}
                                            onValueChange={(value) => setMeterPaymentMethod(value as PaymentMethod)}
                                            disabled={isFormDisabled}
                                        >
                                            <SelectTrigger id="edit-meterPaymentMethod">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="cash">Cash</SelectItem>
                                                <SelectItem value="credit">Credit</SelectItem>
                                                <SelectItem value="voucher">Voucher</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Tip */}
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-tip">Tip</Label>
                                        <Input
                                            id="edit-tip"
                                            type="number"
                                            step="0.01"
                                            value={tip}
                                            onChange={(e) => setTip(e.target.value)}
                                            disabled={isFormDisabled}
                                        />
                                    </div>

                                    {/* Tip Payment Method */}
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-tipPaymentMethod">Tip Payment Method</Label>
                                        <Select
                                            value={tipPaymentMethod}
                                            onValueChange={(value) => setTipPaymentMethod(value as PaymentMethod)}
                                            disabled={isFormDisabled}
                                        >
                                            <SelectTrigger id="edit-tipPaymentMethod">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="cash">Cash</SelectItem>
                                                <SelectItem value="credit">Credit</SelectItem>
                                                <SelectItem value="voucher">Voucher</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Calculated Total */}
                                    <div className="rounded-lg bg-muted/50 p-4 border">
                                        <div className="flex justify-between items-center">
                                            <span className="font-semibold">Calculated Total:</span>
                                            <span className="text-xl font-bold text-primary">
                                                ${calculatedTotal.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>
                        </div>
                    )}

                    {/* Action Buttons - Always visible at bottom */}
                    {isEditing && (
                        <div className="flex gap-2 pt-4 border-t">
                            <Button
                                variant="outline"
                                onClick={handleCancel}
                                disabled={isFormDisabled}
                                className="flex-1"
                            >
                                <img 
                                    src="/assets/generated/cancel-icon.dim_32x32.png" 
                                    alt="Cancel" 
                                    className="h-4 w-4 mr-2"
                                />
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={isFormDisabled}
                                className="flex-1"
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
                                onClick={handleSave}
                                disabled={isFormDisabled}
                                className="flex-1"
                            >
                                {updatePickupMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : !isReady ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Connecting...
                                    </>
                                ) : (
                                    <>
                                        <img 
                                            src="/assets/generated/save-icon.dim_32x32.png" 
                                            alt="Save" 
                                            className="h-4 w-4 mr-2"
                                        />
                                        Save
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
