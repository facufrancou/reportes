interface Tarea {
    tarea_id: number;
    tarea_titulo: string;
    fecha_inicio: string;
    duracion_min: number;
    estado_tarea: string;
    categoria_tarea: string;
  }
  
  interface Ticket {
    ticket_id: number;
    titulo: string;
    ubicacion: string;
    estado_ticket: string;
    tareas: Tarea[];
  }
  
  // 🔧 Limpieza de etiquetas <p> y decodificación HTML
  const procesarHTML = (html: string): string => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const decoded = doc.documentElement.textContent || '';
  
    // Eliminar etiquetas <p> pero mantener otras
    return decoded.replace(/<\/?p>/gi, '');
  };
  
  export default function TicketCard({ ticket }: { ticket: Ticket }) {
    return (
      <div style={{ border: '1px solid #ccc', marginBottom: '1rem', padding: '1rem' }}>
        <h3>{ticket.titulo}</h3>
        <p><strong>Ubicación:</strong> {ticket.ubicacion || 'N/D'}</p>
        <p><strong>Estado:</strong> {ticket.estado_ticket}</p>
        <h4>Tareas:</h4>
        <ul>
          {ticket.tareas.map(tarea => (
            <li key={tarea.tarea_id}>
              <span dangerouslySetInnerHTML={{ __html: procesarHTML(tarea.tarea_titulo) }} />
              &nbsp;({tarea.estado_tarea}, {tarea.duracion_min} min)<br />
              <em>{tarea.categoria_tarea || 'Sin categoría'}</em> - {new Date(tarea.fecha_inicio).toLocaleString()}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  