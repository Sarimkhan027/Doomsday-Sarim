import { createContext, useContext, useMemo, useState } from 'react';
import { apiRequest } from "./services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('doomsday-user') || 'null');
    } catch {
      return null;
    }
  });

  async function authenticate(mode, values) {
    const result = await apiRequest(`/api/v1/auth/${mode}`, {
      method: 'POST',
      body: JSON.stringify(values)
    });
    localStorage.setItem('doomsday-token', result.token);
    localStorage.setItem('doomsday-user', JSON.stringify(result.user));
    setUser(result.user);
    return result.user;
  }

  function logout() {
    localStorage.removeItem('doomsday-token');
    localStorage.removeItem('doomsday-user');
    setUser(null);
  }

  const value = useMemo(() => ({ user, authenticate, logout }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}