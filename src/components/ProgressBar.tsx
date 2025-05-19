import { Progress } from '@/components/ui/progress';

interface ProgressBarProps {
  progress: number;
  label?: string;
  className?: string;
}

export function ProgressBar({ progress, label, className = '' }: ProgressBarProps) {
  return (
    <div className={className}>
      <Progress value={progress} className="w-full" />
      {label && (
        <p className="mt-2 text-sm text-center text-gray-600">
          {label} {Math.round(progress)}%
        </p>
      )}
    </div>
  );
} 