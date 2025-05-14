require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./db");
const fs = require("fs");
const path = require("path");
const app = express();

app.use(cors());
app.use(express.json());

app.post("/api/log-reporte", (req, res) => {
  const { nombre, evento } = req.body;

  if (!nombre || !evento) {
    return res.status(400).json({ error: "Faltan datos en el cuerpo (nombre o evento)" });
  }

  const timestamp = new Date().toISOString();
  const linea = `[${timestamp}] ${evento} por: ${nombre}\n`;

  const rutaLogs = path.join(__dirname, "logs", "reporte.log");

  fs.mkdir(path.dirname(rutaLogs), { recursive: true }, (err) => {
    if (err) {
      console.error("Error creando carpeta de logs:", err);
      return res.status(500).json({ error: "Error al crear carpeta de logs" });
    }

    fs.appendFile(rutaLogs, linea, (err) => {
      if (err) {
        console.error("Error al escribir log:", err);
        return res.status(500).json({ error: "Error al guardar el log" });
      }

      res.status(200).json({ mensaje: "Log guardado correctamente" });
    });
  });
});



app.get("/api/tickets-tareas", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        t.id AS ticket_id,
        t.name AS titulo,
        t.date AS fecha_reporte,
        t.solvedate AS fecha_resolucion,
        l.name AS ubicacion,
        CASE t.priority
          
          WHEN 2 THEN 'Baja'
          WHEN 3 THEN 'Media'
          WHEN 4 THEN 'Alta'
         
          ELSE 'Sin prioridad'
        END AS prioridad,
        CASE t.status
          WHEN 1 THEN 'Nuevo'
          WHEN 2 THEN 'En curso (asignado)'
          WHEN 3 THEN 'En curso (planificado)'
          WHEN 4 THEN 'En espera'
          WHEN 5 THEN 'Resuelto'
          WHEN 6 THEN 'Cerrado'
          ELSE 'Desconocido'
        END AS estado_ticket,
        ic.completename AS categoria_ticket,
        ped.name AS estado_extendido,
        tk.id AS tarea_id,
        tk.content AS tarea_titulo,
        tk.begin AS fecha_inicio,
        tk.end AS fecha_fin,
        ROUND(tk.actiontime / 60) AS duracion_min,
        CASE tk.state
          WHEN 1 THEN 'Por Hacer'
          WHEN 2 THEN 'Hecho'
          WHEN 3 THEN 'Informacion'
          ELSE 'Sin estado'
        END AS estado_tarea,
        tc.name AS categoria_tarea
      FROM glpi_tickets t
      LEFT JOIN glpi_locations l ON t.locations_id = l.id
      LEFT JOIN glpi_itilcategories ic ON t.itilcategories_id = ic.id
      LEFT JOIN glpi_plugin_fields_ticketestadoextendidos pe ON pe.items_id = t.id
      LEFT JOIN glpi_plugin_fields_estadoextendidofielddropdowns ped ON ped.id = pe.plugin_fields_estadoextendidofielddropdowns_id
      LEFT JOIN glpi_tickettasks tk ON tk.tickets_id = t.id
      LEFT JOIN glpi_taskcategories tc ON tk.taskcategories_id = tc.id
      WHERE t.is_deleted = 0
      ORDER BY t.id DESC
    `);

    const ticketsMap = {};

    rows.forEach((row) => {
      const ticketId = row.ticket_id;

      if (!ticketsMap[ticketId]) {
        ticketsMap[ticketId] = {
          ticket_id: row.ticket_id,
          titulo: row.titulo,
          ubicacion: row.ubicacion,
          fecha_reporte: row.fecha_reporte,
          fecha_resolucion: row.fecha_resolucion,
          prioridad: row.prioridad,
          estado_ticket: row.estado_ticket,
          estado_extendido: row.estado_extendido || "",
          categoria_ticket: row.categoria_ticket || "Sin categoría",
          tareas: [],
        };
      }

      if (row.tarea_id) {
        ticketsMap[ticketId].tareas.push({
          tarea_id: row.tarea_id,
          tarea_titulo: row.tarea_titulo,
          fecha_inicio: row.fecha_inicio,
          fecha_fin: row.fecha_fin,
          duracion_min: row.duracion_min,
          estado_tarea: row.estado_tarea,
          categoria_tarea: row.categoria_tarea || "-",
        });
      }
    });

    const tickets = Object.values(ticketsMap);
    res.json(tickets);
  } catch (error) {
    console.error("Error al consultar la base:", error);
    res.status(500).json({ error: "Error al consultar los datos" });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${process.env.PORT}`);
});
