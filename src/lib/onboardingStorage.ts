// QuIDE — Onboarding Completion Storage (localStorage)
// src/lib/onboardingStorage.ts

const ONBOARDING_STORAGE_KEY = 'quide_onboarding_completed';

export const onboardingStorage = {
  /**
   * Mark onboarding as completed
   */
  save: (): void => {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    } catch (error) {
      console.warn('Failed to save onboarding status:', error);
    }
  },

  /**
   * Check if user has completed onboarding
   * Returns false if localStorage is disabled or key not found
   */
  hasCompleted: (): boolean => {
    try {
      return localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
    } catch (error) {
      console.warn('Failed to check onboarding status:', error);
      return false;
    }
  },

  /**
   * Clear onboarding completion status (for testing/reset)
   */
  clear: (): void => {
    try {
      localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear onboarding status:', error);
    }
  },
};
