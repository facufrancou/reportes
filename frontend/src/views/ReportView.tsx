import { useEffect, useState } from "react";
// @ts-ignore
import jsPDF from "jspdf";
// @ts-ignore
import autoTable from "jspdf-autotable";
// @ts-ignore
import * as XLSX from "xlsx";
// @ts-ignore
import { saveAs } from "file-saver";
import axios from "axios";
import logo from "../assets/logo.png";
import { useNavigate } from "react-router-dom";

interface Props {
  username: string;
}

interface Tarea {
  tarea_id: number;
  tarea_titulo: string;
  fecha_inicio: string;
  fecha_fin: string;
  duracion_min: number;
  estado_tarea: string;
  categoria_tarea: string;
}

interface Ticket {
  ticket_id: number;
  titulo: string;
  ubicacion: string;
  fecha_reporte: string;
  fecha_resolucion: string;
  prioridad: string;
  estado_ticket: string;
  estado_extendido: string;
  categoria_ticket: string;
  tareas: Tarea[];
}

const ESTADOS = [
  "Nuevo",
  "En curso (asignado)",
  "En curso (planificado)",
  "En espera",
  "Resuelto",
  "Cerrado",
  /* "Desconocido", */
];

export default function ReportView({ username }: Props) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketDesde, setTicketDesde] = useState("");
  const [ticketHasta, setTicketHasta] = useState("");
  const [resolucionDesde, setResolucionDesde] = useState("");
  const [resolucionHasta, setResolucionHasta] = useState("");

  const [ordenCampo, setOrdenCampo] = useState<keyof Ticket>("fecha_reporte");
  const [ordenAscendente, setOrdenAscendente] = useState(true);

  const [estadosSeleccionados, setEstadosSeleccionados] = useState<string[]>(
    []
  );
  const storedName = localStorage.getItem("username") || username;
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("https://api-reportes.netsolutionsar.com/api/tickets-tareas")
      .then((res) => setTickets(res.data))
      .catch((err) => console.error("Error al obtener datos", err));
    registrarEvento("Ingreso al reporte web");
  }, []);

  const registrarEvento = (evento: string) => {
    axios
      .post("https://api-reportes.netsolutionsar.com/api/log-reporte", {
        nombre: storedName,
        evento,
      })
      .catch((err) => {
        console.error("Error al registrar evento:", err);
      });
  };

  const cambiarOrden = (campo: keyof Ticket) => {
    if (ordenCampo === campo) {
      setOrdenAscendente(!ordenAscendente); // invierte el orden
    } else {
      setOrdenCampo(campo);
      setOrdenAscendente(true); // por defecto ascendente
    }
  };

  const handleEstadoChange = (estado: string) => {
    setEstadosSeleccionados((prev) =>
      prev.includes(estado)
        ? prev.filter((e) => e !== estado)
        : [...prev, estado]
    );
  };

  const formatearFecha = (fecha: string): string => {
    if (!fecha) return "";
    const f = new Date(fecha);
    return (
      f.toLocaleDateString("es-AR") +
      " " +
      f.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
    );
  };

