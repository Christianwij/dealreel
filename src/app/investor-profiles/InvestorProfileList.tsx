'use client';

import { useEffect, useState } from 'react';
import { InvestorProfile, InvestorProfileInput } from '@/types/investor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InvestorProfileForm } from '@/components/InvestorProfileForm';
import { useToast } from '@/components/ui/use-toast';
import { InvestorProfileService } from '@/services/investorProfileService';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Pencil, Trash2 } from 'lucide-react';

export function InvestorProfileList() {
  const [profiles, setProfiles] = useState<InvestorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState<InvestorProfile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadProfiles();
    }
  }, [user]);

  const loadProfiles = async () => {
    try {
      const data = await InvestorProfileService.listProfiles(user!.id);
      setProfiles(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load profiles',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await InvestorProfileService.deleteProfile(id, user!.id);
      setProfiles(profiles.filter(p => p.id !== id));
      toast({
        title: 'Success',
        description: 'Profile deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete profile',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (data: InvestorProfileInput) => {
    try {
      if (editingProfile) {
        const updated = await InvestorProfileService.updateProfile(editingProfile.id, user!.id, data);
        setProfiles(profiles.map(p => p.id === editingProfile.id ? updated : p));
        toast({
          title: 'Success',
          description: 'Profile updated successfully',
        });
      }
      setIsDialogOpen(false);
      setEditingProfile(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {profiles.map((profile) => (
        <Card key={profile.id} className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-bold">{profile.name}</CardTitle>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditingProfile(profile);
                  setIsDialogOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(profile.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-medium">Industries: </span>
              {profile.industries.join(', ')}
            </div>
            <div>
              <span className="font-medium">Stages: </span>
              {profile.stages.join(', ')}
            </div>
            <div>
              <span className="font-medium">Investment Range: </span>
              ${profile.minInvestment.toLocaleString()} - ${profile.maxInvestment.toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Key KPIs: </span>
              {profile.kpis.join(', ')}
            </div>
            <div>
              <span className="font-medium">Red Flags: </span>
              {profile.redFlags.join(', ')}
            </div>
            <div>
              <span className="font-medium">Communication Tone: </span>
              {profile.communicationTone}
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingProfile ? 'Edit Profile' : 'Create Profile'}
            </DialogTitle>
          </DialogHeader>
          <InvestorProfileForm
            initialData={editingProfile || undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              setEditingProfile(null);
              setIsDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
} 