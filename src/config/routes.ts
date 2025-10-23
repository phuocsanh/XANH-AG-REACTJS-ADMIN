export const PUBLIC_ROUTES = ["/sign-in", "/forgot-password", "/otp"]

export const isPublicRoute = (pathname: string) => {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
}
