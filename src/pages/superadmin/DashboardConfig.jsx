import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { LayoutGrid, Save } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import {
  companyAPI,
  getApiErrorMessage,
  widgetPermissionAPI,
} from "../../services/backendApi";

const rolesToConfigure = ["admin", "user"];

const widgetMeta = {
  "settings.profile": "Settings: Profile",
  "settings.notifications": "Settings: Notifications",
  "settings.preferences": "Settings: Preferences",
  "settings.security": "Settings: Security",
  "settings.organization": "Settings: Organization",
  "settings.leave_policy": "Settings: Leave Policy",
  "settings.attendance_rules": "Settings: Attendance Rules",
  "settings.roles_permissions": "Settings: Roles & Permissions",
  "settings.device_integration": "Settings: Device & Integration",
  "dashboard.admin.stats": "Admin: Attendance Stat Cards",
  "dashboard.admin.employees_on_leave": "Admin: Employees On Leave",
  "dashboard.user.attendance_summary": "User: Attendance Summary Cards",
  "dashboard.user.today_attendance": "User: Today Attendance Widget",
  "dashboard.user.attendance_calendar": "User: Attendance Calendar",
  "dashboard.user.colleagues_on_leave": "User: Colleagues On Leave",
  "dashboard.user.leave_balance": "User: Leave Balance Card",
  "dashboard.company_leave_calendar": "All: Upcoming Company Leave Calendar",
  "dashboard.card.totalEmployees": "Card: Total Employees",
  "dashboard.card.newHires": "Card: New Hires",
  "dashboard.card.attendanceRate": "Card: Attendance Rate",
};

const roleWidgetRecommendations = {
  admin: [
    "settings.profile",
    "settings.notifications",
    "settings.preferences",
    "settings.security",
    "settings.organization",
    "settings.leave_policy",
    "settings.attendance_rules",
    "settings.roles_permissions",
    "settings.device_integration",
    "dashboard.admin.stats",
    "dashboard.admin.employees_on_leave",
    "dashboard.company_leave_calendar",
    "dashboard.card.totalEmployees",
    "dashboard.card.newHires",
    "dashboard.card.attendanceRate",
  ],
  user: [
    "settings.profile",
    "settings.notifications",
    "settings.preferences",
    "settings.security",
    "dashboard.user.attendance_summary",
    "dashboard.user.today_attendance",
    "dashboard.user.attendance_calendar",
    "dashboard.user.colleagues_on_leave",
    "dashboard.user.leave_balance",
    "dashboard.company_leave_calendar",
  ],
};

