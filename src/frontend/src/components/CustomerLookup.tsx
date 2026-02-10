import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useGetCustomerSuggestions } from '../hooks/useQueries';
import type { Customer } from '../backend';

interface CustomerLookupProps {
    value: string;
    onSelect: (customer: Customer | null) => void;
    disabled?: boolean;
}

export default function CustomerLookup({ value, onSelect, disabled }: CustomerLookupProps) {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const { data: suggestions = [] } = useGetCustomerSuggestions(searchQuery);

    useEffect(() => {
        if (value) {
            setSearchQuery(value);
        }
    }, [value]);

    const handleSelect = (customer: Customer) => {
        onSelect(customer);
        setOpen(false);
    };

    const handleClear = () => {
        onSelect(null);
        setSearchQuery('');
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                    disabled={disabled}
                >
                    {value || 'Select existing or enter new customer...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent 
                className="w-[var(--radix-popover-trigger-width)] p-0 bg-popover text-popover-foreground border border-border shadow-lg"
                align="start"
                sideOffset={8}
                collisionPadding={16}
            >
                <Command>
                    <CommandInput
                        placeholder="Search by name, address, or phone..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                    />
                    <CommandList>
                        <CommandEmpty>No customers found.</CommandEmpty>
                        <CommandGroup>
                            {suggestions.map((customer) => (
                                <CommandItem
                                    key={`${customer.name}-${customer.phoneNumber}`}
                                    value={customer.name}
                                    onSelect={() => handleSelect(customer)}
                                >
                                    <Check
                                        className={cn(
                                            'mr-2 h-4 w-4',
                                            value === customer.name ? 'opacity-100' : 'opacity-0'
                                        )}
                                    />
                                    <div className="flex flex-col">
                                        <span className="font-medium">
                                            {customer.name} ({customer.phoneNumber})
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            {customer.streetAddress}, {customer.city}
                                        </span>
                                    </div>
                                </CommandItem>
                            ))}
                            {searchQuery && suggestions.length === 0 && (
                                <CommandItem onSelect={handleClear}>
                                    <span className="text-muted-foreground">Enter new customer details manually</span>
                                </CommandItem>
                            )}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
