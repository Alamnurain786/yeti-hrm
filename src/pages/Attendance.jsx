import { useEffect, useState } from "react";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
} from "lucide-react";
import { attendanceAPI, deviceAPI } from "../services/backendApi";
import NepaliDatePicker from "../components/NepaliDatePicker";
import { useAuth } from "../context/AuthContext";
import { useDebounce } from "../hooks/useDebounce";
import {
  bsToAdDateLabel,
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

const AUTO_REFRESH_INTERVAL_MS = 15000;

const Attendance = () => {
  const { user } = useAuth();
  const currentBS = getCurrentBSYearMonth();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [records, setRecords] = useState([]);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewMode, setViewMode] = useState("daily");
  const [selectedDateBS, setSelectedDateBS] = useState(() => getTodayBS());
  const [selectedMonthBS, setSelectedMonthBS] = useState(currentBS.month);
  const [selectedYearBS, setSelectedYearBS] = useState(currentBS.year);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [syncingDeviceData, setSyncingDeviceData] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [appliedFilter, setAppliedFilter] = useState(() => ({
    mode: "daily",
    dateBS: getTodayBS(),
    monthBS: currentBS.month,
    yearBS: currentBS.year,
  }));

  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  const canManualDeviceSync =
    user?.role === "admin" || user?.role === "superadmin";

  const getRequestRange = () => {
    if (appliedFilter.mode === "monthly") {
      const month = Number(appliedFilter.monthBS);
      const year = Number(appliedFilter.yearBS);
      const lastDay = getDaysInBsMonth(year, month);
      const startDateBS = `${year}-${String(month).padStart(2, "0")}-01`;
      const endDateBS = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      return { startDateBS, endDateBS };
    }
    return {
      startDateBS: appliedFilter.dateBS,
      endDateBS: appliedFilter.dateBS,
    };
  };

  const buildStatusSummary = (rows, mode) => ({
    status: "ready",
    message:
      mode === "monthly"
        ? "Monthly records built from raw device transactions."
        : "Daily records built from raw device transactions.",
    date: null,
    total: rows.length,
    present: rows.filter((row) => row.status === "Present").length,
    late: rows.filter((row) => row.is_late).length,
    half_day: rows.filter((row) => row.is_half_day).length,
    absent: rows.filter((row) => row.status === "Absent").length,
  });

  const loadAttendance = async ({
    showLoading = true,
    syncFromServer = false,
  } = {}) => {
    if (showLoading) {
      setLoading(true);
      setError("");
    }
    try {
      const { startDateBS, endDateBS } = getRequestRange();
      const attendanceData = await attendanceAPI.getPaged({
        start_date_bs: startDateBS,
        end_date_bs: endDateBS,
        sync: syncFromServer,
        page,
        page_size: pageSize,
        status: statusFilter !== "All" ? statusFilter : undefined,
        search: debouncedSearchTerm.trim() || undefined,
      });
      const nextRecords = Array.isArray(attendanceData?.items)
        ? attendanceData.items
        : [];
      setRecords(nextRecords);
      setTotalRecords(Number(attendanceData?.total || 0));
      setTotalPages(Number(attendanceData?.total_pages || 0));

      if (appliedFilter.mode === "daily") {
        const dailyStatus = await attendanceAPI.getStatus({
          target_date_bs: appliedFilter.dateBS,
          sync: syncFromServer,
        });
        setStatus({
          ...buildStatusSummary(nextRecords, appliedFilter.mode),
          total: dailyStatus?.total ?? nextRecords.length,
          present: dailyStatus?.present ?? 0,
          late: dailyStatus?.late ?? 0,
          half_day: dailyStatus?.half_day ?? 0,
          absent: dailyStatus?.absent ?? 0,
          date: dailyStatus?.date ?? null,
          message:
            dailyStatus?.message ||
            "Daily records built from raw device transactions.",
        });
      } else {
        setStatus(
          attendanceData?.status_summary ||
            buildStatusSummary(nextRecords, appliedFilter.mode),
        );
      }
    } catch (err) {
      if (showLoading) {
        setStatus(null);
        setRecords([]);
        const serverMessage = err?.response?.data?.detail;
        setError(
          typeof serverMessage === "string"
            ? serverMessage
            : "Unable to load attendance records right now.",
        );
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadAttendance({ showLoading: true, syncFromServer: false });
  }, [appliedFilter, page, pageSize, statusFilter, debouncedSearchTerm]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadAttendance({ showLoading: false, syncFromServer: false });
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [appliedFilter, page, pageSize, statusFilter, debouncedSearchTerm]);

  useEffect(() => {
    if (!canManualDeviceSync) return;

    const loadDevices = async () => {
      try {
        const deviceList = await deviceAPI.getAll();
        const normalizedDevices = Array.isArray(deviceList) ? deviceList : [];
        setDevices(normalizedDevices);
        if (normalizedDevices.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(normalizedDevices[0].id);
        }
      } catch {
        setDevices([]);
      }
    };

    loadDevices();
  }, [canManualDeviceSync]);

  const selectedDateAD =
    appliedFilter.mode === "daily"
      ? bsToAdDateLabel(appliedFilter.dateBS) || formatDateInput()
      : "-";

  const selectedMonthLabel = nepaliMonthOptions.find(
    (monthOption) => monthOption.value === Number(appliedFilter.monthBS),
  )?.label;

  const handleShowAttendance = () => {
    setPage(1);
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

  useEffect(() => {
    setPage(1);
  }, [statusFilter, debouncedSearchTerm]);

  const handleExportCSV = () => {
    const rows = [
      [
        "Date BS",
        "Date AD",
        "Employee ID",
        "Employee Name",
        "Check-In",
        "Check-Out",
        "Working Hours",
        "Status",
        "Late Reason",
      ],
      ...records.map((record) => [
        record.date_bs || "",
        record.date || selectedDateAD,
        record.user_id || "",
        record.user_name || "",
        formatTime(record.check_in),
        formatTime(record.check_out),
        record.working_hours || "0h 00m",
        record.status || "",
        record.late_reason || "",
      ]),
    ];

    const csvContent = rows
      .map((row) => row.map((cell) => escapeCsv(cell)).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download =
      appliedFilter.mode === "monthly"
        ? `attendance-monthly-${appliedFilter.yearBS}-${String(appliedFilter.monthBS).padStart(2, "0")}.csv`
        : `attendance-report-${appliedFilter.dateBS || "report"}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleManualDeviceSync = async () => {
    if (!selectedDeviceId || syncingDeviceData) {
      return;
    }

    setSyncingDeviceData(true);
    setSyncMessage("");
    try {
      const result = await deviceAPI.syncAttendance(selectedDeviceId, {
        include_users: false,
        only_new: true,
      });
      await loadAttendance({ showLoading: false, syncFromServer: true });

      const inserted = Number(result?.inserted_events || 0);
      const skipped = Number(result?.skipped_duplicates || 0);
      setSyncMessage(
        `Sync complete: inserted ${inserted} event(s), skipped ${skipped}.`,
      );
    } catch {
      setSyncMessage("Device sync failed. Please try again.");
    } finally {
      setSyncingDeviceData(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Attendance</h1>
          <p className="text-slate-500 mt-1">
            Review daily and monthly attendance reports in Nepali date format.
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
            <div className="bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-xl w-full sm:w-auto sm:min-w-64">
              <NepaliDatePicker
                value={selectedDateBS}
                onChange={setSelectedDateBS}
                placeholder="Select BS date"
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
            type="button"
            onClick={handleExportCSV}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition-colors shadow-lg shadow-emerald-600/30 flex items-center gap-2"
          >
            <Download size={16} />
            Export CSV
          </button>

          {canManualDeviceSync && (
            <div className="flex items-center gap-2">
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-2 max-w-48"
              >
                {devices.length === 0 ? (
                  <option value="">No devices</option>
                ) : (
                  devices.map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.name} ({device.ip})
                    </option>
                  ))
                )}
              </select>
              <button
                type="button"
                onClick={handleManualDeviceSync}
                disabled={syncingDeviceData || !selectedDeviceId}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl transition-colors shadow-lg shadow-indigo-600/30"
              >
                {syncingDeviceData ? "Syncing..." : "Sync Device Data"}
              </button>
            </div>
          )}
        </div>
      </div>

      {syncMessage && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {syncMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                {appliedFilter.mode === "monthly"
                  ? "Present (Month)"
                  : "Present Today"}
              </p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">
                {status?.present ?? 0}
              </h3>
            </div>
            <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
              <CheckCircle size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                {appliedFilter.mode === "monthly"
                  ? "Late (Month)"
                  : "Late Arrivals"}
              </p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">
                {status?.late ?? 0}
              </h3>
            </div>
            <div className="p-3 bg-orange-100 rounded-xl text-orange-600">
              <Clock size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                {appliedFilter.mode === "monthly" ? "Absent (Month)" : "Absent"}
              </p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">
                {status?.absent ?? 0}
              </h3>
            </div>
            <div className="p-3 bg-red-100 rounded-xl text-red-600">
              <XCircle size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                {appliedFilter.mode === "monthly"
                  ? "Half Day (Month)"
                  : "Half Day"}
              </p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">
                {status?.half_day ?? 0}
              </h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
              <AlertCircle size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-bold text-slate-800">
              {appliedFilter.mode === "monthly"
                ? `Monthly Attendance for ${selectedMonthLabel || "-"} ${appliedFilter.yearBS} (BS)`
                : `Attendance for ${appliedFilter.dateBS || "-"} (BS)`}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {appliedFilter.mode === "daily"
                ? `AD: ${formatDateLabel(selectedDateAD)}`
                : "Nepali month-wise report"}
            </p>
            <p className="text-sm text-slate-500">
              {status?.message ||
                "Daily records built from raw device transactions."}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="Search by employee, ID or BS date"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-2 w-full sm:min-w-60"
            />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-2 w-full sm:w-auto"
            >
              <option value="All">All Status</option>
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Half Day">Half Day</option>
              <option value="Absent">Absent</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-slate-500">
            Loading attendance records...
          </div>
        ) : error ? (
          <div className="p-6 text-red-600">{error}</div>
        ) : records.length > 0 ? (
          <>
            <div className="md:hidden p-4 space-y-3">
              {records.map((record) => (
                <div
                  key={record.id}
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
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getAttendanceStatusColor(record.status)}`}
                    >
                      {record.status}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <p className="col-span-2">
                      BS Date: {record.date_bs || "-"}
                    </p>
                    <p>In: {formatTime(record.check_in)}</p>
                    <p>Out: {formatTime(record.check_out)}</p>
                    <p className="col-span-2">
                      Hours: {record.working_hours || "0h 00m"}
                    </p>
                    <p className="col-span-2">
                      Note: {record.late_reason || "-"}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Date (BS)
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
                      Working Hours
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Note
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((record) => (
                    <tr
                      key={record.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {record.date_bs || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-800">
                          {record.user_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          ID: {record.user_id}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatTime(record.check_in)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatTime(record.check_out)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {record.working_hours || "0h 00m"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getAttendanceStatusColor(record.status)}`}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {record.late_reason || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-100 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/40">
              <p className="text-sm text-slate-600">
                Showing {records.length} of {totalRecords} record(s)
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <label className="text-sm text-slate-600" htmlFor="page-size">
                  Rows:
                </label>
                <select
                  id="page-size"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-2 py-1.5"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>

                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100"
                >
                  Prev
                </button>
                <span className="text-sm text-slate-700 min-w-24 text-center">
                  Page {page} / {Math.max(totalPages, 1)}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPage((prev) =>
                      totalPages > 0
                        ? Math.min(prev + 1, totalPages)
                        : prev + 1,
                    )
                  }
                  disabled={
                    totalPages > 0
                      ? page >= totalPages
                      : records.length < pageSize
                  }
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-10 text-center text-slate-500">
            {appliedFilter.mode === "monthly"
              ? `No records found for ${selectedMonthLabel || "selected month"} ${appliedFilter.yearBS}.`
              : `No records found for ${appliedFilter.dateBS || "the selected date"}.`}
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
