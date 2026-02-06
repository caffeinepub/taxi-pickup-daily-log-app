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
                    <div className="flex-1">
                        <CardTitle className="text-2xl font-bold">New Pickup</CardTitle>
                        <CardDescription className="text-base mt-1">
                            Record passenger details and trip information
                        </CardDescription>
                    </div>
                </div>
                <Separator className="bg-primary/10" />
            </CardHeader>
            <CardContent className="pb-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Pickup Date Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="p-1.5 rounded-lg bg-primary/10">
                                <img 
                                    src="/assets/generated/calendar-icon.dim_32x32.png" 
                                    alt="Calendar" 
                                    className="w-5 h-5"
                                />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">Pickup Date</h3>
                        </div>
                        <div className="space-y-2.5 pl-9">
                            <Label 
                                htmlFor="pickupDate" 
                                className="text-sm font-medium text-muted-foreground"
                            >
                                Date (for new pickup and viewing list) <span className="text-destructive">*</span>
                            </Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="pickupDate"
                                        variant="outline"
                                        className={cn(
                                            "w-full h-11 justify-start text-left font-normal border-2 focus-visible:ring-2 focus-visible:ring-primary/20",
                                            !selectedDate && "text-muted-foreground"
                                        )}
                                        disabled={recordPickupMutation.isPending}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={(date) => date && onDateChange(date)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <p className="text-xs text-muted-foreground pl-1">
                                This date will be saved with the new pickup and used to filter the pickup list below
                            </p>
                        </div>
                    </div>

                    <Separator className="bg-border/50" />

                    {/* Pickup Location Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="p-1.5 rounded-lg bg-primary/10">
                                <img 
                                    src="/assets/generated/pickup-location-icon.dim_32x32.png" 
                                    alt="Pickup" 
                                    className="w-5 h-5"
                                />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">Pickup Location</h3>
                        </div>
                        <div className="space-y-4 pl-9">
                            <div className="space-y-2.5">
                                <Label 
                                    htmlFor="streetAddress" 
                                    className="text-sm font-medium text-muted-foreground"
                                >
                                    Street Address <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="streetAddress"
                                    placeholder="Enter street address (e.g., 123 Main St)"
                                    value={streetAddress}
                                    onChange={(e) => handleStreetAddressChange(e.target.value)}
                                    disabled={recordPickupMutation.isPending}
                                    className="h-11 text-base border-2 focus-visible:ring-2 focus-visible:ring-primary/20"
                                    required
                                />
                            </div>
                            <div className="space-y-2.5">
                                <Label 
                                    htmlFor="city" 
                                    className="text-sm font-medium text-muted-foreground"
                                >
                                    City
                                </Label>
                                <Input
                                    id="city"
                                    placeholder="Enter city (optional)"
                                    value={city}
                                    onChange={(e) => handleCityChange(e.target.value)}
                                    disabled={recordPickupMutation.isPending}
                                    className="h-11 text-base border-2 focus-visible:ring-2 focus-visible:ring-primary/20"
                                />
                            </div>
                        </div>
                    </div>

                    <Separator className="bg-border/50" />

                    {/* Customer Information Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="p-1.5 rounded-lg bg-primary/10">
                                <img 
                                    src="/assets/generated/customer-icon.dim_32x32.png" 
                                    alt="Customer" 
                                    className="w-5 h-5"
                                />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">Customer Information</h3>
                        </div>
                        <div className="space-y-4 pl-9">
                            <div className="space-y-2.5">
                                <Label 
                                    htmlFor="customerName" 
                                    className="text-sm font-medium text-muted-foreground"
                                >
                                    Name
                                </Label>
                                <CustomerLookup
                                    value={customerName}
                                    onChange={setCustomerName}
                                    disabled={recordPickupMutation.isPending}
                                />
                            </div>
                            <div className="space-y-2.5">
                                <Label 
                                    htmlFor="phoneNumber" 
                                    className="text-sm font-medium text-muted-foreground"
                                >
                                    Phone Number
                                </Label>
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                                        <img 
                                            src="/assets/generated/phone-icon.dim_32x32.png" 
                                            alt="Phone" 
                                            className="w-4 h-4"
                                        />
                                    </div>
                                    <Input
                                        id="phoneNumber"
                                        type="tel"
                                        placeholder="Enter phone number (optional)"
                                        value={phoneNumber}
                                        onChange={(e) => handlePhoneNumberChange(e.target.value)}
                                        disabled={recordPickupMutation.isPending}
                                        className="h-11 text-base border-2 focus-visible:ring-2 focus-visible:ring-primary/20"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator className="bg-border/50" />

                    {/* Pickup Time Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="p-1.5 rounded-lg bg-primary/10">
                                <img 
                                    src="/assets/generated/time-icon.dim_32x32.png" 
                                    alt="Time" 
                                    className="w-5 h-5"
                                />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">Pickup Time</h3>
                        </div>
                        <div className="space-y-2.5 pl-9">
                            <Label 
                                htmlFor="pickupTime" 
                                className="text-sm font-medium text-muted-foreground"
                            >
                                Time <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="pickupTime"
                                type="time"
                                value={pickupTime}
                                onChange={(e) => setPickupTime(e.target.value)}
                                disabled={recordPickupMutation.isPending}
                                className="h-11 text-base border-2 focus-visible:ring-2 focus-visible:ring-primary/20"
                                required
                            />
                            <p className="text-xs text-muted-foreground pl-1">
                                Enter the pickup time for this trip (defaults to 20 minutes from now)
                            </p>
                        </div>
                    </div>

                    <Separator className="bg-border/50" />

                    {/* Destination Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="p-1.5 rounded-lg bg-primary/10">
                                <img 
                                    src="/assets/generated/destination-icon.dim_32x32.png" 
                                    alt="Destination" 
                                    className="w-5 h-5"
                                />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">Destination</h3>
                        </div>
                        <div className="space-y-2.5 pl-9">
                            <Label 
                                htmlFor="destinationAddress" 
                                className="text-sm font-medium text-muted-foreground"
                            >
                                Address <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="destinationAddress"
                                placeholder="Enter destination address"
                                value={destinationAddress}
                                onChange={(e) => setDestinationAddress(e.target.value)}
                                disabled={recordPickupMutation.isPending}
                                className="h-11 text-base border-2 focus-visible:ring-2 focus-visible:ring-primary/20"
                                required
                            />
                        </div>
                    </div>

                    <Separator className="bg-border/50" />

                    {/* Fare Information Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="p-1.5 rounded-lg bg-primary/10">
                                <DollarSign className="w-5 h-5 text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">Fare Information</h3>
                        </div>
                        <div className="space-y-4 pl-9">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2.5">
                                    <Label 
                                        htmlFor="meterTotal" 
                                        className="text-sm font-medium text-muted-foreground"
                                    >
                                        Meter Total
                                    </Label>
                                    <Input
                                        id="meterTotal"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00 (optional)"
                                        value={meterTotal}
                                        onChange={(e) => setMeterTotal(e.target.value)}
                                        disabled={recordPickupMutation.isPending}
                                        className="h-11 text-base border-2 focus-visible:ring-2 focus-visible:ring-primary/20"
                                    />
                                </div>
                                <div className="space-y-2.5">
                                    <Label 
                                        htmlFor="paymentMethod" 
                                        className="text-sm font-medium text-muted-foreground"
                                    >
                                        Payment Method
                                    </Label>
                                    <Select
                                        value={paymentMethod}
                                        onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                                        disabled={recordPickupMutation.isPending}
                                    >
                                        <SelectTrigger 
                                            id="paymentMethod"
                                            className="h-11 text-base border-2 focus-visible:ring-2 focus-visible:ring-primary/20"
                                        >
                                            <SelectValue placeholder="Select payment method" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={PaymentMethod.cash}>Cash</SelectItem>
                                            <SelectItem value={PaymentMethod.credit}>Credit</SelectItem>
                                            <SelectItem value={PaymentMethod.voucher}>Voucher</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2.5">
                                    <Label 
                                        htmlFor="tip" 
                                        className="text-sm font-medium text-muted-foreground"
                                    >
                                        Tip
                                    </Label>
                                    <Input
                                        id="tip"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00 (optional)"
                                        value={tip}
                                        onChange={(e) => setTip(e.target.value)}
                                        disabled={recordPickupMutation.isPending}
                                        className="h-11 text-base border-2 focus-visible:ring-2 focus-visible:ring-primary/20"
                                    />
                                </div>
                                <div className="space-y-2.5">
                                    <Label 
                                        htmlFor="tipPaymentMethod" 
                                        className="text-sm font-medium text-muted-foreground"
                                    >
                                        Tip Payment Method
                                    </Label>
                                    <Select
                                        value={tipPaymentMethod}
                                        onValueChange={(value) => setTipPaymentMethod(value as PaymentMethod)}
                                        disabled={recordPickupMutation.isPending}
                                    >
                                        <SelectTrigger 
                                            id="tipPaymentMethod"
                                            className="h-11 text-base border-2 focus-visible:ring-2 focus-visible:ring-primary/20"
                                        >
                                            <SelectValue placeholder="Select tip payment method" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={PaymentMethod.cash}>Cash</SelectItem>
                                            <SelectItem value={PaymentMethod.credit}>Credit</SelectItem>
                                            <SelectItem value={PaymentMethod.voucher}>Voucher</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2.5">
                                <Label 
                                    htmlFor="calculatedTotal" 
                                    className="text-sm font-medium text-muted-foreground"
                                >
                                    Calculated Total
                                </Label>
                                <div className="h-11 px-3 py-2 rounded-md border-2 border-muted bg-muted/50 flex items-center text-base font-semibold text-foreground">
                                    ${calculatedTotal.toFixed(2)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator className="bg-border/50" />

                    {/* Submit Button */}
                    <div className="pt-2">
                        <Button
                            type="submit"
                            size="lg"
                            className="w-full h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all"
                            disabled={recordPickupMutation.isPending}
                        >
                            {recordPickupMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Recording Pickup...
                                </>
                            ) : (
                                <>
                                    <Clock className="mr-2 h-5 w-5" />
                                    Record Pickup
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
