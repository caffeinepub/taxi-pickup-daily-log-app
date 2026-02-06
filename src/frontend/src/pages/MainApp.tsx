import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PickupForm from '../components/PickupForm';
import PickupList from '../components/PickupList';
import { format } from 'date-fns';

export default function MainApp() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    // Convert date to timestamp range for backend (start and end of day in nanoseconds)
    const getDateRange = (date: Date): { fromDate: bigint; toDate: bigint } => {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        return {
            fromDate: BigInt(startOfDay.getTime()) * BigInt(1000000),
            toDate: BigInt(endOfDay.getTime()) * BigInt(1000000),
        };
    };

    const { fromDate, toDate } = getDateRange(selectedDate);

    return (
        <>
            <Header />
            <main className="flex-1">
                <div className="container mx-auto px-4 py-8 max-w-4xl">
                    <div className="space-y-10">
                        <section>
                            <div className="mb-6">
                                <h2 className="text-3xl font-bold tracking-tight mb-2">Record New Pickup</h2>
                                <p className="text-muted-foreground text-lg">
                                    Log your passenger details and trip information
                                </p>
                            </div>
                            <PickupForm 
                                selectedDate={selectedDate}
                                onDateChange={setSelectedDate}
                            />
                        </section>
                        <section>
                            <div className="mb-6">
                                <h2 className="text-3xl font-bold tracking-tight mb-2">
                                    Pickups for {format(selectedDate, 'MMMM d, yyyy')}
                                </h2>
                                <p className="text-muted-foreground text-lg">
                                    View all recorded trips for the selected date
                                </p>
                            </div>
                            <PickupList fromDate={fromDate} toDate={toDate} />
                        </section>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
