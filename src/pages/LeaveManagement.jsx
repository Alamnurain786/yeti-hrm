import { useState, useMemo } from "react";
import {
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useMockData } from "../context/MockData";
import { useToast } from "../context/ToastContext";
import NepaliDatePicker from "../components/NepaliDatePicker";
import NepaliDate from "nepali-date-converter";

const LeaveManagement = () => {
  const { user } = useAuth();
  const { leaves, addLeaveRequest, users } = useMockData();
  const { showToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");
  const [formData, setFormData] = useState({
    type: "Casual Leave",
    startDateBS: "",
    endDateBS: "",
    reason: "",
    halfDay: false,
  });

  // Get user's leaves
  const userLeaves = useMemo(() => {
    const myLeaves = leaves.filter((l) => l.userId === user?.id);
    if (filterStatus === "All") return myLeaves;
    return myLeaves.filter((l) => l.status === filterStatus);
  }, [leaves, user?.id, filterStatus]);

  // Calculate leave summary
  const leaveSummary = useMemo(() => {
    const approved = userLeaves.filter((l) => l.status === "Approved");

    let fullDays = 0;
    let halfDays = 0;

    approved.forEach((leave) => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

      if (leave.halfDay) {
        halfDays += days;
      } else {
        fullDays += days;
      }
    });

    return {
      totalLeaves: fullDays + halfDays * 0.5,
      fullDays,
      halfDays,
      pending: userLeaves.filter((l) => l.status === "Pending").length,
      approved: approved.length,
      rejected: userLeaves.filter((l) => l.status === "Rejected").length,
      balance: 12 - (fullDays + halfDays * 0.5),
    };
  }, [userLeaves]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.startDateBS || !formData.endDateBS) {
      showToast("error", "Please select start and end dates", {
        title: "Validation Error",
      });
      return;
    }

    if (!formData.reason.trim()) {
      showToast("error", "Please provide a reason for leave", {
        title: "Validation Error",
      });
      return;
    }

    try {
      // Convert Nepali dates to AD
      const [startYear, startMonth, startDay] = formData.startDateBS
        .split("-")
        .map(Number);
      const [endYear, endMonth, endDay] = formData.endDateBS
        .split("-")
        .map(Number);

      const startNepali = new NepaliDate(startYear, startMonth - 1, startDay);
      const endNepali = new NepaliDate(endYear, endMonth - 1, endDay);

      const startDateAD = startNepali.toJsDate().toISOString().split("T")[0];
      const endDateAD = endNepali.toJsDate().toISOString().split("T")[0];

      // Find manager (HR or superadmin)
      const manager = users.find(
        (u) => u.role === "hr" || u.role === "superadmin"
      );

      const newLeave = {
        type: formData.type,
        startDate: startDateAD,
        endDate: endDateAD,
        reason: formData.reason,
        halfDay: formData.halfDay,
        managerId: manager?.id || "SA001",
        managerName: manager?.name || "Admin",
        requestedAt: new Date().toLocaleDateString(),
      };

      addLeaveRequest(newLeave);
      showToast("success", "Leave request submitted successfully", {
        title: "Request Submitted",
      });

      // Reset form
      setFormData({
        type: "Casual Leave",
        startDateBS: "",
        endDateBS: "",
        reason: "",
        halfDay: false,
      });
      setShowModal(false);
    } catch (error) {
      showToast("error", "Invalid date format", { title: "Error" });
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Approved":
        return <CheckCircle size={20} className="text-emerald-500" />;
      case "Rejected":
        return <XCircle size={20} className="text-red-500" />;
      default:
        return <AlertCircle size={20} className="text-orange-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "bg-emerald-100 text-emerald-600";
      case "Rejected":
        return "bg-red-100 text-red-600";
      default:
        return "bg-orange-100 text-orange-600";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Leave Management
          </h1>
          <p className="text-slate-500 mt-1">
            Track and manage your leave requests.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center transition-colors shadow-lg shadow-blue-600/30"
        >
          <Plus size={20} className="mr-2" />
          Request Leave
        </button>
      </div>

      {/* Leave Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">
              Leave Balance
            </span>
            <Calendar className="text-blue-600" size={24} />
          </div>
          <h3 className="text-3xl font-bold text-slate-800">
            {leaveSummary.balance.toFixed(1)}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Days remaining</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">
              Full Day Leaves
            </span>
            <Clock className="text-emerald-600" size={24} />
          </div>
          <h3 className="text-3xl font-bold text-slate-800">
            {leaveSummary.fullDays}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Days taken</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">
              Half Day Leaves
            </span>
            <Clock className="text-orange-600" size={24} />
          </div>
          <h3 className="text-3xl font-bold text-slate-800">
            {leaveSummary.halfDays}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Half days taken</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">
              Pending Requests
            </span>
            <AlertCircle className="text-purple-600" size={24} />
          </div>
          <h3 className="text-3xl font-bold text-slate-800">
            {leaveSummary.pending}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Awaiting approval</p>
        </div>
      </div>

      {/* Leave Requests List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            My Leave Requests
          </h2>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-2"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Approved By
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {userLeaves.length > 0 ? (
                userLeaves.map((leave) => {
                  const start = new Date(leave.startDate);
                  const end = new Date(leave.endDate);
                  const days =
                    Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

                  return (
                    <tr
                      key={leave.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-slate-800">
                          {leave.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">
                          {leave.halfDay
                            ? `${days} Half Day${days > 1 ? "s" : ""}`
                            : `${days} Full Day${days > 1 ? "s" : ""}`}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600">
                          <div>{leave.startDate}</div>
                          <div className="text-xs text-slate-400">
                            to {leave.endDate}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600 max-w-xs truncate">
                          {leave.reason}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(leave.status)}
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              leave.status
                            )}`}
                          >
                            {leave.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">
                          {leave.approvedBy || "-"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <Calendar
                      size={48}
                      className="mx-auto text-slate-300 mb-3"
                    />
                    <p className="text-slate-500">No leave requests found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Leave Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800">
                Request Leave
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label
                  htmlFor="type"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Leave Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Earned Leave">Earned Leave</option>
                  <option value="Unpaid Leave">Unpaid Leave</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="startDateBS"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Start Date (Nepali) <span className="text-red-500">*</span>
                </label>
                <NepaliDatePicker
                  value={formData.startDateBS}
                  onChange={(date) =>
                    setFormData((prev) => ({ ...prev, startDateBS: date }))
                  }
                  placeholder="Select start date (BS)"
                  className="w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="endDateBS"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  End Date (Nepali) <span className="text-red-500">*</span>
                </label>
                <NepaliDatePicker
                  value={formData.endDateBS}
                  onChange={(date) =>
                    setFormData((prev) => ({ ...prev, endDateBS: date }))
                  }
                  placeholder="Select end date (BS)"
                  className="w-full"
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="halfDay"
                    checked={formData.halfDay}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-slate-700">
                    Half Day Leave
                  </span>
                </label>
              </div>

              <div>
                <label
                  htmlFor="reason"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Explain the reason for your leave request"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm shadow-lg shadow-blue-600/30"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;
