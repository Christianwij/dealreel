'use client';

import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileUpload } from '@/components/upload/FileUpload';
import { BriefingCard } from './BriefingCard';
import { SearchAndFilter, type SortOption, type FilterOption } from '@/components/search/SearchAndFilter';
import { useBriefings } from '@/hooks/useBriefings';
import { useToast } from '@/components/ui/use-toast';

export function BriefingList() {
  const [showUpload, setShowUpload] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  
  const { briefings, deleteBriefing } = useBriefings();
  const { toast } = useToast();

  const handleUploadComplete = (documentId: string) => {
    toast({
      title: 'Document Uploaded',
      description: 'Your document has been uploaded and is being processed.',
    });
    setShowUpload(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBriefing(id);
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
    }
  };

  const filteredBriefings = useMemo(() => {
    if (!briefings) return [];

    return briefings
      .filter(briefing => {
        // Apply search filter
        if (searchQuery) {
          const searchLower = searchQuery.toLowerCase();
          const matchesSearch = 
            briefing.title?.toLowerCase().includes(searchLower) ||
            briefing.description?.toLowerCase().includes(searchLower) ||
            briefing.documents?.title?.toLowerCase().includes(searchLower);
          
          if (!matchesSearch) return false;
        }

        // Apply status filter
        if (filterBy === 'all') return true;
        if (filterBy === 'completed') return briefing.status === 'completed';
        if (filterBy === 'pending') return briefing.status === 'pending';
        if (filterBy === 'processing') return briefing.status === 'processing';
        
        return true;
      })
      .sort((a, b) => {
        // Apply sorting
        if (sortBy === 'date') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sortBy === 'title') {
          return (a.title || '').localeCompare(b.title || '');
        }
        if (sortBy === 'rating') {
          const aRating = a.metadata?.averageRating || 0;
          const bRating = b.metadata?.averageRating || 0;
          return bRating - aRating;
        }
        return 0;
      });
  }, [briefings, searchQuery, sortBy, filterBy]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Briefings</h2>
        <Dialog open={showUpload} onOpenChange={setShowUpload}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            <FileUpload onUploadComplete={handleUploadComplete} />
          </DialogContent>
        </Dialog>
      </div>

      <SearchAndFilter
        onSearch={setSearchQuery}
        onSort={setSortBy}
        onFilter={setFilterBy}
        sortBy={sortBy}
        filterBy={filterBy}
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredBriefings.map((briefing) => (
          <BriefingCard
            key={briefing.id}
            briefing={briefing}
            onDelete={handleDelete}
          />
        ))}
        {filteredBriefings.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery
                ? 'No briefings match your search criteria.'
                : 'No briefings yet. Upload a document to get started.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 