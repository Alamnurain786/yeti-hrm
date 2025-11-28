import { useState } from "react";
import { useMockData } from "../context/MockData";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { Send, Calendar } from "lucide-react";

const LeaveRequest = () => {
  const { user } = useAuth();
  const { users, addLeaveRequest } = useMockData();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    type: "Casual Leave",
    startDate: "",
    endDate: "",
    reason: "",
    managerId: "",
  });
  const [success, setSuccess] = useState("");

  // Get potential managers (HRs and Superadmins, or specific managers if we had that role)
  // For this mock, we'll list all HRs and Superadmins as potential managers
  const managers = users.filter(
    (u) => u.role === "hr" || u.role === "superadmin"
  );

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const manager = users.find((u) => u.id === formData.managerId);

    addLeaveRequest({
      userId: user.id,
      userName: user.name,
      ...formData,
      managerName: manager?.name || "Unknown",
      requestedAt: new Date().toLocaleDateString(),
    });

    setSuccess("Leave request sent successfully!");
    showToast("success", "Leave request sent successfully!", {
      title: "Leave Requested",
    });
    setFormData({
      type: "Casual Leave",
      startDate: "",
      endDate: "",
      reason: "",
      managerId: "",
    });
    setTimeout(() => setSuccess(""), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Request Leave</h1>
        <p className="text-slate-500 mt-1">
          Submit a leave request for approval.
        </p>
      </div>

      {success && (
        <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl border border-emerald-100 flex items-center">
          <Send size={20} className="mr-2" />
          {success}
        </div>
      )}

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Leave Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
              >
                <option>Casual Leave</option>
                <option>Sick Leave</option>
                <option>Earned Leave</option>
                <option>Unpaid Leave</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Approving Manager
              </label>
              <select
                name="managerId"
                value={formData.managerId}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                required
              >
                <option value="">Select Manager</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Reason
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none h-32 resize-none"
              placeholder="Please describe the reason for your leave..."
              required
            ></textarea>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center transition-colors shadow-lg shadow-blue-600/30 font-medium"
            >
              <Send size={20} className="mr-2" />
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeaveRequest;
