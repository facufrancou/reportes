import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  
  return (
    <div className="app-container">
      {!isHomePage && (
        <header className="app-header animate-fade-in">
          <div className="header-content">
            <Link to="/" className="logo-link">
              <div className="logo-container">
                <svg 
                  className="app-logo"
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M19 3H5C3.89 3 3 3.89 3 5V19C3 20.11 3.89 21 5 21H19C20.11 21 21 20.11 21 19V5C21 3.89 20.11 3 19 3ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" 
                    fill="#646cff"/>
                </svg>
                <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Sistema de Reportes</h1>
              </div>
            </Link>
            <nav className="main-nav">
              <ul>
                <li className={location.pathname === '/reporte' ? 'active' : ''}>
                  <Link to="/reporte">Reporte</Link>
                </li>
                <li className={location.pathname === '/ver-logs' ? 'active' : ''}>
                  <Link to="/ver-logs">Logs</Link>
                </li>
                <li className={location.pathname === '/calendario' ? 'active' : ''}>
                  <Link to="/calendario">Calendario</Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>
      )}
      
      <main className="app-main">
        {children}
      </main>
      
      {!isHomePage && (
        <footer className="app-footer">
          <div className="footer-content">
            <p>© {new Date().getFullYear()} - Sistema de Reportes</p>
          </div>
        </footer>
      )}
    </div>
  );
}
