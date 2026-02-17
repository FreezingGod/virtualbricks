/**
 * LEGO Color Definition
 * Based on LDConfig.ldr standard
 */
export interface LegoColor {
  id: number
  name: string
  hex: string
  edge: string
  alpha?: number
  material?: 'solid' | 'transparent' | 'chrome' | 'pearl' | 'metallic' | 'rubber'
}

/**
 * Standard LEGO colors (subset of LDraw color palette)
 */
export const LEGO_COLORS: Record<number, LegoColor> = {
  0: { id: 0, name: 'Black', hex: '#212121', edge: '#595959' },
  1: { id: 1, name: 'Blue', hex: '#0055BF', edge: '#333333' },
  2: { id: 2, name: 'Green', hex: '#237841', edge: '#333333' },
  3: { id: 3, name: 'Dark Turquoise', hex: '#008F9B', edge: '#333333' },
  4: { id: 4, name: 'Red', hex: '#C91A09', edge: '#333333' },
  5: { id: 5, name: 'Dark Pink', hex: '#C870A0', edge: '#333333' },
  6: { id: 6, name: 'Brown', hex: '#583927', edge: '#333333' },
  7: { id: 7, name: 'Light Gray', hex: '#9BA19D', edge: '#333333' },
  8: { id: 8, name: 'Dark Gray', hex: '#6D6E5C', edge: '#333333' },
  9: { id: 9, name: 'Light Blue', hex: '#B4D2E3', edge: '#333333' },
  10: { id: 10, name: 'Bright Green', hex: '#4B9F4A', edge: '#333333' },
  11: { id: 11, name: 'Light Turquoise', hex: '#55A5AF', edge: '#333333' },
  12: { id: 12, name: 'Salmon', hex: '#F2705E', edge: '#333333' },
  13: { id: 13, name: 'Pink', hex: '#FC97AC', edge: '#333333' },
  14: { id: 14, name: 'Yellow', hex: '#F2CD37', edge: '#333333' },
  15: { id: 15, name: 'White', hex: '#FFFFFF', edge: '#333333' },
  17: { id: 17, name: 'Light Green', hex: '#C2DAB8', edge: '#333333' },
  18: { id: 18, name: 'Light Yellow', hex: '#FBE696', edge: '#333333' },
  19: { id: 19, name: 'Tan', hex: '#E4CD9E', edge: '#333333' },
  20: { id: 20, name: 'Light Violet', hex: '#C9CAE2', edge: '#333333' },
  22: { id: 22, name: 'Purple', hex: '#81007B', edge: '#333333' },
  23: { id: 23, name: 'Dark Blue Violet', hex: '#2032B0', edge: '#333333' },
  25: { id: 25, name: 'Orange', hex: '#FE8A18', edge: '#333333' },
  26: { id: 26, name: 'Magenta', hex: '#923978', edge: '#333333' },
  27: { id: 27, name: 'Lime', hex: '#BBE90B', edge: '#333333' },
  28: { id: 28, name: 'Dark Tan', hex: '#958A73', edge: '#333333' },
  29: { id: 29, name: 'Bright Pink', hex: '#E4ADC8', edge: '#333333' },
  68: { id: 68, name: 'Very Light Orange', hex: '#F3CF9B', edge: '#333333' },
  69: { id: 69, name: 'Bright Reddish Lilac', hex: '#CD6298', edge: '#333333' },
  70: { id: 70, name: 'Reddish Brown', hex: '#582A12', edge: '#333333' },
  71: { id: 71, name: 'Light Bluish Gray', hex: '#A0A5A9', edge: '#333333' },
  72: { id: 72, name: 'Dark Bluish Gray', hex: '#6C6E68', edge: '#333333' },
  73: { id: 73, name: 'Medium Blue', hex: '#5C9DD1', edge: '#333333' },
  74: { id: 74, name: 'Medium Green', hex: '#73DCA1', edge: '#333333' },
  77: { id: 77, name: 'Light Pink', hex: '#FECCCF', edge: '#333333' },
  78: { id: 78, name: 'Light Nougat', hex: '#F6D7B3', edge: '#333333' },
  84: { id: 84, name: 'Medium Nougat', hex: '#CC702A', edge: '#333333' },
  85: { id: 85, name: 'Medium Lilac', hex: '#3F3691', edge: '#333333' },
  86: { id: 86, name: 'Light Brown', hex: '#7C503A', edge: '#333333' },
  89: { id: 89, name: 'Blue Violet', hex: '#4C61DB', edge: '#333333' },
  92: { id: 92, name: 'Nougat', hex: '#D09168', edge: '#333333' },
  // Transparent colors
  33: { id: 33, name: 'Trans Blue', hex: '#0020A0', edge: '#333333', alpha: 0.5, material: 'transparent' },
  34: { id: 34, name: 'Trans Green', hex: '#237841', edge: '#333333', alpha: 0.5, material: 'transparent' },
  36: { id: 36, name: 'Trans Red', hex: '#C91A09', edge: '#333333', alpha: 0.5, material: 'transparent' },
  37: { id: 37, name: 'Trans Violet', hex: '#8320B7', edge: '#333333', alpha: 0.5, material: 'transparent' },
  40: { id: 40, name: 'Trans Gray', hex: '#635F52', edge: '#333333', alpha: 0.5, material: 'transparent' },
  41: { id: 41, name: 'Trans Light Cyan', hex: '#AEEFEC', edge: '#333333', alpha: 0.5, material: 'transparent' },
  42: { id: 42, name: 'Trans Neon Green', hex: '#C0F500', edge: '#333333', alpha: 0.5, material: 'transparent' },
  43: { id: 43, name: 'Trans Light Blue', hex: '#AEE9EF', edge: '#333333', alpha: 0.5, material: 'transparent' },
  44: { id: 44, name: 'Trans Light Purple', hex: '#96709F', edge: '#333333', alpha: 0.5, material: 'transparent' },
  46: { id: 46, name: 'Trans Yellow', hex: '#F5CD2F', edge: '#333333', alpha: 0.5, material: 'transparent' },
  47: { id: 47, name: 'Trans Clear', hex: '#FCFCFC', edge: '#333333', alpha: 0.5, material: 'transparent' },
}

/**
 * Default colors commonly used in the UI palette
 */
export const DEFAULT_PALETTE_COLORS = [
  // Row 1: Primary colors
  LEGO_COLORS[4],   // Red
  LEGO_COLORS[14],  // Yellow
  LEGO_COLORS[1],   // Blue
  LEGO_COLORS[2],   // Green
  LEGO_COLORS[25],  // Orange
  LEGO_COLORS[22],  // Purple
  // Row 2: Light/pastel colors
  LEGO_COLORS[13],  // Pink
  LEGO_COLORS[77],  // Light Pink
  LEGO_COLORS[17],  // Light Green
  LEGO_COLORS[9],   // Light Blue
  LEGO_COLORS[18],  // Light Yellow
  LEGO_COLORS[20],  // Light Violet
  // Row 3: Neutral & misc
  LEGO_COLORS[15],  // White
  LEGO_COLORS[0],   // Black
  LEGO_COLORS[71],  // Light Bluish Gray
  LEGO_COLORS[72],  // Dark Bluish Gray
  LEGO_COLORS[19],  // Tan
  LEGO_COLORS[27],  // Lime
]
