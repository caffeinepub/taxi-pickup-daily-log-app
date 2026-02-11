import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Download, Upload } from 'lucide-react';
import { useExportData, useImportData } from '../hooks/useQueries';
import { toast } from 'sonner';
import { useActorReady } from '../hooks/useActorReady';
import { getErrorMessage } from '../utils/errorMessage';
import type { ImportExportData } from '../backend';

interface ExportImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function ExportImportDialog({ open, onOpenChange }: ExportImportDialogProps) {
    const exportDataMutation = useExportData();
    const importDataMutation = useImportData();
    const { isReady } = useActorReady();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleExport = async () => {
        try {
            const data = await exportDataMutation.mutateAsync();
            const json = JSON.stringify(data, (_, value) =>
                typeof value === 'bigint' ? value.toString() : value
            );
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `taxi-log-export-${new Date().toISOString().split('T')[0]}T${new Date().toTimeString().split(' ')[0].replace(/:/g, '-')}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success('Data exported successfully');
        } catch (error: any) {
            toast.error(getErrorMessage(error));
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const normalizeImportData = (data: any): any => {
        // Handle legacy/mistyped field names by mapping them to the correct field
        const normalized = { ...data };
        
        // Map common variants of nextPickupId to the correct field name
        if ('nextpickupupld' in normalized && !('nextPickupId' in normalized)) {
            normalized.nextPickupId = normalized.nextpickupupld;
            delete normalized.nextpickupupld;
        }
        if ('nextpickupid' in normalized && !('nextPickupId' in normalized)) {
            normalized.nextPickupId = normalized.nextpickupid;
            delete normalized.nextpickupid;
        }
        if ('next_pickup_id' in normalized && !('nextPickupId' in normalized)) {
            normalized.nextPickupId = normalized.next_pickup_id;
            delete normalized.next_pickup_id;
        }
        
        return normalized;
    };

    const validateImportData = (data: any): { valid: boolean; error?: string } => {
        // Check top-level structure
        if (!data || typeof data !== 'object') {
            return { valid: false, error: 'Invalid file format: expected JSON object' };
        }

        if (!Array.isArray(data.pickups)) {
            return { valid: false, error: 'Invalid file format: missing or invalid "pickups" array' };
        }

        if (!Array.isArray(data.customers)) {
            return { valid: false, error: 'Invalid file format: missing or invalid "customers" array' };
        }

        // nextPickupId is now optional - will be computed if missing

        // Validate each pickup record
        for (let i = 0; i < data.pickups.length; i++) {
            const pickup = data.pickups[i];
            const requiredFields = [
                'id', 'pickupDate', 'streetAddress', 'city', 'customerName',
                'phoneNumber', 'pickupTime', 'destinationAddress', 'meterTotal',
                'meterPaymentMethod', 'tip', 'tipPaymentMethod', 'calculatedTotal'
            ];

            for (const field of requiredFields) {
                if (!(field in pickup)) {
                    return {
                        valid: false,
                        error: `Invalid pickup record at index ${i}: missing required field "${field}"`
                    };
                }
            }

            // Validate payment method enums
            const validPaymentMethods = ['cash', 'credit', 'voucher'];
            if (!validPaymentMethods.includes(pickup.meterPaymentMethod)) {
                return {
                    valid: false,
                    error: `Invalid pickup record at index ${i}: invalid meterPaymentMethod "${pickup.meterPaymentMethod}"`
                };
            }
            if (!validPaymentMethods.includes(pickup.tipPaymentMethod)) {
                return {
                    valid: false,
                    error: `Invalid pickup record at index ${i}: invalid tipPaymentMethod "${pickup.tipPaymentMethod}"`
                };
            }
        }

        return { valid: true };
    };

    const reconstructNextPickupId = (pickups: any[]): bigint => {
        // Find the maximum pickup ID and add 1
        if (pickups.length === 0) {
            return 0n;
        }

        let maxId = 0n;
        for (const pickup of pickups) {
            const pickupId = typeof pickup.id === 'bigint' ? pickup.id : BigInt(pickup.id);
            if (pickupId > maxId) {
                maxId = pickupId;
            }
        }

        return maxId + 1n;
    };

    const handleImport = async () => {
        if (!selectedFile) {
            toast.error('Please select a file to import');
            return;
        }

        try {
            const text = await selectedFile.text();
            
            // Parse JSON with BigInt revival for all relevant fields
            let parsedData = JSON.parse(text, (key, value) => {
                // Convert string representations back to BigInt for all bigint fields
                if (key === 'id' || key === 'pickupDate' || key === 'pickupTime' || key === 'nextPickupId') {
                    // Handle both string and number inputs
                    if (typeof value === 'string' || typeof value === 'number') {
                        try {
                            return BigInt(value);
                        } catch {
                            return value; // Keep original if conversion fails, validation will catch it
                        }
                    }
                }
                return value;
            });

            // Normalize field names (handle legacy/mistyped variants)
            parsedData = normalizeImportData(parsedData);

            // Validate the imported data structure
            const validation = validateImportData(parsedData);
            if (!validation.valid) {
                toast.error(validation.error || 'Invalid import file format');
                return;
            }

            // Reconstruct nextPickupId if missing (backward compatibility)
            if (typeof parsedData.nextPickupId === 'undefined' || parsedData.nextPickupId === null) {
                parsedData.nextPickupId = reconstructNextPickupId(parsedData.pickups);
            }

            // Import the data
            await importDataMutation.mutateAsync(parsedData as ImportExportData);
            
            toast.success(`Successfully imported ${parsedData.pickups.length} pickup record(s)`);
            setSelectedFile(null);
            onOpenChange(false);
        } catch (error: any) {
            if (error instanceof SyntaxError) {
                toast.error('Invalid JSON file format');
            } else {
                toast.error(getErrorMessage(error));
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-card text-card-foreground border border-border shadow-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <img 
                            src="/assets/generated/export-import-icon-transparent.dim_32x32.png" 
                            alt="Export/Import" 
                            className="w-6 h-6"
                        />
                        Export/Import Data
                    </DialogTitle>
                    <DialogDescription>
                        Backup your data or restore from a previous export
                    </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="export" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="export">Export</TabsTrigger>
                        <TabsTrigger value="import">Import</TabsTrigger>
                    </TabsList>
                    <TabsContent value="export" className="space-y-4 py-4">
                        <p className="text-sm text-muted-foreground">
                            Download all your pickup records and customer data as a JSON file.
                        </p>
                        <Button
                            onClick={handleExport}
                            disabled={exportDataMutation.isPending || !isReady}
                            className="w-full"
                        >
                            {exportDataMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Exporting...
                                </>
                            ) : !isReady ? (
                                'Connecting...'
                            ) : (
                                <>
                                    <Download className="mr-2 h-4 w-4" />
                                    Export Data
                                </>
                            )}
                        </Button>
                    </TabsContent>
                    <TabsContent value="import" className="space-y-4 py-4">
                        <p className="text-sm text-muted-foreground">
                            Import data from a previously exported JSON file. This will replace all existing data.
                        </p>
                        <div className="space-y-2">
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleFileSelect}
                                className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                                disabled={!isReady}
                            />
                            {selectedFile && (
                                <p className="text-sm text-muted-foreground">
                                    Selected: {selectedFile.name}
                                </p>
                            )}
                        </div>
                        <Button
                            onClick={handleImport}
                            disabled={importDataMutation.isPending || !selectedFile || !isReady}
                            className="w-full"
                        >
                            {importDataMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Importing...
                                </>
                            ) : !isReady ? (
                                'Connecting...'
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Import Data
                                </>
                            )}
                        </Button>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
