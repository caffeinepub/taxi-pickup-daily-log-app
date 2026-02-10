import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import { useDeleteAllRecords } from '../hooks/useQueries';
import { toast } from 'sonner';
import { useActorReady } from '../hooks/useActorReady';

interface DeleteAllRecordsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function DeleteAllRecordsDialog({ open, onOpenChange }: DeleteAllRecordsDialogProps) {
    const deleteAllMutation = useDeleteAllRecords();
    const { isReady } = useActorReady();

    const handleDelete = async () => {
        try {
            await deleteAllMutation.mutateAsync();
            toast.success('All records deleted successfully');
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete records');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-card text-card-foreground border border-border shadow-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <Trash2 className="h-6 w-6" />
                        Delete All Records
                    </DialogTitle>
                    <DialogDescription>
                        This action cannot be undone. This will permanently delete all your pickup records and customer data.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={deleteAllMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={deleteAllMutation.isPending || !isReady}
                    >
                        {deleteAllMutation.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                            </>
                        ) : !isReady ? (
                            'Connecting...'
                        ) : (
                            <>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete All Records
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
