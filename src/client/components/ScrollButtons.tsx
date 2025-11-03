import React, { useState } from 'react';
import { trackAnalytics } from '../lib/trackAnalytics';

interface ScrollButtonsProps {
  currentPage: number;
  setPage: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
  hasMoreToLoad: boolean;
  loadMore: () => Promise<void>;
  loadingMore: boolean;
}

export const ScrollButtons: React.FC<ScrollButtonsProps> = ({
  currentPage,
  setPage,
  totalItems,
  itemsPerPage,
  hasMoreToLoad,
  loadMore,
  loadingMore
}) => {
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Calculate total pages based on actual items we have
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  // Determine if we can navigate
  const canGoPrev = currentPage > 0;
  const hasNextPage = currentPage < totalPages - 1;
  const canGoNext = hasNextPage || hasMoreToLoad;

  const handlePrevious = () => {
    trackAnalytics();
    if (canGoPrev) {
      setPage(currentPage - 1);
    }
  };

  const handleNext = async () => {
    trackAnalytics();

    if (hasNextPage) {
      // We have another page of existing items, just navigate
      setPage(currentPage + 1);
    } else if (hasMoreToLoad && !isLoadingMore && !loadingMore) {
      // We're at the end, need to load more
      setIsLoadingMore(true);
      try {
        await loadMore();
        // After loading, advance to the next page if new items were added
        setPage(currentPage + 1);
      } catch (error) {
        console.error('Error loading more items:', error);
      } finally {
        setIsLoadingMore(false);
      }
    }
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
          disabled={!canGoNext || isLoadingMore || loadingMore}
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
