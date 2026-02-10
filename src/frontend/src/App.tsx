import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import LoginPage from './pages/LoginPage';
import AccountSetupPage from './pages/AccountSetupPage';
import MainApp from './pages/MainApp';
import ActorInitializationGate from './components/ActorInitializationGate';
import { BackendActorProvider } from './hooks/useBackendActor';
import { Loader2 } from 'lucide-react';
import { useGetProfile } from './hooks/useQueries';
import { useRadixOverlayCleanup } from './hooks/useRadixOverlayCleanup';

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const { isInitializing, identity } = useInternetIdentity();

  // Android Chrome overlay cleanup hook
  useRadixOverlayCleanup();

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  if (!identity) {
    return <LoginPage />;
  }

  return (
    <BackendActorProvider>
      <ActorInitializationGate>
        <DriverApp />
        <Toaster />
      </ActorInitializationGate>
    </BackendActorProvider>
  );
}

function DriverApp() {
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetProfile();
  const { identity } = useInternetIdentity();

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  if (profileLoading || !isFetched) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (showProfileSetup) {
    return <AccountSetupPage />;
  }

  return <MainApp />;
}

export default App;
