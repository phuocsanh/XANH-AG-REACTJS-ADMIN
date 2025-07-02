import { useCallback, useState } from 'react';

/**
 * Custom hook to manage boolean state in React components.
 * @param initialState - The initial value of the state, defaults to false.
 */
export const useBoolean = (initialState = false) => {
  const [state, setState] = useState(initialState);

  /**
   * Sets the state value to true.
   */
  const setTrue = useCallback(() => setState(true), []);

  /**
   * Sets the state value to false.
   */
  const setFalse = useCallback(() => setState(false), []);

  /**
   * Toggles the state value between true and false.
   */
  const toggle = useCallback(() => setState(!state), [state]);

  return { state, setTrue, setFalse, toggle };
};
