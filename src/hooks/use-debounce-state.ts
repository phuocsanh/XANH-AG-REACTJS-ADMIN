import { Dispatch, SetStateAction, useEffect, useState } from 'react';

/**
 * Custom hook for managing a state value with debounce functionality.
 * @param initialValue - The initial value of the state.
 * @param timeout - The debounce timeout in milliseconds, defaults to 500ms.
 * @returns A tuple containing the debounced value and a setter function.
 */
export const useDebounceState = <T>(
  initialValue?: T,
  timeout = 500
): [T | undefined, Dispatch<SetStateAction<T | undefined>>] => {
  const [bindingValue, setBindingValue] = useState<T | undefined>(initialValue);
  const [debounceValue, setDebounceValue] = useState<T | undefined>(initialValue);

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      setDebounceValue(bindingValue);
    }, timeout);

    return () => clearTimeout(debounceTimeout);
  }, [bindingValue, timeout]);

  return [debounceValue, setBindingValue];
};
