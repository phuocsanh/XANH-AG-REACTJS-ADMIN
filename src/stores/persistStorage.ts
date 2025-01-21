// persistStorage.ts
import { createJSONStorage } from "zustand/middleware";

const persistStorage = createJSONStorage(() => ({
  setItem: (name, value) => {
    localStorage.setItem(name, value);
  },
  getItem: (name) => {
    const value = localStorage.getItem(name);
    return value ?? null;
  },
  removeItem: (name) => {
    localStorage.removeItem(name);
  },
}));

export default persistStorage;
