import axios from "axios";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const API_PREFIX = "/api/v1";

const api = axios.create({
  baseURL: `${API_BASE_URL}${API_PREFIX}`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

let isRefreshingToken = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

const onRefreshed = (token) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    if (
      error?.response?.status === 401 &&
      !originalRequest?._retry &&
      localStorage.getItem("refresh_token")
    ) {
      if (isRefreshingToken) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshingToken = true;
      try {
        const refreshResponse = await axios.post(
          `${API_BASE_URL}${API_PREFIX}/auth/refresh`,
          { refresh_token: localStorage.getItem("refresh_token") },
          { headers: { "Content-Type": "application/json" } },
        );
        const newAccessToken = refreshResponse?.data?.access_token;
        const newRefreshToken = refreshResponse?.data?.refresh_token;
        if (newAccessToken) {
          localStorage.setItem("access_token", newAccessToken);
          onRefreshed(newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        if (newRefreshToken) {
          localStorage.setItem("refresh_token", newRefreshToken);
        }
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("hrm_current_user");
        return Promise.reject(refreshError);
      } finally {
        isRefreshingToken = false;
      }
    }

    const data = error?.response?.data;
    if (data && Array.isArray(data.detail) && data.detail.length > 0) {
      const first = data.detail[0];
      if (typeof first === "string") {
        data.detail = first;
      } else if (first && typeof first === "object") {
        const field = Array.isArray(first.loc)
          ? first.loc.filter((part) => part !== "body").join(".")
          : "";
        const msg = typeof first.msg === "string" ? first.msg : "Invalid input";
        data.detail = field ? `${field}: ${msg}` : msg;
      }
    }

    // Server is completely unreachable (no response = network error / server down).
    // Dispatch a global event so AuthContext can destroy the session immediately.
    if (!error.response) {
      window.dispatchEvent(new Event("server-unreachable"));
    }
    return Promise.reject(error);
  },
);

export const authAPI = {
  login: async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },

  refresh: async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    const response = await api.post("/auth/refresh", {
      refresh_token: refreshToken,
    });
    return response.data;
  },
};

