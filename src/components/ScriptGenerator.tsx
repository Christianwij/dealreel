import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { ScriptService } from '@/services/scriptService';
import type { ScriptGenerationRequest, ScriptRecord } from '@/types/script';

interface ScriptGeneratorProps {
  uploadId: string;
  parsedContent: Record<string, any>;
  investorProfileId: string;
  userId: string;
  onScriptGenerated?: (script: ScriptRecord) => void;
}

export function ScriptGenerator({
  uploadId,
  parsedContent,
  investorProfileId,
  userId,
  onScriptGenerated,
}: ScriptGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const request: ScriptGenerationRequest = {
        uploadId,
        parsedContent,
        investorProfileId,
      };

      const script = await ScriptService.createScript(userId, request);
      toast({
        title: 'Success',
        description: 'Script generated successfully',
      });
      onScriptGenerated?.(script);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate script',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Investor Script</CardTitle>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Script...
            </>
          ) : (
            'Generate Script'
          )}
        </Button>
      </CardContent>
    </Card>
  );
} 