import { create } from "zustand"
import { persist } from "zustand/middleware"
import persistStorage from "./persistStorage"

import { UserResponse } from "@/models/auth.model"

// Interface cho vị trí đã lưu
export interface SavedLocation {
  name: string
  latitude: number
  longitude: number
  region?: string
  timestamp: number // Thời gian lưu
}

type Store = {
  isLogin?: boolean
  accessToken: string | undefined
  refreshToken: string | undefined
  userInfo?: UserResponse | null
  lastLocation?: SavedLocation | null // Vị trí GPS cuối cùng
  setIsLogin: (isLogin: boolean) => void
  setAccessToken: (accessToken: string | undefined) => void
  setRefreshToken: (refreshToken: string | undefined) => void
  setUserInfo: (userInfo: UserResponse | null | undefined) => void
  setLastLocation: (location: SavedLocation | null) => void
  logout: () => void
}

export const useAppStore = create<Store>()(
  persist(
    (set) => ({
      isLogin: false,
      accessToken: undefined,
      refreshToken: undefined,
      userInfo: undefined,
      lastLocation: null,
      setIsLogin: (isLogin) => set({ isLogin }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setRefreshToken: (refreshToken) => set({ refreshToken }),
      setUserInfo: (userInfo) => set({ userInfo }),
      setLastLocation: (lastLocation) => set({ lastLocation }),
      logout: () =>
        set({
          isLogin: false,
          accessToken: undefined,
          refreshToken: undefined,
          userInfo: undefined,
          lastLocation: null,
        }),
    }),
    {
      name: "app-storage",
      storage: persistStorage,
      partialize: (state) => ({
        // Các trường sẽ được lưu lại sau khi reload app
        isLogin: state.isLogin,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        userInfo: state.userInfo,
        lastLocation: state.lastLocation, // Lưu vị trí cuối cùng
      }),
    }
  )
)
