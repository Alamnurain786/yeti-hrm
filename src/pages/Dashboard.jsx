import { useState, useMemo } from "react";
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
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useMockData } from "../context/MockData";
import NepaliDate from "nepali-date-converter";
import NepaliDatePicker from "../components/NepaliDatePicker";

const StatCard = ({ title, value, change, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800 mt-2">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={24} className="text-white" />
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

const Dashboard = () => {
  const { user } = useAuth();
  const { users, attendance, leaves, dashboardConfig } = useMockData();

  // Initialize with current Nepali date
  const currentNepaliDate = new NepaliDate();
  const [currentMonth, setCurrentMonth] = useState({
    year: currentNepaliDate.getYear(),
    month: currentNepaliDate.getMonth(),
  });

  const today = new Date().toLocaleDateString();

  // Get today's attendance for current user
  const todayAttendance = useMemo(() => {
    return attendance.find((a) => a.userId === user?.id && a.date === today);
  }, [attendance, user?.id, today]);

  // Calculate attendance statistics for employee
  const attendanceStats = useMemo(() => {
    const userAttendance = attendance.filter((a) => a.userId === user?.id);
    const approved = leaves.filter(
      (l) => l.userId === user?.id && l.status === "Approved"
    );

    let fullLeaves = 0;
    let halfLeaves = 0;

    approved.forEach((leave) => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

      if (leave.halfDay) {
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
    const todayRecords = attendance.filter((a) => a.date === today);
    return {
      present: todayRecords.filter((a) => a.status === "Present").length,
      late: todayRecords.filter((a) => a.status === "Late").length,
      absent:
        users.filter((u) => u.role === "employee").length - todayRecords.length,
      onLeave: leaves.filter(
        (l) =>
          l.status === "Approved" &&
          new Date(l.startDate) <= new Date() &&
          new Date(l.endDate) >= new Date()
      ).length,
    };
  }, [attendance, users, leaves, today]);

  // Get colleagues on leave today
  const colleaguesOnLeave = useMemo(() => {
    return leaves.filter(
      (l) =>
        l.status === "Approved" &&
        new Date(l.startDate) <= new Date() &&
        new Date(l.endDate) >= new Date()
    );
  }, [leaves]);

  // Selected Nepali date (for calendar component)
  const [selectedBsDate, setSelectedBsDate] = useState(() => {
    const d = new NepaliDate();
    return `${d.getYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
  });

  // Attendance for selected Nepali date (converted to AD)
  const selectedDayAttendance = useMemo(() => {
    try {
      const [y, m, d] = selectedBsDate.split("-").map(Number);
      const ad = new NepaliDate(y, m - 1, d).toJsDate();
      const dateStr = ad.toLocaleDateString();
      return (
        attendance.find((a) => a.userId === user?.id && a.date === dateStr) ||
        null
      );
    } catch {
      return null;
    }
  }, [selectedBsDate, attendance, user?.id]);

  // Calculators for dynamic cards
  const calculators = {
    totalEmployees: () => users.length,
    leaveBalance: () =>
      12 -
      leaves.filter((l) => l.userId === user?.id && l.status === "Approved")
        .length,
    newHires: () => {
      // Mock approximation (no reliable created timestamp) - fallback static demo
      return 3;
    },
    attendanceRate: () => "95%", // Static mock
  };

  const roleCards = dashboardConfig?.[user.role] || [];

  const cardMeta = {
    totalEmployees: {
      title: "Total Employees",
      icon: Users,
      color: "bg-blue-500",
      change: "+12%",
    },
    leaveBalance: {
      title: "Leave Balance",
      icon: Clock,
      color: "bg-orange-500",
      change: "-2",
    },
    newHires: {
      title: "New Hires",
      icon: UserPlus,
      color: "bg-purple-500",
      change: "+5%",
    },
    attendanceRate: {
      title: "Attendance",
      icon: TrendingUp,
      color: "bg-emerald-500",
      change: "+1%",
    },
  };

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

      {/* HR Dashboard */}
      {user?.role === "hr" && (
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
                        {leave.userName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {leave.userName}
                        </p>
                        <p className="text-xs text-slate-500">{leave.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">
                        {leave.startDate} - {leave.endDate}
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
        </>
      )}

      {/* Employee Dashboard */}
      {user?.role === "employee" && (
        <>
          {/* Attendance Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">
                  Total Present
                </span>
                <UserCheck className="text-emerald-600" size={24} />
              </div>
              <h3 className="text-3xl font-bold text-slate-800">
                {attendanceStats.totalPresent}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Days present</p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">
                  Late Check-In
                </span>
                <ClockAlert className="text-orange-600" size={24} />
              </div>
              <h3 className="text-3xl font-bold text-slate-800">
                {attendanceStats.totalLate}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Days late</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">
                  Full Leaves
                </span>
                <Calendar className="text-blue-600" size={24} />
              </div>
              <h3 className="text-3xl font-bold text-slate-800">
                {attendanceStats.fullLeaves}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Full day leaves</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">
                  Half Leaves
                </span>
                <Clock className="text-purple-600" size={24} />
              </div>
              <h3 className="text-3xl font-bold text-slate-800">
                {attendanceStats.halfLeaves}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Half day leaves</p>
            </div>
          </div>

          {/* Today's Attendance Widget */}
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
                      {todayAttendance.checkIn}
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
                      {todayAttendance.checkOut}
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

          {/* Attendance Calendar (NepaliDatePicker) */}
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
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-3 border border-slate-200">
                        <div className="text-xs text-slate-500 mb-1">
                          Check-In
                        </div>
                        <div className="text-slate-800 font-semibold">
                          {selectedDayAttendance.checkIn || "-"}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-slate-200">
                        <div className="text-xs text-slate-500 mb-1">
                          Check-Out
                        </div>
                        <div className="text-slate-800 font-semibold">
                          {selectedDayAttendance.checkOut || "-"}
                        </div>
                      </div>
                    </div>
                    {selectedDayAttendance.lateReason && (
                      <div className="bg-white rounded-lg p-3 border border-slate-200">
                        <div className="text-xs text-slate-500 mb-1">
                          Late Reason
                        </div>
                        <div className="text-slate-800 text-sm">
                          {selectedDayAttendance.lateReason}
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

          {/* Colleagues on Leave */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Colleagues on Leave
            </h2>
            {colleaguesOnLeave.length > 0 ? (
              <div className="space-y-3">
                {colleaguesOnLeave.slice(0, 5).map((leave) => (
                  <div
                    key={leave.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 text-purple-600 flex items-center justify-center font-bold text-sm mr-3">
                        {leave.userName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {leave.userName}
                        </p>
                        <p className="text-xs text-slate-500">{leave.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">
                        {leave.startDate} - {leave.endDate}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm text-center py-4">
                No colleagues on leave today
              </p>
            )}
          </div>

          {/* Leave Balance Card */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-sm border border-purple-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Leave Balance
                </p>
                <h3 className="text-4xl font-bold text-slate-800 mt-2">
                  {calculators.leaveBalance()} Days
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Available for this year
                </p>
              </div>
              <div className="p-4 rounded-xl bg-purple-100">
                <Calendar size={32} className="text-purple-600" />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Superadmin Dashboard - Dynamic Stats Grid */}
      {user?.role === "superadmin" && roleCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {roleCards.map((cardId) => {
            const meta = cardMeta[cardId];
            if (!meta) return null;
            const rawVal = calculators[cardId]();
            const value = cardId === "leaveBalance" ? `${rawVal} Days` : rawVal;
            return (
              <StatCard
                key={cardId}
                title={meta.title}
                value={value}
                change={meta.change}
                icon={meta.icon}
                color={meta.color}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
