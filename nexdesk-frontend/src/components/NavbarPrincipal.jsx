import { useId, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { menuPorRol, ICONOS_BI as ICONOS } from "../config/menu";
import BotonTema from "./BotonTema";
import CampanaNotificaciones from "./CampanaNotificaciones";

/**
 * Logo SKYA (nube + "S" + píxeles) dibujado en SVG.
 * - variante "color": para fondos claros
 * - variante "claro": para fondos oscuros (blanco)
 *
 * Si tienes el logo original, puedes reemplazar este componente por:
 *   <img src={logo} alt="SKYA" width={tamano} />
 */
export function LogoSkya({ tamano = 64, variante = "color", className = "" }) {
  const id = useId().replace(/:/g, "");
  const claro = variante === "claro";

  const trazoNube = claro ? "#ffffff" : `url(#nube-${id})`;
  const trazoS = claro ? "#ccfbf1" : "#0b3b3d";
  const pixel = claro ? "#99f6e4" : "#14b8a6";

  return (
    <svg
      className={className}
      width={tamano}
      height={tamano * 0.78}
      viewBox="0 0 120 94"
      fill="none"
      role="img"
      aria-label="SKYA"
    >
      {!claro && (
        <defs>
          <linearGradient id={`nube-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#0f766e" />
            <stop offset="1" stopColor="#2dd4bf" />
          </linearGradient>
        </defs>
      )}

      {/* Nube */}
      <path
        d="M30 72 C13 72 7 57 16 48 C14 34 30 26 40 33 C45 17 71 15 79 31 C94 29 104 43 96 55 C105 64 98 73 87 72 Z"
        stroke={trazoNube}
        strokeWidth="7"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* S central */}
      <path
        d="M44 63 C62 68 82 60 72 51 C65 45 45 51 50 41 C54 33 72 34 82 41"
        stroke={trazoS}
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Píxeles */}
      <rect x="92" y="8" width="7" height="7" rx="1.5" fill={pixel} />
      <rect x="102" y="15" width="5" height="5" rx="1" fill={pixel} opacity=".75" />
      <rect x="100" y="3" width="4" height="4" rx="1" fill={pixel} opacity=".55" />
    </svg>
  );
}

export default function NavbarPrincipal() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const opciones = menuPorRol(usuario?.rol);

  // ==========================================
  // 1. INFORMACIÓN DEL USUARIO
  // ==========================================

  const nombreCompleto = [usuario?.nombre, usuario?.apellido]
    .filter(Boolean)
    .join(" ");

  const inicial = usuario?.nombre?.charAt(0)?.toUpperCase() || "U";

  // ==========================================
  // 2. CERRAR SESIÓN
  // ==========================================

  function cerrarSesion() {
    sessionStorage.removeItem("nexdesk_mostrar_bienvenida");
    logout();
    navigate("/login", { replace: true });
  }

  // ==========================================
  // 3. BARRA DE NAVEGACIÓN
  // ==========================================

  return (
    <header className="skya-nav">
      <div className="skya-nav-inner">

        {/* MARCA */}
        <Link to="/dashboard" className="skya-brand" aria-label="SKYA, ir al panel">
          <span className="skya-brand-mark">
            <LogoSkya tamano={26} variante="claro" />
          </span>
          <span>
            <strong>SKYA</strong>
            <small>Sistema Integral de Gestión</small>
          </span>
        </Link>

        {/* NAVEGACIÓN PRINCIPAL */}
        <nav
          className={`skya-links ${menuAbierto ? "abierto" : ""}`}
          aria-label="Navegación principal"
        >
          {opciones.map((opcion) => (
            <NavLink
              key={opcion.ruta}
              to={opcion.ruta}
              onClick={() => setMenuAbierto(false)}
              className={({ isActive }) =>
                `skya-link ${isActive ? "activo" : ""}`
              }
            >
              <i className={`bi ${ICONOS[opcion.ruta] || "bi-circle"}`} aria-hidden="true"></i>
              <span>{opcion.titulo}</span>
            </NavLink>
          ))}
        </nav>

        {/* ACCIONES */}
        <div className="skya-nav-actions">

          <BotonTema />

          <CampanaNotificaciones />

          {/* MENÚ DEL USUARIO */}
          <div className="dropdown">
            <button
              className="btn d-flex align-items-center gap-2 skya-user"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <span className="nexdesk-avatar">{inicial}</span>

              <span className="text-start nexdesk-user-info">
                <strong className="d-block">
                  {nombreCompleto || "Usuario"}
                </strong>
                <small className="d-block">{usuario?.rol}</small>
              </span>

              <i className="bi bi-chevron-down small" aria-hidden="true"></i>
            </button>

            <ul className="dropdown-menu dropdown-menu-end shadow border-0">
              <li>
                <span className="dropdown-item-text small text-secondary">
                  {usuario?.email}
                </span>
              </li>

              <li><hr className="dropdown-divider" /></li>

              <li>
                <Link className="dropdown-item" to="/cambiar-password">
                  <i className="bi bi-shield-lock me-2" aria-hidden="true"></i>
                  Cambiar contraseña
                </Link>
              </li>

              <li>
                <button
                  type="button"
                  className="dropdown-item text-danger"
                  onClick={cerrarSesion}
                >
                  <i className="bi bi-box-arrow-right me-2" aria-hidden="true"></i>
                  Cerrar sesión
                </button>
              </li>
            </ul>
          </div>

          <button
            type="button"
            className="skya-nav-toggle"
            onClick={() => setMenuAbierto((v) => !v)}
            aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuAbierto}
          >
            <i className={`bi ${menuAbierto ? "bi-x-lg" : "bi-list"}`} aria-hidden="true"></i>
          </button>
        </div>

      </div>
    </header>
  );
}
