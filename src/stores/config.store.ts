import { create } from 'zustand'

interface ConfigStore {
  geminiApiKey1: string | null
  geminiApiKey2: string | null
  geminiApiKey3: string | null
  geminiApiKey4: string | null
  geminiApiKey5: string | null
  geminiApiKey6: string | null
  geminiApiKey7: string | null
  setGeminiApiKey1: (key: string) => void
  setGeminiApiKey2: (key: string) => void
  setGeminiApiKey3: (key: string) => void
  setGeminiApiKey4: (key: string) => void
  setGeminiApiKey5: (key: string) => void
  setGeminiApiKey6: (key: string) => void
  setGeminiApiKey7: (key: string) => void
}

/**
 * Store quản lý config từ Firebase Remote Config
 */
export const useConfigStore = create<ConfigStore>((set) => ({
  geminiApiKey1: null,
  geminiApiKey2: null,
  geminiApiKey3: null,
  geminiApiKey4: null,
  geminiApiKey5: null,
  geminiApiKey6: null,
  geminiApiKey7: null,
  setGeminiApiKey1: (key: string) => set({ geminiApiKey1: key }),
  setGeminiApiKey2: (key: string) => set({ geminiApiKey2: key }),
  setGeminiApiKey3: (key: string) => set({ geminiApiKey3: key }),
  setGeminiApiKey4: (key: string) => set({ geminiApiKey4: key }),
  setGeminiApiKey5: (key: string) => set({ geminiApiKey5: key }),
  setGeminiApiKey6: (key: string) => set({ geminiApiKey6: key }),
  setGeminiApiKey7: (key: string) => set({ geminiApiKey7: key }),
}))
