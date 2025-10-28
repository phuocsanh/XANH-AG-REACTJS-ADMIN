import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react"

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
  const [bindingValue, setBindingValue] = useState<T | undefined>(initialValue)
  const [debounceValue, setDebounceValue] = useState<T | undefined>(
    initialValue
  )
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Clear the previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // Set a new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      setDebounceValue(bindingValue)
    }, timeout)

    // Cleanup function to clear timeout on unmount or when bindingValue/timeout changes
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [bindingValue, timeout])

  return [debounceValue, setBindingValue]
}
