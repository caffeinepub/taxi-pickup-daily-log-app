import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2, Activity } from 'lucide-react';
import { useGetCycleBalance } from '../hooks/useQueries';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CycleBalanceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function CycleBalanceDialog({ open, onOpenChange }: CycleBalanceDialogProps) {
    const [refreshKey, setRefreshKey] = useState(0);
    const { data: cycleBalance, isLoading, isError, refetch } = useGetCycleBalance(refreshKey);

    const handleRefresh = () => {
        setRefreshKey((prev) => prev + 1);
        refetch();
    };

    const formatCycles = (cycles: bigint | undefined): string => {
        if (cycles === undefined) return 'N/A';
        
        const cyclesNum = Number(cycles);
        
        if (cyclesNum >= 1_000_000_000_000) {
            return `${(cyclesNum / 1_000_000_000_000).toFixed(2)}T cycles`;
        } else if (cyclesNum >= 1_000_000_000) {
            return `${(cyclesNum / 1_000_000_000).toFixed(2)}B cycles`;
        } else if (cyclesNum >= 1_000_000) {
            return `${(cyclesNum / 1_000_000).toFixed(2)}M cycles`;
        } else if (cyclesNum >= 1_000) {
            return `${(cyclesNum / 1_000).toFixed(2)}K cycles`;
        } else {
            return `${cyclesNum} cycles`;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        Cycle Balance
                    </DialogTitle>
                    <DialogDescription>
                        View the current cycle balance (remaining computational resources) for the canister.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <Alert>
                        <Activity className="h-4 w-4" />
                        <AlertDescription>
                            Cycles are the computational resources used to power this application on the Internet Computer.
                            The balance shown represents the remaining cycles available for the canister to process requests.
                        </AlertDescription>
                    </Alert>

                    <div className="rounded-lg border bg-card p-6">
                        <div className="text-center space-y-2">
                            <p className="text-sm text-muted-foreground">Current Balance</p>
                            {isLoading ? (
                                <div className="flex items-center justify-center gap-2 py-4">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    <span className="text-muted-foreground">Loading...</span>
                                </div>
                            ) : isError ? (
                                <div className="py-4">
                                    <p className="text-destructive font-semibold">Error loading balance</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Unable to fetch cycle balance. Please try again.
                                    </p>
                                </div>
                            ) : (
                                <div className="py-2">
                                    <p className="text-3xl font-bold text-primary">
                                        {formatCycles(cycleBalance)}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {cycleBalance !== undefined && `(${cycleBalance.toString()} cycles)`}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-between items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={handleRefresh}
                            disabled={isLoading}
                            className="gap-2"
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Button onClick={() => onOpenChange(false)}>
                            Close
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
