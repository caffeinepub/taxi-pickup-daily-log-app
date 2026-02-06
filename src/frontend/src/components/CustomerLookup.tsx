import { useState, useEffect } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, UserPlus, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGetCustomerSuggestions } from '../hooks/useQueries';

interface CustomerLookupProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

export default function CustomerLookup({ value, onChange, disabled }: CustomerLookupProps) {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const { data: suggestions = [], isLoading } = useGetCustomerSuggestions(searchQuery);

    useEffect(() => {
        setSearchQuery(value);
    }, [value]);

    const handleSelect = (selectedValue: string) => {
        onChange(selectedValue);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full h-11 justify-between text-base border-2 hover:border-primary/30 hover:bg-accent/50 transition-colors"
                    disabled={disabled}
                >
                    <span className={cn("truncate", !value && "text-muted-foreground")}>
                        {value || 'Select existing or enter new customer...'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Type customer name..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                        className="h-11"
                    />
                    <CommandList>
                        {isLoading ? (
                            <div className="py-8 text-center text-sm text-muted-foreground">
                                <div className="flex items-center justify-center gap-2">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                    Searching customers...
                                </div>
                            </div>
                        ) : (
                            <>
                                {suggestions.length === 0 && searchQuery ? (
                                    <CommandEmpty>
                                        <div className="py-4 px-2">
                                            <div className="flex items-center justify-center mb-3">
                                                <div className="p-2 rounded-full bg-primary/10">
                                                    <UserPlus className="h-5 w-5 text-primary" />
                                                </div>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-3 text-center">
                                                No existing customer found
                                            </p>
                                            <Button
                                                variant="default"
                                                size="sm"
                                                onClick={() => handleSelect(searchQuery)}
                                                className="w-full"
                                            >
                                                <UserPlus className="mr-2 h-4 w-4" />
                                                Create "{searchQuery}"
                                            </Button>
                                        </div>
                                    </CommandEmpty>
                                ) : (
                                    <CommandGroup heading={
                                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                            <Users className="h-3.5 w-3.5" />
                                            Existing Customers
                                        </div>
                                    }>
                                        {suggestions.map((customer) => (
                                            <CommandItem
                                                key={customer.name}
                                                value={customer.name}
                                                onSelect={() => handleSelect(customer.name)}
                                                className="cursor-pointer"
                                            >
                                                <Check
                                                    className={cn(
                                                        'mr-2 h-4 w-4 text-primary',
                                                        value === customer.name ? 'opacity-100' : 'opacity-0'
                                                    )}
                                                />
                                                <div className="flex-1">
                                                    <div className="font-medium">{customer.name}</div>
                                                    {customer.phoneNumber && (
                                                        <div className="text-xs text-muted-foreground">
                                                            {customer.phoneNumber}
                                                        </div>
                                                    )}
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )}
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
