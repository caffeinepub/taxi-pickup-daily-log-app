import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Loader2, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRecordPickup } from '../hooks/useQueries';
import { PaymentMethod, type Customer } from '../backend';
import { toast } from 'sonner';
import CustomerLookup from './CustomerLookup';
import { useActorReady } from '../hooks/useActorReady';

interface PickupFormProps {
    selectedDate: Date;
    onPickupRecorded: () => void;
}

export default function PickupForm({ selectedDate, onPickupRecorded }: PickupFormProps) {
    const [pickupDate, setPickupDate] = useState<Date>(selectedDate);
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

    const recordPickupMutation = useRecordPickup();
    const { isReady } = useActorReady();

    const handleCustomerSelect = (customer: Customer | null) => {
        if (customer) {
            setCustomerName(customer.name);
            setStreetAddress(customer.streetAddress);
            setCity(customer.city);
            setPhoneNumber(customer.phoneNumber);
        } else {
            setCustomerName('');
            setStreetAddress('');
            setCity('');
            setPhoneNumber('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!pickupTime || !customerName || !streetAddress || !city || !phoneNumber || !destinationAddress || !meterTotal || !tip) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            const [hours, minutes] = pickupTime.split(':').map(Number);
            const pickupDateTime = new Date(pickupDate);
            pickupDateTime.setHours(hours, minutes, 0, 0);

            const pickupDateOnly = new Date(pickupDate);
            pickupDateOnly.setHours(0, 0, 0, 0);

            await recordPickupMutation.mutateAsync({
                pickupDate: BigInt(pickupDateOnly.getTime()) * BigInt(1000000),
                streetAddress,
                city,
                customerName,
                phoneNumber,
                pickupTime: BigInt(pickupDateTime.getTime()) * BigInt(1000000),
                destinationAddress,
                meterTotal: parseFloat(meterTotal),
                paymentMethod: meterPaymentMethod,
                tip: parseFloat(tip),
                tipPaymentMethod,
            });

            toast.success('Pickup recorded successfully');
            
            // Reset form
            setPickupTime('');
            setCustomerName('');
            setStreetAddress('');
            setCity('');
            setPhoneNumber('');
            setDestinationAddress('');
            setMeterTotal('');
            setMeterPaymentMethod(PaymentMethod.cash);
            setTip('');
            setTipPaymentMethod(PaymentMethod.cash);

            onPickupRecorded();
        } catch (error: any) {
            toast.error(error.message || 'Failed to record pickup');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>
                        <img 
                            src="/assets/generated/calendar-icon.dim_32x32.png" 
                            alt="Calendar" 
                            className="w-4 h-4 inline mr-2"
                        />
                        Pickup Date *
                    </Label>
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
                        <PopoverContent className="w-auto p-0 bg-popover text-popover-foreground border border-border shadow-lg" align="start">
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
                    <Label htmlFor="pickupTime">
                        <img 
                            src="/assets/generated/time-icon.dim_32x32.png" 
                            alt="Time" 
                            className="w-4 h-4 inline mr-2"
                        />
                        Pickup Time *
                    </Label>
                    <Input
                        id="pickupTime"
                        type="time"
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                        required
                        disabled={!isReady}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label>
                    <img 
                        src="/assets/generated/customer-icon.dim_32x32.png" 
                        alt="Customer" 
                        className="w-4 h-4 inline mr-2"
                    />
                    Customer Lookup
                </Label>
                <CustomerLookup
                    value={customerName}
                    onSelect={handleCustomerSelect}
                    disabled={!isReady}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="streetAddress">
                        <img 
                            src="/assets/generated/pickup-location-icon.dim_32x32.png" 
                            alt="Location" 
                            className="w-4 h-4 inline mr-2"
                        />
                        Street Address *
                    </Label>
                    <Input
                        id="streetAddress"
                        value={streetAddress}
                        onChange={(e) => setStreetAddress(e.target.value)}
                        placeholder="123 Main St"
                        required
                        disabled={!isReady}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Springfield"
                        required
                        disabled={!isReady}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="phoneNumber">
                    <img 
                        src="/assets/generated/phone-icon.dim_32x32.png" 
                        alt="Phone" 
                        className="w-4 h-4 inline mr-2"
                    />
                    Phone Number *
                </Label>
                <Input
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="555-1234"
                    required
                    disabled={!isReady}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="destinationAddress">
                    <img 
                        src="/assets/generated/destination-icon.dim_32x32.png" 
                        alt="Destination" 
                        className="w-4 h-4 inline mr-2"
                    />
                    Destination Address *
                </Label>
                <Input
                    id="destinationAddress"
                    value={destinationAddress}
                    onChange={(e) => setDestinationAddress(e.target.value)}
                    placeholder="456 Oak Ave"
                    required
                    disabled={!isReady}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="meterTotal">Meter Total *</Label>
                    <Input
                        id="meterTotal"
                        type="number"
                        step="0.01"
                        value={meterTotal}
                        onChange={(e) => setMeterTotal(e.target.value)}
                        placeholder="0.00"
                        required
                        disabled={!isReady}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Meter Payment Method *</Label>
                    <Select
                        value={meterPaymentMethod}
                        onValueChange={(value) => setMeterPaymentMethod(value as PaymentMethod)}
                        disabled={!isReady}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover text-popover-foreground border border-border shadow-lg">
                            <SelectItem value={PaymentMethod.cash}>Cash</SelectItem>
                            <SelectItem value={PaymentMethod.credit}>Credit</SelectItem>
                            <SelectItem value={PaymentMethod.voucher}>Voucher</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="tip">Tip *</Label>
                    <Input
                        id="tip"
                        type="number"
                        step="0.01"
                        value={tip}
                        onChange={(e) => setTip(e.target.value)}
                        placeholder="0.00"
                        required
                        disabled={!isReady}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Tip Payment Method *</Label>
                    <Select
                        value={tipPaymentMethod}
                        onValueChange={(value) => setTipPaymentMethod(value as PaymentMethod)}
                        disabled={!isReady}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover text-popover-foreground border border-border shadow-lg">
                            <SelectItem value={PaymentMethod.cash}>Cash</SelectItem>
                            <SelectItem value={PaymentMethod.credit}>Credit</SelectItem>
                            <SelectItem value={PaymentMethod.voucher}>Voucher</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Button
                type="submit"
                className="w-full"
                disabled={recordPickupMutation.isPending || !isReady}
            >
                {recordPickupMutation.isPending ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Recording...
                    </>
                ) : !isReady ? (
                    'Connecting...'
                ) : (
                    'Record Pickup'
                )}
            </Button>
        </form>
    );
}
