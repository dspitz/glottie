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

/**
 * Get the flood color (main background color) for a language
 * @param code ISO 639-1 language code (e.g., 'es', 'fr')
 * @param alpha Optional alpha/opacity value (default: 1 for solid color)
 * @returns The flood color as rgba string
 */
export function getFloodColor(code: string, alpha: number = 1): string {
  const floodColors: Record<string, string> = {
    es: '247, 115, 115',  // Spanish red #F77373
    fr: '247, 159, 115'   // French orange #F79F73
  }
  const rgb = floodColors[code] || floodColors.es
  return `rgba(${rgb}, ${alpha})`
}

/**
 * Get the secondary color derived from the flood color
 * Uses 210° rotation + 60% saturation + 33% lightness
 * @param code ISO 639-1 language code (e.g., 'es', 'fr')
 * @param alpha Optional alpha/opacity value (default: 1 for solid color)
 * @returns The secondary color as rgba string
 */
export function getSecondaryColor(code: string, alpha: number = 1): string {
  // Get RGB values
  const floodColors: Record<string, [number, number, number]> = {
    es: [247, 115, 115],  // Spanish red #F77373
    fr: [247, 159, 115]   // French orange #F79F73
  }
  const [r, g, b] = floodColors[code] || floodColors.es

  // Convert RGB to HSL
  const rNorm = r / 255
  const gNorm = g / 255
  const bNorm = b / 255

  const max = Math.max(rNorm, gNorm, bNorm)
  const min = Math.min(rNorm, gNorm, bNorm)
  const delta = max - min

  let h = 0
  const l = (max + min) / 2
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))

  if (delta !== 0) {
    if (max === rNorm) {
      h = ((gNorm - bNorm) / delta + (gNorm < bNorm ? 6 : 0)) / 6
    } else if (max === gNorm) {
      h = ((bNorm - rNorm) / delta + 2) / 6
    } else {
      h = ((rNorm - gNorm) / delta + 4) / 6
    }
  }

  // Get secondary color hue (210° rotation for blue shift)
  const compH = (h + 0.583) % 1  // 210/360 = 0.583

  // Use fixed saturation (60%) and lightness (33%)
  const targetS = 0.6
  const targetL = 0.33

  // Convert HSL back to RGB
  const c = (1 - Math.abs(2 * targetL - 1)) * targetS
  const x = c * (1 - Math.abs(((compH * 6) % 2) - 1))
  const m = targetL - c / 2

  let rComp = 0, gComp = 0, bComp = 0
  const hue = compH * 6

  if (hue < 1) {
    rComp = c; gComp = x; bComp = 0
  } else if (hue < 2) {
    rComp = x; gComp = c; bComp = 0
  } else if (hue < 3) {
    rComp = 0; gComp = c; bComp = x
  } else if (hue < 4) {
    rComp = 0; gComp = x; bComp = c
  } else if (hue < 5) {
    rComp = x; gComp = 0; bComp = c
  } else {
    rComp = c; gComp = 0; bComp = x
  }

  const finalR = Math.round((rComp + m) * 255)
  const finalG = Math.round((gComp + m) * 255)
  const finalB = Math.round((bComp + m) * 255)

  return `rgba(${finalR}, ${finalG}, ${finalB}, ${alpha})`
}

// Backward compatibility alias
export const getFloodComplementaryColor = getSecondaryColor
