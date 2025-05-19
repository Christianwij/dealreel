'use client';

import { useState } from 'react';
import { FileText, Video, Star, Download, Trash2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import type { Briefing } from '@/types/briefing';

interface BriefingCardProps {
  briefing: Briefing;
  onDelete?: (id: string) => Promise<void>;
}

export function BriefingCard({ briefing, onDelete }: BriefingCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!onDelete) return;
    
    try {
      setIsDeleting(true);
      await onDelete(briefing.id);
      toast({
        title: 'Briefing Deleted',
        description: 'The briefing has been successfully deleted.',
      });
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: error instanceof Error ? error.message : 'Failed to delete briefing',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = async () => {
    // TODO: Implement actual file download from storage
    toast({
      title: 'Download Started',
      description: 'Your file will be downloaded shortly.',
    });
  };

  const getBadgeVariant = (status: Briefing['status']) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'processing':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">{briefing.title}</CardTitle>
        <Badge variant={getBadgeVariant(briefing.status)}>
          {briefing.status}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {briefing.document && (
          <div className="flex items-center space-x-4">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm">{briefing.document.title}</span>
          </div>
        )}
        
        {briefing.video_url && (
          <Dialog open={showVideo} onOpenChange={setShowVideo}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Video className="mr-2 h-4 w-4" />
                Watch Briefing
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px]">
              <DialogHeader>
                <DialogTitle>{briefing.title}</DialogTitle>
              </DialogHeader>
              <div className="aspect-video w-full">
                <iframe
                  src={briefing.video_url}
                  className="h-full w-full rounded-lg"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </DialogContent>
          </Dialog>
        )}

        <div className="flex items-center space-x-2">
          <Star className="h-4 w-4 text-yellow-400" />
          <span className="text-sm text-muted-foreground">
            Average Rating: {briefing.metadata.averageRating ?? 'No ratings yet'}
            {briefing.metadata.totalRatings && ` (${briefing.metadata.totalRatings} ratings)`}
          </span>
        </div>

        {briefing.script && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {briefing.script}
          </p>
        )}

        {briefing.metadata.processingStatus?.stage === 'processing' && (
          <div className="text-sm text-muted-foreground">
            Processing: {briefing.metadata.processingStatus.progress}%
          </div>
        )}

        {briefing.metadata.processingStatus?.error && (
          <p className="text-sm text-destructive">
            Error: {briefing.metadata.processingStatus.error}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
        >
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
        {onDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 