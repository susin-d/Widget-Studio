/**
 * Converts a hex color string (e.g., "#ffffff" or "#fff") to space-separated RGB values (e.g., "255 255 255").
 */
export function hexToRgb(hex: string): string {
  const value = hex.replace("#", "");
  const int = Number.parseInt(value.length === 3 ? value.split("").map((c) => c + c).join("") : value, 16);
  if (Number.isNaN(int)) return "0 95 184";
  return `${(int >> 16) & 255} ${(int >> 8) & 255} ${int & 255}`;
}
