import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('jit_token');
    const saved = localStorage.getItem('jit_user');
    if (token && saved) {
      setUser(JSON.parse(saved));
      authApi.me().catch(() => logout());
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const data = await authApi.login({ username, password });
    localStorage.setItem('jit_token', data.token);
    const u = { _id: data._id, username: data.username, role: data.role, fullName: data.fullName };
    localStorage.setItem('jit_user', JSON.stringify(u));
    setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem('jit_token');
    localStorage.removeItem('jit_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
