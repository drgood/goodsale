'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

export default function AdminProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const userAvatar = PlaceHolderImages.find(img => img.id === 'user-avatar-3')?.imageUrl || '';
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState(userAvatar);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || '');
      setEmail(session.user.email || '');
    }
  }, [session]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      toast({
        title: "Profile Updated",
        description: "Your profile information has been successfully updated.",
      });

      // Update the admin session so header and other places reflect changes immediately
      await update({
        name,
        email,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update profile',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPassword(true);

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const currentPassword = formData.get('current-password') as string;
    const newPassword = formData.get('new-password') as string;
    const confirmPassword = formData.get('confirm-password') as string;

    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Passwords do not match',
        description: 'Please ensure both password fields are the same.',
      });
      setIsChangingPassword(false);
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      toast({
        variant: 'destructive',
        title: 'Password Too Short',
        description: 'Your new password must be at least 8 characters long.',
      });
      setIsChangingPassword(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to change password');
      }

      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
      });
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to change password',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(URL.createObjectURL(file));
    }
  };

  return (
    <div className="grid gap-6">
      <PageHeader title="Admin Profile" description="Manage your personal administrator account." />
      <div className="grid gap-6">
        <Card>
          <form onSubmit={handleProfileSave}>
            <CardHeader>
              <CardTitle className="font-headline">Personal Information</CardTitle>
              <CardDescription>Update your name, email, and avatar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Image src={avatar} alt={name} width={96} height={96} className="rounded-full object-cover aspect-square" data-ai-hint="person portrait" />
                  <Label htmlFor="avatar-upload" className="absolute inset-0 bg-black/40 flex items-center justify-center text-white rounded-full cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                    Change
                  </Label>
                  <Input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} disabled={isSaving} />
                </div>
                <div className="flex-1 space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required disabled={isSaving} />
                </div>
              </div>
               <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isSaving} />
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <form onSubmit={handlePasswordSave}>
            <CardHeader>
              <CardTitle className="font-headline">Change Password</CardTitle>
              <CardDescription>Set a new password for your account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" name="current-password" type="password" required disabled={isChangingPassword} />
              </div>
              <Separator />
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" name="new-password" type="password" required disabled={isChangingPassword} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input id="confirm-password" name="confirm-password" type="password" required disabled={isChangingPassword} />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit" disabled={isChangingPassword}>
                {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isChangingPassword ? 'Updating...' : 'Update Password'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
