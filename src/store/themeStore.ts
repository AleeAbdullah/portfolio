"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark";

interface ThemeStore {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: "light",
      toggleTheme: () => {
        set((state) => {
          const newTheme = state.theme === "light" ? "dark" : "light";
          if (typeof window !== "undefined") {
            document.documentElement.classList.toggle("dark", newTheme === "dark");
          }
          return { theme: newTheme };
        });
      },
      setTheme: (theme: Theme) => {
        set({ theme });
        if (typeof window !== "undefined") {
          document.documentElement.classList.toggle("dark", theme === "dark");
        }
      },
    }),
    {
      name: "theme-store",
      onRehydrateStorage: () => (state) => {
        if (state && typeof window !== "undefined") {
          document.documentElement.classList.toggle("dark", state.theme === "dark");
        } else if (typeof window !== "undefined") {
          // Check system preference on first load
          const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
          const initialTheme = prefersDark ? "dark" : "light";
          document.documentElement.classList.toggle("dark", initialTheme === "dark");
          if (state) {
            state.theme = initialTheme;
          }
        }
      },
    }
  )
);

