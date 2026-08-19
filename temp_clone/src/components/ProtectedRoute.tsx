import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user } = useContext(AuthContext) as any;

  // If nobody is logged in, send them to the login screen
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If the page requires an admin, but a regular customer is logged in, send them home
  if (requireAdmin && user.role !== 'admin' && user.role !== 'staff') {
    return <Navigate to="/" replace />;
  }

  // If they pass the checks, let them view the page
  return children;
};

export default ProtectedRoute;