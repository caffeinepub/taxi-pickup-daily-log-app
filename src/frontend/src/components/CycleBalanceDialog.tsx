import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { useGetCycleBalance } from '../hooks/useQueries';

interface CycleBalanceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function CycleBalanceDialog({ open, onOpenChange }: CycleBalanceDialogProps) {
    const { data: balance, isLoading, refetch } = useGetCycleBalance();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refetch();
        setIsRefreshing(false);
    };

    const formatBalance = (balance: bigint | undefined) => {
        if (balance === undefined) return 'N/A';
        const trillion = BigInt(1_000_000_000_000);
        const balanceInTrillions = Number(balance) / Number(trillion);
        return `${balanceInTrillions.toFixed(2)} T`;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-card text-card-foreground border border-border shadow-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <img 
                            src="/assets/generated/cycle-balance-icon-transparent.dim_32x32.png" 
                            alt="Cycle Balance" 
                            className="w-6 h-6"
                        />
                        Cycle Balance
                    </DialogTitle>
                    <DialogDescription>
                        Current canister cycle balance
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <>
                            <div className="text-center space-y-2">
                                <p className="text-sm text-muted-foreground">Current Balance</p>
                                <p className="text-3xl font-bold text-primary">{formatBalance(balance)}</p>
                                <p className="text-xs text-muted-foreground">cycles</p>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-2">
                                <p>
                                    Cycles are the computational resources used by your canister on the Internet Computer.
                                </p>
                                <p>
                                    Monitor your balance to ensure your application continues running smoothly.
                                </p>
                            </div>
                            <Button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="w-full"
                                variant="outline"
                            >
                                {isRefreshing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Refreshing...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Refresh Balance
                                    </>
                                )}
                            </Button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
