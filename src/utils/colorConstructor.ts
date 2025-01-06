type ColorValue = { r?: number; g?: number; b?: number; a?: number };
export type ColorSpace = 'rgba' | 'hex' | 'hsl' | 'oklch';

const DEFAULT_COLORS = {
  rgba: 'rgba(0, 0, 0, 0)',
  hex: '#00000000',
  hsl: 'hsla(0, 0%, 0%, 0)',
  oklch: 'oklch(0% 0 0 / 0)'
} as const;

const normalizeColor = (value: ColorValue) => ({
  r: value.r ?? 0,
  g: value.g ?? 0,
  b: value.b ?? 0,
  a: value.a ?? 1
});

const rgbToHex = (r: number, g: number, b: number, a: number): string => {
  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(a)}`;
};

const rgbToHsl = (r: number, g: number, b: number, a: number): string => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  
  if (max === min) {
    return `hsla(0, 0%, ${Math.round(l * 100)}%, ${a})`;
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  
  let h = 0;
  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0);
      break;
    case g:
      h = (b - r) / d + 2;
      break;
    case b:
      h = (r - g) / d + 4;
      break;
  }
  h /= 6;

  return `hsla(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%, ${a})`;
};

const rgbToRgba = (r: number, g: number, b: number, a: number): string => 
  `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;

const rgbToOklch = (r: number, g: number, b: number, a: number): string => {
  // Convert RGB to OKLCH (simplified conversion)
  // Note: This is a basic conversion. For production use, 
  // consider using a color conversion library for more accurate results
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const lightness = Math.round(l * 100);
  const chroma = Math.round(Math.sqrt(m * m + s * s) * 100) / 100;
  const hue = Math.round(Math.atan2(s, m) * (180 / Math.PI));

  return `oklch(${lightness}% ${chroma} ${hue} / ${a})`;
};

export function colorConstructor(
  value: ColorValue,
  colorSpace: ColorSpace = 'rgba'
): string {
  if (!value || typeof value !== 'object') {
    return DEFAULT_COLORS[colorSpace];
  }

  const { r, g, b, a } = normalizeColor(value);
  
  const converters = {
    hex: rgbToHex,
    hsl: rgbToHsl,
    rgba: rgbToRgba,
    oklch: rgbToOklch
  };

  return converters[colorSpace](r, g, b, a);
} 