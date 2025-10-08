/**
 * Language utility functions for multi-language support
 */

export interface LanguageInfo {
  code: string
  name: string
  flag: string
  nativeName: string
}

export const SUPPORTED_LANGUAGES: Record<string, LanguageInfo> = {
  es: {
    code: 'es',
    name: 'Spanish',
    flag: '🇪🇸',
    nativeName: 'Español'
  },
  fr: {
    code: 'fr',
    name: 'French',
    flag: '🇫🇷',
    nativeName: 'Français'
  }
}

/**
 * Get the display name for a language code
 * @param code ISO 639-1 language code (e.g., 'es', 'fr')
 * @returns Language name in English (e.g., 'Spanish', 'French')
 */
export function getLanguageName(code: string): string {
  return SUPPORTED_LANGUAGES[code]?.name || 'Spanish'
}

/**
 * Get the flag emoji for a language code
 * @param code ISO 639-1 language code
 * @returns Flag emoji string
 */
export function getLanguageFlag(code: string): string {
  return SUPPORTED_LANGUAGES[code]?.flag || '🇪🇸'
}

/**
 * Get the native name for a language code
 * @param code ISO 639-1 language code
 * @returns Language name in its native language
 */
export function getLanguageNativeName(code: string): string {
  return SUPPORTED_LANGUAGES[code]?.nativeName || 'Español'
}

/**
 * Get full language information
 * @param code ISO 639-1 language code
 * @returns LanguageInfo object
 */
export function getLanguageInfo(code: string): LanguageInfo {
  return SUPPORTED_LANGUAGES[code] || SUPPORTED_LANGUAGES.es
}

/**
 * Get all supported languages
 * @returns Array of LanguageInfo objects
 */
export function getAllLanguages(): LanguageInfo[] {
  return Object.values(SUPPORTED_LANGUAGES)
}

/**
 * Check if a language code is supported
 * @param code ISO 639-1 language code
 * @returns true if supported, false otherwise
 */
export function isLanguageSupported(code: string): boolean {
  return code in SUPPORTED_LANGUAGES
}
