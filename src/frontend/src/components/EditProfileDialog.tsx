import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import { useGetProfile, useUpdateProfile } from '../hooks/useQueries';
import { toast } from 'sonner';
import { useActorReady } from '../hooks/useActorReady';

interface EditProfileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function EditProfileDialog({ open, onOpenChange }: EditProfileDialogProps) {
    const { data: profile } = useGetProfile();
    const saveProfileMutation = useUpdateProfile();
    const { isReady } = useActorReady();

    const [formData, setFormData] = useState({
        driverName: '',
        contactInfo: '',
        email: '',
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                driverName: profile.driverName,
                contactInfo: profile.contactInfo,
                email: profile.email || '',
            });
        }
    }, [profile]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.driverName.trim() || !formData.contactInfo.trim()) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            await saveProfileMutation.mutateAsync({
                driverName: formData.driverName,
                contactInfo: formData.contactInfo,
                email: formData.email || undefined,
            });
            toast.success('Profile updated successfully');
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message || 'Failed to update profile');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-card text-card-foreground border border-border shadow-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <img 
                            src="/assets/generated/profile-icon-transparent.dim_32x32.png" 
                            alt="Profile" 
                            className="w-6 h-6"
                        />
                        Edit Profile
                    </DialogTitle>
                    <DialogDescription>
                        Update your driver profile information
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="driverName">Driver Name *</Label>
                        <Input
                            id="driverName"
                            value={formData.driverName}
                            onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                            placeholder="Enter your name"
                            disabled={!isReady}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="contactInfo">Contact Info *</Label>
                        <Input
                            id="contactInfo"
                            value={formData.contactInfo}
                            onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                            placeholder="Phone number or other contact"
                            disabled={!isReady}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email (Optional)</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="your.email@example.com"
                            disabled={!isReady}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={saveProfileMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={saveProfileMutation.isPending || !isReady}
                        >
                            {saveProfileMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : !isReady ? (
                                'Connecting...'
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
