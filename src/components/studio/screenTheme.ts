export type ScreenTheme = "light" | "dark";
export const screenThemeKey = "ali-workstation-screen-theme";
export function readScreenTheme(value: string | null): ScreenTheme {
  return value === "dark" ? "dark" : "light";
}
