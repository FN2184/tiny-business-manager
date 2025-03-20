
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

interface User {
  username: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  
  // Check if user was previously logged in
  useEffect(() => {
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('auth_user');
      }
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    // Default credentials: admin/admin
    if (username === 'admin' && password === 'admin') {
      const user = { username };
      setUser(user);
      localStorage.setItem('auth_user', JSON.stringify(user));
      toast.success("Inicio de sesión exitoso", {
        description: `Bienvenido, ${username}!`,
      });
      return true;
    } else {
      toast.error("Credenciales incorrectas", {
        description: "Usuario o contraseña incorrecta.",
      });
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
    toast.success("Sesión cerrada", {
      description: "Has cerrado sesión correctamente.",
    });
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: user !== null,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
