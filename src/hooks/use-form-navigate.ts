import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Type declaration for the `useFormNavigate` hook.
 */
type FormNavigateHook = (featurePatch: string) => {
  /**
   * Navigates back to the list view if the current location state matches the feature path, otherwise, navigates to the feature path.
   */
  goBackToList: () => void;

  /**
   * Navigates to the update view of the specified created item by its ID within the feature path.
   *
   * @param createdId - The ID of the created item to navigate to.
   */
  goToUpdate: (createdId: number) => void;
};

/**
 * Hook for handling navigation within a form-based feature.
 *
 * @param featurePatch - The path or identifier of the feature to navigate to.
 * @returns An object containing functions for navigation.
 */
export const useFormNavigate: FormNavigateHook = featurePatch => {
  const navigate = useNavigate();
  const location = useLocation();

  const goBackToList = () => {
    location.state === featurePatch ? navigate(-1) : navigate(featurePatch);
  };

  const goToUpdate = (createdId: number) => {
    navigate(`${featurePatch}/${createdId}`);
  };

  return { goBackToList, goToUpdate };
};
