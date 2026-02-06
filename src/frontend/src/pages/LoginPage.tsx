import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, LogIn, Loader2, Moon, Sun, UserPlus } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useTheme } from 'next-themes';

export default function LoginPage() {
    const { login, isLoggingIn, isLoginError } = useInternetIdentity();
    const { theme, setTheme } = useTheme();

    return (
        <div className="flex min-h-screen flex-col">
            <header className="border-b bg-card">
                <div className="container mx-auto px-4 py-4 max-w-4xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                <Car className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold">Taxi Daily Log</h1>
                                <p className="text-sm text-muted-foreground">Track your pickups</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        >
                            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            <span className="sr-only">Toggle theme</span>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-xl border-2 border-primary/10">
                    <CardHeader className="space-y-4 text-center pb-8">
                        <div className="flex justify-center">
                            <div className="p-4 rounded-2xl bg-primary/10 ring-4 ring-primary/20">
                                <img 
                                    src="/assets/generated/taxi-icon.dim_64x64.png" 
                                    alt="Taxi" 
                                    className="w-16 h-16"
                                />
                            </div>
                        </div>
                        <div>
                            <CardTitle className="text-3xl font-bold">Welcome</CardTitle>
                            <CardDescription className="text-base mt-2">
                                Sign in to access your taxi pickup log
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6 pb-8">
                        <div className="space-y-4">
                            <Button
                                onClick={login}
                                disabled={isLoggingIn}
                                size="lg"
                                className="w-full h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all"
                            >
                                {isLoggingIn ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Signing In...
                                    </>
                                ) : (
                                    <>
                                        <LogIn className="mr-2 h-5 w-5" />
                                        Sign In
                                    </>
                                )}
                            </Button>

                            {isLoginError && (
                                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                                    <p className="text-sm text-destructive text-center">
                                        Failed to sign in. Please try again.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="rounded-lg bg-muted/50 border border-border p-4 space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <UserPlus className="h-4 w-4 text-primary" />
                                <span>New User?</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                After signing in, you'll be guided to create your driver profile if you don't have one yet.
                            </p>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            <p>Secure authentication powered by</p>
                            <p className="font-medium text-foreground mt-1">Internet Identity</p>
                        </div>
                    </CardContent>
                </Card>
            </main>

            <footer className="border-t bg-card mt-auto">
                <div className="container mx-auto px-4 py-6 max-w-4xl">
                    <div className="text-center text-sm text-muted-foreground">
                        © 2025. Built with love using{' '}
                        <a
                            href="https://caffeine.ai"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-foreground hover:text-primary transition-colors"
                        >
                            caffeine.ai
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
