import { useEffect, useState } from "react";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { Send } from "lucide-react";
import NepaliDatePicker from "../components/NepaliDatePicker";
import NepaliDate from "nepali-date-converter";
import { getApiErrorMessage, leaveAPI } from "../services/backendApi";

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

const LeaveRequest = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [leaveTypeOptions, setLeaveTypeOptions] = useState([]);
  const [myLeaves, setMyLeaves] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: "",
    startDateBS: "",
    endDateBS: "",
    reason: "",
    halfDay: false,
  });
  const [success, setSuccess] = useState("");
  const assignedManagerName = String(user?.manager || "").trim();

  const hasDateOverlap = (startDate, endDate) => {
    return myLeaves.some((leave) => {
      if (leave?.status === "Rejected" || leave?.status === "Cancelled")
        return false;
      if (!leave?.start_date || !leave?.end_date) return false;
      return leave.start_date <= endDate && leave.end_date >= startDate;
    });
  };

  useEffect(() => {
    const loadManagersAndPolicy = async () => {
      try {
        const [policy, existingLeaves] = await Promise.all([
          leaveAPI.getPolicy().catch(() => null),
          leaveAPI.getMy().catch(() => []),
        ]);

        const gender = normalizeGender(user?.gender || user?.sex);
        const policyTypes = Array.isArray(policy?.leave_types)
          ? policy.leave_types
              .filter((item) => Boolean(item?.is_active))
              .filter((item) => isLeaveTypeEligible(item, gender))
              .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
              .map((item) => item.leave_type_name)
              .filter(Boolean)
          : [];

        const nextOptions = policyTypes;
        setLeaveTypeOptions(nextOptions);
        setMyLeaves(Array.isArray(existingLeaves) ? existingLeaves : []);
        setFormData((prev) => ({
          ...prev,
          type:
            nextOptions.includes(prev.type) && prev.type
              ? prev.type
              : (nextOptions[0] ?? ""),
        }));
      } catch {
        setLeaveTypeOptions([]);
        setMyLeaves([]);
        setFormData((prev) => ({
          ...prev,
          type: "",
        }));
      }
    };
    loadManagersAndPolicy();
  }, [user?.role, user?.gender, user?.sex]);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
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

    if (!formData.startDateBS || !formData.endDateBS) {
      showToast("error", "Please select start and end date.", {
        title: "Date Required",
      });
      return;
    }

    if (formData.halfDay && formData.startDateBS !== formData.endDateBS) {
      showToast("error", "Half-day leave must have same start and end date.", {
        title: "Invalid Half Day",
      });
      return;
    }

    setSubmitting(true);
    try {
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
        user_id: user.id,
        type: formData.type,
        start_date: startDateAD,
        end_date: endDateAD,
        reason: formData.reason,
        half_day: Boolean(formData.halfDay),
        status: "Pending",
        manager_id: null,
        manager_name: assignedManagerName,
      });

      setSuccess("Leave request sent successfully!");
      showToast("success", "Leave request sent successfully!", {
        title: "Leave Requested",
      });
      setMyLeaves((prev) => [
        ...prev,
        {
          start_date: startDateAD,
          end_date: endDateAD,
          status: "Pending",
        },
      ]);
      setFormData({
        type: leaveTypeOptions[0] || "",
        startDateBS: "",
        endDateBS: "",
        reason: "",
        halfDay: false,
      });
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      const backendFieldError =
        error?.response?.data?.error?.details?.errors?.type ||
        error?.response?.data?.error?.message ||
        error?.response?.data?.detail;
      const errorMessage =
        (typeof backendFieldError === "string" && backendFieldError.trim()) ||
        getApiErrorMessage(error, "Failed to submit leave request.");
      showToast("error", errorMessage, {
        title: "Request Failed",
      });
    } finally {
      setSubmitting(false);
    }
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
        <form noValidate onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Leave Type <span className="text-red-500">*</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
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
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Approving Manager <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={assignedManagerName || "Not assigned"}
                readOnly
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-600"
              />
              {!assignedManagerName && (
                <p className="text-xs text-red-600 mt-1">
                  Assigned manager is missing. Contact HR before requesting
                  leave.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
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
              <label className="block text-sm font-medium text-slate-700 mb-2">
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
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="halfDay"
                checked={formData.halfDay}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <span>Half Day Leave</span>
            </label>
            {formData.halfDay && (
              <p className="text-xs text-slate-500 mt-1">
                End date is locked to start date for half-day leave.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Reason <span className="text-red-500">*</span>
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
              disabled={submitting || leaveTypeOptions.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center transition-colors shadow-lg shadow-blue-600/30 font-medium"
            >
              <Send size={20} className="mr-2" />
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeaveRequest;
