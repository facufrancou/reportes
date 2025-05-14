import { useEffect, useRef, useState } from "react";
import esLocale from "@fullcalendar/core/locales/es";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";

import axios from "axios";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";

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
  const calendarRef = useRef<any>(null); // 👈 Referencia al calendario

  const handleFechaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fecha = e.target.value;
    if (calendarRef.current && fecha) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView("timeGridDay", fecha); // 👈 cambia la vista y navega a la fecha
    }
  };

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
                title: `[${ticket.titulo}] ${ticket.ubicacion} - ${
                  tarea.categoria_tarea || "-"
                }: ${limpiarParrafos(tarea.tarea_titulo)}`,
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
        return "#74c0fc";
      case "Hecho":
        return "#69db7c";
      case "Informacion":
        return "#ffd43b";
      default:
        return "#ced4da";
    }
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h2 style={{ marginBottom: "1rem" }}>Tareas Pendientes Programadas</h2>

      <div style={{ marginBottom: "1rem", textAlign: "center" }}>
        <label style={{ marginRight: "0.5rem" }}>Ir a fecha:</label>
        <input type="date" onChange={handleFechaChange} />
      </div>

      <FullCalendar
        slotEventOverlap={false}
        locale={esLocale}
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={eventos}
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
        slotMinTime="08:00:00"
        slotMaxTime="20:00:00"
        expandRows={true}
        height="auto"
        eventDisplay="block"
        dayMaxEventRows={4}
      />
    </div>
  );
}
