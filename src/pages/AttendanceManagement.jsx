import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  Download,
  Clock,
  UserCheck,
  ClockAlert,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { attendanceAPI } from "../services/backendApi";
import NepaliDatePicker from "../components/NepaliDatePicker";
import SummaryCard from "../components/SummaryCard";
import {
  escapeCsv,
  formatDateInput,
  formatDateLabel,
  formatTime,
  getBsYears,
  getCurrentBSYearMonth,
  getDaysInBsMonth,
  getTodayBS,
  nepaliMonthOptions,
} from "../utils/nepaliDateUtils";
import { getAttendanceStatusColor } from "../utils/statusUi";

const AUTO_REFRESH_INTERVAL_MS = 30000;

const AttendanceManagement = () => {
  const currentBS = getCurrentBSYearMonth();
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewMode, setViewMode] = useState("monthly");
  const [selectedDateBS, setSelectedDateBS] = useState(() => getTodayBS());
  const [selectedMonthBS, setSelectedMonthBS] = useState(currentBS.month);
  const [selectedYearBS, setSelectedYearBS] = useState(currentBS.year);
  const [appliedFilter, setAppliedFilter] = useState(() => ({
    mode: "monthly",
    dateBS: getTodayBS(),
    monthBS: currentBS.month,
    yearBS: currentBS.year,
  }));

  const getRequestRange = () => {
    if (appliedFilter.mode === "monthly") {
      const month = Number(appliedFilter.monthBS);
      const year = Number(appliedFilter.yearBS);
      const lastDay = getDaysInBsMonth(year, month);
      return {
        startDateBS: `${year}-${String(month).padStart(2, "0")}-01`,
        endDateBS: `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
      };
    }
    return {
      startDateBS: appliedFilter.dateBS,
      endDateBS: appliedFilter.dateBS,
    };
  };

  const loadAttendance = async ({ showLoading = true } = {}) => {
    if (showLoading) {
      setLoading(true);
      setError("");
    }
    try {
      const { startDateBS, endDateBS } = getRequestRange();
      const params = {
        start_date_bs: startDateBS,
        end_date_bs: endDateBS,
        sync: false,
      };
      const data = await attendanceAPI.getMy(params);
      setAttendance(Array.isArray(data) ? data : []);
    } catch {
      if (showLoading) {
        setAttendance([]);
        setError("Unable to load your attendance records.");
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadAttendance({ showLoading: true });
  }, [appliedFilter]);

  useEffect(() => {
    if (appliedFilter.mode !== "daily") {
      return undefined;
    }
    const intervalId = window.setInterval(() => {
      loadAttendance({ showLoading: false });
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [appliedFilter]);

  // Filter attendance records - only current user
  const filteredAttendance = useMemo(() => {
    return attendance.filter((record) => {
      const matchesStatus =
        statusFilter === "All" || record.status === statusFilter;
      const matchesSearch =
        searchTerm === "" ||
        (record.user_name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (record.user_id || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (record.date_bs || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        formatDateLabel(record.date)
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }, [attendance, statusFilter, searchTerm]);

  // Calculate attendance statistics for current user
  const attendanceStats = useMemo(() => {
    const userRecords = attendance.filter((a) => a.user_id === user?.id);
    return {
      totalPresent: userRecords.filter((a) => a.status === "Present").length,
      totalLate: userRecords.filter((a) => a.status === "Late").length,
      totalDays: userRecords.length,
    };
  }, [attendance, user?.id]);

  const handleExportCSV = () => {
    const csvRows = [
      [
        "Date BS",
        "Date AD",
        "Employee ID",
        "Name",
        "Check-In",
        "Check-Out",
        "Working Hours",
        "Status",
        "Late Reason",
      ],
      ...filteredAttendance.map((record) => [
        record.date_bs || record.date,
        record.date || "",
        record.user_id,
        record.user_name,
        formatTime(record.check_in),
        formatTime(record.check_out),
        record.working_hours || "0h 00m",
        record.status,
        record.late_reason || "-",
      ]),
    ];

    const csvContent = csvRows
      .map((row) => row.map((cell) => escapeCsv(cell)).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      appliedFilter.mode === "monthly"
        ? `my-attendance-monthly-${appliedFilter.yearBS}-${String(appliedFilter.monthBS).padStart(2, "0")}.csv`
        : `my-attendance-${appliedFilter.dateBS || formatDateInput()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleShowAttendance = () => {
    if (viewMode === "monthly") {
      setAppliedFilter({
        mode: "monthly",
        dateBS: selectedDateBS,
        monthBS: Number(selectedMonthBS),
        yearBS: Number(selectedYearBS),
      });
      return;
    }

    if (!selectedDateBS) return;
    setAppliedFilter({
      mode: "daily",
      dateBS: selectedDateBS,
      monthBS: Number(selectedMonthBS),
      yearBS: Number(selectedYearBS),
    });
  };

  const selectedMonthLabel = nepaliMonthOptions.find(
    (monthOption) => monthOption.value === Number(appliedFilter.monthBS),
  )?.label;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            My Attendance Records
          </h1>
          <p className="text-slate-500 mt-1">
            View daily and monthly attendance reports in Nepali date format.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-start sm:justify-end w-full sm:w-auto">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-2"
          >
            <option value="daily">Daily Report</option>
            <option value="monthly">Monthly Report</option>
          </select>

          {viewMode === "daily" ? (
            <div className="w-full sm:w-56">
              <NepaliDatePicker
                value={selectedDateBS}
                onChange={setSelectedDateBS}
                placeholder="Filter by BS date"
                calendarAlign="right"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <select
                value={selectedMonthBS}
                onChange={(e) => setSelectedMonthBS(Number(e.target.value))}
                className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-2"
              >
                {nepaliMonthOptions.map((monthOption) => (
                  <option key={monthOption.value} value={monthOption.value}>
                    {monthOption.label}
                  </option>
                ))}
              </select>
              <select
                value={selectedYearBS}
                onChange={(e) => setSelectedYearBS(Number(e.target.value))}
                className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-2"
              >
                {getBsYears().map((yearOption) => (
                  <option key={yearOption} value={yearOption}>
                    {yearOption}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={handleShowAttendance}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors shadow-lg shadow-blue-600/30"
          >
            Show
          </button>

          <button
            onClick={handleExportCSV}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center transition-colors shadow-lg shadow-emerald-600/30"
          >
            <Download size={20} className="mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Attendance Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard
          title={
            appliedFilter.mode === "monthly"
              ? "Present (Month)"
              : "Total Present Days"
          }
          value={attendanceStats.totalPresent}
          subtitle={`${
            attendanceStats.totalDays > 0
              ? Math.round(
                  (attendanceStats.totalPresent / attendanceStats.totalDays) *
                    100,
                )
              : 0
          }% of total days`}
          icon={UserCheck}
          iconClassName="text-emerald-600"
          cardClassName="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-100"
        />

        <SummaryCard
          title={
            appliedFilter.mode === "monthly"
              ? "Late (Month)"
              : "Late Check-In Days"
          }
          value={attendanceStats.totalLate}
          subtitle={`${
            attendanceStats.totalDays > 0
              ? Math.round(
                  (attendanceStats.totalLate / attendanceStats.totalDays) * 100,
                )
              : 0
          }% of total days`}
          icon={ClockAlert}
          iconClassName="text-orange-600"
          cardClassName="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100"
        />

        <SummaryCard
          title={
            appliedFilter.mode === "monthly"
              ? "Total Days (Month)"
              : "Total Attendance Days"
          }
          value={attendanceStats.totalDays}
          subtitle="Recorded attendance"
          icon={Clock}
          iconClassName="text-blue-600"
          cardClassName="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100"
        />
      </div>

      {/* Attendance Records Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-bold text-slate-800">
              {appliedFilter.mode === "monthly"
                ? `My Attendance for ${selectedMonthLabel || "-"} ${appliedFilter.yearBS} (BS)`
                : `My Attendance for ${appliedFilter.dateBS || "-"} (BS)`}
            </h3>
          </div>

          <div className="flex items-center bg-slate-50 rounded-xl px-4 py-2 flex-1 max-w-md border border-slate-100">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID, or date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none ml-3 w-full text-sm text-slate-600 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
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
                <option value="Half Day">Half Day</option>
                <option value="Absent">Absent</option>
              </select>
            </div>
          </div>
        </div>

        <div className="md:hidden p-4 space-y-3">
          {loading ? (
            <div className="px-3 py-8 text-center text-slate-500">
              Loading attendance records...
            </div>
          ) : error ? (
            <div className="px-3 py-8 text-center text-red-600">{error}</div>
          ) : filteredAttendance.length > 0 ? (
            filteredAttendance.map((record, index) => (
              <div
                key={record.id || index}
                className="rounded-xl border border-slate-200 p-4 bg-slate-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {record.user_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      ID: {record.user_id}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getAttendanceStatusColor(
                      record.status,
                    )}`}
                  >
                    {record.status}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <p className="col-span-2">
                    BS Date: {record.date_bs || formatDateLabel(record.date)}
                  </p>
                  <p>In: {formatTime(record.check_in)}</p>
                  <p>Out: {formatTime(record.check_out)}</p>
                  <p className="col-span-2">
                    Late Reason: {record.late_reason || "-"}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="px-3 py-8 text-center text-slate-500">
              {appliedFilter.mode === "monthly"
                ? `No attendance records found for ${selectedMonthLabel || "selected month"} ${appliedFilter.yearBS}.`
                : `No attendance records found for ${appliedFilter.dateBS || "the selected date"}.`}
            </div>
          )}
        </div>

        <div className="hidden md:block overflow-x-auto">
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
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    Loading attendance records...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-red-600"
                  >
                    {error}
                  </td>
                </tr>
              ) : filteredAttendance.length > 0 ? (
                filteredAttendance.map((record, index) => (
                  <tr
                    key={record.id || index}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-800">
                        {record.date_bs || formatDateLabel(record.date)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {record.user_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          ID: {record.user_id}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">
                        {formatTime(record.check_in)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">
                        {formatTime(record.check_out)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getAttendanceStatusColor(
                          record.status,
                        )}`}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">
                        {record.late_reason || "-"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <Clock size={48} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500">
                      {appliedFilter.mode === "monthly"
                        ? `No attendance records found for ${selectedMonthLabel || "selected month"} ${appliedFilter.yearBS}.`
                        : `No attendance records found for ${appliedFilter.dateBS || "the selected date"}.`}
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
