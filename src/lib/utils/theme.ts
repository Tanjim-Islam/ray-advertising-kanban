export const COLOR_MODE_STORAGE_KEY = "ray.color-mode";

export type ColorMode = "dark" | "light";

export function resolveColorMode(value: string | null | undefined): ColorMode {
  return value === "dark" ? "dark" : "light";
}
