import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, UserCircle, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useGetProfile, useSetupProfile } from '../hooks/useQueries';
import { useActorReady } from '../hooks/useActorReady';

export default function AccountSetupPage() {
    const [driverName, setDriverName] = useState('');
    const [contactInfo, setContactInfo] = useState('');
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const { data: profile } = useGetProfile();
    const setupProfileMutation = useSetupProfile();
    const { isReady } = useActorReady();

    useEffect(() => {
        if (profile) {
            setDriverName(profile.driverName);
            setContactInfo(profile.contactInfo);
            setEmail(profile.email || '');
        }
    }, [profile]);

    const validateEmail = (email: string): boolean => {
        // If email is empty, it's valid (optional field)
        if (!email.trim()) {
            setEmailError('');
            return true;
        }
        // If email is provided, validate format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setEmailError('Please enter a valid email address');
            return false;
        }
        setEmailError('');
        return true;
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmail(value);
        validateEmail(value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!driverName.trim() || !contactInfo.trim()) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (!validateEmail(email)) {
            return;
        }

        try {
            await setupProfileMutation.mutateAsync({
                driverName: driverName.trim(),
                contactInfo: contactInfo.trim(),
                email: email.trim() ? email.trim() : undefined,
            });
            toast.success('Profile saved successfully!');
        } catch (error: any) {
            console.error('Error saving profile:', error);
            const errorMessage = error?.message || 'Failed to save profile. Please try again.';
            toast.error(errorMessage);
        }
    };

    const isFormDisabled = setupProfileMutation.isPending || !isReady;

    return (
        <div className="flex min-h-screen flex-col">
            <header className="border-b bg-card">
                <div className="container mx-auto px-4 py-4 max-w-4xl">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <UserCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Account Setup</h1>
                            <p className="text-sm text-muted-foreground">Complete your profile</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-xl border-2 border-primary/10">
                    <CardHeader className="space-y-4 text-center pb-8">
                        <div className="flex justify-center">
                            <div className="p-4 rounded-2xl bg-primary/10 ring-4 ring-primary/20">
                                <UserCircle className="w-16 h-16 text-primary" />
                            </div>
                        </div>
                        <div>
                            <CardTitle className="text-3xl font-bold">Welcome!</CardTitle>
                            <CardDescription className="text-base mt-2">
                                Let's set up your driver profile to get started
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="pb-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2.5">
                                <Label htmlFor="driverName" className="text-sm font-medium">
                                    Driver Name <span className="text-destructive">*</span>
                                </Label>
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                                        <UserCircle className="w-4 h-4 text-primary" />
                                    </div>
                                    <Input
                                        id="driverName"
                                        placeholder="Enter your full name"
                                        value={driverName}
                                        onChange={(e) => setDriverName(e.target.value)}
                                        disabled={isFormDisabled}
                                        className="h-11 text-base border-2 focus-visible:ring-2 focus-visible:ring-primary/20"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <Label htmlFor="contactInfo" className="text-sm font-medium">
                                    Contact Information <span className="text-destructive">*</span>
                                </Label>
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                                        <Phone className="w-4 h-4 text-primary" />
                                    </div>
                                    <Input
                                        id="contactInfo"
                                        type="tel"
                                        placeholder="Enter your phone number"
                                        value={contactInfo}
                                        onChange={(e) => setContactInfo(e.target.value)}
                                        disabled={isFormDisabled}
                                        className="h-11 text-base border-2 focus-visible:ring-2 focus-visible:ring-primary/20"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <Label htmlFor="email" className="text-sm font-medium">
                                    Email Address <span className="text-muted-foreground text-xs">(optional)</span>
                                </Label>
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                                        <Mail className="w-4 h-4 text-primary" />
                                    </div>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="Enter your email address"
                                        value={email}
                                        onChange={handleEmailChange}
                                        disabled={isFormDisabled}
                                        className={`h-11 text-base border-2 focus-visible:ring-2 focus-visible:ring-primary/20 ${
                                            emailError ? 'border-destructive' : ''
                                        }`}
                                    />
                                </div>
                                {emailError && (
                                    <p className="text-sm text-destructive">{emailError}</p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                size="lg"
                                className="w-full h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all"
                                disabled={isFormDisabled || !!emailError}
                            >
                                {setupProfileMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Saving Profile...
                                    </>
                                ) : !isReady ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Connecting...
                                    </>
                                ) : (
                                    'Complete Setup'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </main>

            <footer className="border-t bg-card mt-auto">
                <div className="container mx-auto px-4 py-6 max-w-4xl">
                    <div className="text-center text-sm text-muted-foreground">
                        © 2026. Built with love using{' '}
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
