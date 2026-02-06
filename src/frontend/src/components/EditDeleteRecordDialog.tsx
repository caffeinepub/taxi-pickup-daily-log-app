import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, CalendarIcon, Edit, Trash2, Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useGetPickupsForDate, useUpdatePickup, useDeletePickup } from '../hooks/useQueries';
import { PaymentMethod, type Pickup } from '../backend';
import CustomerLookup from './CustomerLookup';

interface EditDeleteRecordDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function EditDeleteRecordDialog({ open, onOpenChange }: EditDeleteRecordDialogProps) {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedPickup, setSelectedPickup] = useState<Pickup | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Form state for editing
    const [editPickupDate, setEditPickupDate] = useState<Date>(new Date());
    const [editStreetAddress, setEditStreetAddress] = useState('');
    const [editCity, setEditCity] = useState('');
    const [editCustomerName, setEditCustomerName] = useState('');
    const [editPhoneNumber, setEditPhoneNumber] = useState('');
    const [editPickupTime, setEditPickupTime] = useState('');
    const [editDestinationAddress, setEditDestinationAddress] = useState('');
    const [editMeterTotal, setEditMeterTotal] = useState('');
    const [editPaymentMethod, setEditPaymentMethod] = useState<PaymentMethod>(PaymentMethod.cash);
    const [editTip, setEditTip] = useState('');
    const [editTipPaymentMethod, setEditTipPaymentMethod] = useState<PaymentMethod>(PaymentMethod.cash);

    // Convert date to timestamp range for query
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const fromDate = BigInt(startOfDay.getTime()) * BigInt(1000000);
    const toDate = BigInt(endOfDay.getTime()) * BigInt(1000000);

    const { data: pickups = [], isLoading } = useGetPickupsForDate(fromDate, toDate);
    const updatePickupMutation = useUpdatePickup();
    const deletePickupMutation = useDeletePickup();

    // Reset state when dialog closes
    useEffect(() => {
        if (!open) {
            setSelectedPickup(null);
            setIsEditing(false);
            setShowDeleteConfirm(false);
        }
    }, [open]);

    // Populate edit form when a pickup is selected for editing
    useEffect(() => {
        if (selectedPickup && isEditing) {
            // Convert pickup date timestamp to Date
            const pickupDateMs = Number(selectedPickup.pickupDate / BigInt(1000000));
            setEditPickupDate(new Date(pickupDateMs));

            setEditStreetAddress(selectedPickup.streetAddress);
            setEditCity(selectedPickup.city);
            setEditCustomerName(selectedPickup.customerName);
            setEditPhoneNumber(selectedPickup.phoneNumber);

            // Convert pickup time timestamp to HH:MM format
            const pickupTimeMs = Number(selectedPickup.pickupTime / BigInt(1000000));
            const pickupTimeDate = new Date(pickupTimeMs);
            const hours = String(pickupTimeDate.getHours()).padStart(2, '0');
            const minutes = String(pickupTimeDate.getMinutes()).padStart(2, '0');
            setEditPickupTime(`${hours}:${minutes}`);

            setEditDestinationAddress(selectedPickup.destinationAddress);
            setEditMeterTotal(selectedPickup.meterTotal.toString());
            setEditPaymentMethod(selectedPickup.meterPaymentMethod);
            setEditTip(selectedPickup.tip.toString());
            setEditTipPaymentMethod(selectedPickup.tipPaymentMethod);
        }
    }, [selectedPickup, isEditing]);

    const handleSelectPickup = (pickup: Pickup) => {
        setSelectedPickup(pickup);
    };

    const handleEdit = () => {
        if (!selectedPickup) return;
        setIsEditing(true);
    };

    const handleDelete = () => {
        if (!selectedPickup) return;
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedPickup) return;

        try {
            await deletePickupMutation.mutateAsync(selectedPickup.id);
            toast.success('Pickup record deleted successfully');
            setShowDeleteConfirm(false);
            setSelectedPickup(null);
        } catch (error) {
            toast.error('Failed to delete pickup record');
            console.error('Error deleting pickup:', error);
        }
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedPickup) return;

        // Validate required fields
        if (!editStreetAddress.trim() || !editDestinationAddress.trim()) {
            toast.error('Street Address and Destination Address are required');
            return;
        }

        if (!editPickupTime.trim()) {
            toast.error('Pickup time is required');
            return;
        }

        const meterTotalValue = parseFloat(editMeterTotal) || 0;
        const tipValue = parseFloat(editTip) || 0;

        if (meterTotalValue < 0 || tipValue < 0) {
            toast.error('Meter total and tip must be positive numbers');
            return;
        }

        try {
            // Convert edit pickup date to timestamp
            const pickupDateCopy = new Date(editPickupDate);
            pickupDateCopy.setHours(0, 0, 0, 0);
            const pickupDateTimestamp = BigInt(pickupDateCopy.getTime()) * BigInt(1000000);

            // Convert pickup time to timestamp
            const [hours, minutes] = editPickupTime.split(':').map(Number);
            const pickupDateTime = new Date(editPickupDate);
            pickupDateTime.setHours(hours, minutes, 0, 0);
            const pickupTimeTimestamp = BigInt(pickupDateTime.getTime()) * BigInt(1000000);

            await updatePickupMutation.mutateAsync({
                pickupId: selectedPickup.id,
                pickupDate: pickupDateTimestamp,
                streetAddress: editStreetAddress.trim(),
                city: editCity.trim(),
                customerName: editCustomerName.trim(),
                phoneNumber: editPhoneNumber.trim(),
                pickupTime: pickupTimeTimestamp,
                destinationAddress: editDestinationAddress.trim(),
                meterTotal: meterTotalValue,
                meterPaymentMethod: editPaymentMethod,
                tip: tipValue,
                tipPaymentMethod: editTipPaymentMethod,
            });

            toast.success('Pickup record updated successfully');
            setIsEditing(false);
            setSelectedPickup(null);
        } catch (error) {
            toast.error('Failed to update pickup record');
            console.error('Error updating pickup:', error);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
    };

    const handleBackToList = () => {
        setSelectedPickup(null);
        setIsEditing(false);
    };

    const editCalculatedTotal = (parseFloat(editMeterTotal) || 0) + (parseFloat(editTip) || 0);

    // Sort pickups by time
    const sortedPickups = [...pickups].sort((a, b) => {
        const timeA = Number(a.pickupTime);
        const timeB = Number(b.pickupTime);
        return timeA - timeB;
    });

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                    <div className="px-6 pt-6 pb-4 flex-shrink-0">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                <Edit className="h-6 w-6 text-primary" />
                                Edit/Delete Record
                            </DialogTitle>
                            <DialogDescription>
                                {isEditing
                                    ? 'Edit the pickup record details below'
                                    : selectedPickup
                                    ? 'Choose an action for the selected record'
                                    : 'Select a date and choose a pickup record to edit or delete'}
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6">
                        <div className="pb-4">
                            {!selectedPickup && !isEditing && (
                                <div className="space-y-6">
                                    {/* Date Picker */}
                                    <div className="space-y-3">
                                        <Label htmlFor="recordDate" className="text-base font-semibold">
                                            Select Date
                                        </Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    id="recordDate"
                                                    variant="outline"
                                                    className={cn(
                                                        'w-full h-11 justify-start text-left font-normal border-2',
                                                        !selectedDate && 'text-muted-foreground'
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={selectedDate}
                                                    onSelect={(date) => date && setSelectedDate(date)}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    <Separator />

                                    {/* Pickup List */}
                                    <div className="space-y-3">
                                        <Label className="text-base font-semibold">
                                            Pickup Records ({sortedPickups.length})
                                        </Label>
                                        {isLoading ? (
                                            <div className="flex items-center justify-center py-8">
                                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                            </div>
                                        ) : sortedPickups.length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground">
                                                No pickup records found for this date
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {sortedPickups.map((pickup) => {
                                                    const pickupTimeMs = Number(pickup.pickupTime / BigInt(1000000));
                                                    const pickupTimeDate = new Date(pickupTimeMs);
                                                    const timeStr = format(pickupTimeDate, 'h:mm a');

                                                    return (
                                                        <Button
                                                            key={pickup.id.toString()}
                                                            variant="outline"
                                                            className="w-full h-auto py-3 px-4 justify-start text-left hover:bg-accent"
                                                            onClick={() => handleSelectPickup(pickup)}
                                                        >
                                                            <div className="flex flex-col gap-1 w-full">
                                                                <div className="flex items-center gap-2 font-semibold">
                                                                    <Clock className="h-4 w-4 text-primary" />
                                                                    {timeStr}
                                                                </div>
                                                                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                                                    <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                                                                    <span className="line-clamp-1">
                                                                        {pickup.streetAddress}
                                                                        {pickup.city && `, ${pickup.city}`}
                                                                    </span>
                                                                </div>
                                                                {pickup.customerName && (
                                                                    <div className="text-sm text-muted-foreground">
                                                                        Customer: {pickup.customerName}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </Button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {selectedPickup && !isEditing && (
                                <div className="space-y-6">
                                    {/* Selected Record Details */}
                                    <div className="space-y-3">
                                        <Label className="text-base font-semibold">Selected Record</Label>
                                        <div className="border-2 rounded-lg p-4 space-y-2 bg-accent/50">
                                            <div className="flex items-center gap-2 font-semibold">
                                                <Clock className="h-4 w-4 text-primary" />
                                                {format(new Date(Number(selectedPickup.pickupTime / BigInt(1000000))), 'h:mm a')}
                                            </div>
                                            <div className="flex items-start gap-2 text-sm">
                                                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                                                <span>
                                                    {selectedPickup.streetAddress}
                                                    {selectedPickup.city && `, ${selectedPickup.city}`}
                                                </span>
                                            </div>
                                            {selectedPickup.customerName && (
                                                <div className="text-sm">Customer: {selectedPickup.customerName}</div>
                                            )}
                                            <div className="text-sm">Destination: {selectedPickup.destinationAddress}</div>
                                            <div className="text-sm font-semibold">
                                                Total: ${selectedPickup.calculatedTotal.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Action Buttons */}
                                    <div className="space-y-3">
                                        <Label className="text-base font-semibold">Choose Action</Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button
                                                variant="default"
                                                className="h-12"
                                                onClick={handleEdit}
                                            >
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit Record
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                className="h-12"
                                                onClick={handleDelete}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete Record
                                            </Button>
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={handleBackToList}
                                        >
                                            Back to List
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {isEditing && selectedPickup && (
                                <div className="space-y-6">
                                    {/* Edit Form */}
                                    <div className="space-y-4">
                                        <Label className="text-base font-semibold">Edit Pickup Details</Label>

                                        {/* Pickup Date */}
                                        <div className="space-y-2">
                                            <Label htmlFor="editPickupDate">
                                                Pickup Date <span className="text-destructive">*</span>
                                            </Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        id="editPickupDate"
                                                        variant="outline"
                                                        className={cn(
                                                            'w-full h-11 justify-start text-left font-normal border-2',
                                                            !editPickupDate && 'text-muted-foreground'
                                                        )}
                                                        disabled={updatePickupMutation.isPending}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {editPickupDate ? format(editPickupDate, 'PPP') : <span>Pick a date</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={editPickupDate}
                                                        onSelect={(date) => date && setEditPickupDate(date)}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>

                                        {/* Street Address */}
                                        <div className="space-y-2">
                                            <Label htmlFor="editStreetAddress">
                                                Street Address <span className="text-destructive">*</span>
                                            </Label>
                                            <Input
                                                id="editStreetAddress"
                                                value={editStreetAddress}
                                                onChange={(e) => setEditStreetAddress(e.target.value)}
                                                disabled={updatePickupMutation.isPending}
                                                className="h-11 border-2"
                                                required
                                            />
                                        </div>

                                        {/* City */}
                                        <div className="space-y-2">
                                            <Label htmlFor="editCity">City</Label>
                                            <Input
                                                id="editCity"
                                                value={editCity}
                                                onChange={(e) => setEditCity(e.target.value)}
                                                disabled={updatePickupMutation.isPending}
                                                className="h-11 border-2"
                                            />
                                        </div>

                                        {/* Customer Name */}
                                        <div className="space-y-2">
                                            <Label htmlFor="editCustomerName">Customer Name</Label>
                                            <CustomerLookup
                                                value={editCustomerName}
                                                onChange={setEditCustomerName}
                                                disabled={updatePickupMutation.isPending}
                                            />
                                        </div>

                                        {/* Phone Number */}
                                        <div className="space-y-2">
                                            <Label htmlFor="editPhoneNumber">Phone Number</Label>
                                            <Input
                                                id="editPhoneNumber"
                                                type="tel"
                                                value={editPhoneNumber}
                                                onChange={(e) => setEditPhoneNumber(e.target.value)}
                                                disabled={updatePickupMutation.isPending}
                                                className="h-11 border-2"
                                            />
                                        </div>

                                        {/* Pickup Time */}
                                        <div className="space-y-2">
                                            <Label htmlFor="editPickupTime">
                                                Pickup Time <span className="text-destructive">*</span>
                                            </Label>
                                            <Input
                                                id="editPickupTime"
                                                type="time"
                                                value={editPickupTime}
                                                onChange={(e) => setEditPickupTime(e.target.value)}
                                                disabled={updatePickupMutation.isPending}
                                                className="h-11 border-2"
                                                required
                                            />
                                        </div>

                                        {/* Destination Address */}
                                        <div className="space-y-2">
                                            <Label htmlFor="editDestinationAddress">
                                                Destination Address <span className="text-destructive">*</span>
                                            </Label>
                                            <Input
                                                id="editDestinationAddress"
                                                value={editDestinationAddress}
                                                onChange={(e) => setEditDestinationAddress(e.target.value)}
                                                disabled={updatePickupMutation.isPending}
                                                className="h-11 border-2"
                                                required
                                            />
                                        </div>

                                        {/* Meter Total and Payment Method */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="editMeterTotal">Meter Total</Label>
                                                <Input
                                                    id="editMeterTotal"
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={editMeterTotal}
                                                    onChange={(e) => setEditMeterTotal(e.target.value)}
                                                    disabled={updatePickupMutation.isPending}
                                                    className="h-11 border-2"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="editPaymentMethod">Payment Method</Label>
                                                <Select
                                                    value={editPaymentMethod}
                                                    onValueChange={(value) => setEditPaymentMethod(value as PaymentMethod)}
                                                    disabled={updatePickupMutation.isPending}
                                                >
                                                    <SelectTrigger id="editPaymentMethod" className="h-11 border-2">
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

                                        {/* Tip and Tip Payment Method */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="editTip">Tip</Label>
                                                <Input
                                                    id="editTip"
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={editTip}
                                                    onChange={(e) => setEditTip(e.target.value)}
                                                    disabled={updatePickupMutation.isPending}
                                                    className="h-11 border-2"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="editTipPaymentMethod">Tip Payment Method</Label>
                                                <Select
                                                    value={editTipPaymentMethod}
                                                    onValueChange={(value) => setEditTipPaymentMethod(value as PaymentMethod)}
                                                    disabled={updatePickupMutation.isPending}
                                                >
                                                    <SelectTrigger id="editTipPaymentMethod" className="h-11 border-2">
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

                                        {/* Calculated Total */}
                                        <div className="space-y-2">
                                            <Label>Calculated Total</Label>
                                            <div className="h-11 px-3 py-2 rounded-md border-2 border-muted bg-muted/50 flex items-center font-semibold">
                                                ${editCalculatedTotal.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Fixed Action Buttons at Bottom - Only shown when editing */}
                    {isEditing && selectedPickup && (
                        <div className="border-t px-6 py-4 flex-shrink-0 bg-background space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    type="button"
                                    size="lg"
                                    className="h-14 font-semibold text-base shadow-md hover:shadow-lg transition-shadow"
                                    disabled={updatePickupMutation.isPending}
                                    onClick={handleSaveEdit}
                                >
                                    {updatePickupMutation.isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <img src="/assets/generated/save-icon.dim_32x32.png" alt="" className="mr-2 h-6 w-6" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="lg"
                                    className="h-14 font-semibold text-base border-2 shadow-md hover:shadow-lg transition-shadow"
                                    onClick={handleCancelEdit}
                                    disabled={updatePickupMutation.isPending}
                                >
                                    <img src="/assets/generated/cancel-icon.dim_32x32.png" alt="" className="mr-2 h-6 w-6" />
                                    Cancel
                                </Button>
                            </div>
                            <p className="text-sm text-center text-muted-foreground">
                                Save your changes to update the pickup record, or cancel to discard all edits
                            </p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Pickup Record?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the following pickup record:
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {selectedPickup && (
                        <div className="border rounded-lg p-3 space-y-1 bg-accent/50">
                            <div className="font-semibold">
                                {format(new Date(Number(selectedPickup.pickupTime / BigInt(1000000))), 'h:mm a')}
                            </div>
                            <div className="text-sm">
                                {selectedPickup.streetAddress}
                                {selectedPickup.city && `, ${selectedPickup.city}`}
                            </div>
                            {selectedPickup.customerName && (
                                <div className="text-sm">Customer: {selectedPickup.customerName}</div>
                            )}
                        </div>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deletePickupMutation.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            disabled={deletePickupMutation.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deletePickupMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
