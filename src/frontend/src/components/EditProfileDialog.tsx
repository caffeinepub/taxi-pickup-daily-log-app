import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useGetProfile, useUpdateProfile } from '../hooks/useQueries';
import { useActorReady } from '../hooks/useActorReady';

interface EditProfileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function EditProfileDialog({ open, onOpenChange }: EditProfileDialogProps) {
    const [driverName, setDriverName] = useState('');
    const [contactInfo, setContactInfo] = useState('');
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');

    const { data: profile } = useGetProfile();
    const updateProfileMutation = useUpdateProfile();
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

    const isFormDisabled = updateProfileMutation.isPending || !isReady;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <img 
                            src="/assets/generated/profile-icon-transparent.dim_32x32.png" 
                            alt="Profile" 
                            className="h-6 w-6"
                        />
                        Edit Profile
                    </DialogTitle>
                    <DialogDescription>
                        Update your driver profile information
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-driverName">
                            Driver Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="edit-driverName"
                            placeholder="Enter your full name"
                            value={driverName}
                            onChange={(e) => setDriverName(e.target.value)}
                            disabled={isFormDisabled}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-contactInfo">
                            Contact Information <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="edit-contactInfo"
                            type="tel"
                            placeholder="Enter your phone number"
                            value={contactInfo}
                            onChange={(e) => setContactInfo(e.target.value)}
                            disabled={isFormDisabled}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-email">
                            Email Address <span className="text-muted-foreground text-xs">(optional)</span>
                        </Label>
                        <Input
                            id="edit-email"
                            type="email"
                            placeholder="Enter your email address"
                            value={email}
                            onChange={handleEmailChange}
                            disabled={isFormDisabled}
                            className={emailError ? 'border-destructive' : ''}
                        />
                        {emailError && (
                            <p className="text-sm text-destructive">{emailError}</p>
                        )}
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isFormDisabled}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isFormDisabled || !!emailError}
                            className="flex-1"
                        >
                            {updateProfileMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : !isReady ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Connecting...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