/*   const limpiarParrafos = (html: string): string => {
    const parser = new DOMParser();
    const decoded =
      parser.parseFromString(html, "text/html").documentElement.textContent ||
      "";
    return decoded
      .replace(/<\/?p>/gi, "")
      .replace(/<br\s*\/?>/gi, " ")
      .trim();
  }; */

  const limpiarParrafos = (html: string): string => {
  // Decodificar entidades HTML sin agregar etiquetas extra
  const textarea = document.createElement("textarea");
  textarea.innerHTML = html;
  const decodedHtml = textarea.value;

  const parser = new DOMParser();
  const decoded =
    parser.parseFromString(decodedHtml, "text/html").documentElement
      .textContent || "";

  return decoded
    .replace(/<\/?p>/gi, "")
    .replace(/<br\s*\/?>/gi, " ")
    .trim();
};

  const getPrioridadColor = (prioridad: string): string => {
    switch (prioridad) {
      case "Alta":
        return "#f8d7da"; // rojo suave
      case "Media":
        return "#fff3cd"; // amarillo suave
      case "Baja":
        return "#d4edda"; // verde suave
      default:
        return "#f1f3f5";
    }
  };

  const getEstadoColor = (estado: string): string => {
    switch (estado) {
      case "Nuevo":
        return "#d0ebff";
      case "En curso (asignado)":
        return "#fff3bf";
      case "En curso (planificado)":
        return "#fff3bf";
      case "En espera":
        return "#ffd8a8";
      case "Resuelto":
        return "#d3f9d8";
      case "Cerrado":
        return "#dee2e6";
      default:
        return "white";
    }
  };

  const getTareaColor = (estado: string): string => {
    switch (estado) {
      case "Por Hacer":
        return "#e3fafc";
      case "Hecho":
        return "#fff9db";
      case "Informacion":
        return "#d8f5a2";
      default:
        return "white";
    }
  };

  const getFechaHoy = (): string => {
    return new Date().toLocaleDateString("es-AR");
  };

  /* const prioridadOrden: { [key: string]: number } = {
    Crítica: 1,
    "Muy Alta": 2,
    Alta: 3,
    Media: 4,
    Baja: 5,
    "Sin prioridad": 6,
  }; */

  const ticketsFiltrados = tickets
    // Filtro por fecha de creación del ticket
    .filter((ticket) => {
      const fechaCreacion = ticket.fecha_reporte?.split("T")[0];
      return (
        (!ticketDesde || fechaCreacion >= ticketDesde) &&
        (!ticketHasta || fechaCreacion <= ticketHasta)
      );
    })

    // Filtro por fecha de resolución del ticket
    .filter((ticket) => {
      const fechaResolucion = ticket.fecha_resolucion?.split("T")[0];
      return (
        (!resolucionDesde ||
          (fechaResolucion && fechaResolucion >= resolucionDesde)) &&
        (!resolucionHasta ||
          (fechaResolucion && fechaResolucion <= resolucionHasta))
      );
    })

    // Filtro por estado del ticket
    .filter((ticket) => {
      return (
        estadosSeleccionados.length === 0 ||
        estadosSeleccionados.includes(ticket.estado_ticket)
      );
    })

    // Ordenamiento por campo seleccionado
    .sort((a, b) => {
      const aVal = a[ordenCampo];
      const bVal = b[ordenCampo];

      // Si el campo es una fecha y alguna es null
      if (ordenCampo === "fecha_resolucion" || ordenCampo === "fecha_reporte") {
        const isEmpty = (val: any) =>
          val === null || val === undefined || val === "";

        const aIsEmpty = isEmpty(aVal);
        const bIsEmpty = isEmpty(bVal);

        // Siempre poner vacíos al final
        if (aIsEmpty && !bIsEmpty) return 1;
        if (!aIsEmpty && bIsEmpty) return -1;
        if (aIsEmpty && bIsEmpty) return 0;

        const aDate = new Date(aVal as string).getTime();
        const bDate = new Date(bVal as string).getTime();
        return ordenAscendente ? aDate - bDate : bDate - aDate;
      }

      // Comparación por texto
      if (typeof aVal === "string" && typeof bVal === "string") {
        return ordenAscendente
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      // Comparación numérica genérica
      return ordenAscendente
        ? (aVal as any) > (bVal as any)
          ? 1
          : -1
        : (aVal as any) < (bVal as any)
        ? 1
        : -1;
    })

    // Asignar tareas filtradas por ticket, o una vacía si no hay
    .map((ticket) => {
      const tareasFiltradas =
        ticket.tareas.length > 0
          ? ticket.tareas
          : [
              {
                tarea_id: -1,
                tarea_titulo: "",
                fecha_inicio: "",
                duracion_min: 0,
                estado_tarea: "",
                categoria_tarea: "",
              },
            ];
      return { ...ticket, tareas: tareasFiltradas };
    });

  // Orden final por prioridad
  /*  .sort((a, b) => prioridadOrden[a.prioridad] - prioridadOrden[b.prioridad]); */
  const descargarPDF = async () => {
    registrarEvento("Descarga de PDF");

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "legal",
    });

    const width = doc.internal.pageSize.getWidth();
    const fechaHoy = getFechaHoy();
    
    // Logo
    const cargarLogoBase64 = async (): Promise<string> => {
      const response = await fetch(logo);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    };

    const logoBase64 = await cargarLogoBase64();
    doc.addImage(logoBase64, "PNG", 40, 20, 150, 75);

    doc.setFontSize(18);
    doc.text("SEGUIMIENTO DE GARANTÍAS", width / 2, 45, { align: "center" });
