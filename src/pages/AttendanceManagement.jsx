import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Download,
  Clock,
  UserCheck,
  UserX,
  ClockAlert,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useMockData } from "../context/MockData";

const AttendanceManagement = () => {
  const { user } = useAuth();
  const { attendance } = useMockData();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");

  // Filter attendance records - only current user
  const filteredAttendance = useMemo(() => {
    return attendance.filter((record) => {
      const matchesUser = record.userId === user?.id;
      const matchesDate = dateFilter === "All" || record.date === dateFilter;
      const matchesStatus =
        statusFilter === "All" || record.status === statusFilter;
      const matchesSearch =
        searchTerm === "" ||
        record.date.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesUser && matchesDate && matchesStatus && matchesSearch;
    });
  }, [attendance, dateFilter, statusFilter, searchTerm, user?.id]);

  // Calculate attendance statistics for current user
  const attendanceStats = useMemo(() => {
    const userRecords = attendance.filter((a) => a.userId === user?.id);
    return {
      totalPresent: userRecords.filter((a) => a.status === "Present").length,
      totalLate: userRecords.filter((a) => a.status === "Late").length,
      totalDays: userRecords.length,
    };
  }, [attendance, user?.id]);

  const getStatusColor = (status) => {
    switch (status) {
      case "Present":
        return "bg-emerald-100 text-emerald-600";
      case "Late":
        return "bg-orange-100 text-orange-600";
      case "Absent":
        return "bg-red-100 text-red-600";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const handleExportCSV = () => {
    const csvContent = [
      [
        "Date",
        "Employee ID",
        "Name",
        "Check-In",
        "Check-Out",
        "Status",
        "Late Reason",
      ],
      ...filteredAttendance.map((record) => [
        record.date,
        record.userId,
        record.name,
        record.checkIn,
        record.checkOut,
        record.status,
        record.lateReason || "-",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${dateFilter}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            My Attendance Records
          </h1>
          <p className="text-slate-500 mt-1">
            View and track your attendance history.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center transition-colors shadow-lg shadow-blue-600/30"
        >
          <Download size={20} className="mr-2" />
          Export CSV
        </button>
      </div>

      {/* Attendance Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">
              Total Present Days
            </span>
            <UserCheck className="text-emerald-600" size={24} />
          </div>
          <h3 className="text-3xl font-bold text-slate-800">
            {attendanceStats.totalPresent}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {attendanceStats.totalDays > 0
              ? Math.round(
                  (attendanceStats.totalPresent / attendanceStats.totalDays) *
                    100
                )
              : 0}
            % of total days
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">
              Late Check-In Days
            </span>
            <ClockAlert className="text-orange-600" size={24} />
          </div>
          <h3 className="text-3xl font-bold text-slate-800">
            {attendanceStats.totalLate}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {attendanceStats.totalDays > 0
              ? Math.round(
                  (attendanceStats.totalLate / attendanceStats.totalDays) * 100
                )
              : 0}
            % of total days
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">
              Total Attendance Days
            </span>
            <Clock className="text-blue-600" size={24} />
          </div>
          <h3 className="text-3xl font-bold text-slate-800">
            {attendanceStats.totalDays}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Recorded attendance</p>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="flex items-center bg-slate-50 rounded-xl px-4 py-2 flex-1 max-w-md border border-slate-100">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search by date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none ml-3 w-full text-sm text-slate-600 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-2"
              >
                <option value="All">All Status</option>
                <option value="Present">Present</option>
                <option value="Late">Late</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Clock size={18} className="text-slate-400" />
              <input
                type="date"
                value={
                  dateFilter !== "All"
                    ? new Date(dateFilter).toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) => {
                  const date = e.target.value
                    ? new Date(e.target.value).toLocaleDateString()
                    : "All";
                  setDateFilter(date);
                }}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-2"
              />
              {dateFilter !== "All" && (
                <button
                  onClick={() => setDateFilter("All")}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Check-In
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Check-Out
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Late Reason
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAttendance.length > 0 ? (
                filteredAttendance.map((record, index) => (
                  <tr
                    key={index}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-800">
                        {record.date}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {record.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          ID: {record.userId}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">
                        {record.checkIn}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">
                        {record.checkOut}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          record.status
                        )}`}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">
                        {record.lateReason || "-"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <Clock size={48} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500">
                      No attendance records found
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceManagement;
