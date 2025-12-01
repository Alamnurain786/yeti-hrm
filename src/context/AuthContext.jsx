import { createContext, useContext, useState, useEffect } from "react";
import {
  authAPI,
  userAPI,
  setAuthToken,
  clearAuthData,
} from "../services/backendApi";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const initAuth = async () => {
      const token = localStorage.getItem("access_token");
      if (token) {
        try {
          // Verify token and get current user
          const userData = await userAPI.getMe();
          setUser(userData);
        } catch (error) {
          console.error("Session expired:", error);
          clearAuthData();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      // Call backend login API
      const response = await authAPI.login(email, password);

      // Store token
      setAuthToken(response.access_token);

      // Store user data
      setUser(response.user);
      localStorage.setItem("hrm_current_user", JSON.stringify(response.user));

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: error.response?.data?.detail || "Invalid credentials",
      };
    }
  };

  const logout = () => {
    setUser(null);
    clearAuthData();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
