import { useState, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Upload, AlertTriangle, CheckCircle2, Loader2, FileText, X } from 'lucide-react';
import { useExportData, useImportData } from '../hooks/useQueries';
import { useActorReady } from '../hooks/useActorReady';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ExportData, Pickup } from '../backend';

interface ExportImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface ImportPreview {
    pickupCount: number;
    customerCount: number;
    dateRange: { earliest: string; latest: string } | null;
    samplePickups: Pickup[];
    uniquePickupIds: number;
}

export default function ExportImportDialog({ open, onOpenChange }: ExportImportDialogProps) {
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importData, setImportData] = useState<ExportData | null>(null);
    const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const exportMutation = useExportData();
    const importMutation = useImportData();
    const { isReady } = useActorReady();

    const handleExport = async () => {
        try {
            const data = await exportMutation.mutateAsync();
            
            // Deduplicate pickups by ID to ensure each pickup appears exactly once
            const uniquePickupsMap = new Map<string, Pickup>();
            data.pickups.forEach(pickup => {
                const pickupId = pickup.id.toString();
                if (!uniquePickupsMap.has(pickupId)) {
                    uniquePickupsMap.set(pickupId, pickup);
                }
            });
            
            const uniquePickups = Array.from(uniquePickupsMap.values());
            
            // Create export data with deduplicated pickups
            const exportData: ExportData = {
                pickups: uniquePickups,
                customers: data.customers,
            };
            
            // Create JSON file with proper serialization
            const jsonString = JSON.stringify(exportData, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value
            , 2);
            
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            // Create download link
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const filename = `taxi-log-export-${timestamp}.json`;
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            toast.success('Data exported successfully', {
                description: `Downloaded ${filename} with ${uniquePickups.length} unique pickups`,
            });
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export data', {
                description: error instanceof Error ? error.message : 'Unknown error occurred',
            });
        }
    };

    // Helper function to convert ISO 8601 string or number to timestamp
    const parseTimestamp = (value: any): bigint => {
        // If it's already a number or bigint, use it directly
        if (typeof value === 'number') {
            return BigInt(value);
        }
        if (typeof value === 'bigint') {
            return value;
        }
        
        // If it's a string, check if it's an ISO 8601 date/time string
        if (typeof value === 'string') {
            // Try to parse as ISO 8601 string
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                return BigInt(date.getTime());
            }
            
            // If not a valid date string, try to parse as numeric string
            try {
                return BigInt(value);
            } catch {
                throw new Error(`Invalid timestamp value: ${value}`);
            }
        }
        
        throw new Error(`Invalid timestamp type: ${typeof value}`);
    };

    const validateAndParseFile = (content: string): ExportData => {
        const parsed = JSON.parse(content);

        // Validate structure
        if (!parsed.pickups || !Array.isArray(parsed.pickups)) {
            throw new Error('Invalid file format: missing or invalid pickups array');
        }
        if (!parsed.customers || !Array.isArray(parsed.customers)) {
            throw new Error('Invalid file format: missing or invalid customers array');
        }

        // Process and validate pickup records
        const processedPickups = parsed.pickups.map((pickup: any) => {
            // Validate required fields exist
            if (!pickup.pickupDate || !pickup.pickupTime || !pickup.streetAddress || !pickup.destinationAddress) {
                throw new Error('Invalid pickup record: missing required fields (pickupDate, pickupTime, streetAddress, destinationAddress)');
            }
            
            // Validate numeric fields
            if (typeof pickup.meterTotal !== 'number' || typeof pickup.tip !== 'number') {
                throw new Error('Invalid pickup record: meterTotal and tip must be numbers');
            }
            if (typeof pickup.calculatedTotal !== 'number') {
                throw new Error('Invalid pickup record: calculatedTotal must be a number');
            }
            
            // Validate payment methods
            if (!pickup.meterPaymentMethod || !pickup.tipPaymentMethod) {
                throw new Error('Invalid pickup record: missing payment method fields');
            }

            // Convert timestamps (handles both numeric and ISO 8601 string formats)
            try {
                return {
                    ...pickup,
                    id: parseTimestamp(pickup.id),
                    pickupDate: parseTimestamp(pickup.pickupDate),
                    pickupTime: parseTimestamp(pickup.pickupTime),
                } as Pickup;
            } catch (error) {
                throw new Error(`Failed to parse timestamps in pickup record: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });

        // Process customer records (also handle timestamps in pickup history)
        const processedCustomers = parsed.customers.map((customer: any) => {
            return {
                ...customer,
                pickupHistory: customer.pickupHistory.map((pickup: any) => ({
                    ...pickup,
                    id: parseTimestamp(pickup.id),
                    pickupDate: parseTimestamp(pickup.pickupDate),
                    pickupTime: parseTimestamp(pickup.pickupTime),
                })),
            };
        });

        // Deduplicate pickups by ID
        const uniquePickupsMap = new Map<string, Pickup>();
        processedPickups.forEach((pickup: Pickup) => {
            const pickupId = pickup.id.toString();
            if (!uniquePickupsMap.has(pickupId)) {
                uniquePickupsMap.set(pickupId, pickup);
            }
        });

        const uniquePickups = Array.from(uniquePickupsMap.values());

        return {
            pickups: uniquePickups,
            customers: processedCustomers,
        } as ExportData;
    };

    const generatePreview = (data: ExportData): ImportPreview => {
        const pickups = data.pickups;
        
        // Count unique pickup IDs
        const uniqueIds = new Set(pickups.map(p => p.id.toString()));
        
        let dateRange: { earliest: string; latest: string } | null = null;
        if (pickups.length > 0) {
            const dates = pickups.map(p => Number(p.pickupDate));
            const earliest = Math.min(...dates);
            const latest = Math.max(...dates);
            dateRange = {
                earliest: new Date(earliest).toLocaleDateString(),
                latest: new Date(latest).toLocaleDateString(),
            };
        }

        // Get up to 3 sample pickups
        const samplePickups = pickups.slice(0, 3);

        return {
            pickupCount: pickups.length,
            customerCount: data.customers.length,
            dateRange,
            samplePickups,
            uniquePickupIds: uniqueIds.size,
        };
    };

    const processFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const validated = validateAndParseFile(content);
                const preview = generatePreview(validated);

                setImportData(validated);
                setImportPreview(preview);
                setShowConfirmation(true);
            } catch (error) {
                console.error('Parse error:', error);
                toast.error('Invalid file format', {
                    description: error instanceof Error ? error.message : 'The selected file is not a valid export file',
                });
                setImportFile(null);
            }
        };
        reader.onerror = () => {
            toast.error('Failed to read file', {
                description: 'An error occurred while reading the file',
            });
            setImportFile(null);
        };
        reader.readAsText(file);
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File too large', {
                description: 'Maximum file size is 10MB',
            });
            return;
        }

        // Validate file type
        if (!file.name.endsWith('.json')) {
            toast.error('Invalid file type', {
                description: 'Please select a JSON file',
            });
            return;
        }

        setImportFile(file);
        processFile(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (!file) return;

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File too large', {
                description: 'Maximum file size is 10MB',
            });
            return;
        }

        // Validate file type
        if (!file.name.endsWith('.json')) {
            toast.error('Invalid file type', {
                description: 'Please select a JSON file',
            });
            return;
        }

        setImportFile(file);
        processFile(file);
    };

    const handleImportConfirm = async () => {
        if (!importData) return;

        try {
            await importMutation.mutateAsync(importData);
            
            toast.success('Data imported successfully', {
                description: `Imported ${importData.pickups.length} unique pickups and ${importData.customers.length} customers. All totals and calculations have been restored.`,
            });
            
            // Reset state
            setImportFile(null);
            setImportData(null);
            setImportPreview(null);
            setShowConfirmation(false);
            onOpenChange(false);
        } catch (error) {
            console.error('Import error:', error);
            toast.error('Failed to import data', {
                description: error instanceof Error ? error.message : 'Unknown error occurred',
            });
        }
    };

    const handleImportCancel = () => {
        setImportFile(null);
        setImportData(null);
        setImportPreview(null);
        setShowConfirmation(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const formatTime = (timestamp: bigint): string => {
        const date = new Date(Number(timestamp));
        if (isNaN(date.getTime())) {
            return 'Invalid Time';
        }
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (timestamp: bigint): string => {
        const date = new Date(Number(timestamp));
        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }
        return date.toLocaleDateString();
    };

    const isExportDisabled = exportMutation.isPending || !isReady;
    const isImportDisabled = importMutation.isPending || !isReady;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <img 
                            src="/assets/generated/export-import-icon-transparent.dim_32x32.png" 
                            alt="Export/Import" 
                            className="h-6 w-6"
                        />
                        Export/Import Data
                    </DialogTitle>
                    <DialogDescription>
                        Export your data for backup or import previously exported data to restore your records.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Export Section */}
                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold">Export Data</h3>
                        <p className="text-sm text-muted-foreground">
                            Download all your pickup records and customer data in JSON format. Each pickup will be exported exactly once with complete accuracy for all meter totals, tip amounts, and payment method details.
                        </p>
                        <Button
                            onClick={handleExport}
                            disabled={isExportDisabled}
                            className="w-full sm:w-auto"
                        >
                            {exportMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Exporting...
                                </>
                            ) : !isReady ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Connecting...
                                </>
                            ) : (
                                <>
                                    <Download className="mr-2 h-4 w-4" />
                                    Export Data
                                </>
                            )}
                        </Button>
                    </div>

                    <div className="border-t pt-6">
                        {/* Import Section */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold">Import Data</h3>
                            <p className="text-sm text-muted-foreground">
                                Upload a previously exported JSON file to restore your data. This will replace all existing records.
                            </p>

                            {!showConfirmation ? (
                                <>
                                    <Alert>
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertDescription>
                                            <strong>Warning:</strong> Importing data will permanently replace all your current records. Make sure to export your current data first if you want to keep it.
                                        </AlertDescription>
                                    </Alert>

                                    <div
                                        className={cn(
                                            'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                                            isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
                                            isImportDisabled && 'opacity-50 cursor-not-allowed'
                                        )}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                    >
                                        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Drag and drop your JSON file here, or click to browse
                                        </p>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".json"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                            id="file-upload"
                                            disabled={isImportDisabled}
                                        />
                                        <Button
                                            variant="outline"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isImportDisabled}
                                        >
                                            {!isReady ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Connecting...
                                                </>
                                            ) : (
                                                <>
                                                    <FileText className="mr-2 h-4 w-4" />
                                                    Select File
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Import Preview */}
                                    <Alert>
                                        <CheckCircle2 className="h-4 w-4" />
                                        <AlertDescription>
                                            <strong>File validated successfully!</strong> Review the preview below before importing.
                                        </AlertDescription>
                                    </Alert>

                                    {importPreview && (
                                        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-semibold">Import Preview</h4>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={handleImportCancel}
                                                    disabled={isImportDisabled}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-muted-foreground">Unique Pickups</p>
                                                    <p className="text-lg font-semibold">{importPreview.uniquePickupIds}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Customers</p>
                                                    <p className="text-lg font-semibold">{importPreview.customerCount}</p>
                                                </div>
                                            </div>

                                            {importPreview.dateRange && (
                                                <div className="text-sm">
                                                    <p className="text-muted-foreground">Date Range</p>
                                                    <p className="font-medium">
                                                        {importPreview.dateRange.earliest} - {importPreview.dateRange.latest}
                                                    </p>
                                                </div>
                                            )}

                                            {importPreview.samplePickups.length > 0 && (
                                                <div className="space-y-2">
                                                    <p className="text-sm text-muted-foreground">Sample Records</p>
                                                    {importPreview.samplePickups.map((pickup) => (
                                                        <div
                                                            key={pickup.id.toString()}
                                                            className="text-xs p-2 bg-background rounded border"
                                                        >
                                                            <div className="flex justify-between">
                                                                <span className="font-medium">{pickup.streetAddress}</span>
                                                                <span className="text-muted-foreground">
                                                                    {formatDate(pickup.pickupDate)} {formatTime(pickup.pickupTime)}
                                                                </span>
                                                            </div>
                                                            <div className="text-muted-foreground">
                                                                ${pickup.calculatedTotal.toFixed(2)}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={handleImportCancel}
                                            disabled={isImportDisabled}
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleImportConfirm}
                                            disabled={isImportDisabled}
                                            className="flex-1"
                                        >
                                            {importMutation.isPending ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Importing...
                                                </>
                                            ) : !isReady ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Connecting...
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="mr-2 h-4 w-4" />
                                                    Confirm Import
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
