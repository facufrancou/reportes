import { useEffect, useState } from "react";
import axios from "axios";

interface LogEntry {
  timestamp: string;
  evento: string;
  usuario: string;
}

export default function LogView() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  console.log("MONTADO")
  useEffect(() => {
    axios
      .get("https://api-reportes.netsolutionsar.com/api/logs")
      .then((res) => setLogs(res.data))
      .catch((err) => console.error("Error al obtener logs", err))
      .finally(() => setLoading(false));
  }, []);

  console.log("LOGS:", logs);
  
  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>Historial de Actividad</h1>

      {loading ? (
        <p>Cargando logs...</p>
      ) : logs.length === 0 ? (
        <p>No hay registros disponibles.</p>
      ) : (
        <table
          style={{
            margin: "2rem auto",
            borderCollapse: "collapse",
            width: "90%",
            backgroundColor: "#fff",
            color: "#000",
          }}
          border={1}
        >
          <thead style={{ backgroundColor: "#ddd" }}>
            <tr>
              <th>Fecha y hora</th>
              <th>Evento</th>
              <th>Usuario</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, idx) => (
              <tr key={idx}>
                <td>{new Date(log.timestamp).toLocaleString("es-AR")}</td>
                <td>{log.evento}</td>
                <td>{log.usuario}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
