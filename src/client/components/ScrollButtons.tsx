import React from 'react';
import { trackAnalytics } from '../lib/trackAnalytics';

interface ScrollButtonsProps {
  onPrevious?: () => void;
  onNext?: () => void;
  canGoPrev?: boolean;
  canGoNext?: boolean;
  loading?: boolean;
}

export const ScrollButtons: React.FC<ScrollButtonsProps> = ({
  onPrevious,
  onNext,
  canGoPrev = true,
  canGoNext = true,
  loading = false
}) => {

  const handlePrevious = () => {
    trackAnalytics(); // Track user interaction
    onPrevious?.();
  };

  const handleNext = () => {
    trackAnalytics(); // Track user interaction
    onNext?.();
  };

  return (
    <>
      {/* Left Button */}
      {canGoPrev && (
        <button
          onClick={handlePrevious}
          disabled={!canGoPrev}
          className="absolute left-1 bottom-1 z-20 w-8 h-8 flex items-center justify-center bg-gray-800/50 hover:bg-gray-800/70 dark:bg-gray-200/50 dark:hover:bg-gray-200/70 text-white dark:text-gray-900 rounded-full shadow-lg cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}

      {/* Right Button */}
      {canGoNext && (
        <button
          onClick={handleNext}
          disabled={!canGoNext || loading}
          className="absolute right-1 bottom-1 z-20 w-8 h-8 flex items-center justify-center bg-gray-800/50 hover:bg-gray-800/70 dark:bg-gray-200/50 dark:hover:bg-gray-200/70 text-white dark:text-gray-900 rounded-full shadow-lg cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Next"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}
    </>
  );
};
