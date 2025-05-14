

/* require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
app.use(cors());

app.get("/api/tickets-tareas", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        t.id AS ticket_id,
        t.name AS titulo,
        l.name AS ubicacion,
        CASE t.priority
          WHEN 1 THEN 'Baja'
          WHEN 2 THEN 'Media'
          WHEN 3 THEN 'Alta'
          WHEN 4 THEN 'Muy Alta'
          WHEN 5 THEN 'Crítica'
          ELSE 'Sin prioridad'
        END AS prioridad,
        CASE t.status
          WHEN 1 THEN 'Nuevo'
          WHEN 2 THEN 'En curso (asignado)'
          WHEN 3 THEN 'En espera'
          WHEN 4 THEN 'Resuelto'
          WHEN 5 THEN 'Cerrado'
          ELSE 'Desconocido'
        END AS estado_ticket,
        gtc.name AS categoria_ticket,
        tk.id AS tarea_id,
        tk.content AS tarea_titulo,
        tk.begin AS fecha_inicio,
        ROUND(tk.actiontime / 60) AS duracion_min,
        CASE tk.state
          WHEN 1 THEN 'Planificada'
          WHEN 2 THEN 'En curso'
          WHEN 3 THEN 'Finalizada'
          ELSE 'Sin estado'
        END AS estado_tarea,
        tc.name AS categoria_tarea
      FROM glpi_tickets t
      LEFT JOIN glpi_locations l ON t.locations_id = l.id
      LEFT JOIN glpi_itilcategories gtc ON t.itilcategories_id = gtc.id
      LEFT JOIN glpi_tickettasks tk ON tk.tickets_id = t.id
      LEFT JOIN glpi_taskcategories tc ON tk.taskcategories_id = tc.id
      WHERE t.is_deleted = 0
      ORDER BY t.id DESC
    `);

    const ticketsMap = {};

    rows.forEach(row => {
      const ticketId = row.ticket_id;

      if (!ticketsMap[ticketId]) {
        ticketsMap[ticketId] = {
          ticket_id: row.ticket_id,
          titulo: row.titulo,
          ubicacion: row.ubicacion,
          prioridad: row.prioridad,
          estado_ticket: row.estado_ticket,
          categoria_ticket: row.categoria_ticket,
          tareas: []
        };
      }

      if (row.tarea_id) {
        ticketsMap[ticketId].tareas.push({
          tarea_id: row.tarea_id,
          tarea_titulo: row.tarea_titulo,
          fecha_inicio: row.fecha_inicio,
          duracion_min: row.duracion_min,
          estado_tarea: row.estado_tarea,
          categoria_tarea: row.categoria_tarea
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
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
app.use(cors());

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
          WHEN 1 THEN 'Baja'
          WHEN 2 THEN 'Media'
          WHEN 3 THEN 'Alta'
          WHEN 4 THEN 'Muy Alta'
          WHEN 5 THEN 'Crítica'
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
        tk.id AS tarea_id,
        tk.content AS tarea_titulo,
        tk.begin AS fecha_inicio,
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
      LEFT JOIN glpi_tickettasks tk ON tk.tickets_id = t.id
      LEFT JOIN glpi_taskcategories tc ON tk.taskcategories_id = tc.id
      WHERE t.is_deleted = 0
      ORDER BY t.id DESC
    `);

    const ticketsMap = {};

    rows.forEach(row => {
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
          categoria_ticket: row.categoria_ticket || 'Sin categoría',
          tareas: []
        };
      }

      if (row.tarea_id) {
        ticketsMap[ticketId].tareas.push({
          tarea_id: row.tarea_id,
          tarea_titulo: row.tarea_titulo,
          fecha_inicio: row.fecha_inicio,
          duracion_min: row.duracion_min,
          estado_tarea: row.estado_tarea,
          categoria_tarea: row.categoria_tarea || '-'
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
