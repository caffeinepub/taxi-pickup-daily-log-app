import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TimePicker12hProps {
    value: { hour: number; minute: number; isPM: boolean };
    onChange: (value: { hour: number; minute: number; isPM: boolean }) => void;
    disabled?: boolean;
}

export default function TimePicker12h({ value, onChange, disabled }: TimePicker12hProps) {
    const [hour, setHour] = useState(value.hour);
    const [minute, setMinute] = useState(value.minute);
    const [isPM, setIsPM] = useState(value.isPM);

    // Sync with external value changes
    useEffect(() => {
        setHour(value.hour);
        setMinute(value.minute);
        setIsPM(value.isPM);
    }, [value]);

    const handleHourChange = (newHour: string) => {
        const h = parseInt(newHour, 10);
        setHour(h);
        onChange({ hour: h, minute, isPM });
    };

    const handleMinuteChange = (newMinute: string) => {
        const m = parseInt(newMinute, 10);
        setMinute(m);
        onChange({ hour, minute: m, isPM });
    };

    const handlePeriodChange = (newPeriod: string) => {
        const pm = newPeriod === 'PM';
        setIsPM(pm);
        onChange({ hour, minute, isPM: pm });
    };

    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    return (
        <div className="flex gap-2">
            <div className="flex-1">
                <Select
                    value={hour.toString()}
                    onValueChange={handleHourChange}
                    disabled={disabled}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Hour" />
                    </SelectTrigger>
                    <SelectContent>
                        {hours.map((h) => (
                            <SelectItem key={h} value={h.toString()}>
                                {h}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex-1">
                <Select
                    value={minute.toString()}
                    onValueChange={handleMinuteChange}
                    disabled={disabled}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Min" />
                    </SelectTrigger>
                    <SelectContent>
                        {minutes.map((m) => (
                            <SelectItem key={m} value={m.toString()}>
                                {String(m).padStart(2, '0')}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="w-24">
                <Select
                    value={isPM ? 'PM' : 'AM'}
                    onValueChange={handlePeriodChange}
                    disabled={disabled}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="AM">AM</SelectItem>
                        <SelectItem value="PM">PM</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
