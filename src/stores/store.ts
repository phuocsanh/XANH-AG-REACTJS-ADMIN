import { create } from "zustand"
import { persist } from "zustand/middleware"
import persistStorage from "./persistStorage"

import { UserResponse } from "@/models/auth.model"

type Store = {
  isLogin?: boolean
  accessToken: string | undefined
  refreshToken: string | undefined
  userInfo?: UserResponse | null
  setIsLogin: (isLogin: boolean) => void
  setAccessToken: (accessToken: string | undefined) => void
  setRefreshToken: (refreshToken: string | undefined) => void
  setUserInfo: (userInfo: UserResponse | null | undefined) => void
  logout: () => void
}

export const useAppStore = create<Store>()(
  persist(
    (set) => ({
      isLogin: false,
      accessToken: undefined,
      refreshToken: undefined,
      userInfo: undefined,
      setIsLogin: (isLogin) => set({ isLogin }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setRefreshToken: (refreshToken) => set({ refreshToken }),
      setUserInfo: (userInfo) => set({ userInfo }),
      logout: () =>
        set({
          isLogin: false,
          accessToken: undefined,
          refreshToken: undefined,
          userInfo: undefined,
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
      }),
    }
  )
)
