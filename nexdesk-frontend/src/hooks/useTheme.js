import { useEffect, useState } from "react";

const KEY = "actual_theme";

function saveTheme() {
  try {
    const t = localStorage.getItem(KEY);
    if (t === "dark" || t === "light") return t;
  } catch { /* sin localStorage */ }
  return "light";
}

export function useTheme() {
  const [theme, setTheme] = useState(saveTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-bs-theme", theme);
    try { localStorage.setItem(KEY, theme); } catch { /* ignorar */ }
  }, [theme]);

  const change = () =>
    setTheme((t) => (t === "dark" ? "light" : "dark"));

  return { theme, change };
}