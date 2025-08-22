/**
 * Utils functions
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 *
 * @param value
 * @returns
 */
export const parseJson = <T>(value: string) => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return value;
  }
};

/**
 *
 * @param inputs
 * @returns
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
/**
 * Creates a hash map from a list of objects using the specified key as the key in the map.
 *
 * @param list - The list of objects to create a hash map from.
 * @param key - The key to use as the map key (default is 'id').
 * @returns A hash map where the keys are the specified property values and the values are the corresponding objects.
 *          Returns null if the input list is empty.
 */
export const hash = <T>(list: T[], key = 'id'): { [key: string | number]: T } | null => {
  if (!list.length) return null;

  return list.reduce((result, item) => {
    return { ...result, [item[key as keyof T] as number | string]: item };
  }, {});
};

/**
 * Gets a local storage key with the host as a prefix.
 *
 * @param key - The key to prefix with the host.
 * @returns The local storage key with the host prefix.
 */
export const getLocalKeyWithHost = (key: string): string =>
  !window ? key : `${window.location.host}_${key}`;

/**
 * Checks if the scrollable container is at the bottom.
 *
 * @param eventTarget - The scrollable HTMLElement to check.
 * @returns True if the scrollable container is at the bottom, false otherwise.
 */
export const atBottom = (eventTarget: HTMLElement) => {
  const { scrollHeight, scrollTop, offsetHeight } = eventTarget;
  if (offsetHeight === 0) {
    return true;
  }
  return scrollTop === scrollHeight - offsetHeight;
};
