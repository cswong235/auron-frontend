import { useState } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, Outlet } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { Menu01Icon, Notification03Icon, UserIcon } from '@hugeicons/core-free-icons';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserProfile from './pages/UserProfile';
import './App.css';

function Layout(){
  const [showMenu, setShowMenu] = useState(false);

  return(
    <div data-bs-theme="dark">
      <header className="app-header">
        <button type="button" className="icon-button d-md-none" onClick={() => setShowMenu(true)} aria-label="Open menu">
          <HugeiconsIcon icon={Menu01Icon} size={24} />
        </button>

        <Link to="/" className="app-logo">AURON</Link>

        <div className="app-header-right">
          <button type="button" className="icon-button" aria-label="Notifications">
            <HugeiconsIcon icon={Notification03Icon} size={24} />
          </button>
          <Link to="/profile" className="app-avatar" aria-label="Profile">
            <HugeiconsIcon icon={UserIcon} size={20} />
          </Link>
        </div>
      </header>

      <div className="app-body">
        <Sidebar show={showMenu} onOpen={() => setShowMenu(true)} onClose={() => setShowMenu(false)} />

        <main className="app-main">
          <Outlet/>
        </main>
      </div>

      <footer>
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
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
