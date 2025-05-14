import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import NameInput from './views/NameInput';
import ReportView from './views/ReportView';
import LogView from "./views/LogView";
import CalendarView from "./views/CalendarView";

export default function AppRoutes() {
  const [username, setUsername] = useState('');

  return (
    <Routes>
      <Route path="/" element={<NameInput onSubmit={setUsername} />} />
      <Route path="/reporte" element={<ReportView username={username} />} />
      <Route path="/ver-logs" element={<LogView />} />
      <Route path="/calendario" element={<CalendarView />} />
    </Routes>
  );
}
