import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  getToken, removeToken,
  loginUser, registerUser, getCurrentUser, logoutUser as apiLogout,
} from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Restore session on app launch ──────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (token) {
          const data = await getCurrentUser();
          setCurrentUser(data.user);
        }
      } catch (err) {
        console.warn('Session restore failed:', err.message);
        await removeToken();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Register ───────────────────────────────────────────────────────────
  const register = async (name, email, password) => {
    const data = await registerUser(name, email, password);
    setCurrentUser(data.user);
    return data;
  };

  // ── Login ──────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const data = await loginUser(email, password);
    setCurrentUser(data.user);
    return data;
  };

  // ── Sign Out ───────────────────────────────────────────────────────────
  const signOut = async () => {
    await apiLogout();
    setCurrentUser(null);
  };

  // ── Update profile (age/gender/onboarding) ────────────────────────────
  const updateProfile = (updates) => {
    setCurrentUser(prev => prev ? { ...prev, ...updates } : prev);
  };

  const value = {
    currentUser,
    loading,
    register,
    login,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
