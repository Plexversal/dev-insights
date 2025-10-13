import React from 'react';

interface ScrollButtonsProps {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  scrollAmount?: number;
}

export const ScrollButtons: React.FC<ScrollButtonsProps> = ({
  scrollContainerRef,
  scrollAmount = 300
}) => {
  const [showLeftButton, setShowLeftButton] = React.useState(false);
  const [showRightButton, setShowRightButton] = React.useState(false);

  const checkScroll = React.useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;

    // Show left button if scrolled right
    setShowLeftButton(scrollLeft > 0);

    // Show right button if there's more content to the right
    setShowRightButton(scrollLeft < scrollWidth - clientWidth - 1);
  }, [scrollContainerRef]);

  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Check initial state
    checkScroll();

    // Add scroll listener
    container.addEventListener('scroll', checkScroll);

    // Add resize listener to handle window resizing
    window.addEventListener('resize', checkScroll);

    // Use MutationObserver to detect content changes
    const observer = new MutationObserver(checkScroll);
    observer.observe(container, { childList: true, subtree: true });

    return () => {
      container.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
      observer.disconnect();
    };
  }, [checkScroll, scrollContainerRef]);

  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.scrollBy({
      left: -scrollAmount,
      behavior: 'smooth'
    });
  };

  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    });
  };

  return (
    <>
      {/* Left Button */}
      {showLeftButton && (
        <button
          onClick={scrollLeft}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center bg-gray-800/50 hover:bg-gray-800/70 text-white rounded-full shadow-lg cursor-pointer transition-all"
          aria-label="Scroll left"
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
      {showRightButton && (
        <button
          onClick={scrollRight}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center bg-gray-800/50 hover:bg-gray-800/70 text-white rounded-full shadow-lg cursor-pointer transition-all"
          aria-label="Scroll right"
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
