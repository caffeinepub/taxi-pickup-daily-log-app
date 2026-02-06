import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import LoginPage from './pages/LoginPage';
import AccountSetupPage from './pages/AccountSetupPage';
import MainApp from './pages/MainApp';
import { Loader2 } from 'lucide-react';
import { useGetProfile } from './hooks/useQueries';

function App() {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AppContent />
        </ThemeProvider>
    );
}

function AppContent() {
    const { isInitializing, identity } = useInternetIdentity();

    if (isInitializing) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-lg text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    // Driver flow
    if (!identity) {
        return (
            <>
                <LoginPage />
                <Toaster />
            </>
        );
    }

    // Driver is authenticated, show account setup or main app
    return (
        <>
            <DriverApp />
            <Toaster />
        </>
    );
}

// Component for regular driver flow
function DriverApp() {
    const { data: profile, isLoading } = useGetProfile();

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-lg text-muted-foreground">Loading profile...</p>
                </div>
            </div>
        );
    }

    // If driver has a complete profile, show main app
    if (profile && profile.driverName && profile.contactInfo) {
        return <MainApp />;
    }

    // Otherwise show profile setup
    return <AccountSetupPage />;
}

export default App;
