"use client";

import { Moon, Sun } from "lucide-react";
import { useCallback, useLayoutEffect, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "css-theme";

function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function savedTheme(): Theme | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

function currentTheme(): Theme {
  const value = document.documentElement.dataset.theme;
  return value === "light" || value === "dark" ? value : systemTheme();
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  document.querySelector<HTMLMetaElement>("meta[data-site-theme-color]")?.setAttribute(
    "content",
    theme === "dark" ? "#080b0f" : "#f2efe6",
  );
  window.dispatchEvent(new CustomEvent("css:theme-change", { detail: { theme } }));
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  const syncTheme = useCallback((next: Theme) => {
    applyTheme(next);
    setTheme(next);
  }, []);

  useLayoutEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const initialTheme = savedTheme() ?? (media.matches ? "dark" : "light");
    applyTheme(initialTheme);
    const initialFrame = window.requestAnimationFrame(() => setTheme(initialTheme));

    const onSystemChange = (event: MediaQueryListEvent) => {
      if (!savedTheme()) syncTheme(event.matches ? "dark" : "light");
    };
    const onThemeChange = (event: Event) => {
      const detail = (event as CustomEvent<{ theme?: Theme }>).detail;
      if (detail?.theme === "light" || detail?.theme === "dark") setTheme(detail.theme);
    };

    media.addEventListener("change", onSystemChange);
    window.addEventListener("css:theme-change", onThemeChange);
    return () => {
      window.cancelAnimationFrame(initialFrame);
      media.removeEventListener("change", onSystemChange);
      window.removeEventListener("css:theme-change", onThemeChange);
    };
  }, [syncTheme]);

  const activeTheme = theme ?? "dark";
  const nextTheme: Theme = activeTheme === "dark" ? "light" : "dark";
  const label = `Switch to ${nextTheme} mode`;

  const toggleTheme = () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // The in-memory theme still changes when storage is unavailable.
    }
    document.documentElement.classList.add("theme-transitioning");
    syncTheme(next);
    window.setTimeout(() => document.documentElement.classList.remove("theme-transitioning"), 260);
  };

  return (
    <button
      className="site-theme-toggle"
      type="button"
      aria-label={label}
      aria-pressed={activeTheme === "light"}
      title={label}
      onClick={toggleTheme}
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        <Sun className="theme-icon theme-icon-sun" strokeWidth={1.9} />
        <Moon className="theme-icon theme-icon-moon" strokeWidth={1.9} />
      </span>
      <span className="sr-only">{label}</span>
    </button>
  );
}
