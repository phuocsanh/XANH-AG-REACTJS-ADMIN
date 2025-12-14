export const PUBLIC_ROUTES = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/otp",
  "/weather-forecast",
]

export const AI_DEMO_ROUTE = "/ai-demo"

export const isPublicRoute = (pathname: string) => {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
}
