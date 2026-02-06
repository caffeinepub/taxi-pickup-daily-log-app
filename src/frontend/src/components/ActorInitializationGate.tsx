import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useActorReady } from '../hooks/useActorReady';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

interface ActorInitializationGateProps {
    children: React.ReactNode;
}

export default function ActorInitializationGate({ children }: ActorInitializationGateProps) {
    const { isLoading, isReady } = useActorReady();
    const { clear } = useInternetIdentity();

    // Show loading state while actor is initializing
    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-lg text-muted-foreground">Connecting to backend...</p>
                    <p className="text-sm text-muted-foreground">Please wait a moment</p>
                </div>
            </div>
        );
    }

    // Only render children when actor is ready
    if (isReady) {
        return <>{children}</>;
    }

    // Fallback: show error state if not loading and not ready
    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
            <div className="w-full max-w-md">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Connection Failed</AlertTitle>
                    <AlertDescription className="mt-2 space-y-3">
                        <p>
                            Unable to connect to the backend. This could be due to a network issue or the backend service being temporarily unavailable.
                        </p>
                        <div className="flex gap-2 pt-2">
                            <Button
                                onClick={() => window.location.reload()}
                                variant="outline"
                                className="flex-1"
                            >
                                Retry Connection
                            </Button>
                            <Button
                                onClick={async () => {
                                    await clear();
                                    window.location.reload();
                                }}
                                variant="outline"
                                className="flex-1"
                            >
                                Logout & Retry
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            </div>
        </div>
    );
}
