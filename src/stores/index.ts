import { create } from "zustand"
import { persist } from "zustand/middleware"
import persistStorage from "./persistStorage"

import { UserResponse } from "@/models/auth.model"

type Store = {
  isLogin?: boolean
  accessToken: string | undefined
  refreshToken: string | undefined
  userInfo?: UserResponse | null
}

export const useAppStore = create<Store>()(
  persist(
    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
    (_set, _get) => ({
      isLogin: false,
      accessToken: undefined,
      refreshToken: undefined,
    }),
    {
      name: "app-storage",
      storage: persistStorage,
      partialize: (state) => ({
        // Các trường sẽ được lưu lại sau khi reload app
        isLogin: state.isLogin,
      }),
    }
  )
)
