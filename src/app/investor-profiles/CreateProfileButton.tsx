import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { InvestorProfileForm } from '@/components/InvestorProfileForm';
import { useToast } from '@/components/ui/use-toast';
import { InvestorProfileService } from '@/services/investorProfileService';
import { useAuth } from '@/hooks/useAuth';
import type { InvestorProfileInput } from '@/types/investor';

export function CreateProfileButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (data: InvestorProfileInput) => {
    try {
      if (!user) {
        toast({
          title: 'Error',
          description: 'You must be logged in to create a profile.',
          variant: 'destructive',
        });
        return;
      }
      await InvestorProfileService.createProfile(user.id, data);
      setIsOpen(false);
      toast({
        title: 'Success',
        description: 'Profile created successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Create Profile</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Investor Profile</DialogTitle>
          <DialogDescription>
            Set up your investment preferences and criteria for deal analysis.
          </DialogDescription>
        </DialogHeader>
        <InvestorProfileForm
          onSubmit={handleSubmit}
          onCancel={() => setIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
} 