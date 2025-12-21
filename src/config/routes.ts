export const PUBLIC_ROUTES = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/otp",
  "/weather-forecast",
]

// Routes mà CUSTOMER được phép truy cập
export const CUSTOMER_ALLOWED_ROUTES = [
  "/",  // Dashboard
  "/rice-crops",  // Ruộng lúa
  "/weather-forecast",  // Dự báo thời tiết
  "/change-password",  // Đổi mật khẩu
]

export const AI_DEMO_ROUTE = "/ai-demo"

export const isPublicRoute = (pathname: string) => {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
}

// Kiểm tra xem route có được phép cho CUSTOMER không
export const isCustomerAllowedRoute = (pathname: string) => {
  return CUSTOMER_ALLOWED_ROUTES.some((route) => {
    if (route === "/") {
      return pathname === "/"
    }
    return pathname.startsWith(route)
  })
}
