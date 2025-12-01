import { useState } from "react";
// import { useMockData } from "../context/MockData";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { CheckCircle, XCircle, Clock } from "lucide-react";

const LeaveApprovals = () => {
  const { user } = useAuth();
  const { leaves, updateLeaveStatus } = useMockData();
  const { showToast } = useToast();
  const [filter, setFilter] = useState("Pending");

  // Filter logic:
  // 1. Managers see requests assigned to them.
  // 2. HR sees requests assigned to them OR requests approved by Manager (waiting for HR final approval).
  // Note: For this mock, we'll assume "Approved" by Manager means it needs HR approval if the manager wasn't HR.
  // But to keep it simple: Manager approves -> Status "Approved by Manager". HR approves "Approved by Manager" -> "Approved".

  const myApprovals = leaves.filter((leave) => {
    // If I am the assigned manager
    if (leave.managerId === user.id) {
      return leave.status === filter;
    }
    // If I am HR, I can see requests that are "Approved by Manager" (escalated to HR)
    // or if I am the manager myself.
    if (user.role === "hr" && leave.status === "Approved by Manager") {
      return true;
    }
    return false;
  });

  const handleApprove = (id) => {
    if (user.role === "hr") {
      updateLeaveStatus(id, "Approved", user.name);
      showToast("success", "Leave has been approved.", {
        title: "Leave Approved",
      });
    } else {
      // If just a manager (not HR), status becomes "Approved by Manager"
      updateLeaveStatus(id, "Approved by Manager", user.name);
      showToast("info", "Forwarded to HR for final approval.", {
        title: "Approved by Manager",
      });
    }
  };

  const handleReject = (id) => {
    updateLeaveStatus(id, "Rejected", user.name);
    showToast("error", "Leave has been rejected.", { title: "Leave Rejected" });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "bg-emerald-100 text-emerald-600";
      case "Approved by Manager":
        return "bg-blue-100 text-blue-600";
      case "Rejected":
        return "bg-red-100 text-red-600";
      default:
        return "bg-orange-100 text-orange-600";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Leave Approvals</h1>
        <p className="text-slate-500 mt-1">Review and manage leave requests.</p>
      </div>

      <div className="flex space-x-2 border-b border-slate-200 pb-1">
        {["Pending", "Approved by Manager", "Approved", "Rejected"].map(
          (status) => (
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
          )
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {myApprovals.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No requests found with status "{filter}".
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                      {leave.userName}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{leave.type}</td>
                    <td className="px-6 py-4 text-slate-600 text-sm">
                      {leave.startDate} to {leave.endDate}
                    </td>
                    <td
                      className="px-6 py-4 text-slate-600 max-w-xs truncate"
                      title={leave.reason}
                    >
                      {leave.reason}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          leave.status
                        )}`}
                      >
                        {leave.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {leave.status !== "Approved" &&
                        leave.status !== "Rejected" && (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleApprove(leave.id)}
                              className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors"
                              title="Approve"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => handleReject(leave.id)}
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
        )}
      </div>
    </div>
  );
};

export default LeaveApprovals;
