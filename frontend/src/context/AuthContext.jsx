import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../api/axios';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

/** Maps role → the route tree root for that role */
const ROLE_HOME = {
  student:    '/dashboard/student',
  faculty:    '/dashboard/faculty',
  admin:      '/dashboard/admin',
  superadmin: '/dashboard/admin',
};

/**
 * Safely decode JWT from localStorage without trusting it blindly.
 * We only use the decoded payload to determine redirect target on the frontend.
 * Actual authorization is always re-validated server-side on every API call.
 */
const decodeToken = (token) => {
  try {
    return jwtDecode(token);
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const navigate = useNavigate();

  /** Redirects user to their role-specific home. */
  const redirectToHome = useCallback((userObj) => {
    const home = ROLE_HOME[userObj?.role] || '/dashboard/student';
    navigate(home, { replace: true });
  }, [navigate]);

  // Initialize auth state from token on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        const decoded = decodeToken(token);
        // Check if token is expired client-side (fail fast, don't hit the server)
        if (!decoded || decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          localStorage.removeItem('activeInstitutionId');
          setLoading(false);
          return;
        }
        try {
          const res = await api.get('/auth/me');
          const userData = res.data.user;
          setUser(userData);
          setProfile(res.data.profile);
          setIsAuthenticated(true);
          // Cache institution ID for the axios header interceptor
          let instId = userData?.institution?._id || userData?.institution;
          if (!instId && userData?.role === 'superadmin') {
            // Superadmin: fetch the first institution they govern
            try {
              const govRes = await api.get('/governance/institutions');
              const institutions = govRes.data?.data || govRes.data?.institutions || [];
              if (institutions.length > 0) instId = institutions[0]._id;
            } catch {} // non-critical
          }
          if (instId) localStorage.setItem('activeInstitutionId', instId);
        } catch {
          // Silently clear stale token — DO NOT show "Session expired" toast on initial load
          localStorage.removeItem('token');
          localStorage.removeItem('activeInstitutionId');
        }
      }
      setLoading(false);
    };

    initAuth();

    // Listen for 401 events fired by axios interceptor
    const handleUnauthorized = () => {
      logout();
      toast.error('Session expired. Please log in again.');
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user: userData } = res.data;

      localStorage.setItem('token', token);
      setUser(userData);
      setIsAuthenticated(true);

      // Cache institution ID for x-institution-id header
      const instId = userData?.institution?._id || userData?.institution;
      if (instId) localStorage.setItem('activeInstitutionId', instId);

      // Fetch full profile (has role-specific profile data)
      const profileRes = await api.get('/auth/me');
      setProfile(profileRes.data.profile);

      toast.success('Logged in successfully');
      // Redirect based on role decoded from the server-issued token
      redirectToHome(userData);
      return true;
    } catch (error) {
      if (error.response?.data?.code !== 'ACCOUNT_NOT_ACTIVATED') {
        toast.error(error.response?.data?.message || 'Login failed');
      }
      throw error;
    }
  };

  const register = async (data) => {
    try {
      const res = await api.post('/auth/register', data);
      if (res.data.isApproved) {
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
        setIsAuthenticated(true);
        const profileRes = await api.get('/auth/me');
        setProfile(profileRes.data.profile);
        redirectToHome(res.data.user);
      }
      toast.success(res.data.message);
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
      throw error;
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('activeInstitutionId');
    setUser(null);
    setProfile(null);
    setIsAuthenticated(false);
  }, []);

  // --- Document Title Effect ---
  useEffect(() => {
    if (user?.institution && user.institution.name) {
      document.title = `${user.institution.name} | EduFlow`;
    } else {
      document.title = 'EduFlow Dashboard';
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAuthenticated, login, register, logout, setProfile, redirectToHome, ROLE_HOME }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
