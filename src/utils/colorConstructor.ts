type ColorValue = { r?: number; g?: number; b?: number; a?: number };
export type ColorSpace = 'rgba' | 'hex' | 'hsl';

const DEFAULT_COLORS = {
  rgba: 'rgba(0, 0, 0, 0)',
  hex: '#00000000',
  hsl: 'hsla(0, 0%, 0%, 0)'
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
    rgba: rgbToRgba
  };

  return converters[colorSpace](r, g, b, a);
} 