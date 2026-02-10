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
import { Loader2, CalendarIcon, Trash2, Save } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useGetPickupsForDate, useUpdatePickup, useDeletePickup } from '../hooks/useQueries';
import { PaymentMethod, type Pickup } from '../backend';
import { toast } from 'sonner';
import { safeCurrency } from '../utils/numberFormat';
import { nanosToDate } from '../utils/pickupGuards';
import { calculateOwedDriver } from '../utils/owedDriver';

interface EditDeleteRecordDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function EditDeleteRecordDialog({ open, onOpenChange }: EditDeleteRecordDialogProps) {
    const [selectedPickup, setSelectedPickup] = useState<Pickup | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Date range for fetching pickups (last 30 days)
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30);

    const { data: pickups = [], isLoading } = useGetPickupsForDate(
        BigInt(fromDate.getTime()) * BigInt(1000000),
        BigInt(toDate.getTime()) * BigInt(1000000)
    );

    // Sort pickups by date descending
    const sortedPickups = [...pickups].sort((a, b) => Number(b.pickupDate - a.pickupDate));

    // Edit form state
    const [editForm, setEditForm] = useState({
        pickupDate: new Date(),
        pickupTime: '',
        customerName: '',
        streetAddress: '',
        city: '',
        phoneNumber: '',
        destinationAddress: '',
        meterTotal: '',
        meterPaymentMethod: PaymentMethod.cash,
        tip: '',
        tipPaymentMethod: PaymentMethod.cash,
    });

    const updatePickupMutation = useUpdatePickup();
    const deletePickupMutation = useDeletePickup();

    useEffect(() => {
        if (selectedPickup && isEditing) {
            const pickupDate = nanosToDate(selectedPickup.pickupDate);
            const pickupTime = nanosToDate(selectedPickup.pickupTime);

            setEditForm({
                pickupDate,
                pickupTime: format(pickupTime, 'HH:mm'),
                customerName: selectedPickup.customerName,
                streetAddress: selectedPickup.streetAddress,
                city: selectedPickup.city,
                phoneNumber: selectedPickup.phoneNumber,
                destinationAddress: selectedPickup.destinationAddress,
                meterTotal: selectedPickup.meterTotal.toString(),
                meterPaymentMethod: selectedPickup.meterPaymentMethod,
                tip: selectedPickup.tip.toString(),
                tipPaymentMethod: selectedPickup.tipPaymentMethod,
            });
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
    };

    const handleSaveEdit = async () => {
        if (!selectedPickup) return;

        try {
            const [hours, minutes] = editForm.pickupTime.split(':').map(Number);
            const pickupDateTime = new Date(editForm.pickupDate);
            pickupDateTime.setHours(hours, minutes, 0, 0);

            const pickupDateOnly = new Date(editForm.pickupDate);
            pickupDateOnly.setHours(0, 0, 0, 0);

            await updatePickupMutation.mutateAsync({
                pickupId: selectedPickup.id,
                pickupDate: BigInt(pickupDateOnly.getTime()) * BigInt(1000000),
                streetAddress: editForm.streetAddress,
                city: editForm.city,
                customerName: editForm.customerName,
                phoneNumber: editForm.phoneNumber,
                pickupTime: BigInt(pickupDateTime.getTime()) * BigInt(1000000),
                destinationAddress: editForm.destinationAddress,
                meterTotal: parseFloat(editForm.meterTotal),
                meterPaymentMethod: editForm.meterPaymentMethod,
                tip: parseFloat(editForm.tip),
                tipPaymentMethod: editForm.tipPaymentMethod,
            });

            toast.success('Pickup updated successfully');
            setIsEditing(false);
            setSelectedPickup(null);
        } catch (error: any) {
            toast.error(error.message || 'Failed to update pickup');
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
            setIsEditing(false);
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete pickup');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] edit-delete-dialog bg-card text-card-foreground border border-border shadow-lg">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <img 
                            src="/assets/generated/edit-icon-transparent.dim_32x32.png" 
                            alt="Edit" 
                            className="w-6 h-6"
                        />
                        Edit/Delete Record
                    </DialogTitle>
                    <DialogDescription>
                        Select a pickup to edit or delete (showing last 30 days)
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Pickup List */}
                        <div className="space-y-2">
                            <h3 className="font-semibold">Select Pickup</h3>
                            <ScrollArea className="h-[400px] border rounded-lg">
                                <div className="p-2 space-y-2">
                                    {sortedPickups.length === 0 ? (
                                        <p className="text-center text-muted-foreground py-8">
                                            No pickups found in the last 30 days
                                        </p>
                                    ) : (
                                        sortedPickups.map((pickup) => {
                                            const pickupDate = nanosToDate(pickup.pickupDate);
                                            const pickupTime = nanosToDate(pickup.pickupTime);
                                            const isSelected = selectedPickup?.id === pickup.id;

                                            return (
                                                <button
                                                    key={pickup.id.toString()}
                                                    onClick={() => handleSelectPickup(pickup)}
                                                    className={cn(
                                                        'w-full text-left p-3 rounded-lg border transition-colors',
                                                        isSelected
                                                            ? 'bg-primary/10 border-primary'
                                                            : 'hover:bg-muted border-border'
                                                    )}
                                                >
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between items-start">
                                                            <span className="font-medium">{pickup.customerName}</span>
                                                            <span className="text-sm text-muted-foreground">
                                                                {format(pickupDate, 'MMM d')}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {format(pickupTime, 'h:mm a')} • {safeCurrency(pickup.calculatedTotal)}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground truncate">
                                                            {pickup.streetAddress}, {pickup.city}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </ScrollArea>
                        </div>

                        {/* Details/Edit Panel */}
                        <div className="space-y-2">
                            {!selectedPickup ? (
                                <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                                    Select a pickup to view details
                                </div>
                            ) : isEditing ? (
                                <div className="space-y-4 edit-form-scroll h-[400px] pr-2">
                                    <h3 className="font-semibold">Edit Pickup</h3>

                                    <div className="space-y-2">
                                        <Label>Pickup Date *</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        'w-full justify-start text-left font-normal',
                                                        !editForm.pickupDate && 'text-muted-foreground'
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {editForm.pickupDate ? format(editForm.pickupDate, 'PPP') : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 radix-in-dialog-overlay bg-popover text-popover-foreground border border-border shadow-lg" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={editForm.pickupDate}
                                                    onSelect={(date) => date && setEditForm({ ...editForm, pickupDate: date })}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="edit-time">Pickup Time *</Label>
                                        <Input
                                            id="edit-time"
                                            type="time"
                                            value={editForm.pickupTime}
                                            onChange={(e) => setEditForm({ ...editForm, pickupTime: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="edit-customer">Customer Name *</Label>
                                        <Input
                                            id="edit-customer"
                                            value={editForm.customerName}
                                            onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="edit-street">Street Address *</Label>
                                        <Input
                                            id="edit-street"
                                            value={editForm.streetAddress}
                                            onChange={(e) => setEditForm({ ...editForm, streetAddress: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="edit-city">City *</Label>
                                        <Input
                                            id="edit-city"
                                            value={editForm.city}
                                            onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="edit-phone">Phone Number *</Label>
                                        <Input
                                            id="edit-phone"
                                            value={editForm.phoneNumber}
                                            onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="edit-destination">Destination Address *</Label>
                                        <Input
                                            id="edit-destination"
                                            value={editForm.destinationAddress}
                                            onChange={(e) => setEditForm({ ...editForm, destinationAddress: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="edit-meter">Meter Total *</Label>
                                        <Input
                                            id="edit-meter"
                                            type="number"
                                            step="0.01"
                                            value={editForm.meterTotal}
                                            onChange={(e) => setEditForm({ ...editForm, meterTotal: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Meter Payment Method *</Label>
                                        <Select
                                            value={editForm.meterPaymentMethod}
                                            onValueChange={(value) => setEditForm({ ...editForm, meterPaymentMethod: value as PaymentMethod })}
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
                                            value={editForm.tip}
                                            onChange={(e) => setEditForm({ ...editForm, tip: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Tip Payment Method *</Label>
                                        <Select
                                            value={editForm.tipPaymentMethod}
                                            onValueChange={(value) => setEditForm({ ...editForm, tipPaymentMethod: value as PaymentMethod })}
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
                                            onClick={handleSaveEdit}
                                            disabled={updatePickupMutation.isPending}
                                            className="flex-1"
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
                                            variant="outline"
                                            onClick={handleCancelEdit}
                                            disabled={updatePickupMutation.isPending}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <h3 className="font-semibold">Pickup Details</h3>
                                    <div className="space-y-3 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Date:</span>
                                            <span className="ml-2 font-medium">
                                                {format(nanosToDate(selectedPickup.pickupDate), 'PPP')}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Time:</span>
                                            <span className="ml-2 font-medium">
                                                {format(nanosToDate(selectedPickup.pickupTime), 'h:mm a')}
                                            </span>
                                        </div>
                                        <Separator />
                                        <div>
                                            <span className="text-muted-foreground">Customer:</span>
                                            <span className="ml-2 font-medium">{selectedPickup.customerName}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Phone:</span>
                                            <span className="ml-2 font-medium">{selectedPickup.phoneNumber}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Pickup:</span>
                                            <span className="ml-2 font-medium">
                                                {selectedPickup.streetAddress}, {selectedPickup.city}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Destination:</span>
                                            <span className="ml-2 font-medium">{selectedPickup.destinationAddress}</span>
                                        </div>
                                        <Separator />
                                        <div>
                                            <span className="text-muted-foreground">Meter Total:</span>
                                            <span className="ml-2 font-medium">
                                                {safeCurrency(selectedPickup.meterTotal)} ({selectedPickup.meterPaymentMethod})
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Tip:</span>
                                            <span className="ml-2 font-medium">
                                                {safeCurrency(selectedPickup.tip)} ({selectedPickup.tipPaymentMethod})
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Total:</span>
                                            <span className="ml-2 font-semibold text-primary">
                                                {safeCurrency(selectedPickup.calculatedTotal)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-4">
                                        <Button onClick={handleEdit} className="flex-1">
                                            <img 
                                                src="/assets/generated/edit-icon-transparent.dim_32x32.png" 
                                                alt="Edit" 
                                                className="w-4 h-4 mr-2"
                                            />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            onClick={handleDelete}
                                            disabled={deletePickupMutation.isPending}
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
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
