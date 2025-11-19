
import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';
import { Spinner } from 'react-bootstrap';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(() => {
    // prefer localStorage snapshot (fast), fallback to null and let loadUser refresh
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // wrapper to keep localStorage in sync whenever we update user
  const setUser = (u) => {
    setUserState((prev) => {
      const value = typeof u === 'function' ? u(prev) : u;
      try {
        if (value) localStorage.setItem('user', JSON.stringify(value));
        else localStorage.removeItem('user');
      } catch (e) {
        console.error('Failed to persist user to localStorage', e);
      }
      return value;
    });
  };

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('userToken');
      if (token) {
        authService.setAuthHeader(token);
        try {
          const currentUser = await authService.getMe();
          setUser(currentUser);
        } catch (error) {
          // Token invalid or expired
          console.error('Failed to fetch user, logging out.', error);
          authService.logout();
          setUser(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    await authService.login({ email, password });
    const currentUser = await authService.getMe();
    setUser(currentUser);
  };

  const register = async (name, email, password) => {
    await authService.register({ name, email, password });
    const currentUser = await authService.getMe();
    setUser(currentUser);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  // NEW: allow parts of the user object to be updated
  const updateUser = (newFields) => {
    setUser((prev) => {
      const merged = { ...(prev || {}), ...(typeof newFields === 'function' ? newFields(prev) : newFields) };
      try {
        localStorage.setItem('user', JSON.stringify(merged));
      } catch (e) {
        console.error('Failed to persist updated user', e);
      }
      return merged;
    });
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser, updateUser, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
