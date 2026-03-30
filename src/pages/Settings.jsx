import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Shield,
  Palette,
  Building2,
  Briefcase,
  Fingerprint,
  Sliders,
  Upload,
  Download,
  Mail,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { companyAPI, leaveAPI, userAPI } from "../services/backendApi";
import AttendanceRulesSettings from "../components/AttendanceRulesSettings";
import LeavePolicySettings from "../components/LeavePolicySettings";

const Settings = () => {
  const { user, refreshCurrentUser, logout } = useAuth();
  const { showToast } = useToast();
  const mustResetPassword = Boolean(
    user?.forcePasswordReset || user?.force_password_reset,
  );

  const userPermissions = useMemo(
    () =>
      Array.isArray(user?.permissions)
        ? user.permissions.filter((item) => typeof item === "string")
        : [],
    [user?.permissions],
  );

  const hasPermission = (permission) => userPermissions.includes(permission);

  const canViewOrganization = hasPermission("settings.organization");
  const canViewLeavePolicy = hasPermission("settings.leave_policy");
  const canViewAttendanceRules = hasPermission("settings.attendance_rules");
  const canViewRolesPermissions = hasPermission("settings.roles_permissions");
  const canViewDeviceIntegration = hasPermission("settings.device_integration");
  const canViewProfile = hasPermission("settings.profile");
  const canViewNotifications = hasPermission("settings.notifications");
  const canViewPreferences = hasPermission("settings.preferences");
  const canViewSecurity = hasPermission("settings.security");
  const roleValue = String(user?.role || "").toLowerCase();
  const hasTenantContext = Boolean(user?.tenant_id || user?.tenantId);
  const canManageCompanyEmailProvider =
    hasTenantContext && (roleValue === "admin" || roleValue === "superadmin");

  const showAdminSection =
    canViewOrganization ||
    canViewLeavePolicy ||
    canViewAttendanceRules ||
    canViewRolesPermissions ||
    canViewDeviceIntegration ||
    canManageCompanyEmailProvider;

  const [preferences, setPreferences] = useState({
    theme: "light",
    language: "English",
    timezone: "Asia/Kathmandu",
    dateFormat: "YYYY-MM-DD",
  });

  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    inApp: true,
    profile: true,
    leave: true,
    payroll: false,
    digestEnabled: false,
    digestHour: 18,
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState("");

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [showOpeningBalanceModal, setShowOpeningBalanceModal] = useState(false);
  const [companyUsers, setCompanyUsers] = useState([]);
  const [loadingCompanyUsers, setLoadingCompanyUsers] = useState(false);
  const [openingBalanceSubmitting, setOpeningBalanceSubmitting] =
    useState(false);
  const [openingBalanceForm, setOpeningBalanceForm] = useState({
    user_id: "",
    leave_type: "home",
    opening_days: "0",
    mode: "set",
    note: "",
  });
  const [selectedUserBalances, setSelectedUserBalances] = useState([]);
  const [loadingSelectedUserBalances, setLoadingSelectedUserBalances] =
    useState(false);
  const [leaveImportFile, setLeaveImportFile] = useState(null);
  const [leaveImportLoading, setLeaveImportLoading] = useState(false);
  const [leaveImportResults, setLeaveImportResults] = useState(null);
  const [emailProviderLoading, setEmailProviderLoading] = useState(false);
  const [emailProviderSaving, setEmailProviderSaving] = useState(false);
  const [showEmailApiKey, setShowEmailApiKey] = useState(false);
  const [emailProviderForm, setEmailProviderForm] = useState({
    mode: "platform",
    provider: "resend",
    resend_api_key: "",
    from_email: "",
    from_name: "",
    reply_to_email: "",
    is_active: true,
    has_api_key: false,
  });

  const leaveOpeningImportTemplate = [
    "user_id,leave_type,opening_days,mode,note",
    "USR001,home,12,set,Imported opening home leave",
    "USR002,sick,4,add,Add sick leave opening",
  ].join("\n");

  useEffect(() => {
    const loadUserSettings = async () => {
      if (!user || (!canViewPreferences && !canViewNotifications)) return;
      setSettingsLoading(true);
      try {
        const data = await userAPI.getMySettings();
        setPreferences({
          theme: data?.theme || "light",
          language: data?.language || "English",
          timezone: data?.timezone || "Asia/Kathmandu",
          dateFormat: data?.date_format || "YYYY-MM-DD",
        });
        setNotifications({
          email: Boolean(data?.notify_email ?? true),
          sms: Boolean(data?.notify_sms ?? false),
          inApp: Boolean(data?.notify_in_app ?? true),
          profile: Boolean(data?.notify_profile ?? true),
          leave: Boolean(data?.notify_leave ?? true),
          payroll: Boolean(data?.notify_payroll ?? false),
          digestEnabled: Boolean(data?.digest_enabled ?? false),
          digestHour: Number(data?.digest_hour ?? 18),
        });
      } catch {
        showToast("error", "Failed to load settings", {
          title: "Load Failed",
        });
      } finally {
        setSettingsLoading(false);
      }
    };

    loadUserSettings();
  }, [canViewNotifications, canViewPreferences, showToast, user]);

  useEffect(() => {
    const loadMyEmailProvider = async () => {
      if (!canManageCompanyEmailProvider) return;
      setEmailProviderLoading(true);
      try {
        const data = await companyAPI.getMyEmailProvider();
        setEmailProviderForm({
          mode: data?.mode || "platform",
          provider: "resend",
          resend_api_key: "",
          from_email: data?.from_email || "",
          from_name: data?.from_name || "",
          reply_to_email: data?.reply_to_email || "",
          is_active: Boolean(data?.is_active ?? true),
          has_api_key: Boolean(data?.has_api_key),
        });
      } catch (error) {
        const errorMsg =
          error?.response?.data?.error?.message ||
          error?.response?.data?.detail ||
          "Failed to load company email provider settings";
        showToast("error", errorMsg, { title: "Load Failed" });
      } finally {
        setEmailProviderLoading(false);
      }
    };

    loadMyEmailProvider();
  }, [canManageCompanyEmailProvider, showToast]);

  const handlePrefChange = (e) => {
    const { name, value } = e.target;
    setPreferences((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggle = (name) => {
    setNotifications((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleSaveUserSettings = async () => {
    setSettingsSaving(true);
    try {
      await userAPI.updateMySettings({
        theme: preferences.theme,
        language: preferences.language,
        timezone: preferences.timezone,
        date_format: preferences.dateFormat,
        notify_email: notifications.email,
        notify_sms: notifications.sms,
        notify_in_app: notifications.inApp,
        notify_profile: notifications.profile,
        notify_leave: notifications.leave,
        notify_payroll: notifications.payroll,
        digest_enabled: notifications.digestEnabled,
        digest_hour: Number(notifications.digestHour || 18),
      });
      showToast("success", "Preferences updated", {
        title: "Settings Saved",
      });
    } catch (error) {
      const errorMsg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.detail ||
        "Failed to save settings";
      showToast("error", errorMsg, { title: "Save Failed" });
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    setLoggingOutAll(true);
    try {
      await userAPI.logoutAllDevices();
      showToast("success", "Logged out from all devices", {
        title: "Session Cleared",
      });
      logout();
    } catch (error) {
      const errorMsg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.detail ||
        "Failed to logout from all devices";
      showToast("error", errorMsg, { title: "Action Failed" });
    } finally {
      setLoggingOutAll(false);
    }
  };

  const loadSessions = async () => {
    if (!canViewSecurity) return;
    setLoadingSessions(true);
    try {
      const rows = await userAPI.getMySessions();
      setSessions(Array.isArray(rows) ? rows : []);
    } catch {
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    setRevokingSessionId(sessionId);
    try {
      await userAPI.revokeMySession(sessionId);
      showToast("success", "Session revoked", { title: "Updated" });
      await loadSessions();
    } catch {
      showToast("error", "Failed to revoke session", {
        title: "Action Failed",
      });
    } finally {
      setRevokingSessionId("");
    }
  };

  const getDeviceNameFromUserAgent = (userAgent) => {
    const ua = String(userAgent || "").toLowerCase();
    if (!ua) return "Unknown Device";

    if (ua.includes("android")) return "Android Device";
    if (ua.includes("iphone")) return "iPhone";
    if (ua.includes("ipad")) return "iPad";
    if (ua.includes("windows")) return "Windows Device";
    if (ua.includes("mac os") || ua.includes("macintosh")) return "Mac Device";
    if (ua.includes("linux")) return "Linux Device";
    return "Web Browser";
  };

  const topActiveSessions = useMemo(
    () =>
      (Array.isArray(sessions) ? sessions : [])
        .filter((session) => !session?.is_revoked)
        .slice(0, 3),
    [sessions],
  );

  useEffect(() => {
    loadSessions();
  }, [canViewSecurity]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showToast("error", "New password and confirm password do not match", {
        title: "Validation Error",
      });
      return;
    }

    setChangingPassword(true);
    try {
      await userAPI.changeMyPassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      await refreshCurrentUser();
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      showToast("success", "Password updated successfully", {
        title: "Password Changed",
      });
    } catch (error) {
      const errorMsg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.detail ||
        "Failed to change password";
      showToast("error", errorMsg, { title: "Update Failed" });
    } finally {
      setChangingPassword(false);
    }
  };

  const loadCompanyUsers = async () => {
    if (!canViewLeavePolicy) return;
    setLoadingCompanyUsers(true);
    try {
      const rows = await userAPI.getAll();
      const filtered = Array.isArray(rows)
        ? rows
            .filter((item) => String(item?.role || "").toLowerCase() === "user")
            .sort((a, b) =>
              String(a?.name || "").localeCompare(String(b?.name || "")),
            )
        : [];
      setCompanyUsers(filtered);
    } catch {
      setCompanyUsers([]);
      showToast("error", "Failed to load users for opening balance.", {
        title: "Load Failed",
      });
    } finally {
      setLoadingCompanyUsers(false);
    }
  };

  const openOpeningBalanceModal = async () => {
    setShowOpeningBalanceModal(true);
    if (companyUsers.length === 0) {
      await loadCompanyUsers();
    }
  };

  useEffect(() => {
    const loadSelectedUserBalances = async () => {
      if (!openingBalanceForm.user_id) {
        setSelectedUserBalances([]);
        return;
      }
      setLoadingSelectedUserBalances(true);
      try {
        const rows = await leaveAPI.getUserBalance(openingBalanceForm.user_id);
        setSelectedUserBalances(Array.isArray(rows) ? rows : []);
      } catch {
        setSelectedUserBalances([]);
      } finally {
        setLoadingSelectedUserBalances(false);
      }
    };

    loadSelectedUserBalances();
  }, [openingBalanceForm.user_id]);

  const getCurrentBucketBalance = () => {
    const row = selectedUserBalances.find(
      (item) =>
        String(item?.leave_type || "").toLowerCase() ===
        String(openingBalanceForm.leave_type || "").toLowerCase(),
    );
    return Number(row?.available_days ?? 0);
  };

  const handleOpeningBalanceSubmit = async (e) => {
    e.preventDefault();
    if (!openingBalanceForm.user_id) {
      showToast("error", "Please select a user.", { title: "User Required" });
      return;
    }

    const openingDays = Number(openingBalanceForm.opening_days);
    if (Number.isNaN(openingDays) || openingDays < 0) {
      showToast(
        "error",
        "Opening balance must be a valid non-negative number.",
        {
          title: "Invalid Balance",
        },
      );
      return;
    }

    setOpeningBalanceSubmitting(true);
    try {
      await leaveAPI.setOpeningBalance({
        user_id: openingBalanceForm.user_id,
        leave_type: openingBalanceForm.leave_type,
        opening_days: openingDays,
        mode: openingBalanceForm.mode,
        note: openingBalanceForm.note || null,
      });

      const refreshed = await leaveAPI.getUserBalance(
        openingBalanceForm.user_id,
      );
      setSelectedUserBalances(Array.isArray(refreshed) ? refreshed : []);

      showToast("success", "Opening balance updated successfully.", {
        title: "Balance Updated",
      });
    } catch (error) {
      const errorMsg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.detail ||
        "Failed to update opening balance";
      showToast("error", errorMsg, { title: "Update Failed" });
    } finally {
      setOpeningBalanceSubmitting(false);
    }
  };

  const downloadLeaveOpeningTemplate = () => {
    const blob = new Blob([leaveOpeningImportTemplate], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leave_opening_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLeaveOpeningImport = async (e) => {
    e.preventDefault();
    if (!leaveImportFile) return;

    setLeaveImportLoading(true);
    setLeaveImportResults(null);
    try {
      const formData = new FormData();
      formData.append("file", leaveImportFile);
      const response = await leaveAPI.importLeaveOpeningBalances(formData);
      const rows = response?.results || [];
      setLeaveImportResults(rows);

      const successCount = rows.filter(
        (row) => row.status === "success",
      ).length;
      const errorCount = rows.length - successCount;
      showToast(
        "success",
        `Opening balance import finished. ${successCount} success, ${errorCount} failed.`,
        { title: "Import Complete" },
      );
    } catch (error) {
      const errorMsg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.detail ||
        "Failed to import opening balances";
      setLeaveImportResults([
        { row: "-", status: "error", error: String(errorMsg) },
      ]);
      showToast("error", errorMsg, { title: "Import Failed" });
    } finally {
      setLeaveImportLoading(false);
    }
  };

  const handleCompanyEmailFieldChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEmailProviderForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSaveCompanyEmailProvider = async () => {
    const payload = {
      mode: emailProviderForm.mode,
      provider: "resend",
      resend_api_key: emailProviderForm.resend_api_key.trim() || null,
      from_email: emailProviderForm.from_email.trim() || null,
      from_name: emailProviderForm.from_name.trim() || null,
      reply_to_email: emailProviderForm.reply_to_email.trim() || null,
      is_active: Boolean(emailProviderForm.is_active),
    };

    setEmailProviderSaving(true);
    try {
      const updated = await companyAPI.updateMyEmailProvider(payload);
      setEmailProviderForm((prev) => ({
        ...prev,
        mode: updated?.mode || prev.mode,
        from_email: updated?.from_email || "",
        from_name: updated?.from_name || "",
        reply_to_email: updated?.reply_to_email || "",
        is_active: Boolean(updated?.is_active ?? true),
        has_api_key: Boolean(updated?.has_api_key),
        resend_api_key: "",
      }));
      showToast("success", "Company email provider settings saved", {
        title: "Email Provider Updated",
      });
    } catch (error) {
      const errorMsg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.detail ||
        "Failed to save company email provider settings";
      showToast("error", errorMsg, { title: "Save Failed" });
    } finally {
      setEmailProviderSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-500 mt-1">
          Customize your experience and manage system preferences.
        </p>
      </div>

      {mustResetPassword && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 text-sm">
          First login security policy: change your password before continuing to
          other pages.
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {canViewProfile && (
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Sliders size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Profile
                </h2>
                <p className="text-sm text-slate-500">
                  Basic account information.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-600">Name</label>
                <p className="text-sm font-medium text-slate-800">
                  {user?.name || "-"}
                </p>
              </div>
              <div>
                <label className="text-sm text-slate-600">Position</label>
                <p className="text-sm font-medium text-slate-800">
                  {user?.position || "-"}
                </p>
              </div>
              <div>
                <label className="text-sm text-slate-600">Email</label>
                <p className="text-sm font-medium text-slate-800">
                  {user?.email || "-"}
                </p>
              </div>
              <div>
                <label className="text-sm text-slate-600">Department</label>
                <p className="text-sm font-medium text-slate-800">
                  {user?.department || "-"}
                </p>
              </div>
            </div>
          </section>
        )}

        {canViewNotifications && (
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Bell size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Notifications
                </h2>
                <p className="text-sm text-slate-500">
                  Control alerts and reminders.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                "email",
                "sms",
                "inApp",
                "profile",
                "leave",
                "payroll",
                "digestEnabled",
              ].map((key) => (
                <label
                  key={key}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3"
                >
                  <span className="text-sm text-slate-700">{key}</span>
                  <input
                    type="checkbox"
                    checked={notifications[key]}
                    onChange={() => handleToggle(key)}
                    disabled={settingsLoading || settingsSaving}
                    className="h-4 w-4"
                  />
                </label>
              ))}
              <label className="block rounded-xl border border-slate-200 px-4 py-3">
                <span className="text-sm text-slate-700">
                  Digest hour (0-23)
                </span>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={notifications.digestHour}
                  onChange={(e) =>
                    setNotifications((prev) => ({
                      ...prev,
                      digestHour: Number(e.target.value || 18),
                    }))
                  }
                  disabled={settingsLoading || settingsSaving}
                  className="mt-2 w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={handleSaveUserSettings}
              disabled={settingsLoading || settingsSaving}
              className="px-4 py-2 rounded-xl border border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {settingsSaving ? "Saving..." : "Save Notifications"}
            </button>
          </section>
        )}

        {canViewPreferences && (
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <Palette size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Preferences
                </h2>
                <p className="text-sm text-slate-500">
                  Theme, language, timezone.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-600">Theme</label>
                <select
                  name="theme"
                  value={preferences.theme}
                  onChange={handlePrefChange}
                  disabled={settingsLoading || settingsSaving}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-600">Language</label>
                <select
                  name="language"
                  value={preferences.language}
                  onChange={handlePrefChange}
                  disabled={settingsLoading || settingsSaving}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200"
                >
                  <option value="English">English</option>
                  <option value="Nepali">Nepali</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-600">Timezone</label>
                <select
                  name="timezone"
                  value={preferences.timezone}
                  onChange={handlePrefChange}
                  disabled={settingsLoading || settingsSaving}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200"
                >
                  <option value="Asia/Kathmandu">Asia/Kathmandu</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-600">Date format</label>
                <select
                  name="dateFormat"
                  value={preferences.dateFormat}
                  onChange={handlePrefChange}
                  disabled={settingsLoading || settingsSaving}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200"
                >
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                </select>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSaveUserSettings}
              disabled={settingsLoading || settingsSaving}
              className="px-4 py-2 rounded-xl border border-purple-600 bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60"
            >
              {settingsSaving ? "Saving..." : "Save Preferences"}
            </button>
          </section>
        )}

        {canViewSecurity && (
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <Shield size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Security
                </h2>
                <p className="text-sm text-slate-500">Password and sessions.</p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <form
                noValidate
                onSubmit={handlePasswordChange}
                className="space-y-3"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Current Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={passwordForm.current_password}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        current_password: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 rounded-xl border border-slate-200"
                    placeholder="Current password"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={passwordForm.new_password}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        new_password: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 rounded-xl border border-slate-200"
                    placeholder="New password (min 8 characters)"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Confirm New Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirm_password}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        confirm_password: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 rounded-xl border border-slate-200"
                    placeholder="Confirm new password"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="px-4 py-2 rounded-xl border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {changingPassword ? "Updating..." : "Change password"}
                </button>
              </form>
              <button
                type="button"
                onClick={handleLogoutAllDevices}
                disabled={loggingOutAll}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                {loggingOutAll ? "Logging out..." : "Logout from all devices"}
              </button>
            </div>
          </section>
        )}

        {canViewSecurity && (
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Active Sessions
                </h2>
                <p className="text-sm text-slate-500">
                  Showing up to 3 active devices.
                </p>
              </div>
              <button
                type="button"
                onClick={loadSessions}
                className="text-xs px-3 py-2 rounded border border-slate-200 hover:bg-slate-50"
              >
                Refresh
              </button>
            </div>

            {loadingSessions ? (
              <p className="text-sm text-slate-500">Loading sessions...</p>
            ) : topActiveSessions.length === 0 ? (
              <p className="text-sm text-slate-500">
                No active sessions found.
              </p>
            ) : (
              <div className="space-y-3">
                {topActiveSessions.map((session) => (
                  <div
                    key={session.id}
                    className="rounded-xl border border-slate-200 p-3"
                  >
                    <p className="text-sm font-medium text-slate-800">
                      {getDeviceNameFromUserAgent(session.user_agent)}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      IP: {session.ip_address || "-"}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleRevokeSession(session.id)}
                      disabled={revokingSessionId === session.id}
                      className="mt-2 px-2 py-1 rounded border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-60 text-xs"
                    >
                      {revokingSessionId === session.id
                        ? "Revoking..."
                        : "Revoke"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {showAdminSection && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-slate-800">
            Admin Settings
          </h2>
          <div className="grid grid-cols-1 gap-6">
            {canViewLeavePolicy && <LeavePolicySettings />}
            {canViewAttendanceRules && <AttendanceRulesSettings />}

            {canViewLeavePolicy && (
              <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">
                        Opening Leave Balance
                      </h3>
                      <p className="text-sm text-slate-500">
                        Set initial leave balance for individual users.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={openOpeningBalanceModal}
                    className="px-4 py-2 rounded-xl border border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    Set Opening Balance
                  </button>
                </div>

                <form
                  onSubmit={handleLeaveOpeningImport}
                  className="pt-2 border-t border-slate-100 space-y-3"
                >
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
                    <div className="flex-1">
                      <label className="text-sm font-medium text-slate-700">
                        Bulk Import Opening Balances (CSV)
                      </label>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => {
                          setLeaveImportFile(e.target.files?.[0] || null);
                          setLeaveImportResults(null);
                        }}
                        className="mt-1 block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-indigo-700 hover:file:bg-indigo-100"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={downloadLeaveOpeningTemplate}
                        className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-sm inline-flex items-center gap-2"
                      >
                        <Download size={16} /> Template
                      </button>
                      <button
                        type="submit"
                        disabled={!leaveImportFile || leaveImportLoading}
                        className="px-3 py-2 rounded-xl border border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 text-sm inline-flex items-center gap-2"
                      >
                        <Upload size={16} />
                        {leaveImportLoading
                          ? "Importing..."
                          : "Import Opening Balances"}
                      </button>
                    </div>
                  </div>

                  {Array.isArray(leaveImportResults) &&
                    leaveImportResults.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border border-slate-200">
                          <thead>
                            <tr className="bg-slate-50">
                              <th className="border px-2 py-1 text-left">
                                Row
                              </th>
                              <th className="border px-2 py-1 text-left">
                                Status
                              </th>
                              <th className="border px-2 py-1 text-left">
                                User
                              </th>
                              <th className="border px-2 py-1 text-left">
                                Leave Type
                              </th>
                              <th className="border px-2 py-1 text-left">
                                Available/Error
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {leaveImportResults.map((row, index) => (
                              <tr key={index}>
                                <td className="border px-2 py-1">{row.row}</td>
                                <td
                                  className={`border px-2 py-1 ${
                                    row.status === "success"
                                      ? "text-emerald-700"
                                      : "text-red-700"
                                  }`}
                                >
                                  {row.status}
                                </td>
                                <td className="border px-2 py-1">
                                  {row.user_id || "-"}
                                </td>
                                <td className="border px-2 py-1">
                                  {row.leave_type || "-"}
                                </td>
                                <td className="border px-2 py-1">
                                  {row.available_days ?? row.error ?? "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                </form>
              </section>
            )}

            {canViewRolesPermissions && (
              <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <Briefcase size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">
                      Roles & Permissions
                    </h3>
                    <p className="text-sm text-slate-500">
                      Manage access rules.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-600">
                      Default Role
                    </label>
                    <select className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200">
                      <option>user</option>
                      <option>admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">
                      Approvals Required
                    </label>
                    <select className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200">
                      <option>Yes</option>
                      <option>No</option>
                    </select>
                  </div>
                </div>
              </section>
            )}

            {canViewDeviceIntegration && (
              <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center">
                    <Fingerprint size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">
                      Device & Integration
                    </h3>
                    <p className="text-sm text-slate-500">
                      Attendance device sync options.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-600">
                      Sync Interval (min)
                    </label>
                    <input
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200"
                      placeholder="30"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">API Key</label>
                    <input
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </section>
            )}

            {canManageCompanyEmailProvider && (
              <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">
                      Company Email Provider
                    </h3>
                    <p className="text-sm text-slate-500">
                      Configure your company-specific Resend domain and API key.
                    </p>
                  </div>
                </div>

                {emailProviderLoading ? (
                  <p className="text-sm text-slate-500">
                    Loading provider settings...
                  </p>
                ) : (
                  <>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                      Select Platform API to use platform email sender, or
                      Company API & Domain to use your company Resend key and
                      verified domain.
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-slate-600">Mode</label>
                        <select
                          name="mode"
                          value={emailProviderForm.mode}
                          onChange={handleCompanyEmailFieldChange}
                          disabled={emailProviderSaving}
                          className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200"
                        >
                          <option value="platform">
                            Platform API (Default Sender)
                          </option>
                          <option value="tenant">
                            Company API & Domain (Tenant Sender)
                          </option>
                        </select>
                        <p className="mt-1 text-xs text-slate-500">
                          {emailProviderForm.mode === "platform"
                            ? "Company API fields below are disabled in Platform API mode."
                            : "Configure your company Resend API key and sender details below."}
                        </p>
                      </div>

                      <div>
                        <label className="text-sm text-slate-600">
                          Provider
                        </label>
                        <input
                          value="Resend"
                          disabled
                          className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-sm text-slate-600">
                          Resend API Key
                        </label>
                        <div className="mt-1 flex gap-2">
                          <input
                            name="resend_api_key"
                            type={showEmailApiKey ? "text" : "password"}
                            value={emailProviderForm.resend_api_key}
                            onChange={handleCompanyEmailFieldChange}
                            disabled={
                              emailProviderSaving ||
                              emailProviderForm.mode !== "tenant"
                            }
                            placeholder={
                              emailProviderForm.has_api_key
                                ? "Leave blank to keep existing key"
                                : "re_..."
                            }
                            className="w-full px-3 py-2 rounded-xl border border-slate-200"
                          />
                          <button
                            type="button"
                            onClick={() => setShowEmailApiKey((prev) => !prev)}
                            className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
                          >
                            {showEmailApiKey ? "Hide" : "Show"}
                          </button>
                        </div>
                        {emailProviderForm.has_api_key && (
                          <p className="mt-1 text-xs text-emerald-700">
                            API key is already configured.
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm text-slate-600">
                          From Email
                        </label>
                        <input
                          name="from_email"
                          type="email"
                          value={emailProviderForm.from_email}
                          onChange={handleCompanyEmailFieldChange}
                          disabled={
                            emailProviderSaving ||
                            emailProviderForm.mode !== "tenant"
                          }
                          placeholder="noreply@company.com"
                          className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200"
                        />
                      </div>

                      <div>
                        <label className="text-sm text-slate-600">
                          From Name
                        </label>
                        <input
                          name="from_name"
                          value={emailProviderForm.from_name}
                          onChange={handleCompanyEmailFieldChange}
                          disabled={
                            emailProviderSaving ||
                            emailProviderForm.mode !== "tenant"
                          }
                          placeholder="Company HR"
                          className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200"
                        />
                      </div>

                      <div>
                        <label className="text-sm text-slate-600">
                          Reply-To Email
                        </label>
                        <input
                          name="reply_to_email"
                          type="email"
                          value={emailProviderForm.reply_to_email}
                          onChange={handleCompanyEmailFieldChange}
                          disabled={
                            emailProviderSaving ||
                            emailProviderForm.mode !== "tenant"
                          }
                          placeholder="support@company.com"
                          className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200"
                        />
                      </div>

                      <div className="flex items-end">
                        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            name="is_active"
                            checked={Boolean(emailProviderForm.is_active)}
                            onChange={handleCompanyEmailFieldChange}
                            disabled={emailProviderSaving}
                          />
                          Provider Active
                        </label>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveCompanyEmailProvider}
                      disabled={emailProviderSaving}
                      className="px-4 py-2 rounded-xl border border-cyan-600 bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-60"
                    >
                      {emailProviderSaving
                        ? "Saving..."
                        : "Save Email Provider"}
                    </button>
                  </>
                )}
              </section>
            )}
          </div>
        </div>
      )}

      {showOpeningBalanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-800">
                Opening Leave Balance
              </h3>
              <button
                type="button"
                onClick={() => setShowOpeningBalanceModal(false)}
                className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <form
              onSubmit={handleOpeningBalanceSubmit}
              className="space-y-4 px-6 py-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-600">Employee</label>
                  <select
                    value={openingBalanceForm.user_id}
                    onChange={(e) =>
                      setOpeningBalanceForm((prev) => ({
                        ...prev,
                        user_id: e.target.value,
                      }))
                    }
                    disabled={loadingCompanyUsers || openingBalanceSubmitting}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200"
                  >
                    <option value="">Select employee</option>
                    {companyUsers.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-slate-600">Leave Bucket</label>
                  <select
                    value={openingBalanceForm.leave_type}
                    onChange={(e) =>
                      setOpeningBalanceForm((prev) => ({
                        ...prev,
                        leave_type: e.target.value,
                      }))
                    }
                    disabled={openingBalanceSubmitting}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200"
                  >
                    <option value="home">Home</option>
                    <option value="sick">Sick</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-slate-600">Mode</label>
                  <select
                    value={openingBalanceForm.mode}
                    onChange={(e) =>
                      setOpeningBalanceForm((prev) => ({
                        ...prev,
                        mode: e.target.value,
                      }))
                    }
                    disabled={openingBalanceSubmitting}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200"
                  >
                    <option value="set">Set exact balance</option>
                    <option value="add">Add to current balance</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-slate-600">Opening Days</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={openingBalanceForm.opening_days}
                    onChange={(e) =>
                      setOpeningBalanceForm((prev) => ({
                        ...prev,
                        opening_days: e.target.value,
                      }))
                    }
                    disabled={openingBalanceSubmitting}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-600">
                  Note (optional)
                </label>
                <textarea
                  rows={2}
                  value={openingBalanceForm.note}
                  onChange={(e) =>
                    setOpeningBalanceForm((prev) => ({
                      ...prev,
                      note: e.target.value,
                    }))
                  }
                  disabled={openingBalanceSubmitting}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 resize-none"
                  placeholder="Migration opening balance as of go-live"
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {loadingSelectedUserBalances ? (
                  <p>Loading current balance...</p>
                ) : openingBalanceForm.user_id ? (
                  <p>
                    Current {openingBalanceForm.leave_type} balance:{" "}
                    {getCurrentBucketBalance().toFixed(1)} day(s)
                  </p>
                ) : (
                  <p>Select a user to view current balance.</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowOpeningBalanceModal(false)}
                  disabled={openingBalanceSubmitting}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={openingBalanceSubmitting}
                  className="px-4 py-2 rounded-xl border border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {openingBalanceSubmitting ? "Saving..." : "Save Balance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
