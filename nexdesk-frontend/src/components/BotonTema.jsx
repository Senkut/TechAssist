import { useTheme } from "../hooks/useTheme";

export default function BotonTema() {
  const { theme, change } = useTheme();
  const oscuro = theme === "dark";

  return (
    <button
      type="button"
      className="btn-tema"
      onClick={change}
      aria-label={oscuro ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      title={oscuro ? "Tema claro" : "Tema oscuro"}
    >
      {oscuro ? "☀️" : "🌙"}
    </button>
  );
}