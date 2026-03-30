import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { CheckCircle, XCircle } from "lucide-react";
import { leaveAPI, userAPI } from "../services/backendApi";
import { getLeaveApprovalStatusColor } from "../utils/statusUi";

const LeaveApprovals = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [leaves, setLeaves] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Pending");
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [activeAction, setActiveAction] = useState(null);
  const [actionRemark, setActionRemark] = useState("");
  const [historyRemarksByLeaveId, setHistoryRemarksByLeaveId] = useState({});
  const [balanceByUserId, setBalanceByUserId] = useState({});
  const [balanceLoadingByUserId, setBalanceLoadingByUserId] = useState({});

  const resolveLeaveRemark = (leave, audits) => {
    if (!Array.isArray(audits) || audits.length === 0) return "";

    if (leave?.status === "Cancellation Requested") {
      const cancellationAudit = audits.find(
        (item) =>
          item?.to_status === "Cancellation Requested" &&
          String(item?.comments || "").trim(),
      );
      if (cancellationAudit)
        return String(cancellationAudit.comments || "").trim();
    }

    if (leave?.status === "Cancelled") {
      const cancelledAudit = audits.find(
        (item) =>
          item?.to_status === "Cancelled" &&
          String(item?.comments || "").trim(),
      );
      if (cancelledAudit) return String(cancelledAudit.comments || "").trim();
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

  const isHrRole = user?.role === "admin" || user?.role === "superadmin";
  const isManagerRole =
    user?.role === "user" &&
    (Boolean(user?.is_section_manager) ||
      /manager/i.test(String(user?.position || "")));

  const isAssignedToCurrentUser = (leave) => {
    if (!user) return false;
    const myId = String(user.id || "");
    const leaveManagerId = String(leave.manager_id || "");
    const myName = String(user.name || "")
      .trim()
      .toLowerCase();
    const leaveManagerName = String(leave.manager_name || "")
      .trim()
      .toLowerCase();

    return (
      (leaveManagerId && leaveManagerId === myId) ||
      (leaveManagerName && leaveManagerName === myName)
    );
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (isHrRole) {
        const [leaveRows, userRows] = await Promise.all([
          leaveAPI.getAll(),
          userAPI.getAll(),
        ]);
        setLeaves(Array.isArray(leaveRows) ? leaveRows : []);
        setUsers(Array.isArray(userRows) ? userRows : []);
        await loadHistoryRemarks(leaveRows);

        const actionableRows = (
          Array.isArray(leaveRows) ? leaveRows : []
        ).filter(
          (leave) =>
            leave.status === "Pending" ||
            leave.status === "Approved by Manager",
        );
        const targetUserIds = Array.from(
          new Set(actionableRows.map((leave) => leave.user_id).filter(Boolean)),
        );

        if (targetUserIds.length > 0) {
          setBalanceLoadingByUserId((prev) => {
            const next = { ...prev };
            targetUserIds.forEach((userId) => {
              next[userId] = true;
            });
            return next;
          });

          const balanceRows = await Promise.all(
            targetUserIds.map(async (userId) => {
              try {
                const rows = await leaveAPI.getUserBalance(userId);
                return [userId, Array.isArray(rows) ? rows : []];
              } catch {
                return [userId, []];
              }
            }),
          );

          setBalanceByUserId((prev) => {
            const next = { ...prev };
            balanceRows.forEach(([userId, rows]) => {
              next[userId] = rows;
            });
            return next;
          });

          setBalanceLoadingByUserId((prev) => {
            const next = { ...prev };
            targetUserIds.forEach((userId) => {
              next[userId] = false;
            });
            return next;
          });
        }
      } else {
        const leaveRows = await leaveAPI.getAll();
        setLeaves(Array.isArray(leaveRows) ? leaveRows : []);
        setUsers([]);
        await loadHistoryRemarks(leaveRows);
      }
    } catch {
      showToast("error", "Failed to load leave requests.", {
        title: "Load Failed",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isHrRole]);

  const myApprovals = useMemo(
    () =>
      leaves.filter((leave) => {
        if (leave.status !== filter) return false;
        if (isHrRole) return true;
        if (!isManagerRole) return false;
        return isAssignedToCurrentUser(leave);
      }),
    [leaves, filter, isHrRole, isManagerRole],
  );

  const getUserName = (userId) => {
    const found = users.find((item) => item.id === userId);
    return found?.name || userId || "-";
  };

  const getApprovalButtonLabel = (status) => {
    if (status === "Cancellation Requested") {
      return "Approve Cancel";
    }
    if (status === "Approved by Manager") {
      return "Final Approve";
    }
    if (status === "Pending") {
      return isHrRole ? "Approve" : "Manager Approve";
    }
    return "Approve";
  };

  const canApproveCurrentRequest = (leave) => {
    if (leave.status === "Rejected" || leave.status === "Cancelled") {
      return false;
    }
    if (leave.status === "Cancellation Requested") {
      return isHrRole;
    }
    if (leave.status === "Approved by Manager") {
      return isHrRole;
    }
    if (leave.status === "Pending") {
      return isHrRole || (isManagerRole && isAssignedToCurrentUser(leave));
    }
    return false;
  };

  const estimateChargedDays = (leave) => {
    const charged = Number(leave?.charged_days);
    if (!Number.isNaN(charged) && charged > 0) {
      return charged;
    }
    if (!leave?.start_date || !leave?.end_date) {
      return leave?.half_day ? 0.5 : 0;
    }
    const start = new Date(`${leave.start_date}T00:00:00`);
    const end = new Date(`${leave.end_date}T00:00:00`);
    const totalDays = Math.max(
      0,
      Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1,
    );
    return leave?.half_day ? 0.5 : totalDays;
  };

  const findBucketBalance = (userId, bucket) => {
    const rows = balanceByUserId[userId];
    if (!Array.isArray(rows) || rows.length === 0) {
      return null;
    }
    const row = rows.find(
      (item) =>
        String(item?.leave_type || "").toLowerCase() ===
        String(bucket || "").toLowerCase(),
    );
    if (!row) {
      return null;
    }
    return Number(row.available_days ?? 0);
  };

  const renderBalancePreview = (leave) => {
    if (!isHrRole || !canApproveCurrentRequest(leave)) {
      return null;
    }

    const userId = leave.user_id;
    const bucket = String(leave?.leave_bucket || "")
      .trim()
      .toLowerCase();
    const chargedDays = estimateChargedDays(leave);

    if (!bucket || chargedDays <= 0) {
      return (
        <p className="text-[11px] text-slate-500 mt-1">
          No leave-balance deduction for this request.
        </p>
      );
    }

    if (balanceLoadingByUserId[userId]) {
      return (
        <p className="text-[11px] text-slate-500 mt-1">
          Loading balance preview...
        </p>
      );
    }

    const current = findBucketBalance(userId, bucket);
    if (current === null || Number.isNaN(current)) {
      return (
        <p className="text-[11px] text-slate-500 mt-1">
          Current {bucket} balance unavailable.
        </p>
      );
    }

    const afterApproval = current - chargedDays;
    const afterClass = afterApproval < 0 ? "text-red-600" : "text-slate-700";

    return (
      <p className="text-[11px] text-slate-600 mt-1">
        {bucket} balance: current {current.toFixed(1)} day(s) {"->"} after
        approval{" "}
        <span className={afterClass}>{afterApproval.toFixed(1)} day(s)</span>
      </p>
    );
  };

  const openActionModal = (leave, action) => {
    setActiveAction({ leaveId: leave.id, action });
    setActionRemark("");
  };

  const closeActionModal = () => {
    if (activeAction && actionLoadingId === activeAction.leaveId) return;
    setActiveAction(null);
    setActionRemark("");
  };

  const handleApprove = async (id, remarks = "") => {
    setActionLoadingId(id);
    try {
      const leave = leaves.find((item) => item.id === id);
      if (!leave) return;

      const targetStatus =
        leave.status === "Cancellation Requested" ? "Cancelled" : "Approved";

      await leaveAPI.update(id, {
        status: targetStatus,
        manager_id: user.id,
        manager_name: user.name,
        comments: String(remarks || "").trim() || null,
      });

      const title =
        leave.status === "Cancellation Requested"
          ? "Leave Cancelled"
          : leave.status === "Pending" && !isHrRole
            ? "Sent To HR"
            : "Leave Approved";
      const message =
        leave.status === "Cancellation Requested"
          ? "Cancellation request approved and leave cancelled."
          : leave.status === "Pending" && !isHrRole
            ? "Manager approval recorded. Request sent to HR for final approval."
            : "Leave has been approved.";

      showToast("success", message, { title });
      closeActionModal();
      await loadData();
    } catch {
      showToast("error", "Failed to approve leave.", {
        title: "Update Failed",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id, remarks = "") => {
    const reason = String(remarks || "").trim();
    if (!reason) {
      showToast("error", "Please add rejection reason before rejecting.", {
        title: "Reason Required",
      });
      return;
    }

    setActionLoadingId(id);
    try {
      const leave = leaves.find((item) => item.id === id);
      if (!leave) return;
      const targetStatus =
        leave.status === "Cancellation Requested" ? "Approved" : "Rejected";

      await leaveAPI.update(id, {
        status: targetStatus,
        manager_id: user.id,
        manager_name: user.name,
        comments: reason,
      });
      if (leave.status === "Cancellation Requested") {
        showToast(
          "info",
          "Cancellation request rejected. Leave remains approved.",
          {
            title: "Cancellation Rejected",
          },
        );
      } else {
        showToast("error", "Leave has been rejected.", {
          title: "Leave Rejected",
        });
      }
      closeActionModal();
      await loadData();
    } catch {
      showToast("error", "Failed to reject leave.", {
        title: "Update Failed",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const selectedLeave = useMemo(() => {
    if (!activeAction?.leaveId) return null;
    return leaves.find((item) => item.id === activeAction.leaveId) || null;
  }, [activeAction, leaves]);

  const submitActionModal = async () => {
    if (!activeAction?.leaveId) return;
    if (activeAction.action === "reject") {
      await handleReject(activeAction.leaveId, actionRemark);
      return;
    }
    await handleApprove(activeAction.leaveId, actionRemark);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Leave Approvals</h1>
        <p className="text-slate-500 mt-1">
          {isHrRole
            ? "Review and finalize leave requests."
            : "Review leave requests assigned to you."}
        </p>
      </div>

      <div className="flex space-x-2 border-b border-slate-200 pb-1 overflow-x-auto">
        {[
          "Pending",
          "Approved by Manager",
          "Cancellation Requested",
          "Approved",
          "Cancelled",
          "Rejected",
        ].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              filter === status
                ? "bg-white border-b-2 border-blue-600 text-blue-600"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">
            Loading requests...
          </div>
        ) : myApprovals.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No requests found with status "{filter}".
          </div>
        ) : (
          <>
            <div className="md:hidden p-4 space-y-3">
              {myApprovals.map((leave) => (
                <div
                  key={leave.id}
                  className="rounded-xl border border-slate-200 p-4 bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {getUserName(leave.user_id)}
                      </p>
                      <p className="text-xs text-slate-500">{leave.type}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getLeaveApprovalStatusColor(
                        leave.status,
                      )}`}
                    >
                      {leave.status}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-slate-600">
                    <p>
                      Date: {leave.start_date} to {leave.end_date}
                    </p>
                    <p className="line-clamp-3">
                      Reason: {leave.reason || "-"}
                    </p>
                    <p className="line-clamp-2">
                      Remarks: {historyRemarksByLeaveId[leave.id] || "-"}
                    </p>
                  </div>

                  {renderBalancePreview(leave)}

                  {canApproveCurrentRequest(leave) && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => openActionModal(leave, "approve")}
                        disabled={actionLoadingId === leave.id}
                        className="flex-1 p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors text-xs font-medium"
                      >
                        {getApprovalButtonLabel(leave.status)}
                      </button>
                      <button
                        onClick={() => openActionModal(leave, "reject")}
                        disabled={actionLoadingId === leave.id}
                        className="flex-1 p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-xs font-medium"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Type
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
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myApprovals.map((leave) => (
                    <tr
                      key={leave.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {getUserName(leave.user_id)}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{leave.type}</td>
                      <td className="px-6 py-4 text-slate-600 text-sm">
                        {leave.start_date} to {leave.end_date}
                      </td>
                      <td
                        className="px-6 py-4 text-slate-600 max-w-xs truncate"
                        title={leave.reason}
                      >
                        <div>
                          <p className="truncate">{leave.reason}</p>
                          {renderBalancePreview(leave)}
                        </div>
                      </td>
                      <td
                        className="px-6 py-4 text-slate-600 max-w-xs truncate"
                        title={historyRemarksByLeaveId[leave.id] || ""}
                      >
                        {historyRemarksByLeaveId[leave.id] || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getLeaveApprovalStatusColor(
                            leave.status,
                          )}`}
                        >
                          {leave.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {canApproveCurrentRequest(leave) && (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => openActionModal(leave, "approve")}
                              disabled={actionLoadingId === leave.id}
                              className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors"
                              title={getApprovalButtonLabel(leave.status)}
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => openActionModal(leave, "reject")}
                              disabled={actionLoadingId === leave.id}
                              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                              title="Reject"
                            >
                              <XCircle size={18} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedLeave && activeAction && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
                <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <h3 className="text-base font-semibold text-slate-800">
                      {activeAction.action === "reject"
                        ? "Reject Leave Request"
                        : `${getApprovalButtonLabel(selectedLeave.status)} Request`}
                    </h3>
                    <button
                      type="button"
                      onClick={closeActionModal}
                      className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
                    >
                      Close
                    </button>
                  </div>

                  <div className="space-y-3 px-5 py-4">
                    <div className="text-sm text-slate-600">
                      <p>
                        <span className="font-medium text-slate-700">
                          Employee:
                        </span>{" "}
                        {getUserName(selectedLeave.user_id)}
                      </p>
                      <p>
                        <span className="font-medium text-slate-700">
                          Type:
                        </span>{" "}
                        {selectedLeave.type}
                      </p>
                      <p>
                        <span className="font-medium text-slate-700">
                          Dates:
                        </span>{" "}
                        {selectedLeave.start_date} to {selectedLeave.end_date}
                      </p>
                    </div>

                    {renderBalancePreview(selectedLeave)}

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        {activeAction.action === "reject"
                          ? "Rejection Reason"
                          : "Approval Remarks (optional)"}
                      </label>
                      <textarea
                        value={actionRemark}
                        onChange={(e) => setActionRemark(e.target.value)}
                        rows={3}
                        placeholder={
                          activeAction.action === "reject"
                            ? selectedLeave.status === "Cancellation Requested"
                              ? "Please provide a reason for rejecting cancellation"
                              : "Please provide a reason for rejection"
                            : "Add any note for this approval"
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
                    <button
                      type="button"
                      onClick={closeActionModal}
                      disabled={actionLoadingId === selectedLeave.id}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={submitActionModal}
                      disabled={actionLoadingId === selectedLeave.id}
                      className={`rounded-xl px-4 py-2 text-sm font-medium text-white disabled:opacity-60 ${
                        activeAction.action === "reject"
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-emerald-600 hover:bg-emerald-700"
                      }`}
                    >
                      {actionLoadingId === selectedLeave.id
                        ? "Submitting..."
                        : activeAction.action === "reject"
                          ? "Confirm Reject"
                          : "Confirm Approve"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LeaveApprovals;
