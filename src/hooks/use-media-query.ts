import { useEffect, useState } from 'react';

/**
 * Custom hook for tracking media query matches.
 * @param query - The media query string to track.
 * @returns A boolean value indicating whether the media query is matched.
 */
export const useMediaQuery = (query: string): boolean => {
  /**
   * Helper function to get the current match status for a media query.
   * @param query - The media query string.
   * @returns True if the media query is currently matched, false otherwise.
   */
  const getMatches = (query: string): boolean => {
    // Prevents SSR issues
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  };

  // Initialize the state with the initial match status.
  const [matches, setMatches] = useState<boolean>(getMatches(query));

  /**
   * Event handler function to update the match status when the media query changes.
   */
  function handleChange() {
    setMatches(getMatches(query));
  }

  // Subscribe to changes in the media query.
  useEffect(() => {
    const matchMedia = window.matchMedia(query);

    // Triggered at the first client-side load and if the query changes.
    handleChange();

    // Listen for changes in the media query.
    matchMedia.addEventListener('change', handleChange);

    // Clean up the event listener when the component unmounts.
    return () => {
      matchMedia.removeEventListener('change', handleChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Return the current match status.
  return matches;
};
