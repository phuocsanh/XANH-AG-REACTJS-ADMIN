/**
 *  Local store utils
 */

import { parseJson } from './utils';

export const getLocalStorage = <T>(key: string): string | T => {
  const value = localStorage.getItem(key) as string;

  return parseJson<string | T>(value);
};

export const setLocalStorage = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const removeLocalStorage = (key: string) => {
  if (getLocalStorage(key)) {
    localStorage.removeItem(key);
  }
};
