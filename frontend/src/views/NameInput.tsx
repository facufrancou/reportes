import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {
  onSubmit: (name: string) => void;
}

export default function NameInput({ onSubmit }: Props) {
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      localStorage.setItem('username', name); // Guardar en localStorage
      onSubmit(name);
      navigate('/reporte');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Ingresá tu nombre para ver el reporte</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Tu nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" style={{ marginLeft: '1rem' }}>Ver reporte</button>
      </form>
    </div>
  );
}
