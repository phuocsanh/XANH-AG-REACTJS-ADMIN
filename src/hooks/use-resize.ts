import { RefObject, useLayoutEffect, useState } from 'react';

/**
 * useResize
 * A custom hook to track changes in the width and height of a DOM element or the window.
 *
 * @template T - The type of the DOM element to track.
 * @param ref - A ref object pointing to the DOM element whose size is to be tracked. If not provided, the window size will be tracked.
 * @returns An object containing the current width and height of the tracked element or window.
 */
export const useResize = <T extends HTMLElement>(ref?: RefObject<T> | null) => {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    /**
     * Update the size based on the current dimensions of the tracked element or the window.
     */
    function updateSize() {
      setSize({
        width: ref?.current?.clientWidth ?? window.innerWidth,
        height: ref?.current?.clientHeight ?? window.innerHeight,
      });
    }

    // If the size is initially zero, update it immediately.
    if (size.width === 0 && size.height === 0) {
      updateSize();
    }

    // Add a window resize event listener to track changes in size.
    window.addEventListener('resize', updateSize);

    // Remove the event listener when the component unmounts.
    return () => window.removeEventListener('resize', updateSize);
  }, [ref, size.height, size.width]);

  return size;
};
