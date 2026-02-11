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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CalendarIcon, Trash2, Save, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useGetPickupsForDate, useUpdatePickup, useDeletePickup } from '../hooks/useQueries';
import { PaymentMethod, type Pickup } from '../backend';
import { toast } from 'sonner';
import { nanosToDate, nanosToTimeString } from '../utils/pickupGuards';
import { safeCurrency, safeParseFloat } from '../utils/numberFormat';
import { getErrorMessage } from '../utils/errorMessage';

interface EditDeleteRecordDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function EditDeleteRecordDialog({ open, onOpenChange }: EditDeleteRecordDialogProps) {
    const [selectedPickup, setSelectedPickup] = useState<Pickup | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Form state
    const [pickupDate, setPickupDate] = useState<Date>(new Date());
    const [pickupTime, setPickupTime] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [streetAddress, setStreetAddress] = useState('');
    const [city, setCity] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [destinationAddress, setDestinationAddress] = useState('');
    const [meterTotal, setMeterTotal] = useState('');
    const [meterPaymentMethod, setMeterPaymentMethod] = useState<PaymentMethod>(PaymentMethod.cash);
    const [tip, setTip] = useState('');
    const [tipPaymentMethod, setTipPaymentMethod] = useState<PaymentMethod>(PaymentMethod.cash);

