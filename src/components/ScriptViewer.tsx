import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ScriptRecord } from '@/types/script';

interface ScriptViewerProps {
  script: ScriptRecord;
}

export function ScriptViewer({ script }: ScriptViewerProps) {
  if (script.status === 'generating') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Generating Script...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-5/6" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (script.status === 'failed') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Generation Failed</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">
            {script.metadata.error || 'An unknown error occurred'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generated Script</CardTitle>
        <div className="text-sm text-muted-foreground">
          Generated in {script.metadata.generationTime}ms using {script.metadata.model}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="introduction" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="introduction">Intro</TabsTrigger>
            <TabsTrigger value="businessModel">Business</TabsTrigger>
            <TabsTrigger value="tractionMetrics">Traction</TabsTrigger>
            <TabsTrigger value="riskAssessment">Risks</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>
          <TabsContent value="introduction" className="mt-4 whitespace-pre-wrap">
            {script.script.introduction}
          </TabsContent>
          <TabsContent value="businessModel" className="mt-4 whitespace-pre-wrap">
            {script.script.businessModel}
          </TabsContent>
          <TabsContent value="tractionMetrics" className="mt-4 whitespace-pre-wrap">
            {script.script.tractionMetrics}
          </TabsContent>
          <TabsContent value="riskAssessment" className="mt-4 whitespace-pre-wrap">
            {script.script.riskAssessment}
          </TabsContent>
          <TabsContent value="summary" className="mt-4 whitespace-pre-wrap">
            {script.script.summary}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 