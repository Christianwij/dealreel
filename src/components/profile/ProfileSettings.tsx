'use client';

import { useState } from 'react';
import { User, Moon, Sun, Bell, Layout } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { useProfile } from '@/hooks/useProfile';
import { ProfilePreferences } from '@/types/supabase';

export function ProfileSettings() {
  const { profile, updateProfile, updatePreferences } = useProfile();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const [formData, setFormData] = useState({
    fullName: profile?.full_name || '',
    avatarUrl: profile?.avatar_url || '',
  });

  const [preferences, setPreferences] = useState<ProfilePreferences>({
    theme: profile?.preferences?.theme || 'system',
    emailNotifications: profile?.preferences?.emailNotifications ?? true,
    dashboardLayout: {
      showDocuments: profile?.preferences?.dashboardLayout?.showDocuments ?? true,
      showBriefings: profile?.preferences?.dashboardLayout?.showBriefings ?? true,
      showRatings: profile?.preferences?.dashboardLayout?.showRatings ?? true,
    },
  });

  const handleProfileUpdate = async () => {
    try {
      setIsUpdating(true);
      await updateProfile({
        full_name: formData.fullName,
        avatar_url: formData.avatarUrl,
      });
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePreferencesUpdate = async (updates: Partial<ProfilePreferences>) => {
    try {
      setIsUpdating(true);
      const newPreferences = { ...preferences, ...updates };
      setPreferences(newPreferences);
      await updatePreferences(newPreferences);
      toast({
        title: 'Preferences Updated',
        description: 'Your preferences have been successfully updated.',
      });
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update preferences',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your profile information and avatar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Enter your full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="avatarUrl">Avatar URL</Label>
            <Input
              id="avatarUrl"
              value={formData.avatarUrl}
              onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
              placeholder="Enter avatar URL"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleProfileUpdate} disabled={isUpdating}>
            <User className="mr-2 h-4 w-4" />
            Update Profile
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize how DealReel looks on your device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Theme</Label>
              <div className="text-sm text-muted-foreground">
                Choose your preferred theme
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant={preferences.theme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePreferencesUpdate({ theme: 'light' })}
              >
                <Sun className="mr-2 h-4 w-4" />
                Light
              </Button>
              <Button
                variant={preferences.theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePreferencesUpdate({ theme: 'dark' })}
              >
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </Button>
              <Button
                variant={preferences.theme === 'system' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePreferencesUpdate({ theme: 'system' })}
              >
                System
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Configure your notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="notifications"
              checked={preferences.emailNotifications}
              onCheckedChange={(checked) =>
                handlePreferencesUpdate({ emailNotifications: checked })
              }
            />
            <Label htmlFor="notifications">
              <Bell className="mr-2 h-4 w-4 inline-block" />
              Email Notifications
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dashboard Layout</CardTitle>
          <CardDescription>
            Customize which sections appear on your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="showDocuments"
              checked={preferences.dashboardLayout?.showDocuments}
              onCheckedChange={(checked) =>
                handlePreferencesUpdate({
                  dashboardLayout: {
                    ...preferences.dashboardLayout,
                    showDocuments: checked,
                  },
                })
              }
            />
            <Label htmlFor="showDocuments">
              <Layout className="mr-2 h-4 w-4 inline-block" />
              Show Documents Section
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="showBriefings"
              checked={preferences.dashboardLayout?.showBriefings}
              onCheckedChange={(checked) =>
                handlePreferencesUpdate({
                  dashboardLayout: {
                    ...preferences.dashboardLayout,
                    showBriefings: checked,
                  },
                })
              }
            />
            <Label htmlFor="showBriefings">
              <Layout className="mr-2 h-4 w-4 inline-block" />
              Show Briefings Section
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="showRatings"
              checked={preferences.dashboardLayout?.showRatings}
              onCheckedChange={(checked) =>
                handlePreferencesUpdate({
                  dashboardLayout: {
                    ...preferences.dashboardLayout,
                    showRatings: checked,
                  },
                })
              }
            />
            <Label htmlFor="showRatings">
              <Layout className="mr-2 h-4 w-4 inline-block" />
              Show Ratings Section
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 