const DashboardConfig = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [localConfig, setLocalConfig] = useState({
    superadmin: [],
    admin: [],
    user: [],
  });
  const [availableWidgets, setAvailableWidgets] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState("global");

  const canManageDashboardConfig = useMemo(() => {
    const permissions = Array.isArray(user?.permissions)
      ? user.permissions
      : [];
    return permissions.includes("dashboard.config.manage");
  }, [user?.permissions]);

  useEffect(() => {
    if (!canManageDashboardConfig) {
      setLoading(false);
      return;
    }

    const loadCompanies = async () => {
      try {
        const rows = await companyAPI.getAll();
        setCompanies(Array.isArray(rows) ? rows : []);
      } catch {
        setCompanies([]);
      }
    };

    loadCompanies();
  }, [canManageDashboardConfig]);

  useEffect(() => {
    if (!canManageDashboardConfig) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const tenantIdParam =
          selectedTenantId === "global" ? null : selectedTenantId;
        const matrix = await widgetPermissionAPI.getMatrix(tenantIdParam);
        setLocalConfig({
          superadmin: Array.isArray(matrix?.roles?.superadmin)
            ? matrix.roles.superadmin
            : [],
          admin: Array.isArray(matrix?.roles?.admin) ? matrix.roles.admin : [],
          user: Array.isArray(matrix?.roles?.user) ? matrix.roles.user : [],
        });
        const dashboardWidgets = Array.isArray(matrix?.available_widgets)
          ? matrix.available_widgets.filter(
              (item) =>
                Boolean(item) &&
                String(item || "") !== "dashboard.config.manage",
            )
          : [];
        setAvailableWidgets(dashboardWidgets);
      } catch (error) {
        showToast(
          "error",
          getApiErrorMessage(error, "Failed to load dashboard permissions"),
          { title: "Load Failed" },
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [canManageDashboardConfig, showToast, selectedTenantId]);

  const orderedWidgets = useMemo(() => {
    const recommended = [
      ...roleWidgetRecommendations.admin,
      ...roleWidgetRecommendations.user,
    ];
    const merged = [...recommended, ...availableWidgets];
    const unique = Array.from(new Set(merged)).filter(
      (item) =>
        availableWidgets.includes(item) &&
        !item.startsWith("dashboard.superadmin."),
    );

    return unique.sort((a, b) => {
      const aIsSettings = a.startsWith("settings.");
      const bIsSettings = b.startsWith("settings.");
      if (aIsSettings && !bIsSettings) return -1;
      if (!aIsSettings && bIsSettings) return 1;
      const aLabel = widgetMeta[a] || a;
      const bLabel = widgetMeta[b] || b;
      return aLabel.localeCompare(bLabel);
    });
  }, [availableWidgets]);

  if (!canManageDashboardConfig) {
    return (
      <div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-100">
        <p className="text-slate-600">
          You do not have permission to configure dashboard widgets.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-600">
        Loading dashboard widget permissions...
      </div>
    );
  }

  const toggleWidget = (role, widgetKey) => {
    const current = localConfig[role] || [];
    const exists = current.includes(widgetKey);
    const updated = exists
      ? current.filter((c) => c !== widgetKey)
      : [...current, widgetKey];
    setLocalConfig({ ...localConfig, [role]: updated });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const tenantIdParam =
        selectedTenantId === "global" ? null : selectedTenantId;

      const rolesPayload = {
        admin: Array.isArray(localConfig.admin) ? localConfig.admin : [],
        user: Array.isArray(localConfig.user) ? localConfig.user : [],
      };

      await widgetPermissionAPI.updateMatrix(
        { roles: rolesPayload },
        tenantIdParam,
      );
      showToast("success", "Widget access configuration saved.", {
        title: "Saved",
      });
    } catch (error) {
      showToast(
        "error",
        getApiErrorMessage(error, "Failed to save dashboard permissions"),
        { title: "Save Failed" },
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 flex items-center">
          <LayoutGrid className="mr-2 text-blue-600" /> Widget Access
          Configuration
        </h1>
        <p className="text-slate-500 mt-1">
          Assign settings and dashboard widgets for admin and user roles. Pick
          Global Default or a specific company override.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Permission Scope
        </label>
        <select
          value={selectedTenantId}
          onChange={(e) => setSelectedTenantId(e.target.value)}
          className="w-full md:w-[420px] px-3 py-2 rounded-xl border border-slate-200"
        >
          <option value="global">Global Default (all companies)</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name} ({company.code || company.id})
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
          <p className="text-sm text-slate-600">
            Toggle each widget in one line for{" "}
            <span className="font-semibold">Admin</span> and{" "}
            <span className="font-semibold">User</span>.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left">Widget</th>
                <th className="px-4 py-3 text-left">Category</th>
                {rolesToConfigure.map((role) => (
                  <th key={role} className="px-4 py-3 text-center capitalize">
                    {role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orderedWidgets.map((widgetKey) => {
                const isSetting = widgetKey.startsWith("settings.");
                const category = isSetting ? "Settings" : "Dashboard";
                return (
                  <tr key={widgetKey} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-slate-800 font-medium">
                      {widgetMeta[widgetKey] || widgetKey}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{category}</td>
                    {rolesToConfigure.map((role) => {
                      const active = (localConfig[role] || []).includes(
                        widgetKey,
                      );
                      return (
                        <td
                          key={`${widgetKey}-${role}`}
                          className="px-4 py-3 text-center"
                        >
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => toggleWidget(role, widgetKey)}
                            className="h-4 w-4"
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center transition-colors shadow-lg shadow-blue-600/30 font-semibold"
        >
          <Save size={20} className="mr-2" />
          {saving ? "Saving..." : "Save Configuration"}
        </button>
      </div>
    </div>
  );
};

export default DashboardConfig;
