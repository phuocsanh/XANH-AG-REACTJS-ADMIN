import { useLocation } from "react-router-dom";
/**
 * useCurrentPath
 * TODO: get path name from react router
 */
export const useCurrentPath = () => {
  const location = useLocation();
  return location.pathname;
};
