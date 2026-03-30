import { useEffect, useState, useMemo } from "react";
import {
  Users,
  UserPlus,
  Clock,
  TrendingUp,
  UserCheck,
  UserX,
  ClockAlert,
  Calendar,
  LogIn,
  LogOut,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePlatformSettings } from "../context/PlatformSettingsContext";
import NepaliDate from "nepali-date-converter";
import NepaliDatePicker from "../components/NepaliDatePicker";
import CompanyLeaveCalendar from "../components/profile/CompanyLeaveCalendar";
import SummaryCard from "../components/SummaryCard";
import {
  attendanceAPI,
  companyAPI,
  leaveAPI,
  userAPI,
} from "../services/backendApi";

const DASHBOARD_AUTO_REFRESH_MS = 15000;

const StatCard = ({ title, value, change, icon, color }) => {
  const IconComponent = icon;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-3xl font-bold text-slate-800 mt-2">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <IconComponent size={24} className="text-white" />
        </div>
      </div>
      <div className="mt-4 flex items-center text-sm">
        <span className="text-emerald-500 font-medium flex items-center">
          <TrendingUp size={16} className="mr-1" />
          {change}
        </span>
        <span className="text-slate-400 ml-2">vs last month</span>
      </div>
    </div>
  );
};

const formatLocalDateYmd = (dateValue) => {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTodayBS = () => {
  const todayBS = new NepaliDate();
  return `${todayBS.getYear()}-${String(todayBS.getMonth() + 1).padStart(2, "0")}-${String(todayBS.getDate()).padStart(2, "0")}`;
};

const getCurrentBsMonthRange = () => {
  const nowBs = new NepaliDate();
  const year = nowBs.getYear();
  const month = nowBs.getMonth() + 1;

  const monthIndex = month - 1;
  const nextMonthIndex = monthIndex === 11 ? 0 : monthIndex + 1;
  const nextYear = monthIndex === 11 ? year + 1 : year;
  const nextMonthFirst = new NepaliDate(nextYear, nextMonthIndex, 1);
  const lastDay = new NepaliDate(
    year,
    monthIndex,
    nextMonthFirst.getDate() - 1,
  ).getDate();

  return {
    startDateBs: `${year}-${String(month).padStart(2, "0")}-01`,
    endDateBs: `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
  };
};

const Dashboard = () => {
  const { user } = useAuth();
  const { settings } = usePlatformSettings();
  const [users, setUsers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [companyUserCounts, setCompanyUserCounts] = useState([]);

  const userPermissions = Array.isArray(user?.permissions)
    ? user.permissions.filter((item) => typeof item === "string")
    : [];

  const hasPermission = (permission) => userPermissions.includes(permission);

  const today = formatLocalDateYmd(new Date());
  const todayBs = useMemo(() => getTodayBS(), []);

  useEffect(() => {
    if (!user) {
      setUsers([]);
      setLeaves([]);
      setLeaveBalances([]);
      setAttendance([]);
      setAttendanceStatus(null);
      setHolidays([]);
      setCompanies([]);
      setCompanyUserCounts([]);
      return;
    }

    const loadDashboardData = async () => {
      try {
        const { startDateBs, endDateBs } = getCurrentBsMonthRange();
        const isAdminView =
          user?.role === "admin" || user?.role === "superadmin";
        const attendanceRequest = isAdminView
          ? Promise.resolve([])
          : attendanceAPI
              .getMy({
                start_date_bs: startDateBs,
                end_date_bs: endDateBs,
                sync: false,
              })
              .catch(() => []);

        const attendanceStatusRequest = isAdminView
          ? attendanceAPI
              .getStatus({
                target_date_bs: todayBs,
                sync: false,
              })
              .catch(() => null)
          : Promise.resolve(null);

        const usersRequest = isAdminView
          ? userAPI.getAll().catch(() => [])
          : Promise.resolve(user ? [user] : []);

        const leavesRequest = isAdminView
          ? leaveAPI.getAll().catch(() => [])
          : leaveAPI.getMy().catch(() => []);

        const leaveBalanceRequest =
          user?.role === "user"
            ? leaveAPI.getMyBalance().catch(() => [])
            : Promise.resolve([]);

        const companiesRequest =
          user?.role === "superadmin"
            ? companyAPI.getAll()
            : Promise.resolve([]);

        const companyUserCountsRequest =
          user?.role === "superadmin"
            ? userAPI.getCompanyUserCounts().catch(() => [])
            : Promise.resolve([]);

        const holidayRequest = leaveAPI.getHolidays().catch(() => []);

        const [
          usersResponse,
          leavesResponse,
          attendanceResponse,
          attendanceStatusResponse,
          leaveBalanceResponse,
          companyResponse,
          companyUserCountResponse,
          holidayResponse,
        ] = await Promise.all([
          usersRequest,
          leavesRequest,
          attendanceRequest,
          attendanceStatusRequest,
          leaveBalanceRequest,
          companiesRequest,
          companyUserCountsRequest,
          holidayRequest,
        ]);
        setUsers(Array.isArray(usersResponse) ? usersResponse : []);
        setLeaves(Array.isArray(leavesResponse) ? leavesResponse : []);
        setLeaveBalances(
          Array.isArray(leaveBalanceResponse) ? leaveBalanceResponse : [],
        );
        setAttendance(
          Array.isArray(attendanceResponse) ? attendanceResponse : [],
        );
        setAttendanceStatus(
          attendanceStatusResponse &&
            typeof attendanceStatusResponse === "object"
            ? attendanceStatusResponse
            : null,
        );
        setCompanies(Array.isArray(companyResponse) ? companyResponse : []);
        setCompanyUserCounts(
          Array.isArray(companyUserCountResponse)
            ? companyUserCountResponse
            : [],
        );
        setHolidays(Array.isArray(holidayResponse) ? holidayResponse : []);
      } catch {
        setUsers([]);
        setLeaves([]);
        setLeaveBalances([]);
        setAttendance([]);
        setAttendanceStatus(null);
        setHolidays([]);
        setCompanies([]);
        setCompanyUserCounts([]);
      }
    };

    loadDashboardData();

    const intervalId = window.setInterval(() => {
      loadDashboardData();
    }, DASHBOARD_AUTO_REFRESH_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [user, todayBs]);

  const getLeaveStartDate = (leave) => leave.startDate || leave.start_date;
  const getLeaveEndDate = (leave) => leave.endDate || leave.end_date;
  const getLeaveHalfDay = (leave) => leave.halfDay ?? leave.half_day;
  const getLeaveUserId = (leave) => leave.userId || leave.user_id;
  const getLeaveUserName = (leave) => {
    if (leave.userName) return leave.userName;
    if (leave.user_name) return leave.user_name;
    const leaveUser = users.find(
      (u) => String(u.id) === String(getLeaveUserId(leave)),
    );
    return leaveUser?.name || "Employee";
  };

  // Get today's attendance for current user
  const todayAttendance = useMemo(() => {
    return attendance.find(
      (a) =>
        (a.user_id === user?.id || a.device_user_id === user?.id) &&
        a.date === today,
    );
  }, [attendance, user?.id, today]);

  // Calculate attendance statistics for employee
  const attendanceStats = useMemo(() => {
    const userAttendance = attendance.filter(
      (a) => a.user_id === user?.id || a.device_user_id === user?.id,
    );
    const approved = leaves.filter(
      (l) => getLeaveUserId(l) === user?.id && l.status === "Approved",
    );

    let fullLeaves = 0;
    let halfLeaves = 0;

    approved.forEach((leave) => {
      const start = new Date(getLeaveStartDate(leave));
      const end = new Date(getLeaveEndDate(leave));
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

      if (getLeaveHalfDay(leave)) {
        halfLeaves += days;
      } else {
        fullLeaves += days;
      }
    });

    return {
      totalPresent: userAttendance.filter((a) => a.status === "Present").length,
      totalLate: userAttendance.filter((a) => a.status === "Late").length,
      fullLeaves,
      halfLeaves,
      totalLeaves: fullLeaves + halfLeaves * 0.5,
    };
  }, [attendance, leaves, user?.id]);

  // Calculate today's stats for HR
  const todayStats = useMemo(() => {
    if (user?.role === "admin" || user?.role === "superadmin") {
      return {
        present: Number(attendanceStatus?.present || 0),
        late: Number(attendanceStatus?.late || 0),
        absent: Number(attendanceStatus?.absent || 0),
        onLeave: leaves.filter(
          (l) =>
            l.status === "Approved" &&
            new Date(getLeaveStartDate(l)) <= new Date() &&
            new Date(getLeaveEndDate(l)) >= new Date(),
        ).length,
      };
    }

    const todayRecords = attendance.filter((a) => a.date === today);
    const employeeCount = users.filter((u) => u.role === "user").length;
    const absentCount = Math.max(employeeCount - todayRecords.length, 0);
    return {
      present: todayRecords.filter((a) => a.status === "Present").length,
      late: todayRecords.filter((a) => a.status === "Late").length,
      absent: absentCount,
      onLeave: leaves.filter(
        (l) =>
          l.status === "Approved" &&
          new Date(getLeaveStartDate(l)) <= new Date() &&
          new Date(getLeaveEndDate(l)) >= new Date(),
      ).length,
    };
  }, [attendance, users, leaves, today, attendanceStatus, user?.role]);

  // Get colleagues on leave today
  const colleaguesOnLeave = useMemo(() => {
    return leaves.filter(
      (l) =>
        l.status === "Approved" &&
        new Date(getLeaveStartDate(l)) <= new Date() &&
        new Date(getLeaveEndDate(l)) >= new Date(),
    );
  }, [leaves]);

  // Selected Nepali date (for calendar component)
  const [selectedBsDate, setSelectedBsDate] = useState(() => {
    const d = new NepaliDate();
    return `${d.getYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(d.getDate()).padStart(2, "0")}`;
  });

  // Attendance for selected Nepali date (converted to AD)
  const selectedDayAttendance = useMemo(() => {
    try {
      const [y, m, d] = selectedBsDate.split("-").map(Number);
      const ad = new NepaliDate(y, m - 1, d).toJsDate();
      const dateStr = formatLocalDateYmd(ad);
      return (
        attendance.find(
          (a) =>
            (a.user_id === user?.id || a.device_user_id === user?.id) &&
            a.date === dateStr,
        ) || null
      );
    } catch {
      return null;
    }
  }, [selectedBsDate, attendance, user?.id]);

  const leaveBalanceSummary = useMemo(() => {
    const totalAvailable = leaveBalances.reduce(
      (acc, row) => acc + Number(row?.available_days || 0),
      0,
    );
    const totalEarned = leaveBalances.reduce(
      (acc, row) => acc + Number(row?.earned_days || 0),
      0,
    );
    const totalUsed = leaveBalances.reduce(
      (acc, row) => acc + Number(row?.used_days || 0),
      0,
    );

    return {
      totalAvailable: totalAvailable.toFixed(1),
      totalEarned: totalEarned.toFixed(1),
      totalUsed: totalUsed.toFixed(1),
    };
  }, [leaveBalances]);

  const superadminStats = useMemo(() => {
    const activeCompanies = companies.filter(
      (c) => c.status === "ACTIVE",
    ).length;
    const inactiveCompanies = companies.filter(
      (c) => c.status === "INACTIVE",
    ).length;
    const docsCompleted = companies.filter(
      (c) => c.logo_file_path && c.certificate_file_path,
    ).length;

    return {
      totalCompanies: companies.length,
      activeCompanies,
      inactiveCompanies,
      docsCompleted,
    };
  }, [companies]);

  const superadminUserStats = useMemo(() => {
    const totalUsers = companyUserCounts.reduce(
      (acc, row) => acc + Number(row?.total_users || 0),
      0,
    );
    const totalAdmins = companyUserCounts.reduce(
      (acc, row) => acc + Number(row?.admin_users || 0),
      0,
    );
    const totalEmployees = companyUserCounts.reduce(
      (acc, row) => acc + Number(row?.employee_users || 0),
      0,
    );

    return {
      totalUsers,
      totalAdmins,
      totalEmployees,
    };
  }, [companyUserCounts]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Dashboard Overview
          </h1>
          <p className="text-slate-500 mt-1">
            Welcome back, {user?.name}. Here's what's happening today.
          </p>
        </div>
      </div>

      {/* Admin Dashboard */}
      {user?.role === "admin" && hasPermission("dashboard.admin.stats") && (
        <>
          {/* Today's Attendance Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Present Today"
              value={todayStats.present}
              change="+5%"
              icon={UserCheck}
              color="bg-emerald-500"
            />
            <StatCard
              title="Late Check-In"
              value={todayStats.late}
              change="-2"
              icon={ClockAlert}
              color="bg-orange-500"
            />
            <StatCard
              title="Absent Today"
              value={todayStats.absent}
              change="-1"
              icon={UserX}
              color="bg-red-500"
            />
            <StatCard
              title="On Leave"
              value={todayStats.onLeave}
              change="+3"
              icon={Calendar}
              color="bg-blue-500"
            />
          </div>

          {/* Employees on Leave Today */}
          {hasPermission("dashboard.admin.employees_on_leave") && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">
                Employees on Leave Today
              </h2>
              {colleaguesOnLeave.length > 0 ? (
                <div className="space-y-3">
                  {colleaguesOnLeave.slice(0, 5).map((leave) => (
                    <div
                      key={leave.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 flex items-center justify-center font-bold text-sm mr-3">
                          {getLeaveUserName(leave)
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {getLeaveUserName(leave)}
                          </p>
                          <p className="text-xs text-slate-500">{leave.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">
                          {getLeaveStartDate(leave)} - {getLeaveEndDate(leave)}
                        </p>
                        <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                          {leave.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm text-center py-4">
                  No employees on leave today
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* User Dashboard */}
      {user?.role === "user" && (
        <>
          {/* Attendance Summary Stats */}
          {hasPermission("dashboard.user.attendance_summary") && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <SummaryCard
                title="Total Present"
                value={attendanceStats.totalPresent}
                subtitle="Days present"
                icon={UserCheck}
                iconClassName="text-emerald-600"
                cardClassName="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-100"
              />

              <SummaryCard
                title="Late Check-In"
                value={attendanceStats.totalLate}
                subtitle="Days late"
                icon={ClockAlert}
                iconClassName="text-orange-600"
                cardClassName="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100"
              />

              <SummaryCard
                title="Full Leaves"
                value={attendanceStats.fullLeaves}
                subtitle="Full day leaves"
                icon={Calendar}
                iconClassName="text-blue-600"
                cardClassName="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100"
              />

              <SummaryCard
                title="Half Leaves"
                value={attendanceStats.halfLeaves}
                subtitle="Half day leaves"
                icon={Clock}
                iconClassName="text-purple-600"
                cardClassName="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100"
              />
            </div>
          )}

          {/* Leave Balance Top Card (backend + DB driven) */}
          {hasPermission("dashboard.user.leave_balance") && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-sm border border-purple-100 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Leave Balance
                  </p>
                  <h3 className="text-4xl font-bold text-slate-800 mt-2">
                    {leaveBalanceSummary.totalAvailable} Days
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Earned: {leaveBalanceSummary.totalEarned} | Used:{" "}
                    {leaveBalanceSummary.totalUsed}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-purple-100">
                  <Calendar size={32} className="text-purple-600" />
                </div>
              </div>
              {leaveBalances.length > 0 && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {leaveBalances.map((item) => (
                    <div
                      key={item.leave_type}
                      className="bg-white rounded-xl border border-purple-100 px-3 py-2"
                    >
                      <p className="text-xs text-slate-500">
                        {item.leave_type}
                      </p>
                      <p className="text-sm font-semibold text-slate-800">
                        {Number(item.available_days || 0).toFixed(1)} days
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Today's Attendance Widget */}
          {hasPermission("dashboard.user.today_attendance") && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-sm border border-blue-100 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">
                Today's Attendance
              </h2>
              {todayAttendance ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-600">
                          Check-In Time
                        </span>
                        <LogIn size={20} className="text-emerald-500" />
                      </div>
                      <p className="text-2xl font-bold text-slate-800">
                        {todayAttendance.check_in || "-"}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        From attendance machine
                      </p>
                    </div>

                    <div className="bg-white rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-600">
                          Check-Out Time
                        </span>
                        <LogOut size={20} className="text-red-500" />
                      </div>
                      <p className="text-2xl font-bold text-slate-800">
                        {todayAttendance.check_out || "-"}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        From attendance machine
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-white rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Status:</span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          todayAttendance.status === "Present"
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-orange-100 text-orange-600"
                        }`}
                      >
                        {todayAttendance.status}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-xl p-8 text-center">
                  <Clock size={48} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-600 font-medium">
                    No attendance recorded yet
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Your attendance will be synced from the physical machine
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Attendance Calendar (NepaliDatePicker) */}
          {hasPermission("dashboard.user.attendance_calendar") && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">
                My Attendance Calendar (मेरो उपस्थिति क्यालेन्डर)
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <NepaliDatePicker
                  value={selectedBsDate}
                  onChange={(val) => setSelectedBsDate(val)}
                />

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <p className="text-sm font-medium text-slate-700 mb-2">
                    Selected Date:{" "}
                    <span className="font-semibold">{selectedBsDate} (BS)</span>
                  </p>
                  {selectedDayAttendance ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-slate-200">
                        <span className="text-sm text-slate-600">Status</span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            selectedDayAttendance.status === "Present"
                              ? "bg-emerald-100 text-emerald-600"
                              : selectedDayAttendance.status === "Late"
                                ? "bg-orange-100 text-orange-600"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {selectedDayAttendance.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-white rounded-lg p-3 border border-slate-200">
                          <div className="text-xs text-slate-500 mb-1">
                            Check-In
                          </div>
                          <div className="text-slate-800 font-semibold">
                            {selectedDayAttendance.check_in || "-"}
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-slate-200">
                          <div className="text-xs text-slate-500 mb-1">
                            Check-Out
                          </div>
                          <div className="text-slate-800 font-semibold">
                            {selectedDayAttendance.check_out || "-"}
                          </div>
                        </div>
                      </div>
                      {selectedDayAttendance.late_reason && (
                        <div className="bg-white rounded-lg p-3 border border-slate-200">
                          <div className="text-xs text-slate-500 mb-1">
                            Late Reason
                          </div>
                          <div className="text-slate-800 text-sm">
                            {selectedDayAttendance.late_reason}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-600 bg-white rounded-lg p-6 text-center border border-slate-200">
                      No attendance found for the selected date.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Superadmin Dashboard */}
      {user?.role === "superadmin" && (
        <>
          {hasPermission("dashboard.superadmin.company_metrics") &&
            settings.show_company_metrics_on_dashboard && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-sm text-slate-500">Total Companies</p>
                  <h3 className="text-3xl font-bold text-slate-800 mt-1">
                    {superadminStats.totalCompanies}
                  </h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-sm text-slate-500">Active Tenants</p>
                  <h3 className="text-3xl font-bold text-emerald-600 mt-1">
                    {superadminStats.activeCompanies}
                  </h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-sm text-slate-500">Inactive Tenants</p>
                  <h3 className="text-3xl font-bold text-red-600 mt-1">
                    {superadminStats.inactiveCompanies}
                  </h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-sm text-slate-500">Docs Completed</p>
                  <h3 className="text-3xl font-bold text-blue-600 mt-1">
                    {superadminStats.docsCompleted}
                  </h3>
                </div>
              </div>
            )}

          {hasPermission("dashboard.superadmin.company_user_counts") && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">
                  Company-wise User Count
                </h2>
                <div className="text-xs text-slate-500">
                  Total Users: {superadminUserStats.totalUsers} | Admins:{" "}
                  {superadminUserStats.totalAdmins} | Employees:{" "}
                  {superadminUserStats.totalEmployees}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 text-left">Company</th>
                      <th className="px-4 py-3 text-left">Code</th>
                      <th className="px-4 py-3 text-right">Admins</th>
                      <th className="px-4 py-3 text-right">Users</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companyUserCounts.map((row) => (
                      <tr
                        key={row.company_id}
                        className="border-t border-slate-100"
                      >
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {row.company_name || row.company_id}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {row.company_code || "-"}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-700">
                          {row.admin_users || 0}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-700">
                          {row.employee_users || 0}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-800">
                          {row.total_users || 0}
                        </td>
                      </tr>
                    ))}
                    {companyUserCounts.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-8 text-center text-slate-500"
                        >
                          No company user counts available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {hasPermission("dashboard.superadmin.company_registry") &&
            settings.show_company_registry_on_dashboard && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-800">
                    Platform Quick Actions
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {settings.enable_superadmin_companies && (
                      <Link
                        to="/superadmin/companies"
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-600 text-white text-sm shadow-lg shadow-blue-600/30"
                      >
                        <Building2 size={16} /> Manage Companies
                      </Link>
                    )}
                    <Link
                      to="/superadmin/settings"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm"
                    >
                      <ShieldCheck size={16} /> Platform Settings
                    </Link>
                  </div>
                </div>

                {settings.enable_superadmin_companies && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="px-4 py-3 text-left">Company</th>
                          <th className="px-4 py-3 text-left">Contact</th>
                          <th className="px-4 py-3 text-left">PAN/VAT</th>
                          <th className="px-4 py-3 text-left">Documents</th>
                          <th className="px-4 py-3 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {companies.slice(0, 8).map((company) => (
                          <tr
                            key={company.id}
                            className="border-t border-slate-100"
                          >
                            <td className="px-4 py-3">
                              <div className="font-medium text-slate-800">
                                {company.name}
                              </div>
                              <div className="text-xs text-slate-500">
                                {company.code}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div>{company.contact_person_name || "-"}</div>
                              <div className="text-xs text-slate-500">
                                {company.contact_number || "-"}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div>PAN: {company.pan_number || "-"}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  company.logo_file_path &&
                                  company.certificate_file_path
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {company.logo_file_path &&
                                company.certificate_file_path
                                  ? "Complete"
                                  : "Missing Docs"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  company.status === "ACTIVE"
                                    ? "bg-blue-100 text-blue-700"
                                    : company.status === "INACTIVE"
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-slate-200 text-slate-700"
                                }`}
                              >
                                {company.status || "ACTIVE"}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {companies.length === 0 && (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-4 py-8 text-center text-slate-500"
                            >
                              No companies available.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
        </>
      )}

      {user?.role !== "superadmin" &&
        hasPermission("dashboard.company_leave_calendar") && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">
              {user?.role === "user"
                ? "Company Leave Calendar and Colleagues on Leave"
                : "Company Leave Calendar"}
            </h2>

            <div
              className={`grid grid-cols-1 ${user?.role === "user" ? "xl:grid-cols-2" : ""} gap-6`}
            >
              <CompanyLeaveCalendar holidays={holidays} />

              {user?.role === "user" && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">
                    Colleagues on Leave
                  </h3>

                  {colleaguesOnLeave.length > 0 ? (
                    <div className="space-y-3">
                      {colleaguesOnLeave.slice(0, 6).map((leave) => (
                        <div
                          key={leave.id}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                        >
                          <div className="flex items-center">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 text-purple-600 flex items-center justify-center font-bold text-xs mr-3">
                              {getLeaveUserName(leave)
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">
                                {getLeaveUserName(leave)}
                              </p>
                              <p className="text-xs text-slate-500">
                                {leave.type}
                              </p>
                            </div>
                          </div>

                          <p className="text-xs text-slate-500 text-right">
                            {getLeaveStartDate(leave)} -{" "}
                            {getLeaveEndDate(leave)}
                          </p>
                        </div>
                      ))}

                      {colleaguesOnLeave.length > 6 && (
                        <p className="text-xs text-slate-500 text-center pt-1">
                          +{colleaguesOnLeave.length - 6} more
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-6">
                      No colleagues on leave today
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
};

export default Dashboard;
