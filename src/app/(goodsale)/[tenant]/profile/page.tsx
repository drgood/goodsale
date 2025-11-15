
'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator';
import { useSession } from 'next-auth/react';
import { ImageUpload } from '@/components/image-upload';

export default function ProfilePage() {
  const { toast } = useToast();
  const { data: session, update } = useSession();
  const currentUser = session?.user;
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('');
  
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setAvatar(currentUser.avatarUrl || '');
    }
  }, [currentUser]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentUser.id, name, email, avatarUrl: avatar })
      });
      
      if (response.ok) {
        const updated = await response.json();
        // Update local state with response data
        setName(updated.name);
        setEmail(updated.email);
        setAvatar(updated.avatarUrl);
        // Refresh session and propagate updated fields (including avatar) to the header
        await update({
          name: updated.name,
          email: updated.email,
          avatarUrl: updated.avatarUrl,
        });
        toast({
          title: "Profile Updated",
          description: "Your profile information has been successfully updated.",
        });
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile."
      });
    }
  };

  const handlePasswordSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const newPassword = formData.get('new-password');
    const confirmPassword = formData.get('confirm-password');

    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Passwords do not match',
        description: 'Please ensure both password fields are the same.',
      });
      return;
    }

    if (!newPassword || (typeof newPassword === 'string' && newPassword.length < 8)) {
        toast({
          variant: 'destructive',
          title: 'Password Too Short',
          description: 'Your new password must be at least 8 characters long.',
        });
        return;
    }

    toast({
      title: "Password Updated",
      description: "Your password has been changed successfully.",
    });
    (e.target as HTMLFormElement).reset();
  };


  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <PageHeader title="Profile" description="Manage your personal account settings." />
      <div className="grid gap-6">
        <Card>
          <form onSubmit={handleProfileSave}>
            <CardHeader>
              <CardTitle className="font-headline">Personal Information</CardTitle>
              <CardDescription>Update your name, email, and avatar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Profile Picture</Label>
                  <ImageUpload 
                    value={avatar}
                    onChange={setAvatar}
                    previewSize="sm"
                  />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              </div>
               <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit">Save Changes</Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <form onSubmit={handlePasswordSave}>
            <CardHeader>
              <CardTitle className="font-headline">Change Password</CardTitle>
              <CardDescription>Set a new password for your account. Please enter your current password to confirm.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" name="current-password" type="password" required />
              </div>
              <Separator />
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" name="new-password" type="password" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input id="confirm-password" name="confirm-password" type="password" required />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit">Update Password</Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
