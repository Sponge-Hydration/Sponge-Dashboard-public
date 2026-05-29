
import { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { toast } from "sonner";
import { firebaseService, AuthUser } from "@/services/firebaseService";
import { awsApi } from "@/services/awsApi";

// Define the structure of our auth context
interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  isNurse: boolean;
  isAdmin: boolean;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => false,
  logout: () => {},
  loading: true,
  isNurse: false,
  isAdmin: false,
});

// Hook to easily use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component to wrap our app
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing auth on mount
  useEffect(() => {
    const currentUser = firebaseService.getCurrentUser();
    if (currentUser) {
      awsApi.setUserId(currentUser.id);
      awsApi.getUserRole(currentUser.id).then((result) => {
        const role = result.role ?? 'user';
        setUser({ ...currentUser, role });
        setIsAuthenticated(true);
        setLoading(false);
      }).catch(() => {
        setUser({ ...currentUser, role: 'user' });
        setIsAuthenticated(true);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  // Login function using Firebase
  const login = async (email: string, password: string) => {
    try {
      const authUser = await firebaseService.login(email, password);
      
      if (authUser) {
        awsApi.setUserId(authUser.id);
        const roleResult = await awsApi.getUserRole(authUser.id);
        const role = roleResult.role ?? 'user';
        setUser({ ...authUser, role });
        setIsAuthenticated(true);
        toast.success("Login successful");
        return true;
      }
      
      return false;
    } catch (error) {
      toast.error("Login failed");
      return false;
    }
  };

  // Logout function
  const logout = async () => {
    const success = await firebaseService.logout();
    
    if (success) {
      setUser(null);
      setIsAuthenticated(false);
      awsApi.setUserId(null);
      toast.info("Logged out successfully");
    } else {
      toast.error("Logout failed");
    }
  };

  const isNurse = user?.role === 'nurse' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  // Provide the auth context to child components
  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading, isNurse, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
