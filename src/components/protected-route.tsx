import { ReactNode, useEffect, useState } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAppStore } from "@/stores"
import { isPublicRoute } from "@/config/routes"
import { toast } from "react-toastify"

interface ProtectedRouteProps {
  children: ReactNode
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation()
  const isAuthenticated = useAppStore((state) => state.isLogin)
  const [hasShownToast, setHasShownToast] = useState(false)
  const currentPath = location.pathname

  useEffect(() => {
    // Reset toast state khi authentication status thay đổi
    if (isAuthenticated) {
      setHasShownToast(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    // Chỉ hiển thị thông báo nếu người dùng chưa đăng nhập
    // và không phải là trang công khai
    if (!isAuthenticated && !isPublicRoute(currentPath) && !hasShownToast) {
      toast.error("Vui lòng đăng nhập để truy cập trang này")
      setHasShownToast(true)
    }
  }, [isAuthenticated, currentPath, hasShownToast])

  // Nếu chưa đăng nhập và không phải trang công khai, chuyển hướng đến trang đăng nhập
  if (!isAuthenticated && !isPublicRoute(currentPath)) {
    return <Navigate to='/sign-in' state={{ from: currentPath }} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
