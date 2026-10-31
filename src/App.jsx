import { BrowserRouter, Link, Navigate, NavLink, Route, Routes, Outlet } from 'react-router-dom';
import { Nav, Navbar } from 'react-bootstrap';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LogoutModal from './components/LogoutModal';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import './App.css';

function Layout(){
  const { session, user } = useAuth();

  return(
    <div data-bs-theme="dark">
      <header>
        <Link to="/">AURON</Link>
      </header>

      <Navbar>
        {session && (
          <>
            <Nav>
              <Nav.Link as={NavLink} to="/" end>Dashboard</Nav.Link>
              <Nav.Link as={NavLink} to="/profile">Profile</Nav.Link>
            </Nav>
            <span>Logged in as <strong>{user.email}</strong></span>
            <LogoutModal />
          </>
        )}
      </Navbar>

      <main>
        <Outlet/>
      </main>

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

          <Route element={<Layout />}>
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Dashboard />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
