"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "light" ? "light" : "dark");
  }, []);

  function apply(next: Theme) {
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("revena-theme", next);
  }

  return (
    <div className="inline-flex rounded-md border border-border bg-surface p-0.5">
      {(["dark", "light"] as const).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => apply(t)}
          className={`rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
            theme === t ? "bg-surface-hover text-foreground" : "text-muted hover:text-foreground"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
