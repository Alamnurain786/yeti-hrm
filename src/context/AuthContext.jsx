/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  authAPI,
  clearAuthData,
  setRefreshToken,
  setAuthToken,
  userAPI,
} from "../services/backendApi";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const getStoredUser = () => {
    const raw = localStorage.getItem("hrm_current_user");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const sanitizeProfileImageRef = (value) => {
    if (!value) return null;
    if (typeof value === "string" && value.startsWith("blob:")) return null;
    return value;
  };

  const [user, setUser] = useState(() => {
    const parsed = getStoredUser();
    if (!parsed) return null;
    try {
      return {
        ...parsed,
        profileImage: sanitizeProfileImageRef(
          parsed?.profileImage ?? parsed?.profile_image,
        ),
      };
    } catch {
      localStorage.removeItem("hrm_current_user");
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  const normalizeUser = (rawUser) => ({
    ...rawUser,
    profileImage: sanitizeProfileImageRef(
      rawUser?.profileImage ?? rawUser?.profile_image,
    ),
  });

  const refreshCurrentUser = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) return null;
      try {
        const refreshed = await authAPI.refresh();
        setAuthToken(refreshed?.access_token);
        setRefreshToken(refreshed?.refresh_token);
      } catch {
        clearAuthData();
        setUser(null);
        return null;
      }
    }

    try {
      const me = await userAPI.getMe();
      const normalized = normalizeUser(me);
      setUser(normalized);
      localStorage.setItem("hrm_current_user", JSON.stringify(normalized));
      setIsOffline(false);
      return normalized;
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        clearAuthData();
        setUser(null);
        setIsOffline(false);
        return null;
      }

      // Strict mode: if backend is unreachable, end session immediately.
      clearAuthData();
      setUser(null);
      setIsOffline(true);
      return null;
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        clearAuthData();
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        await refreshCurrentUser();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [refreshCurrentUser]);

  useEffect(() => {
    if (!user) return;

    const timer = setInterval(() => {
      refreshCurrentUser();
    }, 10000);

    return () => clearInterval(timer);
  }, [refreshCurrentUser, user]);

  // Immediately destroy session when server becomes unreachable.
  // Triggered by the axios interceptor in backendApi.js on any network-level failure.
  useEffect(() => {
    const handleServerUnreachable = () => {
      clearAuthData();
      setUser(null);
      setIsOffline(true);
    };

    window.addEventListener("server-unreachable", handleServerUnreachable);
    return () =>
      window.removeEventListener("server-unreachable", handleServerUnreachable);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      const normalized = normalizeUser(response.user);

      setAuthToken(response.access_token);
      setRefreshToken(response.refresh_token);
      setUser(normalized);
      localStorage.setItem("hrm_current_user", JSON.stringify(normalized));
      setIsOffline(false);

      return { success: true };
    } catch (error) {
      if (!error?.response) {
        return {
          success: false,
          message: "Network error: server is disconnected. Please try again.",
        };
      }
      return {
        success: false,
        message:
          error.response?.data?.error?.message ||
          error.response?.data?.detail ||
          "Invalid credentials",
      };
    }
  };

  const logout = () => {
    setUser(null);
    setIsOffline(false);
    clearAuthData();
  };

  const updateCurrentUser = (updates) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        ...updates,
        profileImage: sanitizeProfileImageRef(
          updates?.profileImage ?? updates?.profile_image ?? prev?.profileImage,
        ),
      };
      localStorage.setItem("hrm_current_user", JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        isOffline,
        updateCurrentUser,
        refreshCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
