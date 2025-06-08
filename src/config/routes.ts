export const PUBLIC_ROUTES = ['/signIn', '/forgot-password', '/otp'];

export const isPublicRoute = (pathname: string) => {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
};
