import { useEffect, useMemo, useState } from "react";
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
import { useToast } from "../context/ToastContext";
import NepaliDatePicker from "../components/NepaliDatePicker";
import SummaryCard from "../components/SummaryCard";
import NepaliDate from "nepali-date-converter";
import { getApiErrorMessage, leaveAPI } from "../services/backendApi";
import { getLeaveRequestStatusColor } from "../utils/statusUi";

const normalizeGender = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const isLeaveTypeEligible = (leaveType, gender) => {
  const rule = normalizeGender(leaveType?.gender_rule || "all");
  if (rule === "all" || !rule) return true;
  if (!gender) return true;
  return rule === gender;
};

const toLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatAdToBs = (adDateString) => {
  if (!adDateString) return "-";
  const adDate = new Date(`${adDateString}T00:00:00`);
  if (Number.isNaN(adDate.getTime())) return adDateString;

  const bsDate = new NepaliDate(adDate);
  const year = bsDate.getYear();
  const month = String(bsDate.getMonth() + 1).padStart(2, "0");
  const day = String(bsDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getStatusIcon = (status) => {
  switch (status) {
    case "Approved":
      return <CheckCircle size={16} className="text-emerald-500" />;
    case "Cancelled":
      return <XCircle size={16} className="text-slate-500" />;
    case "Cancellation Requested":
      return <AlertCircle size={16} className="text-violet-500" />;
    case "Rejected":
      return <XCircle size={16} className="text-red-500" />;
    default:
      return <AlertCircle size={16} className="text-amber-500" />;
  }
};

const LeaveManagement = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelTargetLeave, setCancelTargetLeave] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [historyRemarksByLeaveId, setHistoryRemarksByLeaveId] = useState({});
  const [leaveTypeOptions, setLeaveTypeOptions] = useState([]);
  const [formData, setFormData] = useState({
    type: "",
    startDateBS: "",
    endDateBS: "",
    reason: "",
    halfDay: false,
  });

  const assignedManagerName = String(user?.manager || "").trim();

  const hasDateOverlap = (startDate, endDate) => {
    return leaves.some((leave) => {
      if (leave?.user_id !== user?.id) return false;
      if (leave?.status === "Rejected" || leave?.status === "Cancelled")
        return false;
      if (!leave?.start_date || !leave?.end_date) return false;
      return leave.start_date <= endDate && leave.end_date >= startDate;
    });
  };

  const refreshMyLeaves = async () => {
    const [myLeaves, myBalance] = await Promise.all([
      leaveAPI.getMy(),
      leaveAPI.getMyBalance().catch(() => []),
    ]);
    setLeaves(Array.isArray(myLeaves) ? myLeaves : []);
    setLeaveBalances(Array.isArray(myBalance) ? myBalance : []);
    await loadHistoryRemarks(myLeaves);
  };

  const canCancelLeave = (leave) => {
    const status = String(leave?.status || "");
    return (
      status === "Pending" ||
      status === "Approved by Manager" ||
      status === "Approved"
    );
  };

  const getCancelActionLabel = (leave) =>
    String(leave?.status || "") === "Approved" ? "Request Cancel" : "Cancel";

  const openCancelModal = (leave) => {
    if (!leave?.id) return;
    setCancelTargetLeave(leave);
    setCancelReason("");
    setShowCancelModal(true);
  };

  const closeCancelModal = () => {
    if (submitting) return;
    setShowCancelModal(false);
    setCancelTargetLeave(null);
    setCancelReason("");
  };

  const submitCancelLeave = async () => {
    const leave = cancelTargetLeave;
    if (!leave?.id) return;
    const reason = String(cancelReason || "").trim();
    if (!reason) {
      showToast("error", "Cancel reason is required", {
        title: "Reason Required",
      });
      return;
    }

    setSubmitting(true);
    try {
      const nextStatus =
        leave.status === "Approved" ? "Cancellation Requested" : "Cancelled";
      await leaveAPI.update(leave.id, {
        status: nextStatus,
        manager_id: leave.manager_id || null,
        manager_name: leave.manager_name || null,
        comments: reason,
      });
      await refreshMyLeaves();
      closeCancelModal();
      showToast(
        "success",
        nextStatus === "Cancellation Requested"
          ? "Cancellation request sent to HR for review."
          : "Leave request cancelled.",
        {
          title:
            nextStatus === "Cancellation Requested"
              ? "Cancellation Requested"
              : "Cancelled",
        },
      );
    } catch (error) {
      showToast(
        "error",
        getApiErrorMessage(error, "Failed to update leave status"),
        {
          title: "Action Failed",
        },
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resolveLeaveRemark = (leave, audits) => {
    if (!Array.isArray(audits) || audits.length === 0) return "";

    if (leave?.status === "Cancellation Requested") {
      const cancellationAudit = audits.find(
        (item) =>
          item?.to_status === "Cancellation Requested" &&
          String(item?.comments || "").trim(),
      );
      if (cancellationAudit) {
        return String(cancellationAudit.comments || "").trim();
      }
    }

    if (leave?.status === "Cancelled") {
      const cancelledAudit = audits.find(
        (item) =>
          item?.to_status === "Cancelled" &&
          String(item?.comments || "").trim(),
      );
      if (cancelledAudit) {
        return String(cancelledAudit.comments || "").trim();
      }
    }

    if (leave?.status === "Rejected") {
      const rejectedAudit = audits.find(
        (item) =>
          item?.to_status === "Rejected" && String(item?.comments || "").trim(),
      );
      if (rejectedAudit) return String(rejectedAudit.comments || "").trim();
    }

    const withComments = audits.find((item) =>
      String(item?.comments || "").trim(),
    );
    return withComments ? String(withComments.comments || "").trim() : "";
  };

  const loadHistoryRemarks = async (rows) => {
    const targetRows = (Array.isArray(rows) ? rows : []).filter(
      (leave) =>
        leave?.status === "Rejected" ||
        leave?.status === "Approved" ||
        leave?.status === "Cancellation Requested" ||
        leave?.status === "Cancelled" ||
        leave?.status === "Approved by Manager",
    );

    if (targetRows.length === 0) {
      setHistoryRemarksByLeaveId({});
      return;
    }

    const pairs = await Promise.all(
      targetRows.map(async (leave) => {
        try {
          const audits = await leaveAPI.getAuditTrail(leave.id);
          return [leave.id, resolveLeaveRemark(leave, audits)];
        } catch {
          return [leave.id, ""];
        }
      }),
    );

    const next = {};
    pairs.forEach(([leaveId, remark]) => {
      if (remark) {
        next[leaveId] = remark;
      }
    });
    setHistoryRemarksByLeaveId(next);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [leaveRows, balanceRows, policy] = await Promise.all([
          leaveAPI.getMy(),
          leaveAPI.getMyBalance().catch(() => []),
          leaveAPI.getPolicy().catch(() => null),
        ]);

        setLeaves(Array.isArray(leaveRows) ? leaveRows : []);
        setLeaveBalances(Array.isArray(balanceRows) ? balanceRows : []);
        await loadHistoryRemarks(leaveRows);

        const gender = normalizeGender(user?.gender || user?.sex);
        const policyTypes = Array.isArray(policy?.leave_types)
          ? policy.leave_types
              .filter((item) => Boolean(item?.is_active))
              .filter((item) => isLeaveTypeEligible(item, gender))
              .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
              .map((item) => item.leave_type_name)
              .filter(Boolean)
          : [];

        setLeaveTypeOptions(policyTypes);
        setFormData((prev) => ({
          ...prev,
          type:
            policyTypes.includes(prev.type) && prev.type
              ? prev.type
              : (policyTypes[0] ?? ""),
        }));
      } catch {
        setLeaves([]);
        setLeaveBalances([]);
        setHistoryRemarksByLeaveId({});
        setLeaveTypeOptions([]);
        setFormData((prev) => ({ ...prev, type: "" }));
        showToast("error", "Failed to load leave data", {
          title: "Load Failed",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [showToast, user?.gender, user?.sex]);

  const userLeaves = useMemo(() => {
    const myLeaves = leaves.filter((item) => item.user_id === user?.id);
    if (filterStatus === "All") return myLeaves;
    return myLeaves.filter((item) => item.status === filterStatus);
  }, [leaves, user?.id, filterStatus]);

  const leaveSummary = useMemo(() => {
    const approved = userLeaves.filter((item) => item.status === "Approved");

    let fullDays = 0;
    let halfDays = 0;

    approved.forEach((leave) => {
      const start = new Date(leave.start_date);
      const end = new Date(leave.end_date);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      if (leave.half_day) {
        halfDays += days;
      } else {
        fullDays += days;
      }
    });

    const totalAvailable = leaveBalances.reduce(
      (acc, balance) => acc + (balance.available_days ?? 0),
      0,
    );

    return {
      fullDays,
      halfDays,
      pending: userLeaves.filter((item) => item.status === "Pending").length,
      approved: approved.length,
      rejected: userLeaves.filter((item) => item.status === "Rejected").length,
      balance: totalAvailable,
    };
  }, [userLeaves, leaveBalances]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      if (name === "halfDay" && checked && prev.startDateBS) {
        next.endDateBS = prev.startDateBS;
      }
      if (name === "startDateBS" && prev.halfDay) {
        next.endDateBS = value;
      }

      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.type) {
      showToast("error", "No active leave type is configured.", {
        title: "Policy Missing",
      });
      return;
    }

    if (!assignedManagerName) {
      showToast("error", "No assigned manager found. Contact HR.", {
        title: "Manager Required",
      });
      return;
    }

    if (formData.halfDay && formData.startDateBS !== formData.endDateBS) {
      showToast("error", "Half-day leave must have same start and end date.", {
        title: "Invalid Half Day",
      });
      return;
    }

    try {
      setSubmitting(true);

      const [startYear, startMonth, startDay] = formData.startDateBS
        .split("-")
        .map(Number);
      const [endYear, endMonth, endDay] = formData.endDateBS
        .split("-")
        .map(Number);

      const startNepali = new NepaliDate(startYear, startMonth - 1, startDay);
      const endNepali = new NepaliDate(endYear, endMonth - 1, endDay);
      const startDateAD = toLocalDateString(startNepali.toJsDate());
      const endDateAD = toLocalDateString(endNepali.toJsDate());

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDateValue = new Date(`${startDateAD}T00:00:00`);
      const endDateValue = new Date(`${endDateAD}T00:00:00`);

      if (startDateValue < today) {
        showToast("error", "Leave start date cannot be in the past.", {
          title: "Invalid Date",
        });
        return;
      }

      if (endDateValue < startDateValue) {
        showToast(
          "error",
          "Leave end date cannot be earlier than start date.",
          {
            title: "Invalid Date Range",
          },
        );
        return;
      }

      if (hasDateOverlap(startDateAD, endDateAD)) {
        showToast(
          "error",
          "You already requested leave for one or more selected date(s).",
          {
            title: "Duplicate Date",
          },
        );
        return;
      }

      await leaveAPI.create({
        user_id: user?.id,
        type: formData.type,
        start_date: startDateAD,
        end_date: endDateAD,
        reason: formData.reason,
        half_day: Boolean(formData.halfDay),
        status: "Pending",
        manager_id: null,
        manager_name: assignedManagerName,
      });

      await refreshMyLeaves();

      showToast("success", "Leave request submitted successfully", {
        title: "Request Submitted",
      });

      setFormData({
        type: leaveTypeOptions[0] || "",
        startDateBS: "",
        endDateBS: "",
        reason: "",
        halfDay: false,
      });
      setShowModal(false);
    } catch (error) {
      const errorMessage = getApiErrorMessage(
        error,
        "Failed to submit leave request",
      );
      showToast("error", errorMessage, {
        title: "Error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Leave Management
          </h1>
          <p className="text-slate-500 mt-1">
            Manage your leave requests and balance
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl flex items-center transition-colors shadow-lg shadow-blue-600/30"
        >
          <Plus size={20} className="mr-2" />
          Request Leave
        </button>
      </div>

      {/* Leave Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Leave Balance"
          value={leaveSummary.balance.toFixed(1)}
          icon={Calendar}
          iconClassName="text-blue-600"
          cardClassName="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100"
          footer={
            leaveBalances.length > 0 ? (
              <div className="space-y-0.5">
                {leaveBalances.map((b) => (
                  <p key={b.leave_type} className="text-xs text-slate-500">
                    {b.leave_type === "home" ? "Home" : "Sick"}:{" "}
                    {b.available_days.toFixed(1)} day(s)
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Days remaining</p>
            )
          }
        />

        <SummaryCard
          title="Full Day Leaves"
          value={leaveSummary.fullDays}
          subtitle="Days taken"
          icon={Clock}
          iconClassName="text-emerald-600"
          cardClassName="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-100"
        />

        <SummaryCard
          title="Half Day Leaves"
          value={leaveSummary.halfDays}
          subtitle="Half days taken"
          icon={Clock}
          iconClassName="text-orange-600"
          cardClassName="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100"
        />

        <SummaryCard
          title="Pending Requests"
          value={leaveSummary.pending}
          subtitle="Awaiting approval"
          icon={AlertCircle}
          iconClassName="text-purple-600"
          cardClassName="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100"
        />
      </div>

      {/* Leave Requests List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            My Leave Requests
          </h2>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={18} className="text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-2 w-full sm:w-auto"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved by Manager">Approved by Manager</option>
              <option value="Approved">Approved</option>
              <option value="Cancellation Requested">
                Cancellation Requested
              </option>
              <option value="Cancelled">Cancelled</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="px-6 py-10 text-center text-slate-500">
            Loading leave requests...
          </div>
        ) : (
          <>
            <div className="md:hidden p-4 space-y-3">
              {userLeaves.length > 0 ? (
                userLeaves.map((leave) => {
                  const start = new Date(leave.start_date);
                  const end = new Date(leave.end_date);
                  const days =
                    Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

                  return (
                    <div
                      key={leave.id}
                      className="rounded-xl border border-slate-200 p-4 bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {leave.type}
                          </p>
                          <p className="text-xs text-slate-500">
                            {leave.half_day
                              ? `${days} Half Day${days > 1 ? "s" : ""}`
                              : `${days} Full Day${days > 1 ? "s" : ""}`}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getLeaveRequestStatusColor(
                            leave.status,
                          )}`}
                        >
                          {leave.status}
                        </span>
                      </div>
                      <div className="mt-3 text-xs text-slate-600 space-y-1">
                        <p>
                          Date: {formatAdToBs(leave.start_date)} to{" "}
                          {formatAdToBs(leave.end_date)}
                        </p>
                        <p className="line-clamp-3">Reason: {leave.reason}</p>
                        <p className="line-clamp-2">
                          Remarks: {historyRemarksByLeaveId[leave.id] || "-"}
                        </p>
                        <p>Approved By: {leave.manager_name || "-"}</p>
                      </div>
                      {canCancelLeave(leave) && (
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={() => openCancelModal(leave)}
                            disabled={submitting}
                            className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
                          >
                            {getCancelActionLabel(leave)}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="px-3 py-8 text-center text-slate-500">
                  No leave requests found
                </div>
              )}
            </div>

            <div className="hidden md:block overflow-x-auto">
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
                      Remarks
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Approved By
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {userLeaves.length > 0 ? (
                    userLeaves.map((leave) => {
                      const start = new Date(leave.start_date);
                      const end = new Date(leave.end_date);
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
                              {leave.half_day
                                ? `${days} Half Day${days > 1 ? "s" : ""}`
                                : `${days} Full Day${days > 1 ? "s" : ""}`}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-slate-600">
                              <div>{formatAdToBs(leave.start_date)}</div>
                              <div className="text-xs text-slate-400">
                                to {formatAdToBs(leave.end_date)}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-slate-600 max-w-xs truncate">
                              {leave.reason}
                            </p>
                          </td>
                          <td
                            className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate"
                            title={historyRemarksByLeaveId[leave.id] || ""}
                          >
                            {historyRemarksByLeaveId[leave.id] || "-"}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(leave.status)}
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${getLeaveRequestStatusColor(
                                  leave.status,
                                )}`}
                              >
                                {leave.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-slate-600">
                              {leave.manager_name || "-"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {canCancelLeave(leave) ? (
                              <button
                                type="button"
                                onClick={() => openCancelModal(leave)}
                                disabled={submitting}
                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
                              >
                                {getCancelActionLabel(leave)}
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center">
                        <Calendar
                          size={48}
                          className="mx-auto text-slate-300 mb-3"
                        />
                        <p className="text-slate-500">
                          No leave requests found
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Request Leave Modal */}
      {showCancelModal && cancelTargetLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-base font-semibold text-slate-800">
                {getCancelActionLabel(cancelTargetLeave)} Leave
              </h3>
              <button
                type="button"
                onClick={closeCancelModal}
                className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 px-5 py-4 text-sm text-slate-600">
              <p>
                <span className="font-medium text-slate-700">Type:</span>{" "}
                {cancelTargetLeave.type}
              </p>
              <p>
                <span className="font-medium text-slate-700">Dates:</span>{" "}
                {formatAdToBs(cancelTargetLeave.start_date)} to{" "}
                {formatAdToBs(cancelTargetLeave.end_date)}
              </p>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Cancel Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                  placeholder="Please explain why you want to cancel this leave"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
              <button
                type="button"
                onClick={closeCancelModal}
                disabled={submitting}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitCancelLeave}
                disabled={submitting}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800">
                Request Leave
              </h2>
            </div>

            <form noValidate onSubmit={handleSubmit} className="p-4 space-y-4">
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
                  {leaveTypeOptions.length === 0 && (
                    <option value="">No leave type configured</option>
                  )}
                  {leaveTypeOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
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
                    setFormData((prev) => ({
                      ...prev,
                      startDateBS: date,
                      endDateBS: prev.halfDay ? date : prev.endDateBS,
                    }))
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
                  disabled={formData.halfDay}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Approving Manager <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={assignedManagerName || "Not assigned"}
                  readOnly
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 text-slate-600"
                />
                {!assignedManagerName && (
                  <p className="text-xs text-red-600 mt-1">
                    Assigned manager is missing. Contact HR before requesting
                    leave.
                  </p>
                )}
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
                  disabled={submitting || leaveTypeOptions.length === 0}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm shadow-lg shadow-blue-600/30"
                >
                  {submitting ? "Submitting..." : "Submit Request"}
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
