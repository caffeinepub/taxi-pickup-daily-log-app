import { useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDeleteAllRecords } from '../hooks/useQueries';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DeleteAllRecordsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function DeleteAllRecordsDialog({ open, onOpenChange }: DeleteAllRecordsDialogProps) {
    const deleteAllRecords = useDeleteAllRecords();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleConfirmDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteAllRecords.mutateAsync();
            toast.success('All records deleted successfully');
            onOpenChange(false);
        } catch (error) {
            console.error('Error deleting records:', error);
            toast.error('Failed to delete records. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete All Records?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete all your pickup records and customer data.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirmDelete}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            'Delete All'
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
