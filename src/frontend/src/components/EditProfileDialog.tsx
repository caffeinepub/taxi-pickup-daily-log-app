import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, UserCircle, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useGetProfile, useUpdateProfile } from '../hooks/useQueries';

interface EditProfileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function EditProfileDialog({ open, onOpenChange }: EditProfileDialogProps) {
    const [driverName, setDriverName] = useState('');
    const [contactInfo, setContactInfo] = useState('');
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    
    const { data: profile, isLoading: isLoadingProfile } = useGetProfile();
    const updateProfileMutation = useUpdateProfile();

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
            await updateProfileMutation.mutateAsync({
                driverName: driverName.trim(),
                contactInfo: contactInfo.trim(),
                email: email.trim() ? email.trim() : undefined,
            });
            toast.success('Profile updated successfully!');
            onOpenChange(false);
        } catch (error: any) {
            console.error('Error updating profile:', error);
            const errorMessage = error?.message || 'Failed to update profile. Please try again.';
            toast.error(errorMessage);
        }
    };

    const handleCancel = () => {
        if (profile) {
            setDriverName(profile.driverName);
            setContactInfo(profile.contactInfo);
            setEmail(profile.email || '');
            setEmailError('');
        }
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Edit Profile</DialogTitle>
                    <DialogDescription>
                        Update your driver profile information
                    </DialogDescription>
                </DialogHeader>

                {isLoadingProfile ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="edit-driverName" className="text-sm font-medium">
                                Driver Name <span className="text-destructive">*</span>
                            </Label>
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                                    <UserCircle className="w-4 h-4 text-primary" />
                                </div>
                                <Input
                                    id="edit-driverName"
                                    placeholder="Enter your full name"
                                    value={driverName}
                                    onChange={(e) => setDriverName(e.target.value)}
                                    disabled={updateProfileMutation.isPending}
                                    className="h-10 border-2 focus-visible:ring-2 focus-visible:ring-primary/20"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-contactInfo" className="text-sm font-medium">
                                Contact Information <span className="text-destructive">*</span>
                            </Label>
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                                    <Phone className="w-4 h-4 text-primary" />
                                </div>
                                <Input
                                    id="edit-contactInfo"
                                    type="tel"
                                    placeholder="Enter your phone number"
                                    value={contactInfo}
                                    onChange={(e) => setContactInfo(e.target.value)}
                                    disabled={updateProfileMutation.isPending}
                                    className="h-10 border-2 focus-visible:ring-2 focus-visible:ring-primary/20"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-email" className="text-sm font-medium">
                                Email Address <span className="text-muted-foreground text-xs">(optional)</span>
                            </Label>
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                                    <Mail className="w-4 h-4 text-primary" />
                                </div>
                                <Input
                                    id="edit-email"
                                    type="email"
                                    placeholder="Enter your email address"
                                    value={email}
                                    onChange={handleEmailChange}
                                    disabled={updateProfileMutation.isPending}
                                    className={`h-10 border-2 focus-visible:ring-2 focus-visible:ring-primary/20 ${
                                        emailError ? 'border-destructive' : ''
                                    }`}
                                />
                            </div>
                            {emailError && (
                                <p className="text-sm text-destructive">{emailError}</p>
                            )}
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCancel}
                                disabled={updateProfileMutation.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={updateProfileMutation.isPending || !!emailError}
                            >
                                {updateProfileMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
