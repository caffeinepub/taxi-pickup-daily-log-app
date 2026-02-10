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
            a.download = `taxi-log-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success('Data exported successfully');
        } catch (error: any) {
            toast.error(error.message || 'Failed to export data');
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleImport = async () => {
        if (!selectedFile) {
            toast.error('Please select a file to import');
            return;
        }

        try {
            const text = await selectedFile.text();
            const data = JSON.parse(text, (key, value) => {
                if (key === 'id' || key === 'pickupDate' || key === 'pickupTime') {
                    return BigInt(value);
                }
                return value;
            });

            await importDataMutation.mutateAsync(data);
            toast.success('Data imported successfully');
            setSelectedFile(null);
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message || 'Failed to import data');
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
