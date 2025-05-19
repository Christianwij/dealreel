'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ScriptService } from '@/services/scriptService';
import { ScriptViewer } from '@/components/ScriptViewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import type { ScriptRecord } from '@/types/script';

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<ScriptRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const loadScripts = async () => {
      if (!user) return;
      try {
        const scripts = await ScriptService.listScripts(user.id);
        setScripts(scripts);
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load scripts',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadScripts();
  }, [user, toast]);

  if (isLoading) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Loading Scripts...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-4 bg-muted rounded w-5/6" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!scripts.length) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>No Scripts Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Upload a document and select an investor profile to generate your first script.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Generated Scripts</h1>
      <div className="space-y-8">
        {scripts.map((script) => (
          <ScriptViewer key={script.id} script={script} />
        ))}
      </div>
    </div>
  );
} 