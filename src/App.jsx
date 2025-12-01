import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Departments from "./pages/Departments";
import Roles from "./pages/Roles";
import Attendance from "./pages/Attendance";
import AttendanceManagement from "./pages/AttendanceManagement";
import Payroll from "./pages/Payroll";
import Login from "./pages/Login";
import CreateHR from "./pages/superadmin/CreateHR";
import DashboardConfig from "./pages/superadmin/DashboardConfig";
import LeaveRequest from "./pages/LeaveRequest";
import LeaveApprovals from "./pages/LeaveApprovals";
import LeaveManagement from "./pages/LeaveManagement";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import LoadingSpinner from "./components/LoadingSpinner";

function App() {
  const { loading } = useAuth();

  if (loading) {
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
            <ProtectedRoute>
              <MainLayout>
                <Employees />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/departments"
          element={
            <ProtectedRoute allowedRoles={["hr", "superadmin"]}>
              <MainLayout>
                <Departments />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/roles"
          element={
            <ProtectedRoute allowedRoles={["hr", "superadmin"]}>
              <MainLayout>
                <Roles />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Profile />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/attendance"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Attendance />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/payroll"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Payroll />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/superadmin/create-hr"
          element={
            <ProtectedRoute allowedRoles={["superadmin"]}>
              <MainLayout>
                <CreateHR />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/superadmin/dashboard-config"
          element={
            <ProtectedRoute allowedRoles={["superadmin"]}>
              <MainLayout>
                <DashboardConfig />
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
            <ProtectedRoute allowedRoles={["employee"]}>
              <MainLayout>
                <LeaveManagement />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/leave-approvals"
          element={
            <ProtectedRoute allowedRoles={["hr", "superadmin"]}>
              <MainLayout>
                <LeaveApprovals />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance-management"
          element={
            <ProtectedRoute allowedRoles={["employee"]}>
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
