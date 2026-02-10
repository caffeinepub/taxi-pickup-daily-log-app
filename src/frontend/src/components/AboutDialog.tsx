import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface AboutDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-card text-card-foreground border border-border shadow-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <img 
                            src="/assets/generated/about-icon-transparent.dim_32x32.png" 
                            alt="About" 
                            className="w-6 h-6"
                        />
                        About
                    </DialogTitle>
                    <DialogDescription>
                        Application information and contact details
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <h3 className="font-semibold">Taxi Pickup Daily Log App</h3>
                        <p className="text-sm text-muted-foreground">
                            A comprehensive tool for tracking daily taxi pickups, managing customer information, and generating reports.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-semibold">Copyright</h3>
                        <p className="text-sm text-muted-foreground">
                            © 2025 All rights reserved
                        </p>
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-semibold">Contact</h3>
                        <p className="text-sm text-muted-foreground">
                            For support or inquiries, please contact:
                        </p>
                        <p className="text-sm font-medium">
                            Gene Townsend
                        </p>
                        <a 
                            href="mailto:genetownend@gmail.com" 
                            className="text-sm text-primary hover:underline"
                        >
                            genetownend@gmail.com
                        </a>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
