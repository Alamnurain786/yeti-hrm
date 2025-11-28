import {
  Home,
  Users,
  Calendar,
  DollarSign,
  Settings,
  LogOut,
  UserPlus,
  Send,
  CheckSquare,
  Building2,
  Briefcase,
  ClipboardCheck,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getMenuItems = () => {
    const common = [
      { icon: Home, label: "Dashboard", path: "/" },
      { icon: Settings, label: "Profile", path: "/profile" },
    ];

    if (!user) return [];

    if (user.role === "superadmin") {
      return [
        ...common,
        { icon: UserPlus, label: "Create HR", path: "/superadmin/create-hr" },
        {
          icon: Settings,
          label: "Dashboard Config",
          path: "/superadmin/dashboard-config",
        },
        { icon: DollarSign, label: "Payroll", path: "/payroll" },
        { icon: CheckSquare, label: "Approvals", path: "/leave-approvals" },
      ];
    }

    if (user.role === "hr") {
      return [
        ...common,
        { icon: Users, label: "Employees", path: "/employees" },
        { icon: Building2, label: "Departments", path: "/departments" },
        { icon: Briefcase, label: "Roles", path: "/roles" },
        { icon: Calendar, label: "Attendance", path: "/attendance" },
        { icon: CheckSquare, label: "Approvals", path: "/leave-approvals" },
        { icon: DollarSign, label: "Payroll", path: "/payroll" },
      ];
    }

    // Employee
    return [
      ...common,
      {
        icon: ClipboardCheck,
        label: "Attendance Management",
        path: "/attendance-management",
      },
      { icon: Calendar, label: "Leave Management", path: "/leave-management" },
      { icon: Send, label: "Request Leave", path: "/leave-request" },
    ];
  };

  const menuItems = getMenuItems();

  return (
    <div className="h-screen w-64 bg-slate-900 text-white flex flex-col fixed left-0 top-0 shadow-xl z-50">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
          HRM Corp
        </h1>
        <p className="text-xs text-slate-500 mt-1 capitalize">
          {user?.role || "Guest"}
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
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
    </div>
  );
};

export default Sidebar;
