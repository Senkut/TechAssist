
export const MENU = [
  {
    titulo: "Panel de control",
    ruta: "/dashboard",
    icono: "▦",
    roles: ["superadmin", "admin", "tecnico", "usuario"],
  },
  {
    titulo: "Usuarios",
    ruta: "/usuarios",
    icono: "♙",
    roles: ["superadmin", "admin"],
  },
  {
    titulo: "Técnicos",
    ruta: "/tecnicos",
    icono: "⚙",
    roles: ["superadmin", "admin"],
  },
  {
    titulo: "Categorías",
    ruta: "/categorias",
    icono: "▤",
    roles: ["superadmin", "admin"],
  },
  {
    titulo: "Tickets",
    ruta: "/tickets",
    icono: "▣",
    roles: ["superadmin", "admin", "tecnico", "usuario"],
  },
  {
    titulo: "Seguimientos",
    ruta: "/seguimientos",
    icono: "◷",
    roles: ["superadmin", "admin", "tecnico", "usuario"],
  },
];

export function menuPorRol(rol) {
  return MENU.filter((opcion) => opcion.roles.includes(rol));
}

// Iconos Bootstrap Icons por ruta (solo presentación)
export const ICONOS_BI = {
  "/dashboard": "bi-grid-1x2-fill",
  "/usuarios": "bi-person-fill",
  "/tecnicos": "bi-gear-fill",
  "/categorias": "bi-tags-fill",
  "/tickets": "bi-ticket-perforated-fill",
  "/seguimientos": "bi-clock-history",
};
