import { FiAlertCircle } from 'react-icons/fi';

interface ErrorDisplayProps {
  message: string;
  className?: string;
  onDismiss?: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  message,
  className = '',
  onDismiss
}) => {
  return (
    <div className={`flex items-center p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 ${className}`}>
      <FiAlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
      <p className="flex-grow">{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-4 text-red-500 hover:text-red-700 focus:outline-none"
          aria-label="Dismiss error"
        >
          ×
        </button>
      )}
    </div>
  );
}; 