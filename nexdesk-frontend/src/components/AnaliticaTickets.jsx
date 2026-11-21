
import { useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// ==========================================
// 1. ESTADOS Y COLORES
// ==========================================

const ESTADOS = [
  ["abierto", "Abiertos", "#0f766e"],
  ["asignado", "Asignados", "#2dd4bf"],
  ["en_proceso", "En proceso", "#f59e0b"],
  ["resuelto", "Resueltos", "#10b981"],
  ["cerrado", "Cerrados", "#64748b"],
  ["reabierto", "Reabiertos", "#a855f7"],
];

// ==========================================
// 2. UTILIDADES PARA EXPORTACIÓN CSV
// ==========================================

// Protege los campos CSV contra separadores,
// saltos de línea, comillas y fórmulas en Excel.
function escaparCSV(valor) {
  if (valor === null || valor === undefined) {
    return "";
  }

  let texto = String(valor);

  // Evita que Excel interprete como fórmula
  // un valor procedente de los tickets.
  if (/^\s*[=+@-]/.test(texto)) {
  texto = `'${texto}`;
}

  return `"${texto.replace(/"/g, '""')}"`;
}

// Convierte una fecha ISO a un formato legible.
function formatearFecha(fecha) {
  if (!fecha) return "";

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return String(fecha);
  }

  return valor.toLocaleString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// Descarga un archivo CSV compatible con Excel.
function descargarCSV(nombreArchivo, filas) {
  const contenido = filas
    .map((fila) => fila.map(escaparCSV).join(";"))
    .join("\r\n");

  // BOM UTF-8 para reconocer tildes y ñ en Excel.
  const blob = new Blob(
    ["\uFEFF", contenido],
    {
      type: "text/csv;charset=utf-8;",
    }
  );

  const url = URL.createObjectURL(blob);

  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;

  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();

  URL.revokeObjectURL(url);
}

// ==========================================
// 3. COMPONENTE DE ANALÍTICA
// ==========================================

export default function AnaliticaTickets({
  tickets = [],
  cargando = false,
  error = "",
  onActualizar,
  panelLateral = null,
}) {

  // Fecha de referencia para la gráfica de actividad
  const [ahora] = useState(() => Date.now());

  // ========================================
  // 4. CALCULAR INDICADORES
  // ========================================

  const resumen = useMemo(() => {
    const total = tickets.length;

    const estados = ESTADOS.map(
      ([clave, nombre, color]) => ({
        clave,
        nombre,
        color,
        cantidad: tickets.filter(
          (ticket) => ticket.estado === clave
        ).length,
      })
    );

    const prioridades = [
      {
        nombre: "Alta",
        color: "#ef4444",
        cantidad: tickets.filter(
          (ticket) => ticket.prioridad === "alta"
        ).length,
      },
      {
        nombre: "Media",
        color: "#f59e0b",
        cantidad: tickets.filter(
          (ticket) => ticket.prioridad === "media"
        ).length,
      },
      {
        nombre: "Baja",
        color: "#10b981",
        cantidad: tickets.filter(
          (ticket) => ticket.prioridad === "baja"
        ).length,
      },
    ];

    const activos = tickets.filter(
      (ticket) =>
        !["cerrado", "resuelto"].includes(ticket.estado)
    ).length;

    return {
      total,
      estados,
      prioridades,
      activos,
    };
  }, [tickets]);

  // Tickets creados en las últimas 4 semanas
  const actividad = useMemo(() => {
    const semana = 7 * 24 * 60 * 60 * 1000;
    return [0, 1, 2, 3].map((i) => {
      const fin = ahora - (3 - i) * semana;
      const inicio = fin - semana;
      const cantidad = tickets.filter((t) => {
        const f = new Date(t.fecha_creacion).getTime();
        return !Number.isNaN(f) && f > inicio && f <= fin;
      }).length;
      const etiqueta = new Date(fin).toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "short",
      });
      return { etiqueta, cantidad };
    });
  }, [tickets, ahora]);

  // Geometría de la gráfica de actividad
  const maxActividad = Math.max(1, ...actividad.map((p) => p.cantidad));
  const puntosActividad = actividad.map((p, i) => ({
    ...p,
    x: 30 + i * ((400 - 60) / 3),
    y: 120 - (p.cantidad / maxActividad) * 90,
  }));
  const lineaActividad = puntosActividad.map((p) => `${p.x},${p.y}`).join(" ");
  const areaActividad = `30,120 ${lineaActividad} ${puntosActividad[3].x},120`;

  // Geometría de la dona de estados
  const RADIO = 42;
  const CIRCUNFERENCIA = 2 * Math.PI * RADIO;
  const conCantidad = resumen.estados.filter((e) => e.cantidad > 0);
  const segmentosDona = conCantidad.map((e, i) => {
    const largo = (e.cantidad / Math.max(1, resumen.total)) * CIRCUNFERENCIA;
    const previo = conCantidad
      .slice(0, i)
      .reduce((suma, x) => suma + x.cantidad, 0);
    const desfase = -(previo / Math.max(1, resumen.total)) * CIRCUNFERENCIA;
    return { clave: e.clave, color: e.color, largo, desfase };
  });

  // ========================================
  // 5. EXPORTAR REPORTE CSV
  // ========================================

  function exportarReporteCSV() {
    if (cargando || error || tickets.length === 0) {
      return;
    }

    const encabezados = [
      "ID",
      "Título",
      "Descripción",
      "Prioridad",
      "Estado",
      "Usuario ID",
      "Técnico ID",
      "Categoría ID",
      "Solución",
      "Fecha de creación",
      "Fecha de actualización",
      "Fecha de cierre",
    ];

    const registros = tickets.map((ticket) => [
      ticket.id,
      ticket.titulo,
      ticket.descripcion,
      ticket.prioridad,
      ticket.estado,
      ticket.usuario_id,
      ticket.tecnico_id,
      ticket.categoria_id,
      ticket.solucion,
      formatearFecha(ticket.fecha_creacion),
      formatearFecha(ticket.fecha_actualizacion),
      formatearFecha(ticket.fecha_cierre),
    ]);

    const filas = [
      encabezados,
      ...registros,
    ];

    const fecha = new Date()
      .toLocaleDateString("sv-SE");

    const nombreArchivo =
      `TechAssits_reporte_tickets_${fecha}.csv`;

    descargarCSV(nombreArchivo, filas);
  }

  // ========================================
  // 5B. EXPORTAR REPORTE PDF
  // ========================================

  function exportarReportePDF() {
    if (cargando || error || tickets.length === 0) return;

    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const ancho = pdf.internal.pageSize.getWidth();
    const fechaGeneracion = formatearFecha(new Date());
    const azul = [22, 54, 93];
    const gris = [82, 95, 111];
    const margen = 14;

    pdf.setFillColor(...azul);
    pdf.rect(0, 0, ancho, 28, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(19);
    pdf.text("TechAssits", margen, 13);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text("Sistema Integral de Gestion de Soporte Tecnico", margen, 20);
    pdf.text("REPORTE DE GESTION", ancho - margen, 15, { align: "right" });

    pdf.setTextColor(...gris);
    pdf.setFontSize(9);
    pdf.text(`Generado: ${fechaGeneracion}`, margen, 35);
    pdf.text("Alcance: tickets visibles para el usuario autenticado", margen, 41);

    const resueltos = resumen.estados.find((e) => e.clave === "resuelto")?.cantidad ?? 0;
    const cerrados = resumen.estados.find((e) => e.clave === "cerrado")?.cantidad ?? 0;
    const metricas = [
      ["Tickets visibles", resumen.total],
      ["En atencion / pendientes", resumen.activos],
      ["Resueltos", resueltos],
      ["Cerrados", cerrados],
    ];
    const espacio = (ancho - 2 * margen - 9) / 4;
    metricas.forEach(([etiqueta, valor], i) => {
      const x = margen + i * (espacio + 3);
      pdf.setFillColor(241, 245, 249);
      pdf.roundedRect(x, 47, espacio, 22, 2, 2, "F");
      pdf.setTextColor(...gris);
      pdf.setFontSize(8);
      pdf.text(etiqueta, x + 4, 54);
      pdf.setTextColor(...azul);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(15);
      pdf.text(String(valor), x + 4, 64);
      pdf.setFont("helvetica", "normal");
    });

    pdf.setTextColor(...azul);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text("Por estado", margen, 79);
    pdf.text("Por prioridad", ancho / 2 + 4, 79);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(45, 55, 72);
    resumen.estados.forEach((e, i) => {
      pdf.text(`${e.nombre}: ${e.cantidad}`, margen, 86 + i * 5);
    });
    resumen.prioridades.forEach((p, i) => {
      pdf.text(`${p.nombre}: ${p.cantidad}`, ancho / 2 + 4, 86 + i * 6);
    });

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...azul);
    pdf.setFontSize(10);
    pdf.text("Detalle de tickets", margen, 123);

    const columnas = [
      "ID", "Titulo", "Prioridad", "Estado", "Usuario ID",
      "Tecnico ID", "Categoria ID", "Fecha creacion", "Fecha cierre",
    ];
    const filas = tickets.map((t) => [
      String(t.id ?? ""),
      String(t.titulo ?? ""),
      String(t.prioridad ?? ""),
      String(t.estado ?? ""),
      String(t.usuario_id ?? ""),
      String(t.tecnico_id ?? "Sin asignar"),
      String(t.categoria_id ?? ""),
      formatearFecha(t.fecha_creacion) || "No disponible",
      formatearFecha(t.fecha_cierre) || "No aplica",
    ]);

    autoTable(pdf, {
      head: [columnas],
      body: filas,
      startY: 127,
      margin: { left: margen, right: margen, bottom: 16 },
      theme: "striped",
      styles: { font: "helvetica", fontSize: 7, cellPadding: 2.3, overflow: "linebreak" },
      headStyles: { fillColor: azul, textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 248, 251] },
      columnStyles: { 1: { cellWidth: 58 }, 7: { cellWidth: 31 }, 8: { cellWidth: 31 } },
    });

    const paginas = pdf.getNumberOfPages();
    for (let pagina = 1; pagina <= paginas; pagina += 1) {
      pdf.setPage(pagina);
      const alto = pdf.internal.pageSize.getHeight();
      pdf.setDrawColor(220, 226, 234);
      pdf.line(margen, alto - 12, ancho - margen, alto - 12);
      pdf.setTextColor(...gris);
      pdf.setFontSize(8);
      pdf.text("TechAssits | Reporte de tickets", margen, alto - 7);
      pdf.text(`Pagina ${pagina} de ${paginas}`, ancho - margen, alto - 7, { align: "right" });
    }

    const fechaArchivo = new Date().toLocaleDateString("sv-SE");
    pdf.save(`TechAssits_reporte_tickets_${fechaArchivo}.pdf`);
  }

  // ========================================
  // 6. INTERFAZ
  // ========================================

  const resueltos =
    resumen.estados.find((e) => e.clave === "resuelto")?.cantidad || 0;
  const cerrados =
    resumen.estados.find((e) => e.clave === "cerrado")?.cantidad || 0;

  const indicadores = [
    ["Tickets visibles", resumen.total, "bi-ticket-perforated", true],
    ["En atención / pendientes", resumen.activos, "bi-clock-history", false],
    ["Resueltos", resueltos, "bi-check2-circle", false],
    ["Cerrados", cerrados, "bi-x-circle", false],
  ];

  const sinDatos = cargando && !tickets.length;

  return (
    <section className="mb-4" aria-label="Analítica de tickets">

      {/* =====================================
          FILA SUPERIOR: SALUDO + INDICADORES
      ===================================== */}

      <div className="row g-3 mb-3">

        {panelLateral && (
          <div className="col-12 col-xl-4">{panelLateral}</div>
        )}

        <div className={panelLateral ? "col-12 col-xl-8" : "col-12"}>

          {/* ENCABEZADO */}
          <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap mb-3">
            <div>
              <h2 className="h5 fw-bold mb-1">Analítica de soporte</h2>
              <p className="text-secondary small mb-0">
                Datos de tickets visibles según tu rol
              </p>
            </div>

            <div className="d-flex gap-2 flex-wrap">
              <button
                type="button"
                className="btn btn-sm btn-outline-success"
                onClick={exportarReporteCSV}
                disabled={cargando || Boolean(error) || tickets.length === 0}
                title="Descargar reporte de tickets en CSV"
              >
                <i className="bi bi-download me-1" aria-hidden="true"></i>
                Exportar CSV
              </button>

              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={exportarReportePDF}
                disabled={cargando || Boolean(error) || tickets.length === 0}
                title="Descargar reporte de tickets en PDF"
              >
                <i className="bi bi-download me-1" aria-hidden="true"></i>
                Exportar PDF
              </button>

              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={onActualizar}
                disabled={cargando || !onActualizar}
              >
                {cargando ? "Actualizando..." : "Actualizar gráficas"}
              </button>
            </div>
          </div>

          {/* MENSAJE DE ERROR */}
          {error && (
            <div className="alert alert-warning" role="alert">
              No se pudieron cargar las gráficas: {error}
            </div>
          )}

          {/* TARJETAS DE INDICADORES */}
          <div className="row g-3">
            {indicadores.map(([nombre, valor, icono, principal]) => (
              <div className="col-6" key={nombre}>
                <div className={`techassits-stat ${principal ? "principal" : ""}`}>
                  <div className="rotulo">{nombre}</div>
                  <div className="valor">{sinDatos ? "…" : valor}</div>
                  <span className="icono">
                    <i className={`bi ${icono}`} aria-hidden="true"></i>
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* =====================================
          FILA INFERIOR: DONA + ACTIVIDAD
      ===================================== */}

      <div className="row g-3">

        {/* TICKETS POR ESTADO */}
        <div className="col-12 col-lg-5">
          <div className="techassits-chart-card">
            <h3>
              <i className="bi bi-pie-chart-fill" aria-hidden="true"></i>
              Tickets por estado
            </h3>
            <p className="sub">Distribución según el estado actual</p>

            <div className="techassits-donut">
              <svg
                width="150"
                height="150"
                viewBox="0 0 100 100"
                role="img"
                aria-label={`Total de tickets: ${resumen.total}`}
              >
                <circle
                  cx="50" cy="50" r={RADIO}
                  fill="none" stroke="var(--bs-tertiary-bg)" strokeWidth="12"
                />
                <g transform="rotate(-90 50 50)">
                  {segmentosDona.map((seg) => (
                    <circle
                      key={seg.clave}
                      cx="50" cy="50" r={RADIO}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth="12"
                      strokeDasharray={`${Math.max(0, seg.largo - 0.8)} ${CIRCUNFERENCIA}`}
                      strokeDashoffset={seg.desfase}
                    />
                  ))}
                </g>
                <text
                  x="50" y="52" textAnchor="middle"
                  fontSize="20" fontWeight="800" fill="currentColor"
                >
                  {resumen.total}
                </text>
                <text
                  x="50" y="64" textAnchor="middle"
                  fontSize="6.5" fill="var(--bs-secondary-color)"
                >
                  tickets
                </text>
              </svg>

              <ul className="techassits-legend">
                {resumen.estados.map((estado) => (
                  <li key={estado.clave}>
                    <span className="punto" style={{ background: estado.color }} />
                    <span>{estado.nombre}</span>
                    <b>{estado.cantidad}</b>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ACTIVIDAD RECIENTE */}
        <div className="col-12 col-lg-7">
          <div className="techassits-chart-card techassits-actividad">
            <div className="d-flex justify-content-between align-items-start gap-2">
              <div>
                <h3>
                  <i className="bi bi-activity" aria-hidden="true"></i>
                  Actividad reciente
                </h3>
                <p className="sub">
                  Tickets creados en las últimas cuatro semanas
                </p>
              </div>
              <span className="techassits-pill">Último mes</span>
            </div>

            <svg
              viewBox="0 0 400 160"
              role="img"
              aria-label="Tickets creados por semana en el último mes"
            >
              <defs>
                <linearGradient id="techassits-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#2dd4bf" stopOpacity="0.35" />
                  <stop offset="1" stopColor="#2dd4bf" stopOpacity="0" />
                </linearGradient>
              </defs>

              {[30, 75, 120].map((y) => (
                <line
                  key={y} x1="30" x2="370" y1={y} y2={y}
                  stroke="var(--bs-border-color)" strokeDasharray="3 4"
                />
              ))}

              <polygon points={areaActividad} fill="url(#techassits-area)" />
              <polyline
                points={lineaActividad}
                fill="none" stroke="#0f766e" strokeWidth="2.5"
                strokeLinejoin="round" strokeLinecap="round"
              />

              {puntosActividad.map((p, i) => (
                <g key={p.etiqueta + i}>
                  <circle
                    cx={p.x} cy={p.y}
                    r={i === 3 ? 5 : 3.5}
                    fill={i === 3 ? "#0f766e" : "#fff"}
                    stroke="#0f766e" strokeWidth="2"
                  />
                  <text
                    x={p.x} y={p.y - 10} textAnchor="middle"
                    fontSize="10" fontWeight="700" fill="currentColor"
                  >
                    {p.cantidad}
                  </text>
                  <text
                    x={p.x} y="146" textAnchor="middle"
                    fontSize="9" fill="var(--bs-secondary-color)"
                  >
                    {p.etiqueta}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* DISTRIBUCIÓN POR PRIORIDAD */}
        <div className="col-12">
          <div className="techassits-chart-card techassits-prio">
            <h3 className="mb-3">
              <i className="bi bi-flag-fill" aria-hidden="true"></i>
              Distribución por prioridad
            </h3>

            <div className="row g-3">
              {resumen.prioridades.map((prioridad) => (
                <div className="col-md-4" key={prioridad.nombre}>
                  <div className="d-flex justify-content-between small mb-2">
                    <span>{prioridad.nombre}</span>
                    <strong>{prioridad.cantidad}</strong>
                  </div>

                  <div
                    className="progress"
                    style={{ height: 12 }}
                    role="progressbar"
                    aria-label={`Prioridad ${prioridad.nombre}`}
                    aria-valuenow={prioridad.cantidad}
                    aria-valuemin={0}
                    aria-valuemax={Math.max(1, resumen.total)}
                  >
                    <div
                      className="progress-bar"
                      style={{
                        backgroundColor: prioridad.color,
                        width: `${
                          resumen.total
                            ? (prioridad.cantidad / resumen.total) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </section>
  );
}
