import { useState, useEffect } from 'react';
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
import TimePicker12h from './TimePicker12h';
import { useActorReady } from '../hooks/useActorReady';
import { safeParseFloat } from '../utils/numberFormat';
import { getErrorMessage } from '../utils/errorMessage';
import { getCurrentPacificTime, pacificTimeToNanos, getPacificDayGrouping } from '../utils/pickupGuards';

interface PickupFormProps {
    selectedDate: Date;
    onPickupRecorded: () => void;
}

export default function PickupForm({ selectedDate, onPickupRecorded }: PickupFormProps) {
    const [pickupDate, setPickupDate] = useState<Date>(selectedDate);
    const [pickupTime, setPickupTime] = useState(getCurrentPacificTime());
    const [customerName, setCustomerName] = useState('');
    const [streetAddress, setStreetAddress] = useState('');
    const [city, setCity] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [destinationAddress, setDestinationAddress] = useState('');
    const [meterTotal, setMeterTotal] = useState('');
    const [meterPaymentMethod, setMeterPaymentMethod] = useState<PaymentMethod>(PaymentMethod.cash);
    const [tip, setTip] = useState('');
    const [tipPaymentMethod, setTipPaymentMethod] = useState<PaymentMethod>(PaymentMethod.cash);
    const [tipManuallyChanged, setTipManuallyChanged] = useState(false);

    const recordPickupMutation = useRecordPickup();
    const { isReady } = useActorReady();

    // Update pickupDate when selectedDate changes
    useEffect(() => {
        setPickupDate(selectedDate);
    }, [selectedDate]);

    // Auto-sync tip payment method to meter payment method for new entries
    useEffect(() => {
        if (!tipManuallyChanged) {
            setTipPaymentMethod(meterPaymentMethod);
        }
    }, [meterPaymentMethod, tipManuallyChanged]);

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

    const handleTipPaymentMethodChange = (value: PaymentMethod) => {
        setTipPaymentMethod(value);
        setTipManuallyChanged(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate only required fields: pickupTime, streetAddress, city (pickup location), and destinationAddress
        const missingFields: string[] = [];
        
        if (!pickupTime) {
            missingFields.push('Pickup Time');
        }
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

        // Parse optional numeric fields with safe defaults
        const parsedMeterTotal = meterTotal.trim() === '' ? 0 : safeParseFloat(meterTotal);
        const parsedTip = tip.trim() === '' ? 0 : safeParseFloat(tip);

        // Validate numeric fields if they were provided
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

            await recordPickupMutation.mutateAsync({
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

            toast.success('Pickup recorded successfully');
            
            // Reset form with current time as default
            setPickupTime(getCurrentPacificTime());
            setCustomerName('');
            setStreetAddress('');
            setCity('');
            setPhoneNumber('');
            setDestinationAddress('');
            setMeterTotal('');
            setMeterPaymentMethod(PaymentMethod.cash);
            setTip('');
            setTipPaymentMethod(PaymentMethod.cash);
            setTipManuallyChanged(false);

            onPickupRecorded();
        } catch (error: unknown) {
            const errorMsg = getErrorMessage(error);
            toast.error(errorMsg || 'Failed to record pickup');
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
                        Pickup Date
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
                    <Label>
                        <img 
                            src="/assets/generated/time-icon.dim_32x32.png" 
                            alt="Time" 
                            className="w-4 h-4 inline mr-2"
                        />
                        Pickup Time *
                    </Label>
                    <TimePicker12h
                        value={pickupTime}
                        onChange={setPickupTime}
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
                    Phone Number
                </Label>
                <Input
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="555-1234"
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
                    disabled={!isReady}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="meterTotal">Meter Total</Label>
                    <Input
                        id="meterTotal"
                        type="number"
                        step="0.01"
                        value={meterTotal}
                        onChange={(e) => setMeterTotal(e.target.value)}
                        placeholder="0.00"
                        disabled={!isReady}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="meterPaymentMethod">Meter Payment Method</Label>
                    <Select
                        value={meterPaymentMethod}
                        onValueChange={(value) => setMeterPaymentMethod(value as PaymentMethod)}
                        disabled={!isReady}
                    >
                        <SelectTrigger id="meterPaymentMethod">
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
                    <Label htmlFor="tip">Tip</Label>
                    <Input
                        id="tip"
                        type="number"
                        step="0.01"
                        value={tip}
                        onChange={(e) => setTip(e.target.value)}
                        placeholder="0.00"
                        disabled={!isReady}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="tipPaymentMethod">Tip Payment Method</Label>
                    <Select
                        value={tipPaymentMethod}
                        onValueChange={handleTipPaymentMethodChange}
                        disabled={!isReady}
                    >
                        <SelectTrigger id="tipPaymentMethod">
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