export const userAPI = {
  getAll: async () => {
    const response = await api.get("/users/all-users");
    return response.data;
  },

  create: async (payload) => {
    const response = await api.post("/users", payload);
    return response.data;
  },

  update: async (userId, payload) => {
    const response = await api.put(`/users/${userId}`, payload);
    return response.data;
  },

  delete: async (userId) => {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get("/users/me");
    return response.data;
  },

  getCompanyUserCounts: async () => {
    const response = await api.get("/users/company-user-counts");
    return response.data;
  },

  changeMyPassword: async (payload) => {
    const response = await api.post("/users/me/change-password", payload);
    return response.data;
  },

  getMySettings: async () => {
    const response = await api.get("/users/me/settings");
    return response.data;
  },

  updateMySettings: async (payload) => {
    const response = await api.put("/users/me/settings", payload);
    return response.data;
  },

  logoutAllDevices: async () => {
    const response = await api.post("/users/me/logout-all");
    return response.data;
  },

  getMySessions: async () => {
    const response = await api.get("/users/me/sessions");
    return response.data;
  },

  revokeMySession: async (sessionId) => {
    const response = await api.delete(`/users/me/sessions/${sessionId}`);
    return response.data;
  },

  importEmployees: async (formData) => {
    const response = await api.post("/import/employees", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  importEmployeesAdvanced: async (
    formData,
    { dryRun = false, duplicateStrategy = "fail" } = {},
  ) => {
    const response = await api.post("/import/employees", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      params: {
        dry_run: dryRun,
        duplicate_strategy: duplicateStrategy,
      },
    });
    return response.data;
  },
};

export const companyAPI = {
  getAll: async (params = {}) => {
    const response = await api.get("/companies/", { params });
    return response.data;
  },

  getMine: async () => {
    const response = await api.get("/companies/me");
    return response.data;
  },

  createWithAdmin: async (payload) => {
    const response = await api.post("/companies/", payload);
    return response.data;
  },

  update: async (companyId, payload) => {
    const response = await api.put(`/companies/${companyId}`, payload);
    return response.data;
  },

  updateStatus: async (companyId, payload) => {
    const response = await api.post(`/companies/${companyId}/status`, payload);
    return response.data;
  },

  deactivateStale: async (payload) => {
    const response = await api.post(
      "/companies/cleanup/deactivate-stale",
      payload,
    );
    return response.data;
  },

  updateMine: async (payload) => {
    const response = await api.put("/companies/me", payload);
    return response.data;
  },

  getMyEmailProvider: async () => {
    const response = await api.get("/companies/me/email-provider");
    return response.data;
  },

  updateMyEmailProvider: async (payload) => {
    const response = await api.put("/companies/me/email-provider", payload);
    return response.data;
  },

  uploadFile: async (companyId, fileType, file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(
      `/companies/${companyId}/files/${fileType}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data;
  },

  uploadMyFile: async (fileType, file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(
      `/companies/me/files/${fileType}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data;
  },

  fetchFileBlob: async (companyId, fileType) => {
    const response = await api.get(
      `/companies/${encodeURIComponent(companyId)}/files/${encodeURIComponent(fileType)}`,
      {
        responseType: "blob",
      },
    );
    return response.data;
  },

  fetchMyFileBlob: async (fileType) => {
    const response = await api.get(
      `/companies/me/files/${encodeURIComponent(fileType)}`,
      {
        responseType: "blob",
      },
    );
    return response.data;
  },

  openFileInNewTab: async (companyId, fileType) => {
    const blob = await companyAPI.fetchFileBlob(companyId, fileType);
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  },

  openMyFileInNewTab: async (fileType) => {
    const blob = await companyAPI.fetchMyFileBlob(fileType);
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  },

  getFileDownloadUrl: (companyId, fileType) =>
    `${API_BASE_URL}${API_PREFIX}/companies/${encodeURIComponent(companyId)}/files/${encodeURIComponent(fileType)}`,

  getMyFileDownloadUrl: (fileType) =>
    `${API_BASE_URL}${API_PREFIX}/companies/me/files/${encodeURIComponent(fileType)}`,
};

export const profileAPI = {
  getMe: async () => {
    const response = await api.get("/profiles/me");
    return response.data;
  },

  getByEmployeeId: async (employeeId) => {
    const response = await api.get(`/profiles/${employeeId}`);
    return response.data;
  },

  updateByEmployeeId: async (employeeId, payload) => {
    const response = await api.put(`/profiles/${employeeId}`, payload);
    return response.data;
  },
};

export const profileFileAPI = {
  upload: async (employeeId, file, section, fieldName) => {
    const formData = new FormData();
    formData.append("file", file);
    if (section) formData.append("section", section);
    if (fieldName) formData.append("field_name", fieldName);

    const response = await api.post(`/profile-files/${employeeId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  list: async (employeeId, section) => {
    const query = section ? `?section=${encodeURIComponent(section)}` : "";
    const response = await api.get(`/profile-files/${employeeId}${query}`);
    return response.data;
  },

  remove: async (fileId) => {
    const response = await api.delete(`/profile-files/${fileId}`);
    return response.data;
  },

  isDirectMediaUrl: (value) => {
    if (typeof value !== "string") return false;
    const trimmed = value.trim();
    return /^(blob:|data:|https?:\/\/|\/)/i.test(trimmed);
  },

  getDownloadUrl: (fileId) =>
    `${API_BASE_URL}${API_PREFIX}/profile-files/download/${encodeURIComponent(String(fileId).trim())}`,

  fetchBlob: async (fileId) => {
    const normalized =
      typeof fileId === "string" ? fileId.trim() : String(fileId || "");
    if (!normalized || profileFileAPI.isDirectMediaUrl(normalized)) {
      throw new Error("Invalid profile file ID");
    }
    const response = await api.get(
      `/profile-files/download/${encodeURIComponent(normalized)}`,
      {
        responseType: "blob",
      },
    );
    return response.data;
  },

  createObjectUrl: async (fileId) => {
    const normalized =
      typeof fileId === "string" ? fileId.trim() : String(fileId || "");
    if (!normalized) {
      throw new Error("Missing profile file ID");
    }
    if (profileFileAPI.isDirectMediaUrl(normalized)) {
      if (/^blob:/i.test(normalized)) {
        throw new Error("Stale blob URL");
      }
      return normalized;
    }
    const blob = await profileFileAPI.fetchBlob(fileId);
    return URL.createObjectURL(blob);
  },
};

export const leaveAPI = {
  getAll: async () => {
    const response = await api.get("/leaves/");
    return response.data;
  },

  getMy: async () => {
    const response = await api.get("/leaves/my");
    return response.data;
  },

  create: async (payload) => {
    const response = await api.post("/leaves/", payload);
    return response.data;
  },

  update: async (leaveId, payload) => {
    const response = await api.put(`/leaves/${leaveId}`, payload);
    return response.data;
  },

  getMyBalance: async () => {
    const response = await api.get("/leaves/balance/me");
    return response.data;
  },

  getUserBalance: async (userId) => {
    const response = await api.get(`/leaves/balance/${userId}`);
    return response.data;
  },

  setOpeningBalance: async (payload) => {
    const response = await api.post("/leaves/balance/opening", payload);
    return response.data;
  },

  getMyLedger: async () => {
    const response = await api.get("/leaves/ledger/me");
    return response.data;
  },

  getHolidays: async () => {
    const response = await api.get("/leaves/holidays");
    return response.data;
  },

  createHoliday: async (payload) => {
    const response = await api.post("/leaves/holidays", payload);
    return response.data;
  },

  deleteHoliday: async (holidayId) => {
    const response = await api.delete(`/leaves/holidays/${holidayId}`);
    return response.data;
  },

  getPolicy: async () => {
    const response = await api.get("/leaves/policy");
    return response.data;
  },

  updatePolicy: async (payload) => {
    const response = await api.put("/leaves/policy", payload);
    return response.data;
  },

  getApprovalWorkflow: async () => {
    const response = await api.get("/leaves/approval-workflow");
    return response.data;
  },

  updateApprovalWorkflow: async (payload) => {
    const response = await api.put("/leaves/approval-workflow", payload);
    return response.data;
  },

  getAuditTrail: async (leaveId) => {
    const response = await api.get(`/leaves/${leaveId}/audit-trail`);
    return response.data;
  },

  importLeaveOpeningBalances: async (formData) => {
    const response = await api.post("/import/leaves", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  importLeaves: async (formData) => {
    return leaveAPI.importLeaveOpeningBalances(formData);
  },

  importLeavesAdvanced: async (
    formData,
    { dryRun = false, duplicateStrategy = "fail" } = {},
  ) => {
    const response = await api.post("/import/leaves", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      params: {
        dry_run: dryRun,
        duplicate_strategy: duplicateStrategy,
      },
    });
    return response.data;
  },

  getImportJobs: async (params = {}) => {
    const response = await api.get("/import/jobs", { params });
    return response.data;
  },

  getImportJobDetail: async (jobId) => {
    const response = await api.get(`/import/jobs/${jobId}`);
    return response.data;
  },

  getImportJobErrorCsvUrl: (jobId) =>
    `${API_BASE_URL}${API_PREFIX}/import/jobs/${encodeURIComponent(jobId)}/errors.csv`,
};

export const attendanceAPI = {
  getStatus: async (params = {}) => {
    const mergedParams = { sync: true, ...params };
    const response = await api.get("/attendance/status", {
      params: mergedParams,
      timeout: 30000,
    });
    return response.data;
  },

  getAbsent: async (params = {}) => {
    const mergedParams = { sync: true, ...params };
    const response = await api.get("/attendance/absent", {
      params: mergedParams,
      timeout: 30000,
    });
    return response.data;
  },

  getAll: async (params = {}) => {
    const mergedParams = { sync: true, ...params };
    const response = await api.get("/attendance/", {
      params: mergedParams,
      timeout: 30000,
    });
    return response.data;
  },

  getPaged: async (params = {}) => {
    const mergedParams = { sync: false, page: 1, page_size: 50, ...params };
    const response = await api.get("/attendance/paged", {
      params: mergedParams,
      timeout: 30000,
    });
    return response.data;
  },

  getMy: async (params = {}) => {
    const mergedParams = { sync: true, ...params };
    const response = await api.get("/attendance/my", {
      params: mergedParams,
      timeout: 30000,
    });
    return response.data;
  },

  previewAbsentRecalculation: async (params = {}) => {
    const response = await api.get("/attendance/absent-recalculation/preview", {
      params,
      timeout: 30000,
    });
    return response.data;
  },

  confirmAbsentRecalculation: async (payload) => {
    const response = await api.post(
      "/attendance/absent-recalculation/confirm",
      payload,
      { timeout: 60000 },
    );
    return response.data;
  },
};

export const payrollAPI = {
  getAll: async () => {
    const response = await api.get("/payroll/");
    return response.data;
  },

  create: async (payload) => {
    const response = await api.post("/payroll/", payload);
    return response.data;
  },
};

export const notificationAPI = {
  getMy: async () => {
    const response = await api.get("/notifications/my");
    return response.data;
  },

  markRead: async (notificationId) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllRead: async () => {
    const response = await api.put("/notifications/read-all");
    return response.data;
  },

  getStreamUrl: () => {
    const token = localStorage.getItem("access_token");
    const base = `${API_BASE_URL}${API_PREFIX}/notifications/stream`;
    const params = new URLSearchParams();
    if (token) {
      params.set("token", token);
    }
    return `${base}?${params.toString()}`;
  },

  getDigestPreview: async () => {
    const response = await api.get("/notifications/digest/preview");
    return response.data;
  },

  sendDigestNow: async () => {
    const response = await api.post("/notifications/digest/send-now");
    return response.data;
  },

  sendSuperadminAlert: async (payload) => {
    const response = await api.post("/notifications/superadmin-alert", payload);
    return response.data;
  },
};

export const emailTemplateAPI = {
  list: async () => {
    const response = await api.get("/email-templates/");
    return response.data;
  },

  get: async (key) => {
    const response = await api.get(
      `/email-templates/${encodeURIComponent(key)}`,
    );
    return response.data;
  },

  update: async (key, payload) => {
    const response = await api.put(
      `/email-templates/${encodeURIComponent(key)}`,
      payload,
    );
    return response.data;
  },

  preview: async (key, context = {}) => {
    const response = await api.post(
      `/email-templates/${encodeURIComponent(key)}/preview`,
      { context },
    );
    return response.data;
  },

  testSend: async (key, payload) => {
    const response = await api.post(
      `/email-templates/${encodeURIComponent(key)}/test-send`,
      payload,
    );
    return response.data;
  },
};

export const reportsAPI = {
  getMonthlyKpi: async (month) => {
    const response = await api.get("/reports/monthly-kpi", {
      params: { month },
    });
    return response.data;
  },

  downloadMonthlyKpiCsv: async (month) => {
    const response = await api.get("/reports/monthly-kpi.csv", {
      params: { month },
      responseType: "blob",
    });
    return {
      blob: response.data,
      contentDisposition: response.headers?.["content-disposition"] || "",
    };
  },

  getMonthlyKpiCsvUrl: (month) =>
    `${API_BASE_URL}${API_PREFIX}/reports/monthly-kpi.csv?month=${encodeURIComponent(month)}`,
};

export const departmentAPI = {
  getAll: async () => {
    const response = await api.get("/departments/");
    return response.data;
  },

  getSections: async () => {
    const response = await api.get("/departments/sections");
    return response.data;
  },

  getSectionsByDepartment: async (departmentId) => {
    const response = await api.get(`/departments/${departmentId}/sections`);
    return response.data;
  },

  create: async (payload) => {
    const response = await api.post("/departments/", payload);
    return response.data;
  },

  createSection: async (payload) => {
    const response = await api.post("/departments/sections", payload);
    return response.data;
  },

  update: async (departmentId, payload) => {
    const response = await api.put(`/departments/${departmentId}`, payload);
    return response.data;
  },

  updateSection: async (sectionId, payload) => {
    const response = await api.put(
      `/departments/sections/${sectionId}`,
      payload,
    );
    return response.data;
  },

  delete: async (departmentId) => {
    const response = await api.delete(`/departments/${departmentId}`);
    return response.data;
  },

  deleteSection: async (sectionId) => {
    const response = await api.delete(`/departments/sections/${sectionId}`);
    return response.data;
  },
};

export const positionAPI = {
  getAll: async () => {
    const response = await api.get("/positions/");
    return response.data;
  },

  create: async (payload) => {
    const response = await api.post("/positions/", payload);
    return response.data;
  },

  update: async (positionId, payload) => {
    const response = await api.put(`/positions/${positionId}`, payload);
    return response.data;
  },

  delete: async (positionId) => {
    const response = await api.delete(`/positions/${positionId}`);
    return response.data;
  },
};

export const deviceAPI = {
  getAll: async () => {
    const response = await api.get("/devices/");
    return response.data;
  },

  create: async (payload) => {
    const response = await api.post("/devices/", payload);
    return response.data;
  },

  update: async (deviceId, payload) => {
    const response = await api.put(`/devices/${deviceId}`, payload);
    return response.data;
  },

  delete: async (deviceId) => {
    const response = await api.delete(`/devices/${deviceId}`);
    return response.data;
  },

  connect: async (deviceId, payload = null) => {
    const response = await api.post(`/devices/${deviceId}/connect`, payload);
    return response.data;
  },

  getLiveSyncStatus: async (deviceId) => {
    const response = await api.get(`/devices/${deviceId}/live-sync-status`);
    return response.data;
  },

  startLiveSync: async (deviceId) => {
    const response = await api.post(`/devices/${deviceId}/start-live-sync`);
    return response.data;
  },

  stopLiveSync: async (deviceId) => {
    const response = await api.post(`/devices/${deviceId}/stop-live-sync`);
    return response.data;
  },

  syncAttendance: async (
    deviceId,
    payload = { include_users: false, only_new: true },
  ) => {
    const response = await api.post(
      `/devices/${deviceId}/pull-raw-data`,
      payload,
      { timeout: 240000 },
    );
    return response.data;
  },

  getDetails: async (deviceId) => {
    const response = await api.get(`/devices/${deviceId}/details`);
    return response.data;
  },

  getUsersFromDb: async (deviceId) => {
    const response = await api.get(`/devices/${deviceId}/users/db`);
    return response.data;
  },

  getLiveEventsStreamUrl: () => {
    const token = localStorage.getItem("access_token");
    const base = `${API_BASE_URL}${API_PREFIX}/devices/events/stream`;
    const params = new URLSearchParams();
    params.set("autostart", "1");
    if (token) {
      params.set("token", token);
    }
    return `${base}?${params.toString()}`;
  },
};

export const attendanceRulesAPI = {
  getForCompany: async (companyId) => {
    const response = await api.get(`/attendance-rules/company/${companyId}`);
    return response.data;
  },

  createOrUpdate: async (companyId, payload) => {
    const response = await api.post(
      `/attendance-rules/company/${companyId}`,
      payload,
    );
    return response.data;
  },

  getById: async (ruleId) => {
    const response = await api.get(`/attendance-rules/${ruleId}`);
    return response.data;
  },

  update: async (ruleId, payload) => {
    const response = await api.put(`/attendance-rules/${ruleId}`, payload);
    return response.data;
  },

  rebuildCompanyAttendance: async (companyId) => {
    const response = await api.post(
      `/attendance-rules/company/${companyId}/rebuild`,
      null,
      { timeout: 300000 }, // 5 minute timeout for heavy rebuild operation
    );
    return response.data;
  },
};

export const platformSettingsAPI = {
  get: async () => {
    const response = await api.get("/platform-settings/");
    return response.data;
  },

  update: async (payload) => {
    const response = await api.put("/platform-settings/", payload);
    return response.data;
  },
};

export const widgetPermissionAPI = {
  getMatrix: async (tenantId = null) => {
    const response = await api.get("/widget-permissions/matrix", {
      params: tenantId ? { tenant_id: tenantId } : {},
    });
    return response.data;
  },

  updateMatrix: async (payload, tenantId = null) => {
    const response = await api.put("/widget-permissions/matrix", payload, {
      params: tenantId ? { tenant_id: tenantId } : {},
    });
    return response.data;
  },
};

const normalizeMessage = (value) => {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
};

const extractFastApiValidationMessage = (detail) => {
  if (!Array.isArray(detail) || detail.length === 0) return null;
  const first = detail[0];
  if (typeof first === "string") {
    return normalizeMessage(first);
  }
  if (first && typeof first === "object") {
    const field = Array.isArray(first.loc)
      ? first.loc.filter((part) => part !== "body").join(".")
      : "";
    const msg = normalizeMessage(first.msg);
    if (field && msg) {
      return `${field}: ${msg}`;
    }
    return msg;
  }
  return null;
};

const normalizeValidationField = (loc) => {
  if (!Array.isArray(loc)) return null;
  const field = loc
    .filter((part) => part !== "body")
    .map((part) => String(part))
    .join(".")
    .trim();
  return field || null;
};

export const getApiValidationErrors = (error, fieldMap = {}) => {
  const detail = error?.response?.data?.detail;
  if (!Array.isArray(detail)) return {};

  const parsed = {};
  detail.forEach((entry) => {
    if (!entry || typeof entry !== "object") return;

    const rawField = normalizeValidationField(entry.loc);
    if (!rawField) return;

    const mappedField =
      fieldMap[rawField] || fieldMap[rawField.split(".").pop()] || rawField;
    const message = normalizeMessage(entry.msg) || "Invalid value";

    if (!parsed[mappedField]) {
      parsed[mappedField] = message;
    }
  });

  return parsed;
};

export const getApiErrorMessage = (
  error,
  fallback = "Something went wrong",
) => {
  const data = error?.response?.data;
  const fromErrorObject = normalizeMessage(data?.error?.message);
  if (fromErrorObject) return fromErrorObject;

  const fromMessage = normalizeMessage(data?.message);
  if (fromMessage) return fromMessage;

  const fromDetailString = normalizeMessage(data?.detail);
  if (fromDetailString) return fromDetailString;

  const fromValidationList = extractFastApiValidationMessage(data?.detail);
  if (fromValidationList) return fromValidationList;

  const fromTopLevelError = normalizeMessage(error?.message);
  if (fromTopLevelError) return fromTopLevelError;

  return fallback;
};

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem("access_token", token);
  } else {
    localStorage.removeItem("access_token");
  }
};

export const setRefreshToken = (token) => {
  if (token) {
    localStorage.setItem("refresh_token", token);
  } else {
    localStorage.removeItem("refresh_token");
  }
};

export const getAuthToken = () => localStorage.getItem("access_token");

export const clearAuthData = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("hrm_current_user");
};
export default api;
