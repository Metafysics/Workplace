import { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'wouter';

interface User {
  id: number;
  name: string;
  email: string;
  companyId: number;
  role: string;
}

interface AuthContextType {
  user: User | null;
  sessionId: string | null;
  login: (sessionId: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check for existing session on mount
    const storedSessionId = localStorage.getItem('sessionId');
    const storedUser = localStorage.getItem('user');
    
    if (storedSessionId && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setSessionId(storedSessionId);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('sessionId');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newSessionId: string, newUser: User) => {
    setSessionId(newSessionId);
    setUser(newUser);
    localStorage.setItem('sessionId', newSessionId);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = () => {
    setSessionId(null);
    setUser(null);
    localStorage.removeItem('sessionId');
    localStorage.removeItem('user');
    setLocation('/');
  };

  return (
    <AuthContext.Provider value={{ user, sessionId, login, logout, isLoading }}>
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

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation('/login');
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}