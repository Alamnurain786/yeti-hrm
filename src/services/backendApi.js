// Backend API Service
// Axios-based API client for HRM backend

import axios from "axios";

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const API_PREFIX = "/api/v1";

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}${API_PREFIX}`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds
});

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem("access_token");
      localStorage.removeItem("hrm_current_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ============= Authentication APIs =============

export const authAPI = {
  // Login with JSON body
  login: async (email, password) => {
    const response = await api.post("/auth/login/json", { email, password });
    return response.data;
  },

  // Register new user
  register: async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },
};

// ============= User APIs =============

export const userAPI = {
  // Get all users (HR/Admin only)
  getAll: async () => {
    const response = await api.get("/users/");
    return response.data;
  },

  // Get current user profile
  getMe: async () => {
    const response = await api.get("/users/me");
    return response.data;
  },

  // Get user by ID
  getById: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  // Update user
  update: async (userId, userData) => {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  },

  // Delete user (HR/Admin only)
  delete: async (userId) => {
    await api.delete(`/users/${userId}`);
  },
};

// ============= Department APIs =============

export const departmentAPI = {
  // Get all departments
  getAll: async () => {
    const response = await api.get("/departments/");
    return response.data;
  },

  // Get department by ID
  getById: async (deptId) => {
    const response = await api.get(`/departments/${deptId}`);
    return response.data;
  },

  // Create department (HR/Admin only)
  create: async (deptData) => {
    const response = await api.post("/departments/", deptData);
    return response.data;
  },

  // Update department (HR/Admin only)
  update: async (deptId, deptData) => {
    const response = await api.put(`/departments/${deptId}`, deptData);
    return response.data;
  },

  // Delete department (Superadmin only)
  delete: async (deptId) => {
    await api.delete(`/departments/${deptId}`);
  },
};

// ============= Role APIs =============

export const roleAPI = {
  // Get all roles
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.department_id)
      params.append("department_id", filters.department_id);
    if (filters.level) params.append("level", filters.level);

    const response = await api.get(`/roles/?${params.toString()}`);
    return response.data;
  },

  // Get role by ID
  getById: async (roleId) => {
    const response = await api.get(`/roles/${roleId}`);
    return response.data;
  },

  // Create role (HR/Admin only)
  create: async (roleData) => {
    const response = await api.post("/roles/", roleData);
    return response.data;
  },

  // Update role (HR/Admin only)
  update: async (roleId, roleData) => {
    const response = await api.put(`/roles/${roleId}`, roleData);
    return response.data;
  },

  // Delete role (Superadmin only)
  delete: async (roleId) => {
    await api.delete(`/roles/${roleId}`);
  },
};

// ============= Attendance APIs =============

export const attendanceAPI = {
  // Get attendance records with filters
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.user_id) params.append("user_id", filters.user_id);
    if (filters.start_date) params.append("start_date", filters.start_date);
    if (filters.end_date) params.append("end_date", filters.end_date);

    const response = await api.get(`/attendance/?${params.toString()}`);
    return response.data;
  },

  // Get current user's attendance
  getMy: async () => {
    const response = await api.get("/attendance/my");
    return response.data;
  },

  // Create attendance record (HR/Admin only)
  create: async (attendanceData) => {
    const response = await api.post("/attendance/", attendanceData);
    return response.data;
  },

  // Update attendance record (HR/Admin only)
  update: async (attendanceId, attendanceData) => {
    const response = await api.put(
      `/attendance/${attendanceId}`,
      attendanceData
    );
    return response.data;
  },

  // Delete attendance record (Superadmin only)
  delete: async (attendanceId) => {
    await api.delete(`/attendance/${attendanceId}`);
  },
};

// ============= Leave APIs =============

export const leaveAPI = {
  // Get leave requests with filters
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append("status", filters.status);
    if (filters.user_id) params.append("user_id", filters.user_id);

    const response = await api.get(`/leaves/?${params.toString()}`);
    return response.data;
  },

  // Get current user's leaves
  getMy: async () => {
    const response = await api.get("/leaves/my");
    return response.data;
  },

  // Create leave request
  create: async (leaveData) => {
    const response = await api.post("/leaves/", leaveData);
    return response.data;
  },

  // Update leave (approve/reject - HR/Admin only)
  update: async (leaveId, leaveData) => {
    const response = await api.put(`/leaves/${leaveId}`, leaveData);
    return response.data;
  },

  // Delete leave request
  delete: async (leaveId) => {
    await api.delete(`/leaves/${leaveId}`);
  },
};

// ============= Helper Functions =============

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem("access_token", token);
  } else {
    localStorage.removeItem("access_token");
  }
};

export const getAuthToken = () => {
  return localStorage.getItem("access_token");
};

export const clearAuthData = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("hrm_current_user");
};

// Export default api instance for custom requests
export default api;
