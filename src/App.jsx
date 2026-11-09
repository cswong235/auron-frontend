import { useEffect, useState } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, Outlet, useLocation } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { Menu01Icon, UserIcon } from '@hugeicons/core-free-icons';
import { AuthProvider, useAuth } from './context/AuthContext';
import { apiFetch } from './services/helpers';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Aurora from './components/Aurora';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserProfile from './pages/UserProfile';
import CurrencyRates from './pages/CurrencyRates';
import './App.css';

function Layout(){
  const { session } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const location = useLocation();
  const isDashboard = location.pathname === '/';

  // When the app opens, make the backend fetch the rates if it hasn't yet today
  useEffect(() => {
    apiFetch('/exchange-rates', { token: session.access_token })
      .catch((err) => console.error(err));
  }, []);

  return(
    <div data-bs-theme="dark" className="app-layout">
      <div className="app-background">
        <Aurora colorStops={['#5227ff', '#466bf3', '#4a90c2']} amplitude={1} blend={0.5} height={0.9} brightness={1.5} direction="bottom" />
      </div>

      <header className="app-header">
        <button type="button" className="icon-button d-md-none" onClick={() => setShowMenu(true)} aria-label="Open menu">
          <HugeiconsIcon icon={Menu01Icon} size={24} />
        </button>

        <Link to="/" className="app-logo">AURON</Link>

        <div className="app-header-right">
          <Link to="/profile" className="app-avatar" aria-label="Profile">
            <HugeiconsIcon icon={UserIcon} size={20} />
          </Link>
        </div>
      </header>

      <div className="app-body">
        <Sidebar show={showMenu} onClose={() => setShowMenu(false)} />

        <main className={isDashboard ? 'app-main full-height' : 'app-main'}>
          <div key={location.pathname} className="page-transition">
            <Outlet/>
          </div>
        </main>
      </div>

      <footer className="app-footer">
        Auron by Wong Chang Sheng, 2026
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/currency-rates" element={<CurrencyRates />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
