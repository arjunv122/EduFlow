import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PERMISSIONS } from '../config/permissions';

/**
 * ProtectedRoute — guards route trees by authentication + permission.
 *
 * Props:
 *  - allowedRoles: string[]  — restrict to specific roles (optional)
 *  - requiredAction: string  — check permissions.js config (optional, takes priority)
 *
 * If requiredAction is supplied, it checks PERMISSIONS[role].includes(action).
 * If only allowedRoles is supplied, checks role membership.
 * If neither is supplied, only authentication is required.
 */
const ProtectedRoute = ({ children, allowedRoles, requiredAction }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: 'var(--bg-primary)',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            border: '3px solid var(--border)',
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
          }}
          className="animate-spin"
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Permission-based check (uses permissions.js — preferred)
  if (requiredAction) {
    const userPermissions = PERMISSIONS[user.role] || [];
    if (!userPermissions.includes(requiredAction)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Role-based check (fallback)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
