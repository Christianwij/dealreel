'use client';

import { useState } from 'react';
import { InvestorProfileList } from './InvestorProfileList';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { InvestorProfileForm } from '@/components/InvestorProfileForm';
import { useToast } from '@/components/ui/use-toast';
import { InvestorProfileService } from '@/services/investorProfileService';
import { useAuth } from '@/hooks/useAuth';
import type { InvestorProfile, InvestorProfileInput } from '@/types/investor';
import { Plus } from 'lucide-react';

export const metadata = {
  title: 'Investor Profiles | DealReel',
  description: 'Manage your investor profiles and preferences',
};

export default function InvestorProfilesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleCreate = async (data: InvestorProfileInput) => {
    try {
      await InvestorProfileService.createProfile(user!.id, data);
      setIsDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Profile created successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create profile',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Investor Profiles</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Profile
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create Profile</DialogTitle>
            </DialogHeader>
            <InvestorProfileForm
              onSubmit={handleCreate}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <InvestorProfileList />
    </div>
  );
} 