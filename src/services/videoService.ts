import { DIDService } from './didService';
import { renderVideo } from '@/remotion/utils/render';
import type { ScriptSections } from '@/types/script';
import type { RenderMediaOnProgress } from '@remotion/renderer';

interface VideoServiceOptions {
  onProgress?: (section: keyof ScriptSections, progress: number) => void;
  onError?: (error: Error) => void;
}

interface VideoGenerationOptions {
  script: ScriptSections;
  metrics: Record<string, number>;
  companyInfo: {
    name: string;
    logo?: string;
    industry: string;
  };
  outputPath: string;
}

export class VideoService {
  private didService: DIDService;
  private onProgress?: (section: keyof ScriptSections, progress: number) => void;
  private onError?: (error: Error) => void;

  constructor(options: VideoServiceOptions = {}) {
    this.onProgress = options.onProgress;
    this.onError = options.onError;

    this.didService = new DIDService({
      onProgress: (progress: number) => {
        // DID progress is reported per section
        if (this.currentSection) {
          this.onProgress?.(this.currentSection, progress * 0.6); // D-ID is 60% of the process
        }
      },
      onError: this.onError,
    });
  }

  private currentSection?: keyof ScriptSections;

  private async generateAvatarVideo(
    section: keyof ScriptSections,
    script: string
  ): Promise<string> {
    this.currentSection = section;
    return this.didService.generateTalkWithProgress(script);
  }

  async generateVideo({
    script,
    metrics,
    companyInfo,
    outputPath,
  }: VideoGenerationOptions): Promise<void> {
    try {
      // Generate avatar videos for each section
      const audioSources: Record<keyof ScriptSections, string> = {} as Record<
        keyof ScriptSections,
        string
      >;

      for (const [section, content] of Object.entries(script)) {
        this.onProgress?.(section as keyof ScriptSections, 0);
        audioSources[section as keyof ScriptSections] = await this.generateAvatarVideo(
          section as keyof ScriptSections,
          content
        );
      }

      // Render final video with Remotion
      await renderVideo({
        script,
        audioSources,
        metrics,
        companyInfo,
        outputPath,
        onProgress: (renderProgress) => {
          // Remotion progress starts after D-ID (remaining 40%)
          if (this.currentSection) {
            this.onProgress?.(
              this.currentSection,
              60 + (renderProgress.progress * 0.4)
            );
          }
        },
      });

      this.onProgress?.(Object.keys(script)[0] as keyof ScriptSections, 100);
    } catch (error) {
      this.onError?.(error as Error);
      throw error;
    }
  }
} 