    // Get pickups from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const { data: recentPickups = [], isLoading: loadingPickups, isError: pickupsError, error: pickupsErrorData } = useGetPickupsForDate(
        BigInt(thirtyDaysAgo.getTime()) * BigInt(1000000),
        BigInt(today.getTime()) * BigInt(1000000)
    );

    const updatePickupMutation = useUpdatePickup();
    const deletePickupMutation = useDeletePickup();

    // Sort pickups by date (most recent first)
    const sortedPickups = [...recentPickups].sort((a, b) => Number(b.pickupTime) - Number(a.pickupTime));

    useEffect(() => {
        if (selectedPickup && isEditing) {
            const date = nanosToDate(selectedPickup.pickupDate);
            setPickupDate(date);
            setPickupTime(nanosToTimeString(selectedPickup.pickupTime));
            setCustomerName(selectedPickup.customerName);
            setStreetAddress(selectedPickup.streetAddress);
            setCity(selectedPickup.city);
            setPhoneNumber(selectedPickup.phoneNumber);
            setDestinationAddress(selectedPickup.destinationAddress);
            setMeterTotal(selectedPickup.meterTotal.toString());
            setMeterPaymentMethod(selectedPickup.meterPaymentMethod as PaymentMethod);
            setTip(selectedPickup.tip.toString());
            setTipPaymentMethod(selectedPickup.tipPaymentMethod as PaymentMethod);
        }
    }, [selectedPickup, isEditing]);

    const handleSelectPickup = (pickup: Pickup) => {
        setSelectedPickup(pickup);
        setIsEditing(false);
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setSelectedPickup(null);
    };

    const handleSave = async () => {
        if (!selectedPickup) return;

        // Validate required text fields with trimmed checks
        if (
            !pickupTime.trim() ||
            !customerName.trim() ||
            !streetAddress.trim() ||
            !city.trim() ||
            !phoneNumber.trim() ||
            !destinationAddress.trim()
        ) {
            toast.error('Please fill in all required fields');
            return;
        }

        // Validate numeric fields
        const parsedMeterTotal = safeParseFloat(meterTotal);
        const parsedTip = safeParseFloat(tip);

        if (meterTotal.trim() === '' || isNaN(parsedMeterTotal)) {
            toast.error('Please enter a valid meter total');
            return;
        }

        if (tip.trim() === '' || isNaN(parsedTip)) {
            toast.error('Please enter a valid tip amount');
            return;
        }

        try {
            const [hours, minutes] = pickupTime.split(':').map(Number);
            const pickupDateTime = new Date(pickupDate);
            pickupDateTime.setHours(hours, minutes, 0, 0);

            const pickupDateOnly = new Date(pickupDate);
            pickupDateOnly.setHours(0, 0, 0, 0);

            await updatePickupMutation.mutateAsync({
                pickupId: selectedPickup.id,
                pickupDate: BigInt(pickupDateOnly.getTime()) * BigInt(1000000),
                streetAddress: streetAddress.trim(),
                city: city.trim(),
                customerName: customerName.trim(),
                phoneNumber: phoneNumber.trim(),
                pickupTime: BigInt(pickupDateTime.getTime()) * BigInt(1000000),
                destinationAddress: destinationAddress.trim(),
                meterTotal: parsedMeterTotal,
                meterPaymentMethod,
                tip: parsedTip,
                tipPaymentMethod,
            });

            toast.success('Pickup updated successfully');
            setIsEditing(false);
            setSelectedPickup(null);
        } catch (error: unknown) {
            const errorMsg = getErrorMessage(error);
            toast.error(errorMsg || 'Failed to update pickup');
        }
    };

    const handleDelete = async () => {
        if (!selectedPickup) return;

        if (!confirm('Are you sure you want to delete this pickup record? This action cannot be undone.')) {
            return;
        }

        try {
            await deletePickupMutation.mutateAsync(selectedPickup.id);
            toast.success('Pickup deleted successfully');
            setSelectedPickup(null);
            setIsEditing(false);
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
                        Edit or Delete Record
                    </DialogTitle>
                    <DialogDescription>
                        Select a pickup from the last 30 days to edit or delete
                    </DialogDescription>
                </DialogHeader>

                {loadingPickups ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : pickupsError ? (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Failed to load recent pickups: {getErrorMessage(pickupsErrorData)}
                        </AlertDescription>
                    </Alert>
                ) : (
                    <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Pickup List */}
                        <div className="flex flex-col min-h-0">
                            <h3 className="font-semibold mb-2">Recent Pickups</h3>
                            {sortedPickups.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No pickups found in the last 30 days</p>
                            ) : (
                                <ScrollArea className="flex-1 border rounded-lg">
                                    <div className="p-2 space-y-2">
                                        {sortedPickups.map((pickup) => (
                                            <button
                                                key={pickup.id.toString()}
                                                onClick={() => handleSelectPickup(pickup)}
                                                className={cn(
                                                    'w-full text-left p-3 rounded-lg border transition-colors',
                                                    selectedPickup?.id === pickup.id
                                                        ? 'bg-primary/10 border-primary'
                                                        : 'hover:bg-muted border-border'
                                                )}
                                            >
                                                <div className="space-y-1">
                                                    <p className="font-medium text-sm">{pickup.customerName}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {nanosToDate(pickup.pickupDate).toLocaleDateString()} - {nanosToTimeString(pickup.pickupTime)}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">{pickup.streetAddress}</p>
                                                    <p className="text-xs font-medium">{safeCurrency(pickup.calculatedTotal)}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                        </div>

                        {/* Pickup Details / Edit Form */}
                        <div className="flex flex-col min-h-0">
                            {!selectedPickup ? (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    Select a pickup to view or edit
                                </div>
                            ) : !isEditing ? (
                                <ScrollArea className="flex-1">
                                    <div className="space-y-4 pr-4">
                                        <div className="border rounded-lg p-4 space-y-3">
                                            <h3 className="font-semibold">Pickup Details</h3>
                                            <div className="space-y-2 text-sm">
                                                <div>
                                                    <p className="text-muted-foreground">Date & Time</p>
                                                    <p className="font-medium">
                                                        {nanosToDate(selectedPickup.pickupDate).toLocaleDateString()} at {nanosToTimeString(selectedPickup.pickupTime)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Customer</p>
                                                    <p className="font-medium">{selectedPickup.customerName}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Phone</p>
                                                    <p className="font-medium">{selectedPickup.phoneNumber}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Pickup Address</p>
                                                    <p className="font-medium">{selectedPickup.streetAddress}, {selectedPickup.city}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Destination</p>
                                                    <p className="font-medium">{selectedPickup.destinationAddress}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Meter ({selectedPickup.meterPaymentMethod})</p>
                                                    <p className="font-medium">{safeCurrency(selectedPickup.meterTotal)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Tip ({selectedPickup.tipPaymentMethod})</p>
                                                    <p className="font-medium">{safeCurrency(selectedPickup.tip)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Total</p>
                                                    <p className="font-bold text-lg text-primary">{safeCurrency(selectedPickup.calculatedTotal)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button onClick={handleEdit} className="flex-1">
                                                <img 
                                                    src="/assets/generated/edit-icon-transparent.dim_32x32.png" 
                                                    alt="Edit" 
                                                    className="w-4 h-4 mr-2"
                                                />
                                                Edit
                                            </Button>
                                            <Button
                                                onClick={handleDelete}
                                                variant="destructive"
                                                disabled={deletePickupMutation.isPending}
                                            >
                                                {deletePickupMutation.isPending ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </ScrollArea>
                            ) : (
                                <ScrollArea className="flex-1">
                                    <form className="space-y-4 pr-4" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                                        <div className="space-y-2">
                                            <Label>Pickup Date *</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            'w-full justify-start text-left font-normal',
                                                            !pickupDate && 'text-muted-foreground'
                                                        )}
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
                                            <Label htmlFor="edit-pickupTime">Pickup Time *</Label>
                                            <Input
                                                id="edit-pickupTime"
                                                type="time"
                                                value={pickupTime}
                                                onChange={(e) => setPickupTime(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="edit-customerName">Customer Name *</Label>
                                            <Input
                                                id="edit-customerName"
                                                value={customerName}
                                                onChange={(e) => setCustomerName(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="edit-streetAddress">Street Address *</Label>
                                            <Input
                                                id="edit-streetAddress"
                                                value={streetAddress}
                                                onChange={(e) => setStreetAddress(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="edit-city">City *</Label>
                                            <Input
                                                id="edit-city"
                                                value={city}
                                                onChange={(e) => setCity(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="edit-phoneNumber">Phone Number *</Label>
                                            <Input
                                                id="edit-phoneNumber"
                                                value={phoneNumber}
                                                onChange={(e) => setPhoneNumber(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="edit-destinationAddress">Destination Address *</Label>
                                            <Input
                                                id="edit-destinationAddress"
                                                value={destinationAddress}
                                                onChange={(e) => setDestinationAddress(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="edit-meterTotal">Meter Total *</Label>
                                            <Input
                                                id="edit-meterTotal"
                                                type="number"
                                                step="0.01"
                                                value={meterTotal}
                                                onChange={(e) => setMeterTotal(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Meter Payment Method *</Label>
                                            <Select
                                                value={meterPaymentMethod}
                                                onValueChange={(value) => setMeterPaymentMethod(value as PaymentMethod)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="radix-in-dialog-overlay bg-popover text-popover-foreground border border-border shadow-lg">
                                                    <SelectItem value={PaymentMethod.cash}>Cash</SelectItem>
                                                    <SelectItem value={PaymentMethod.credit}>Credit</SelectItem>
                                                    <SelectItem value={PaymentMethod.voucher}>Voucher</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="edit-tip">Tip *</Label>
                                            <Input
                                                id="edit-tip"
                                                type="number"
                                                step="0.01"
                                                value={tip}
                                                onChange={(e) => setTip(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Tip Payment Method *</Label>
                                            <Select
                                                value={tipPaymentMethod}
                                                onValueChange={(value) => setTipPaymentMethod(value as PaymentMethod)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="radix-in-dialog-overlay bg-popover text-popover-foreground border border-border shadow-lg">
                                                    <SelectItem value={PaymentMethod.cash}>Cash</SelectItem>
                                                    <SelectItem value={PaymentMethod.credit}>Credit</SelectItem>
                                                    <SelectItem value={PaymentMethod.voucher}>Voucher</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex gap-2 pt-4">
                                            <Button
                                                type="submit"
                                                className="flex-1"
                                                disabled={updatePickupMutation.isPending}
                                            >
                                                {updatePickupMutation.isPending ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="mr-2 h-4 w-4" />
                                                        Save Changes
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={handleCancelEdit}
                                                disabled={updatePickupMutation.isPending}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </form>
                                </ScrollArea>
                            )}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
