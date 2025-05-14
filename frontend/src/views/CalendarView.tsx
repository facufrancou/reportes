import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import axios from "axios";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css"; // estilos base

interface Evento {
  id: string;
  title: string;
  start: string;
  backgroundColor?: string;
  borderColor?: string;
  extendedProps: {
    descripcion: string;
    estado: string;
    categoria: string;
    ubicacion: string;
  };
}

export default function CalendarView() {
  const [eventos, setEventos] = useState<Evento[]>([]);

  useEffect(() => {
    axios
      .get("https://api-reportes.netsolutionsar.com/api/tickets-tareas")
      .then((res) => {
        const tareasPendientes: Evento[] = [];

        res.data.forEach((ticket: any) => {
          ticket.tareas.forEach((tarea: any) => {
            if (tarea.estado_tarea === "Por Hacer") {
              tareasPendientes.push({
                id: `${tarea.tarea_id}`,
                title: `[${ticket.titulo}] ${ticket.ubicacion} - ${tarea.categoria_tarea || "-"}: ${limpiarParrafos(tarea.tarea_titulo)}`,
                start: tarea.fecha_inicio,
                backgroundColor: getColorPorEstado(tarea.estado_tarea),
                borderColor: "#ccc",
                extendedProps: {
                  descripcion: limpiarParrafos(tarea.tarea_titulo),
                  estado: tarea.estado_tarea,
                  categoria: tarea.categoria_tarea || "-",
                  ubicacion: ticket.ubicacion || "-",
                },
              });
            }
          });
        });

        setEventos(tareasPendientes);
      })
      .catch((err) => console.error("Error cargando tareas", err));
  }, []);

  function limpiarParrafos(html: string): string {
    const parser = new DOMParser();
    const decoded =
      parser.parseFromString(html, "text/html").documentElement.textContent ||
      "";
    return decoded
      .replace(/<\/?p>/gi, "")
      .replace(/<br\s*\/?>/gi, " ")
      .trim();
  }

  function getColorPorEstado(estado: string): string {
    switch (estado) {
      case "Por Hacer":
        return "#74c0fc"; // azul claro
      case "Hecho":
        return "#69db7c"; // verde
      case "Informacion":
        return "#ffd43b"; // amarillo
      default:
        return "#ced4da"; // gris
    }
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h2 style={{ marginBottom: "1rem" }}>Tareas Pendientes Programadas</h2>
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={eventos}
        height="auto"
        eventContent={(arg) => {
          const event = arg.event;
          const descripcion = event.extendedProps.descripcion;

          return (
            <Tippy content={descripcion}>
              <div style={{ fontSize: "0.75rem", whiteSpace: "normal" }}>
                <b>{arg.timeText}</b> {event.title}
              </div>
            </Tippy>
          );
        }}
        eventDisplay="block"
        dayMaxEventRows={4}
      />
    </div>
  );
}
