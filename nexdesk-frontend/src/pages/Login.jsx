
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import EstadoBackend from "../components/EstadoBackend";
import { useAuth } from "../hooks/useAuth";
import BotonTema from "../components/BotonTema";
import { LogoSkya } from "../components/NavbarPrincipal";

export default function Login() {
  // 1. Navegación y autenticación
  const navigate = useNavigate();
  const { login } = useAuth();

  // 2. Estados del formulario
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [verPassword, setVerPassword] = useState(false);

  // 3. Procesar inicio de sesión
  async function manejarLogin(evento) {
    evento.preventDefault();

    setError("");
    setCargando(true);

    // Evitar conservar una bienvenida anterior
    sessionStorage.removeItem(
      "nexdesk_mostrar_bienvenida"
    );

    try {
      // Autenticación mediante la API REST
      const perfil = await login(email, password);

      // Verificar cambio obligatorio de contraseña
      if (
        perfil.debeCambiarPassword ||
        perfil.debe_cambiar_password
      ) {
        navigate("/cambiar-password", {
          replace: true,
        });
      } else {
        // Activar notificación de bienvenida
        sessionStorage.setItem(
          "nexdesk_mostrar_bienvenida",
          "1"
        );

        // Acceder al dashboard
        navigate("/dashboard", {
          replace: true,
        });
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible iniciar sesión."
      );
    } finally {
      setCargando(false);
    }
  }

  // 4. Interfaz de inicio de sesión
  return (
    <div className="skya-login">
      <div className="skya-login-corner" aria-hidden="true" />

      <svg
        className="skya-login-wave"
        viewBox="0 0 1440 220"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="skya-ola" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#0b5f58" />
            <stop offset="1" stopColor="#0f766e" />
          </linearGradient>
        </defs>
        <path
          d="M0 90 C240 20 520 30 760 80 C1020 135 1240 110 1440 50 L1440 220 L0 220 Z"
          fill="#2dd4bf"
          opacity="0.35"
        />
        <path
          d="M0 130 C260 70 560 80 800 125 C1050 170 1250 150 1440 105 L1440 220 L0 220 Z"
          fill="url(#skya-ola)"
        />
      </svg>

      <div className="skya-login-toggle">
        <BotonTema />
      </div>

      <div className="skya-login-grid">

        {/* Identidad visual */}
        <section className="skya-login-brand" aria-label="Presentación de SKYA">
          <LogoSkya tamano={170} />
          <div className="skya-wordmark">SKYA</div>
          <p>Sistema Integral de Gestión de Soporte Técnico</p>
          <hr />
          <div className="skya-tagline">
            Conectamos soluciones,
            <br />
            brindamos <b>soporte</b>
          </div>
        </section>

        {/* Tarjeta de acceso */}
        <div className="skya-login-card">
          <div className="text-center">
            <LogoSkya tamano={54} />
          </div>

          <h1>Bienvenido a SKYA</h1>
          <div className="skya-divider">Inicia sesión para continuar</div>

          {/* Mensajes de error */}
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={manejarLogin}>

            <div className="skya-field">
              <i className="bi bi-envelope lead" aria-hidden="true"></i>
              <input
                id="email"
                type="email"
                className="form-control"
                placeholder="Correo electrónico"
                aria-label="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="skya-field">
              <i className="bi bi-lock lead" aria-hidden="true"></i>
              <input
                id="password"
                type={verPassword ? "text" : "password"}
                className="form-control"
                placeholder="Contraseña"
                aria-label="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="skya-eye"
                onClick={() => setVerPassword((v) => !v)}
                aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                <i className={`bi ${verPassword ? "bi-eye-slash" : "bi-eye"}`} aria-hidden="true"></i>
              </button>
            </div>

            <button
              type="submit"
              className="btn btn-primary skya-submit"
              disabled={cargando}
            >
              {cargando ? "Validando..." : (
                <>
                  Iniciar sesión
                  <i className="bi bi-arrow-right" aria-hidden="true"></i>
                </>
              )}
            </button>

          </form>

          {/* Verificación del backend */}
          <EstadoBackend />

          <p className="skya-login-foot">
            <i className="bi bi-diamond me-2" aria-hidden="true"></i>
            Acceso autorizado a SKYA
          </p>
        </div>

      </div>
    </div>
  );
}
