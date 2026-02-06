import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Info, Mail } from 'lucide-react';

interface AboutDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5 text-primary" />
                        About
                    </DialogTitle>
                    <DialogDescription>
                        Information about this application
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <h3 className="font-semibold text-lg">Taxi Pickup Daily Log</h3>
                        <p className="text-sm text-muted-foreground">
                            A comprehensive daily logging application for taxi drivers to record and manage passenger pickups.
                        </p>
                    </div>

                    <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                        <div>
                            <p className="text-sm font-medium mb-1">Copyright</p>
                            <p className="text-sm text-muted-foreground">© 2025. All rights reserved.</p>
                        </div>

                        <div className="pt-2 border-t">
                            <p className="text-sm font-medium mb-2">Contact</p>
                            <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-primary" />
                                <div>
                                    <p className="font-medium">Gene Townsend</p>
                                    <a 
                                        href="mailto:genetownend@gmail.com" 
                                        className="text-primary hover:underline"
                                    >
                                        genetownend@gmail.com
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-center text-xs text-muted-foreground pt-2 border-t">
                        <p>
                            Built with ❤️ using{' '}
                            <a 
                                href="https://caffeine.ai" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                            >
                                caffeine.ai
                            </a>
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
