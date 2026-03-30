import {
  Home,
  Users,
  User as UserIcon,
  Calendar,
  Settings,
  LogOut,
  Send,
  CheckSquare,
  Bell,
  Building2,
  Network,
  BadgeCheck,
  BarChart3,
  ClipboardCheck,
  Server,
  Sliders,
  X,
  Mail,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePlatformSettings } from "../context/PlatformSettingsContext";

const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { settings } = usePlatformSettings();

  const userPermissions = Array.isArray(user?.permissions)
    ? user.permissions.filter((item) => typeof item === "string")
    : [];
  const canManageWidgetConfig = userPermissions.includes(
    "dashboard.config.manage",
  );
  const isManagerRole =
    user?.role === "user" &&
    (Boolean(user?.is_section_manager) ||
      /manager/i.test(String(user?.position || "")));

  const handleLogout = () => {
    logout();
    onClose();
    navigate("/login");
  };

  const getMenuItems = () => {
    if (!user) return [];

    // Superadmin - restricted access
    if (user.role === "superadmin") {
      return [
        { icon: Home, label: "Dashboard", path: "/" },
        { icon: BarChart3, label: "Reports", path: "/reports" },
        { icon: Bell, label: "Notifications", path: "/notifications" },
        {
          icon: Send,
          label: "Company Alerts",
          path: "/superadmin/alerts",
        },
        {
          icon: Mail,
          label: "Email Templates",
          path: "/superadmin/email-templates",
        },
        settings.enable_superadmin_companies
          ? {
              icon: Building2,
              label: "Companies",
              path: "/superadmin/companies",
            }
          : null,
        settings.enable_superadmin_dashboard_config && canManageWidgetConfig
          ? {
              icon: Sliders,
              label: "Widget Configuration",
              path: "/superadmin/dashboard-config",
            }
          : null,
        {
          icon: Settings,
          label: "Superadmin Settings",
          path: "/superadmin/settings",
        },
      ].filter(Boolean);
    }

    // Admin (HR) - full HR operations
    if (user.role === "admin") {
      return [
        { icon: Home, label: "Dashboard", path: "/" },
        { icon: Users, label: "Employees", path: "/employees" },
        { icon: UserIcon, label: "Profile", path: "/profile" },
        { icon: Calendar, label: "Attendance", path: "/attendance" },
        { icon: BarChart3, label: "Reports", path: "/reports" },
        {
          icon: CheckSquare,
          label: "Leave Approvals",
          path: "/leave-approvals",
        },
        { icon: Bell, label: "Notifications", path: "/notifications" },
        { icon: Building2, label: "Departments", path: "/departments" },
        { icon: Network, label: "Sections", path: "/sections" },
        { icon: BadgeCheck, label: "Designations", path: "/designations" },
        { icon: Server, label: "Devices", path: "/superadmin/devices" },
        {
          icon: Building2,
          label: "Company Settings",
          path: "/company/settings",
        },
        { icon: Settings, label: "Settings", path: "/settings" },
      ];
    }

    // User (normal employee)
    return [
      { icon: Home, label: "Dashboard", path: "/" },
      { icon: UserIcon, label: "Profile", path: "/profile" },
      {
        icon: ClipboardCheck,
        label: "Attendance Management",
        path: "/attendance-management",
      },
      { icon: Calendar, label: "Leave Management", path: "/leave-management" },
      { icon: Send, label: "Request Leave", path: "/leave-request" },
      isManagerRole
        ? {
            icon: CheckSquare,
            label: "Leave Approvals",
            path: "/leave-approvals",
          }
        : null,
      { icon: Bell, label: "Notifications", path: "/notifications" },
      { icon: Settings, label: "Settings", path: "/settings" },
    ].filter(Boolean);
  };

  const menuItems = getMenuItems();

  return (
    <>
      {isOpen && (
        <button
          type="button"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          aria-label="Close sidebar overlay"
        />
      )}

      <aside
        className={`sidebar h-screen w-64 bg-slate-900 text-white flex flex-col fixed left-0 top-0 shadow-xl z-50 transform transition-transform duration-300 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                {settings.platform_name || "HRM Platform"}
              </h1>
              <p className="text-xs text-slate-500 mt-1 capitalize">
                {user?.role || "Guest"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "bg-blue-600 shadow-lg shadow-blue-600/30"
                    : "hover:bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Icon
                  size={20}
                  className={`${
                    isActive
                      ? "text-white"
                      : "text-slate-400 group-hover:text-white"
                  }`}
                />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 w-full rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
