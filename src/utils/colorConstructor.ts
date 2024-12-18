export function colorConstructor(value: { r?: number; g?: number; b?: number; a?: number }): string {
  if (!value || typeof value !== 'object') {
    return 'rgba(0, 0, 0, 0)';
  }
  const { r = 0, g = 0, b = 0, a = 1 } = value;
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
} 