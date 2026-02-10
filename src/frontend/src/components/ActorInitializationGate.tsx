import { Loader2, AlertCircle, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useBackendActor } from '../hooks/useBackendActor';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { generateDiagnosticMessage, isUserOffline } from '../utils/connectionDiagnostics';

interface ActorInitializationGateProps {
  children: React.ReactNode;
}

export default function ActorInitializationGate({ children }: ActorInitializationGateProps) {
  const { isLoading, isReady, isError, error, healthCheck, refetch } = useBackendActor();
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

  // Show error state if not loading and not ready
  if (isError) {
    const offline = isUserOffline();
    const diagnosticMessage = generateDiagnosticMessage(error, healthCheck);

    const handleHardRefresh = () => {
      // Cache-busting reload
      const url = new URL(window.location.href);
      url.searchParams.set('_refresh', Date.now().toString());
      window.location.href = url.toString();
    };

    const handleLogoutAndRetry = async () => {
      await clear();
      refetch();
    };

    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
        <div className="w-full max-w-md">
          <Alert variant="destructive">
            {offline ? (
              <WifiOff className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>Connection Failed</AlertTitle>
            <AlertDescription className="mt-2 space-y-3">
              <p className="whitespace-pre-line text-sm">{diagnosticMessage}</p>

              {healthCheck && (
                <p className="text-xs text-muted-foreground">
                  Health check: {healthCheck.success ? '✓ Passed' : '✗ Failed'} at{' '}
                  {new Date(healthCheck.timestamp).toLocaleTimeString()}
                </p>
              )}

              <div className="flex flex-col gap-2 pt-2">
                <Button onClick={refetch} variant="outline" className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry Connection
                </Button>
                <Button onClick={handleLogoutAndRetry} variant="outline" className="w-full">
                  Logout & Retry
                </Button>
                <Button onClick={handleHardRefresh} variant="outline" className="w-full">
                  Hard Refresh
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Fallback: should not reach here
  return null;
}
