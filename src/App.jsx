import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Departments from "./pages/Departments";
import Sections from "./pages/Sections";
import Roles from "./pages/Roles";
import Attendance from "./pages/Attendance";
import AttendanceManagement from "./pages/AttendanceManagement";
import Reports from "./pages/Reports";
import Login from "./pages/Login";
import Companies from "./pages/superadmin/Companies";
import AlertMessage from "./pages/superadmin/AlertMessage";
import EmailTemplates from "./pages/superadmin/EmailTemplates";
import DashboardConfig from "./pages/superadmin/DashboardConfig";
import Devices from "./pages/superadmin/Devices";
import SuperadminSettings from "./pages/superadmin/SuperadminSettings";
import LeaveRequest from "./pages/LeaveRequest";
import LeaveApprovals from "./pages/LeaveApprovals";
import LeaveManagement from "./pages/LeaveManagement";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import CompanySettings from "./pages/CompanySettings";
import Notifications from "./pages/Notifications";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import { usePlatformSettings } from "./context/PlatformSettingsContext";
import LoadingSpinner from "./components/LoadingSpinner";

function App() {
  const { loading, user } = useAuth();
  const { settings, loading: settingsLoading } = usePlatformSettings();

  if (loading || (user && settingsLoading)) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/employees"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <MainLayout>
                <Employees />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/departments"
          element={
            <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
              <MainLayout>
                <Departments />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/sections"
          element={
            <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
              <MainLayout>
                <Sections />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/designations"
          element={
            <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
              <MainLayout>
                <Roles />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/roles"
          element={<Navigate to="/designations" replace />}
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={["admin", "user"]}>
              <MainLayout>
                <Profile />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Settings />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Notifications />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/attendance"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <MainLayout>
                <Attendance />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
              <MainLayout>
                <Reports />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route path="/payroll" element={<Navigate to="/" replace />} />

        <Route
          path="/superadmin/companies"
          element={
            <ProtectedRoute
              allowedRoles={["superadmin"]}
              featureEnabled={settings.enable_superadmin_companies}
            >
              <MainLayout>
                <Companies />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route path="/superadmin/users" element={<Navigate to="/" replace />} />
        <Route
          path="/superadmin/alerts"
          element={
            <ProtectedRoute allowedRoles={["superadmin"]}>
              <MainLayout>
                <AlertMessage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/email-templates"
          element={
            <ProtectedRoute allowedRoles={["superadmin"]}>
              <MainLayout>
                <EmailTemplates />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/create-hr"
          element={<Navigate to="/" replace />}
        />

        <Route
          path="/superadmin/dashboard-config"
          element={
            <ProtectedRoute
              allowedRoles={["superadmin"]}
              featureEnabled={settings.enable_superadmin_dashboard_config}
            >
              <MainLayout>
                <DashboardConfig />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/superadmin/devices"
          element={
            <ProtectedRoute
              allowedRoles={["admin"]}
              featureEnabled={settings.enable_superadmin_devices}
            >
              <MainLayout>
                <Devices />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/superadmin/settings"
          element={
            <ProtectedRoute allowedRoles={["superadmin"]}>
              <MainLayout>
                <SuperadminSettings />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/company/settings"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <MainLayout>
                <CompanySettings />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/leave-request"
          element={
            <ProtectedRoute>
              <MainLayout>
                <LeaveRequest />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/leave-management"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <MainLayout>
                <LeaveManagement />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/leave-approvals"
          element={
            <ProtectedRoute allowedRoles={["admin", "superadmin", "user"]}>
              <MainLayout>
                <LeaveApprovals />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance-management"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <MainLayout>
                <AttendanceManagement />
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}
export default App;
