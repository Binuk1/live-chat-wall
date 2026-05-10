import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import NotFound from '../../pages/NotFound/NotFound.jsx';

const ProtectedRoute = ({ children, requireAdmin }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (requireAdmin && user?.role !== 'admin') {
    // Show 404 for ANY non-admin (including guests) - hides that admin page exists
    return <NotFound />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
