import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p className="fs-muted text-center mt-5">Loading...</p>;
  }

  // Not logged in: send them to /login, remembering where they were headed
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Logged in: render whichever child route matched
  return <Outlet />;
}
