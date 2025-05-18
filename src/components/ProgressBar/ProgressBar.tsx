interface ProgressBarProps {
  progress: number;
  className?: string;
  showPercentage?: boolean;
  color?: string;
  height?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className = '',
  showPercentage = false,
  color = 'bg-primary',
  height = 'h-2.5'
}) => {
  // Ensure progress is between 0 and 100
  const normalizedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={className}>
      <div className={`w-full bg-gray-200 rounded-full ${height}`}>
        <div
          className={`${color} ${height} rounded-full transition-all duration-300`}
          style={{ width: `${normalizedProgress}%` }}
        />
      </div>
      {showPercentage && (
        <p className="text-sm text-gray-600 mt-2">
          {Math.round(normalizedProgress)}%
        </p>
      )}
    </div>
  );
}; 