/* 
    doc.setFontSize(12);
    doc.text("PENDIENTES", width / 2, 65, { align: "center" }); */

    doc.setFontSize(10);
    doc.text(
      `Fecha del reporte: ${fechaHoy} - Generado por: ${storedName}`,
      width / 2,
      80,
      { align: "center" }
    );

    const head = [
      [
        "ID Ticket",
        "Unidad",
        "Ubicación",
        "Prioridad",
        "Estado ticket",
        "Fecha creación",
        "Fecha resolución",
        "Categoría del ticket",
        "Estado tarea",
        "Categoría tarea",
        "Descripción",
        "Inicio tarea",
        "Fin tarea",
        "Tiempo atención",
      ],
    ];

    const body: any[] = [];
    let grupoIndex = -1;

    ticketsFiltrados.forEach((ticket) => {
      grupoIndex++;
      const grupoColor =
        grupoIndex % 2 === 0 ? [255, 255, 255] : [241, 243, 245];

      if (ticket.tareas[0]?.tarea_id === -1) {
        body.push([
          {
            content: ticket.ticket_id,
            styles: { fillColor: grupoColor, fontStyle: "bold" },
          },
          {
            content: ticket.titulo,
            styles: { fillColor: [255, 248, 220], fontStyle: "bold" },
          },
          { content: ticket.ubicacion, styles: { fillColor: grupoColor } },
          { content: ticket.prioridad, styles: { fillColor: grupoColor } },
          { content: ticket.estado_ticket, styles: { fillColor: grupoColor } },
          {
            content: formatearFecha(ticket.fecha_reporte),
            styles: { fillColor: grupoColor },
          },
          {
            content: formatearFecha(ticket.fecha_resolucion),
            styles: { fillColor: grupoColor },
          },
          {
            content: ticket.categoria_ticket,
            styles: { fillColor: grupoColor },
          },
          { content: "Sin tareas", styles: { fillColor: grupoColor } },
          "",
          "No hay tareas generadas",
          "",
          "",
          "",
        ]);
      } else {
        ticket.tareas.forEach((tarea, index) => {
          const fechaTicket = new Date(ticket.fecha_reporte);
          const fechaTarea = new Date(tarea.fecha_inicio);
          const diffMs = fechaTarea.getTime() - fechaTicket.getTime();
          const diffDias = diffMs / (1000 * 60 * 60 * 24);

          let tiempoAtencion = "";
          if (diffDias >= 0 && diffDias < 1) {
            tiempoAtencion = `${(tarea.duracion_min / 60).toFixed(1)} h`;
          } else if (diffDias >= 1) {
            tiempoAtencion = `${diffDias.toFixed(1)} días`;
          }

          body.push([
            {
              content: index === 0 ? ticket.ticket_id : "",
              styles: {
                fillColor: grupoColor,
                fontStyle: index === 0 ? "bold" : "normal",
              },
            },
            {
              content: index === 0 ? ticket.titulo : "",
              styles: {
                fillColor: index === 0 ? [255, 248, 220] : grupoColor,
                fontStyle: "bold",
              },
            },
            {
              content: index === 0 ? ticket.ubicacion : "",
              styles: { fillColor: grupoColor },
            },
            {
              content: index === 0 ? ticket.prioridad : "",
              styles: { fillColor: grupoColor },
            },
            {
              content:
                index === 0
                  ? ticket.estado_ticket +
                    (ticket.estado_ticket === "En espera" &&
                    ticket.estado_extendido
                      ? ` - ${ticket.estado_extendido}`
                      : "")
                  : "",
              styles: { fillColor: grupoColor },
            },
            {
              content: index === 0 ? formatearFecha(ticket.fecha_reporte) : "",
              styles: { fillColor: grupoColor },
            },
            {
              content:
                index === 0 ? formatearFecha(ticket.fecha_resolucion) : "",
              styles: { fillColor: grupoColor },
            },
            {
              content: index === 0 ? ticket.categoria_ticket : "",
              styles: { fillColor: grupoColor },
            },
            tarea.estado_tarea,
            tarea.categoria_tarea,
            limpiarParrafos(tarea.tarea_titulo),
            formatearFecha(tarea.fecha_inicio),
            formatearFecha((tarea as any).fecha_fin || ""),
            tiempoAtencion,
          ]);
        });
      }

      // Separador visual sutil
      body.push([
        {
          content: "",
          colSpan: 14,
          styles: {
            fillColor: [230, 230, 230],
            minCellHeight: 1,
            textColor: [255, 255, 255], // texto blanco
            fontSize: 0, // muy chico para que no agregue altura
            lineWidth: 0,
          },
        },
      ]);
    });

    autoTable(doc, {
      startY: 95,
      head,
      body,
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: {
        fillColor: [200, 200, 200],
        textColor: 20,
        halign: "center",
      },
      bodyStyles: { valign: "top" },
      theme: "grid",
      didDrawPage: () => {
        const pageCount = doc.getNumberOfPages();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        doc.setFontSize(9);
        doc.setTextColor(100);

        doc.text("© Menesse Condos 2025", 40, pageHeight - 10);
        doc.text(`Página ${pageCount}`, pageWidth / 2, pageHeight - 10, {
          align: "center",
        });
        doc.text(
          "Developed by Facundo Francou",
          pageWidth - 40,
          pageHeight - 10,
          { align: "right" }
        );
      },
    });

    doc.save("reporte.pdf");
  };

  const descargarExcel = () => {
    registrarEvento("Descarga de Excel");

    const data: any[] = [];
    

    ticketsFiltrados.forEach((ticket) => {
      if (ticket.tareas[0]?.tarea_id === -1) {
        data.push({
          Ticket_ID: ticket.ticket_id,
          Unidad: ticket.titulo,
          Ubicación: ticket.ubicacion,
          Prioridad: ticket.prioridad,
          Estado_ticket: ticket.estado_ticket,
          Fecha_creación: formatearFecha(ticket.fecha_reporte),
          Fecha_resolución: formatearFecha(ticket.fecha_resolucion),
          Categoría_del_ticket: ticket.categoria_ticket,
          Estado_tarea: "Sin tareas",
          Categoría_tarea: "",
          Descripción: "No hay tareas generadas",
          Fecha_inicio: "",
          Fecha_fin: "",
          Tiempo_de_atención: "",
        });
      } else {
        ticket.tareas.forEach((tarea) => {
          const fechaTicket = new Date(ticket.fecha_reporte);
          const fechaTarea = new Date(tarea.fecha_inicio);
          const diffMs = fechaTarea.getTime() - fechaTicket.getTime();
          const diffDias = diffMs / (1000 * 60 * 60 * 24);

          let tiempoAtencion = "";
          if (diffDias >= 0 && diffDias < 1) {
            tiempoAtencion = `${(tarea.duracion_min / 60).toFixed(1)} h`;
          } else if (diffDias >= 1) {
            tiempoAtencion = `${diffDias.toFixed(1)} días`;
          }

          data.push({
            Ticket_ID: ticket.ticket_id,
            Unidad: ticket.titulo,
            Ubicación: ticket.ubicacion,
            Prioridad: ticket.prioridad,
            Estado_ticket:
              ticket.estado_ticket +
              (ticket.estado_ticket === "En espera" && ticket.estado_extendido
                ? ` - ${ticket.estado_extendido}`
                : ""),
            Fecha_creación: formatearFecha(ticket.fecha_reporte),
            Fecha_resolución: formatearFecha(ticket.fecha_resolucion),
            Categoría_del_ticket: ticket.categoria_ticket,
            Estado_tarea: tarea.estado_tarea,
            Categoría_tarea: tarea.categoria_tarea,
            Descripción: limpiarParrafos(tarea.tarea_titulo),
            Fecha_inicio: formatearFecha(tarea.fecha_inicio),
            Fecha_fin: formatearFecha((tarea as any).fecha_fin || ""),
            Tiempo_de_atención: tiempoAtencion,
          });
        });
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    saveAs(new Blob([excelBuffer]), "reporte.xlsx");
  };

  return (
    <div style={{ padding: "1rem", textAlign: "center" }}>
      <div
        className="filtros"
        style={{
          marginBottom: "2rem",
          backgroundColor: "#f8f9fa",
          borderRadius: "10px",
          padding: "1rem 2rem",
          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          color: "#000",
          maxWidth: "800px",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>Filtros</h2>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: "1rem",
            marginBottom: "1rem",
          }}
        >
          <div style={{ flex: "1 1 45%" }}>
            <label>Fecha de creación del ticket desde:</label>
            <input
              type="date"
              value={ticketDesde}
              onChange={(e) => setTicketDesde(e.target.value)}
              style={{ width: "100%", padding: "0.3rem" }}
            />
          </div>
          <div style={{ flex: "1 1 45%" }}>
            <label>hasta:</label>
            <input
              type="date"
              value={ticketHasta}
              onChange={(e) => setTicketHasta(e.target.value)}
              style={{ width: "100%", padding: "0.3rem" }}
            />
          </div>
          <div style={{ flex: "1 1 45%" }}>
            <label>Fecha de resolución del ticket desde:</label>
            <input
              type="date"
              value={resolucionDesde}
              onChange={(e) => setResolucionDesde(e.target.value)}
              style={{ width: "100%", padding: "0.3rem" }}
            />
          </div>
          <div style={{ flex: "1 1 45%" }}>
            <label>hasta:</label>
            <input
              type="date"
              value={resolucionHasta}
              onChange={(e) => setResolucionHasta(e.target.value)}
              style={{ width: "100%", padding: "0.3rem" }}
            />
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem" }}>
            Estado del ticket:
          </label>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "1rem",
            }}
          >
            {ESTADOS.map((estado) => (
              <label
                key={estado}
                style={{ display: "flex", alignItems: "center" }}
              >
                <input
                  type="checkbox"
                  checked={estadosSeleccionados.includes(estado)}
                  onChange={() => handleEstadoChange(estado)}
                  style={{ marginRight: "0.3rem" }}
                />
                {estado}
              </label>
            ))}
          </div>
        </div>
      </div>

      <h1>SEGUIMIENTO DE GARANTÍAS</h1>
      <button
        onClick={() => navigate("/calendario")}
        style={{
          marginBottom: "1rem",
          padding: "0.5rem 1rem",
          backgroundColor: "#228be6",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Ver calendario
      </button>

      <div>
        <button onClick={descargarPDF} style={{ marginRight: "1rem" }}>
          Descargar PDF
        </button>
        <button onClick={descargarExcel}>Descargar Excel</button>
      </div>
      <p>PENDIENTES</p>
      <p>
        Fecha del reporte: {getFechaHoy()} - Generado por: {storedName}
      </p>

      <div id="reporte">
        <table
          style={{
            minWidth: "100%",

            borderCollapse: "collapse",
            backgroundColor: "#fff",
            color: "#000",
          }}
          border={1}
        >
          <thead style={{ backgroundColor: "#ddd" }}>
            <tr>
              <th>Unidad</th>
              <th
                onClick={() => cambiarOrden("ubicacion")}
                style={{ cursor: "pointer" }}
              >
                Ubicación{" "}
                {ordenCampo === "ubicacion" && (ordenAscendente ? "▲" : "▼")}
              </th>
              <th>Prioridad</th>
              <th>Estado ticket</th>
              <th
                onClick={() => cambiarOrden("fecha_reporte")}
                style={{ cursor: "pointer" }}
              >
                Fecha creación{" "}
                {ordenCampo === "fecha_reporte" &&
                  (ordenAscendente ? "▲" : "▼")}
              </th>
              <th
                onClick={() => cambiarOrden("fecha_resolucion")}
                style={{ cursor: "pointer" }}
              >
                Fecha resolución{" "}
                {ordenCampo === "fecha_resolucion" &&
                  (ordenAscendente ? "▲" : "▼")}
              </th>

              {/* <th>Fecha resolución</th> */}
              <th>Categoría del ticket</th>
              <th>Estado de la tarea</th>
              <th>Categoría de la tarea</th>
              <th>Descripción de la tarea</th>
              <th>Fecha inicio de la tarea</th>
              <th>Fecha fin de la tarea</th>
              <th>Tiempo de atención</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              let grupoIndex = -1;

              return ticketsFiltrados.flatMap((ticket) => {
                if (ticket.tareas[0]?.tarea_id === -1) {
                  grupoIndex++;
                  const backgroundGrupo =
                    grupoIndex % 2 === 0 ? "#ffffff" : "#f1f3f5";
                  return [
                    <tr
                      key={`notareas-${ticket.ticket_id}`}
                      style={{ backgroundColor: backgroundGrupo }}
                    >
                      <td>{ticket.titulo}</td>
                      <td>{ticket.ubicacion}</td>
                      <td
                        style={{
                          backgroundColor: getPrioridadColor(ticket.prioridad),
                        }}
                      >
                        {ticket.prioridad}
                      </td>
                      <td
                        style={{
                          backgroundColor: getEstadoColor(ticket.estado_ticket),
                        }}
                      >
                        {ticket.estado_ticket}
                        {ticket.estado_ticket === "En espera" &&
                        ticket.estado_extendido
                          ? ` - ${ticket.estado_extendido}`
                          : ""}
                      </td>
                      <td>{formatearFecha(ticket.fecha_reporte)}</td>
                      <td>{formatearFecha(ticket.fecha_resolucion)}</td>
                      <td>{ticket.categoria_ticket}</td>
                      <td
                        colSpan={6}
                        style={{
                          textAlign: "center",
                          fontStyle: "italic",
                          color: "#555",
                        }}
                      >
                        No hay tareas generadas
                      </td>
                    </tr>,
                  ];
                }

                return ticket.tareas.map((tarea, index) => {
                  if (index === 0) grupoIndex++;
                  const backgroundGrupo =
                    grupoIndex % 2 === 0 ? "#ffffff" : "#f1f3f5";

                  return (
                    <tr
                      key={`${ticket.ticket_id}-${tarea.tarea_id}`}
                      style={{ backgroundColor: backgroundGrupo }}
                    >
                      {index === 0 && (
                        <>
                          <td rowSpan={ticket.tareas.length}>
                            {ticket.titulo}
                          </td>
                          <td rowSpan={ticket.tareas.length}>
                            {ticket.ubicacion}
                          </td>
                          <td
                            rowSpan={ticket.tareas.length}
                            style={{
                              backgroundColor: getPrioridadColor(
                                ticket.prioridad
                              ),
                            }}
                          >
                            {ticket.prioridad}
                          </td>
                          <td
                            rowSpan={ticket.tareas.length}
                            style={{
                              backgroundColor: getEstadoColor(
                                ticket.estado_ticket
                              ),
                            }}
                          >
                            {ticket.estado_ticket}
                            {ticket.estado_ticket === "En espera" &&
                            ticket.estado_extendido
                              ? ` - ${ticket.estado_extendido}`
                              : ""}
                          </td>
                          <td rowSpan={ticket.tareas.length}>
                            {formatearFecha(ticket.fecha_reporte)}
                          </td>
                          <td rowSpan={ticket.tareas.length}>
                            {formatearFecha(ticket.fecha_resolucion)}
                          </td>
                          <td rowSpan={ticket.tareas.length}>
                            {ticket.categoria_ticket}
                          </td>
                        </>
                      )}
                      <td
                        style={{
                          backgroundColor: getTareaColor(tarea.estado_tarea),
                        }}
                      >
                        {tarea.estado_tarea}
                      </td>
                      <td>{tarea.categoria_tarea}</td>
                      <td>{limpiarParrafos(tarea.tarea_titulo)}</td>
                      <td>{formatearFecha(tarea.fecha_inicio)}</td>
                      <td>{formatearFecha((tarea as any).fecha_fin || "")}</td>
                      {/*   <td>
                        {(() => {
                          const fechaTicket = new Date(ticket.fecha_reporte);
                          const fechaTarea = new Date(tarea.fecha_inicio);
                          const diffMs =
                            fechaTarea.getTime() - fechaTicket.getTime();
                          const diffDias = diffMs / (1000 * 60 * 60 * 24);
                          return diffDias >= 0
                            ? `${diffDias.toFixed(1)} días`
                            : "";
                        })()}
                      </td> */}
                      <td>
                        {(() => {
                          const fechaTicket = new Date(ticket.fecha_reporte);
                          const fechaTarea = new Date(tarea.fecha_inicio);
                          const diffMs =
                            fechaTarea.getTime() - fechaTicket.getTime();
                          const diffDias = diffMs / (1000 * 60 * 60 * 24);

                          if (diffDias < 0) return "";
                          if (diffDias < 1)
                            return `${(tarea.duracion_min / 60).toFixed(1)} h`;
                          return `${diffDias.toFixed(1)} días`;
                        })()}
                      </td>
                    </tr>
                  );
                });
              });
            })()}
          </tbody>
        </table>
      </div>
      <div
        style={{
          marginTop: "3rem",
          paddingTop: "1rem",
          borderTop: "1px solid #ccc",
          textAlign: "center",
          fontSize: "0.85rem",
          color: "#666",
        }}
      >
        <p style={{ margin: 0 }}>© Menesse Condos 2025</p>
        <p style={{ margin: 0 }}>Developed by Facundo Francou</p>
      </div>
    </div>
  );
}
