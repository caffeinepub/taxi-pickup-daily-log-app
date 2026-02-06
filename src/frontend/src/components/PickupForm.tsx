import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Clock, DollarSign, CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRecordPickup, useFindCustomerByAddress, useFindCustomerByPhoneNumber } from '../hooks/useQueries';
import { useActorReady } from '../hooks/useActorReady';
import { PaymentMethod } from '../backend';
import CustomerLookup from './CustomerLookup';

interface PickupFormProps {
    selectedDate: Date;
    onDateChange: (date: Date) => void;
}

export default function PickupForm({ selectedDate, onDateChange }: PickupFormProps) {
    const [streetAddress, setStreetAddress] = useState('');
    const [city, setCity] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [destinationAddress, setDestinationAddress] = useState('');
    const [pickupTime, setPickupTime] = useState('');
    const [meterTotal, setMeterTotal] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.cash);
    const [tip, setTip] = useState('');
    const [tipPaymentMethod, setTipPaymentMethod] = useState<PaymentMethod>(PaymentMethod.cash);
    const [addressLookupEnabled, setAddressLookupEnabled] = useState(false);
    const [phoneLookupEnabled, setPhoneLookupEnabled] = useState(false);

    const recordPickupMutation = useRecordPickup();
    const { isReady } = useActorReady();

    // Lookup customer by address
    const { data: customerByAddress } = useFindCustomerByAddress(
        addressLookupEnabled ? streetAddress : '',
        addressLookupEnabled ? city : ''
    );

    // Lookup customer by phone number
    const { data: customerByPhone } = useFindCustomerByPhoneNumber(
        phoneLookupEnabled ? phoneNumber : ''
    );

    // Calculate total
    const calculatedTotal = (parseFloat(meterTotal) || 0) + (parseFloat(tip) || 0);

    // Set default pickup time to 20 minutes from now when component mounts
    useEffect(() => {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 20);
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        setPickupTime(`${hours}:${minutes}`);
    }, []);

    // Auto-populate customer name when address matches
    useEffect(() => {
        if (customerByAddress && streetAddress.trim()) {
            setCustomerName(customerByAddress.name);
            if (customerByAddress.phoneNumber) {
                setPhoneNumber(customerByAddress.phoneNumber);
            }
            setAddressLookupEnabled(false);
        }
    }, [customerByAddress, streetAddress]);

    // Auto-populate customer name and address when phone number matches
    useEffect(() => {
        if (customerByPhone && phoneNumber.trim()) {
            setCustomerName(customerByPhone.name);
            if (customerByPhone.streetAddress) {
                setStreetAddress(customerByPhone.streetAddress);
            }
            if (customerByPhone.city) {
                setCity(customerByPhone.city);
            }
            setPhoneLookupEnabled(false);
        }
    }, [customerByPhone, phoneNumber]);

    // Sync tip payment method with meter payment method by default
    useEffect(() => {
        setTipPaymentMethod(paymentMethod);
    }, [paymentMethod]);

    const handleStreetAddressChange = (value: string) => {
        setStreetAddress(value);
        // Enable lookup after user stops typing (debounced by query)
        if (value.trim().length > 2) {
            setAddressLookupEnabled(true);
        }
    };

    const handleCityChange = (value: string) => {
        setCity(value);
        // Enable lookup when city is entered along with street address
        if (value.trim().length > 0 && streetAddress.trim().length > 2) {
            setAddressLookupEnabled(true);
        }
    };

    const handlePhoneNumberChange = (value: string) => {
        setPhoneNumber(value);
        // Enable lookup after user enters enough digits
        if (value.trim().length > 3) {
            setPhoneLookupEnabled(true);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate required fields
        if (!streetAddress.trim() || !destinationAddress.trim()) {
            toast.error('Please fill in Street Address and Destination Address (required fields)');
            return;
        }

        if (!selectedDate) {
            toast.error('Please select a pickup date (required field)');
            return;
        }

        if (!pickupTime.trim()) {
            toast.error('Please enter a pickup time (required field)');
            return;
        }

        const meterTotalValue = parseFloat(meterTotal) || 0;
        const tipValue = parseFloat(tip) || 0;

        if (meterTotalValue < 0 || tipValue < 0) {
            toast.error('Meter total and tip must be positive numbers');
            return;
        }

        try {
            // Capture the current selectedDate at the time of submission
            // This ensures the pickup is recorded with the date shown in the form
            const pickupDateCopy = new Date(selectedDate);
            pickupDateCopy.setHours(0, 0, 0, 0);
            const pickupDateTimestamp = BigInt(pickupDateCopy.getTime()) * BigInt(1000000);

            // Convert pickup time (HH:MM) to timestamp
            // Parse the time string and combine with the selected date
            const [hours, minutes] = pickupTime.split(':').map(Number);
            const pickupDateTime = new Date(selectedDate);
            pickupDateTime.setHours(hours, minutes, 0, 0);
            const pickupTimeTimestamp = BigInt(pickupDateTime.getTime()) * BigInt(1000000);

            await recordPickupMutation.mutateAsync({
                pickupDate: pickupDateTimestamp,
                streetAddress: streetAddress.trim(),
                city: city.trim(),
                customerName: customerName.trim(),
                phoneNumber: phoneNumber.trim(),
                pickupTime: pickupTimeTimestamp,
                destinationAddress: destinationAddress.trim(),
                meterTotal: meterTotalValue,
                paymentMethod: paymentMethod,
                tip: tipValue,
                tipPaymentMethod: tipPaymentMethod,
            });

            toast.success('Pickup recorded successfully');
            
            // Reset form fields but keep the pickup time for convenience
            setStreetAddress('');
            setCity('');
            setCustomerName('');
            setPhoneNumber('');
            setDestinationAddress('');
            setMeterTotal('');
            setPaymentMethod(PaymentMethod.cash);
            setTip('');
            setTipPaymentMethod(PaymentMethod.cash);
            setAddressLookupEnabled(false);
            setPhoneLookupEnabled(false);
            // Keep the pickup time as-is so user can reuse it for the next entry
        } catch (error) {
            toast.error('Failed to record pickup');
            console.error('Error recording pickup:', error);
        }
    };

    const isFormDisabled = recordPickupMutation.isPending || !isReady;

    return (
        <Card className="shadow-lg border-2 border-primary/10 hover:border-primary/20 transition-colors">
            <CardHeader className="space-y-3 pb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 ring-2 ring-primary/20">
                        <img 
                            src="/assets/generated/taxi-icon.dim_64x64.png" 
                            alt="Taxi" 
                            className="w-8 h-8"
                        />
                    </div>
                    <div>
                        <CardTitle className="text-2xl">Record Pickup</CardTitle>
                        <CardDescription>Enter pickup details</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Pickup Date */}
                    <div className="space-y-2">
                        <Label htmlFor="pickupDate" className="flex items-center gap-2">
                            <img 
                                src="/assets/generated/calendar-icon.dim_32x32.png" 
                                alt="Calendar" 
                                className="w-4 h-4"
                            />
                            Pickup Date <span className="text-destructive">*</span>
                        </Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="pickupDate"
                                    variant="outline"
                                    className={cn(
                                        'w-full justify-start text-left font-normal h-11',
                                        !selectedDate && 'text-muted-foreground'
                                    )}
                                    disabled={isFormDisabled}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={(date) => date && onDateChange(date)}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Pickup Time */}
                    <div className="space-y-2">
                        <Label htmlFor="pickupTime" className="flex items-center gap-2">
                            <img 
                                src="/assets/generated/time-icon.dim_32x32.png" 
                                alt="Time" 
                                className="w-4 h-4"
                            />
                            Pickup Time <span className="text-destructive">*</span>
                        </Label>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <Input
                                id="pickupTime"
                                type="time"
                                value={pickupTime}
                                onChange={(e) => setPickupTime(e.target.value)}
                                disabled={isFormDisabled}
                                className="h-11"
                            />
                        </div>
                    </div>

                    <Separator />

                    {/* Customer Lookup */}
                    <CustomerLookup
                        value={customerName}
                        onChange={(name) => setCustomerName(name)}
                        disabled={isFormDisabled}
                    />

                    {/* Street Address */}
                    <div className="space-y-2">
                        <Label htmlFor="streetAddress" className="flex items-center gap-2">
                            <img 
                                src="/assets/generated/pickup-location-icon.dim_32x32.png" 
                                alt="Pickup Location" 
                                className="w-4 h-4"
                            />
                            Street Address <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="streetAddress"
                            placeholder="123 Main St"
                            value={streetAddress}
                            onChange={(e) => handleStreetAddressChange(e.target.value)}
                            disabled={isFormDisabled}
                            className="h-11"
                        />
                    </div>

                    {/* City */}
                    <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                            id="city"
                            placeholder="City name"
                            value={city}
                            onChange={(e) => handleCityChange(e.target.value)}
                            disabled={isFormDisabled}
                            className="h-11"
                        />
                    </div>

                    {/* Customer Name */}
                    <div className="space-y-2">
                        <Label htmlFor="customerName" className="flex items-center gap-2">
                            <img 
                                src="/assets/generated/customer-icon.dim_32x32.png" 
                                alt="Customer" 
                                className="w-4 h-4"
                            />
                            Customer Name
                        </Label>
                        <Input
                            id="customerName"
                            placeholder="John Doe"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            disabled={isFormDisabled}
                            className="h-11"
                        />
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-2">
                        <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                            <img 
                                src="/assets/generated/phone-icon.dim_32x32.png" 
                                alt="Phone" 
                                className="w-4 h-4"
                            />
                            Phone Number
                        </Label>
                        <Input
                            id="phoneNumber"
                            type="tel"
                            placeholder="555-1234"
                            value={phoneNumber}
                            onChange={(e) => handlePhoneNumberChange(e.target.value)}
                            disabled={isFormDisabled}
                            className="h-11"
                        />
                    </div>

                    {/* Destination Address */}
                    <div className="space-y-2">
                        <Label htmlFor="destinationAddress" className="flex items-center gap-2">
                            <img 
                                src="/assets/generated/destination-icon.dim_32x32.png" 
                                alt="Destination" 
                                className="w-4 h-4"
                            />
                            Destination Address <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="destinationAddress"
                            placeholder="456 Oak Ave"
                            value={destinationAddress}
                            onChange={(e) => setDestinationAddress(e.target.value)}
                            disabled={isFormDisabled}
                            className="h-11"
                        />
                    </div>

                    <Separator />

                    {/* Meter Total */}
                    <div className="space-y-2">
                        <Label htmlFor="meterTotal" className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Meter Total
                        </Label>
                        <Input
                            id="meterTotal"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={meterTotal}
                            onChange={(e) => setMeterTotal(e.target.value)}
                            disabled={isFormDisabled}
                            className="h-11"
                        />
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-2">
                        <Label htmlFor="paymentMethod">Meter Payment Method</Label>
                        <Select
                            value={paymentMethod}
                            onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                            disabled={isFormDisabled}
                        >
                            <SelectTrigger id="paymentMethod" className="h-11">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={PaymentMethod.cash}>Cash</SelectItem>
                                <SelectItem value={PaymentMethod.credit}>Credit</SelectItem>
                                <SelectItem value={PaymentMethod.voucher}>Voucher</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Tip */}
                    <div className="space-y-2">
                        <Label htmlFor="tip" className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Tip
                        </Label>
                        <Input
                            id="tip"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={tip}
                            onChange={(e) => setTip(e.target.value)}
                            disabled={isFormDisabled}
                            className="h-11"
                        />
                    </div>

                    {/* Tip Payment Method */}
                    <div className="space-y-2">
                        <Label htmlFor="tipPaymentMethod">Tip Payment Method</Label>
                        <Select
                            value={tipPaymentMethod}
                            onValueChange={(value) => setTipPaymentMethod(value as PaymentMethod)}
                            disabled={isFormDisabled}
                        >
                            <SelectTrigger id="tipPaymentMethod" className="h-11">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={PaymentMethod.cash}>Cash</SelectItem>
                                <SelectItem value={PaymentMethod.credit}>Credit</SelectItem>
                                <SelectItem value={PaymentMethod.voucher}>Voucher</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Calculated Total */}
                    <div className="rounded-lg bg-muted/50 p-4 border-2 border-primary/20">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold">Calculated Total:</span>
                            <span className="text-2xl font-bold text-primary">
                                ${calculatedTotal.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        size="lg"
                        className="w-full h-12 text-base font-semibold"
                        disabled={isFormDisabled}
                    >
                        {recordPickupMutation.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Recording...
                            </>
                        ) : !isReady ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Connecting...
                            </>
                        ) : (
                            'Record Pickup'
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
