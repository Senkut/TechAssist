import { useTheme } from "../hooks/useTheme";

export default function BotonTema({ className = "" }) {
  const { theme, change } = useTheme();
  const oscuro = theme === "dark";

  return (
    <button
      type="button"
      className={`btn-tema ${className}`}
      onClick={change}
      aria-label={oscuro ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      title={oscuro ? "Tema claro" : "Tema oscuro"}
    >
      <i className={`bi ${oscuro ? "bi-sun-fill" : "bi-moon-stars-fill"}`} aria-hidden="true"></i>
    </button>
  );
}