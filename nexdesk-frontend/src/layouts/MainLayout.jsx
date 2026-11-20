import { Outlet, useLocation } from "react-router-dom";

import NavbarPrincipal from "../components/NavbarPrincipal";
import { MENU } from "../config/menu";

export default function MainLayout() {
  const { pathname } = useLocation();

  // Título de la sección actual (solo presentación)
  const seccion = MENU.find((opcion) => pathname.startsWith(opcion.ruta));
  const esPanel = !seccion || seccion.ruta === "/dashboard";

  return (
    <div className="nexdesk-app">
      <NavbarPrincipal />

      <div className="skya-subheader">
        <div className="skya-subheader-inner">
          <div>
            <strong>{esPanel ? "Panel de Gestión" : seccion.titulo}</strong>
            <small>Sistema Integral de Gestión de Soporte Técnico</small>
          </div>

          <div className="skya-crumbs">
            Inicio / <b>{esPanel ? "Panel de control" : seccion.titulo}</b>
          </div>
        </div>
      </div>

      <main className="nexdesk-main nexdesk-content">
        <Outlet />
      </main>
    </div>
  );
}
