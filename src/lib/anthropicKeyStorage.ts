// QuIDE — Anthropic API Key Storage (localStorage BYOK)
// src/lib/anthropicKeyStorage.ts

const ANTHROPIC_KEY_STORAGE = 'quide_anthropic_api_key';

export const anthropicKeyStorage = {
  /**
   * Save Anthropic API key to localStorage
   */
  save: (apiKey: string): void => {
    localStorage.setItem(ANTHROPIC_KEY_STORAGE, apiKey);
  },

  /**
   * Load Anthropic API key from localStorage
   * Returns null if not found
   */
  load: (): string | null => {
    return localStorage.getItem(ANTHROPIC_KEY_STORAGE);
  },

  /**
   * Clear Anthropic API key from localStorage
   */
  clear: (): void => {
    localStorage.removeItem(ANTHROPIC_KEY_STORAGE);
  },

  /**
   * Check if API key exists in localStorage
   */
  hasKey: (): boolean => {
    return !!localStorage.getItem(ANTHROPIC_KEY_STORAGE);
  },
};
