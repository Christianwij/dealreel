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

export function CreateProfileButton() {
  const [isOpen, setIsOpen] = useState(false);

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
          onSuccess={() => {
            setIsOpen(false);
            // TODO: Refresh profile list
          }}
        />
      </DialogContent>
    </Dialog>
  );
} 