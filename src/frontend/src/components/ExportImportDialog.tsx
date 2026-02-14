import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, Download, Upload, AlertCircle, ChevronDown, Copy, CheckCircle } from 'lucide-react';
import { useExportData, useImportData } from '../hooks/useQueries';
import { toast } from 'sonner';
import { useActorReady } from '../hooks/useActorReady';
import { getImportErrorSummary, getErrorDetails } from '../utils/errorMessage';
import { normalizeImportData } from '../utils/importNormalization';

interface ExportImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function ExportImportDialog({ open, onOpenChange }: ExportImportDialogProps) {
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importError, setImportError] = useState<{ summary: string; details: string } | null>(null);
    const [detailsExpanded, setDetailsExpanded] = useState(false);
    const [detailsCopied, setDetailsCopied] = useState(false);
    const { isReady } = useActorReady();

    const exportDataQuery = useExportData();
    const importDataMutation = useImportData();

    const handleExport = async () => {
        try {
            const data = await exportDataQuery.refetch();
            if (!data.data) {
                toast.error('No data to export');
                return;
            }

            const jsonString = JSON.stringify(data.data, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value
            , 2);

            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
            link.download = `taxi-log-export-${timestamp}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success('Data exported successfully');
        } catch (error: unknown) {
            const summary = getImportErrorSummary(error);
            toast.error(summary);
        }
    };

    const handleImport = async () => {
        if (!importFile) {
            toast.error('Please select a file to import');
            return;
        }

        // Clear previous errors
        setImportError(null);
        setDetailsExpanded(false);
        setDetailsCopied(false);

        try {
            const fileContent = await importFile.text();
            const rawData = JSON.parse(fileContent);

            // Normalize imported data (handles legacy formats)
            const normalizedData = normalizeImportData(rawData);

            // Import to backend
            await importDataMutation.mutateAsync(normalizedData);

            toast.success('Data imported successfully');
            setImportFile(null);
            onOpenChange(false);
        } catch (error: unknown) {
            const summary = getImportErrorSummary(error);
            const details = getErrorDetails(error);
            
            setImportError({ summary, details });
            toast.error(summary);
        }
    };

    const handleCopyDetails = async () => {
        if (importError) {
            try {
                await navigator.clipboard.writeText(importError.details);
                setDetailsCopied(true);
                setTimeout(() => setDetailsCopied(false), 2000);
            } catch {
                toast.error('Failed to copy details');
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setImportFile(e.target.files?.[0] || null);
        setImportError(null);
        setDetailsExpanded(false);
        setDetailsCopied(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md max-h-[90vh] flex flex-col bg-card text-card-foreground border border-border shadow-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <img 
                            src="/assets/generated/export-import-icon-transparent.dim_32x32.png" 
                            alt="Export/Import" 
                            className="w-6 h-6"
                        />
                        Export / Import Data
                    </DialogTitle>
                    <DialogDescription>
                        Backup your data or restore from a previous backup
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-6 py-4">
                        <div className="space-y-4">
                            <h3 className="font-semibold">Export Data</h3>
                            <p className="text-sm text-muted-foreground">
                                Download all your pickup records and customer data as a JSON file
                            </p>
                            <Button
                                onClick={handleExport}
                                disabled={exportDataQuery.isFetching || !isReady}
                                className="w-full"
                            >
                                {exportDataQuery.isFetching ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Exporting...
                                    </>
                                ) : (
                                    <>
                                        <Download className="mr-2 h-4 w-4" />
                                        Export Data
                                    </>
                                )}
                            </Button>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <h3 className="font-semibold">Import Data</h3>
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    Warning: Importing will replace all existing data. Make sure to export your current data first.
                                </AlertDescription>
                            </Alert>

                            {importError && (
                                <Alert variant="destructive" className="space-y-2">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            <AlertTitle>Import Failed</AlertTitle>
                                            <AlertDescription className="text-sm break-words">
                                                {importError.summary}
                                            </AlertDescription>
                                            
                                            <Collapsible open={detailsExpanded} onOpenChange={setDetailsExpanded}>
                                                <CollapsibleTrigger asChild>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        className="w-full mt-2"
                                                    >
                                                        <ChevronDown className={`h-4 w-4 mr-2 transition-transform ${detailsExpanded ? 'rotate-180' : ''}`} />
                                                        {detailsExpanded ? 'Hide' : 'Show'} Technical Details
                                                    </Button>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent className="mt-2 space-y-2">
                                                    <ScrollArea className="h-32 w-full rounded border bg-muted/50 p-2">
                                                        <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                                                            {importError.details}
                                                        </pre>
                                                    </ScrollArea>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full"
                                                        onClick={handleCopyDetails}
                                                    >
                                                        {detailsCopied ? (
                                                            <>
                                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                                Copied!
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy className="h-4 w-4 mr-2" />
                                                                Copy Details
                                                            </>
                                                        )}
                                                    </Button>
                                                </CollapsibleContent>
                                            </Collapsible>
                                        </div>
                                    </div>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="import-file">Select JSON File</Label>
                                <Input
                                    id="import-file"
                                    type="file"
                                    accept=".json"
                                    onChange={handleFileChange}
                                    disabled={!isReady}
                                />
                            </div>
                            <Button
                                onClick={handleImport}
                                disabled={!importFile || importDataMutation.isPending || !isReady}
                                variant="destructive"
                                className="w-full"
                            >
                                {importDataMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Importing...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Import Data
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
