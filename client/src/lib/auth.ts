import { createContext, useContext, useEffect, useState } from "react";
import { apiRequest } from "./queryClient";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  companyId: number;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      // Validate session by making a request to a protected endpoint
      fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${sessionId}`
        }
      }).then(response => {
        if (response.ok) {
          setIsAuthenticated(true);
          // Could fetch user details here if needed
        } else {
          localStorage.removeItem('sessionId');
        }
      }).catch(() => {
        localStorage.removeItem('sessionId');
      }).finally(() => {
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiRequest('POST', '/api/login', { email, password });
      const data = await response.json();
      
      localStorage.setItem('sessionId', data.sessionId);
      setUser(data.user);
      setIsAuthenticated(true);
    } catch (error) {
      throw new Error('Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('sessionId');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
