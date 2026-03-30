import { useEffect, useMemo, useState } from "react";
import { Calendar, Plus, Save, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import NepaliDate from "nepali-date-converter";
import NepaliDatePicker from "./NepaliDatePicker";
import {
  attendanceAPI,
  getApiErrorMessage,
  leaveAPI,
} from "../services/backendApi";

const WEEK_DAYS = [
  { value: 0, label: "Monday" },
  { value: 1, label: "Tuesday" },
  { value: 2, label: "Wednesday" },
  { value: 3, label: "Thursday" },
  { value: 4, label: "Friday" },
  { value: 5, label: "Saturday" },
  { value: 6, label: "Sunday" },
];

const formatLocalDateYmd = (dateValue) => {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const bsToAdYmd = (bsDate) => {
  const [year, month, day] = String(bsDate || "")
    .split("-")
    .map(Number);
  if (!year || !month || !day) return "";
  const adDate = new NepaliDate(year, month - 1, day).toJsDate();
  return formatLocalDateYmd(adDate);
};

const adToBsYmd = (adDate) => {
  const [year, month, day] = String(adDate || "")
    .split("-")
    .map(Number);
  if (!year || !month || !day) return "";
  const bsDate = new NepaliDate(new Date(year, month - 1, day));
  return `${bsDate.getYear()}-${String(bsDate.getMonth() + 1).padStart(2, "0")}-${String(bsDate.getDate()).padStart(2, "0")}`;
};

const normalizeWeekDays = (values) => {
  if (!Array.isArray(values)) return [];
  const normalized = values
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item >= 0 && item <= 6);
  return Array.from(new Set(normalized)).sort((a, b) => a - b);
};

const LeavePolicySettings = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [holidayLoading, setHolidayLoading] = useState(false);
  const [holidaySaving, setHolidaySaving] = useState(false);
  const [deletingHolidayId, setDeletingHolidayId] = useState("");
  const [holidays, setHolidays] = useState([]);
  const [recalcForm, setRecalcForm] = useState({
    start_date_bs: "",
    end_date_bs: "",
    insufficient_strategy: "negative",
  });
  const [recalcPreview, setRecalcPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [holidayForm, setHolidayForm] = useState({
    date_bs: "",
    title: "",
    holiday_type: "administrative",
    is_leave_day: true,
  });
  const [formData, setFormData] = useState({
    weekly_off_days: [5],
    leave_types: [],
  });
  const [workflow, setWorkflow] = useState({
    approval_mode: "single_step",
    allow_admin_direct_approval: true,
  });
  const [workflowSaving, setWorkflowSaving] = useState(false);

  const sortedTypes = useMemo(
    () =>
      [...formData.leave_types].sort(
        (a, b) => (a.sort_order || 0) - (b.sort_order || 0),
      ),
    [formData.leave_types],
  );

  useEffect(() => {
    const fetchPolicyAndCalendar = async () => {
      setLoading(true);
      setHolidayLoading(true);
      setAccessDenied(false);
      try {
        const [data, holidayRows, workflowData] = await Promise.all([
          leaveAPI.getPolicy(),
          leaveAPI.getHolidays().catch(() => []),
          leaveAPI.getApprovalWorkflow().catch(() => null),
        ]);

        setFormData({
          weekly_off_days: normalizeWeekDays(data?.weekly_off_days),
          leave_types: Array.isArray(data?.leave_types) ? data.leave_types : [],
        });
        const sortedHolidayRows = Array.isArray(holidayRows)
          ? [...holidayRows].sort((a, b) =>
              String(a.date_ad || "").localeCompare(String(b.date_ad || "")),
            )
          : [];
        setHolidays(sortedHolidayRows);

        if (workflowData && typeof workflowData === "object") {
          setWorkflow({
            approval_mode:
              workflowData.approval_mode === "manager_then_admin"
                ? "manager_then_admin"
                : "single_step",
            allow_admin_direct_approval: Boolean(
              workflowData.allow_admin_direct_approval ?? true,
            ),
          });
        }
      } catch (error) {
        if (error?.response?.status === 403) {
          setAccessDenied(true);
          return;
        }
        showToast(
          "error",
          getApiErrorMessage(error, "Failed to load leave policy"),
          {
            title: "Load Failed",
          },
        );
      } finally {
        setLoading(false);
        setHolidayLoading(false);
      }
    };

    fetchPolicyAndCalendar();
  }, [showToast, user?.id]);

  const updateTypeRow = (index, key, value) => {
    setFormData((prev) => {
      const next = [...prev.leave_types];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, leave_types: next };
    });
    setHasChanges(true);
  };

  const toggleWeeklyOff = (day) => {
    setFormData((prev) => {
      const normalizedDays = normalizeWeekDays(prev.weekly_off_days);
      const exists = normalizedDays.includes(day);
      const updated = exists
        ? normalizedDays.filter((item) => item !== day)
        : [...normalizedDays, day];
      return {
        ...prev,
        weekly_off_days: updated,
      };
    });
    setHasChanges(true);
  };

  const addLeaveType = () => {
    setFormData((prev) => ({
      ...prev,
      leave_types: [
        ...prev.leave_types,
        {
          leave_type_name: "",
          gender_rule: "all",
          annual_days: 0,
          leave_bucket: "home",
          is_active: true,
          sort_order: prev.leave_types.length + 1,
        },
      ],
    }));
    setHasChanges(true);
  };

  const removeLeaveType = (index) => {
    setFormData((prev) => ({
      ...prev,
      leave_types: prev.leave_types.filter((_, i) => i !== index),
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    const normalizedWeeklyOffDays = normalizeWeekDays(formData.weekly_off_days);
    if (normalizedWeeklyOffDays.length === 0) {
      showToast("error", "Please select at least one weekly off day", {
        title: "Validation Error",
      });
      return;
    }

    const hasEmptyName = formData.leave_types.some(
      (item) => !String(item.leave_type_name || "").trim(),
    );
    if (hasEmptyName) {
      showToast("error", "Leave type name cannot be empty", {
        title: "Validation Error",
      });
      return;
    }

    const invalidDaysRow = formData.leave_types.find((item) => {
      const value = String(item.annual_days ?? "").trim();
      if (!value) return false;
      const parsed = Number(value);
      return Number.isNaN(parsed) || parsed < 0;
    });
    if (invalidDaysRow) {
      const label =
        String(invalidDaysRow.leave_type_name || "").trim() || "a leave type";
      showToast("error", `Annual days cannot be negative for ${label}.`, {
        title: "Validation Error",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        weekly_off_days: normalizedWeeklyOffDays,
        leave_types: formData.leave_types.map((item, index) => ({
          ...item,
          annual_days: Number(String(item.annual_days ?? "").trim() || 0),
          sort_order: Number(item.sort_order ?? index + 1),
        })),
      };

      const updated = await leaveAPI.updatePolicy(payload);
      setFormData({
        weekly_off_days: normalizeWeekDays(updated?.weekly_off_days),
        leave_types: Array.isArray(updated?.leave_types)
          ? updated.leave_types
          : [],
      });
      setHasChanges(false);
      showToast("success", "Leave policy updated successfully", {
        title: "Policy Saved",
      });
    } catch (error) {
      showToast(
        "error",
        getApiErrorMessage(error, "Failed to update leave policy"),
        {
          title: "Save Failed",
        },
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWorkflow = async () => {
    setWorkflowSaving(true);
    try {
      await leaveAPI.updateApprovalWorkflow({
        approval_mode: workflow.approval_mode,
        allow_admin_direct_approval: workflow.allow_admin_direct_approval,
      });
      showToast("success", "Approval workflow updated", {
        title: "Workflow Saved",
      });
    } catch (error) {
      showToast(
        "error",
        getApiErrorMessage(error, "Failed to save approval workflow"),
        {
          title: "Save Failed",
        },
      );
    } finally {
      setWorkflowSaving(false);
    }
  };

  const handleSaveCalendarDay = async () => {
    if (!holidayForm.date_bs) {
      showToast("error", "Please select Nepali date", {
        title: "Validation Error",
      });
      return;
    }

    const dateAd = bsToAdYmd(holidayForm.date_bs);
    if (!dateAd) {
      showToast("error", "Invalid Nepali date selected", {
        title: "Validation Error",
      });
      return;
    }

    setHolidaySaving(true);
    try {
      await leaveAPI.createHoliday({
        date_ad: dateAd,
        holiday_type: holidayForm.holiday_type || "administrative",
        title:
          String(holidayForm.title || "").trim() ||
          (holidayForm.is_leave_day ? "Company Leave Day" : "Working Day"),
        is_working_day: !holidayForm.is_leave_day,
      });
      const updatedRows = await leaveAPI.getHolidays();
      const sortedRows = Array.isArray(updatedRows)
        ? [...updatedRows].sort((a, b) =>
            String(a.date_ad || "").localeCompare(String(b.date_ad || "")),
          )
        : [];
      setHolidays(sortedRows);
      setHolidayForm((prev) => ({
        ...prev,
        date_bs: "",
        title: "",
      }));
      showToast("success", "Company calendar day saved", {
        title: "Calendar Updated",
      });
    } catch (error) {
      showToast(
        "error",
        getApiErrorMessage(error, "Failed to save calendar day"),
        {
          title: "Save Failed",
        },
      );
    } finally {
      setHolidaySaving(false);
    }
  };

  const handleDeleteHoliday = async (holidayId) => {
    setDeletingHolidayId(holidayId);
    try {
      await leaveAPI.deleteHoliday(holidayId);
      setHolidays((prev) => prev.filter((item) => item.id !== holidayId));
      showToast("success", "Calendar day removed", {
        title: "Deleted",
      });
    } catch (error) {
      showToast(
        "error",
        getApiErrorMessage(error, "Failed to delete calendar day"),
        {
          title: "Delete Failed",
        },
      );
    } finally {
      setDeletingHolidayId("");
    }
  };

  const handlePreviewAbsentRecalculation = async () => {
    if (!recalcForm.start_date_bs || !recalcForm.end_date_bs) {
      showToast("error", "Please select both start and end Nepali dates", {
        title: "Validation Error",
      });
      return;
    }

    setPreviewLoading(true);
    try {
      const data = await attendanceAPI.previewAbsentRecalculation({
        start_date_bs: recalcForm.start_date_bs,
        end_date_bs: recalcForm.end_date_bs,
        limit: 100,
      });
      setRecalcPreview(data);
      showToast("success", "Preview generated", {
        title: "Ready to Confirm",
      });
    } catch (error) {
      showToast(
        "error",
        getApiErrorMessage(error, "Failed to generate recalculation preview"),
        {
          title: "Preview Failed",
        },
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleConfirmAbsentRecalculation = async () => {
    if (!recalcPreview) {
      showToast("error", "Run preview before confirm", {
        title: "Preview Required",
      });
      return;
    }

    setConfirmLoading(true);
    try {
      const result = await attendanceAPI.confirmAbsentRecalculation({
        start_date_bs: recalcForm.start_date_bs,
        end_date_bs: recalcForm.end_date_bs,
        insufficient_strategy: recalcForm.insufficient_strategy,
      });

      showToast(
        "success",
        `Created ${result.absent_rows_created} absent row(s) and applied ${result.deductions_applied} deduction(s).`,
        {
          title: "Recalculation Complete",
        },
      );
      setRecalcPreview(null);
    } catch (error) {
      showToast(
        "error",
        getApiErrorMessage(error, "Failed to apply absence recalculation"),
        {
          title: "Confirm Failed",
        },
      );
    } finally {
      setConfirmLoading(false);
    }
  };

  if (accessDenied) return null;

  return (
    <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <Calendar size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              Leave Policy
            </h3>
            <p className="text-sm text-slate-500">
              Configure weekly off days, leave types, and company calendar.
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={!hasChanges || saving || loading}
          onClick={handleSave}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          <Save size={16} />
          {saving ? "Saving..." : "Save Leave Policy"}
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Loading leave policy...</div>
      ) : (
        <>
          <div className="rounded-xl border border-slate-200 p-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Weekly Off Days
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {WEEK_DAYS.map((day) => (
                <label
                  key={day.value}
                  className="flex items-center gap-2 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={formData.weekly_off_days.includes(day.value)}
                    onChange={() => toggleWeeklyOff(day.value)}
                  />
                  {day.label}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-800">
                Leave Types (Gender + Days)
              </h4>
              <button
                type="button"
                onClick={addLeaveType}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <Plus size={16} />
                Add Type
              </button>
            </div>

            <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
              {sortedTypes.map((row, index) => (
                <div
                  key={`${row.id || "new"}-${index}`}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2 rounded-xl border border-slate-200 p-3"
                >
                  <input
                    value={row.leave_type_name || ""}
                    onChange={(e) =>
                      updateTypeRow(index, "leave_type_name", e.target.value)
                    }
                    placeholder="Leave type name"
                    className="w-full min-w-0 lg:col-span-4 px-3 py-2 rounded-lg border border-slate-200"
                  />
                  <select
                    value={row.gender_rule || "all"}
                    onChange={(e) =>
                      updateTypeRow(index, "gender_rule", e.target.value)
                    }
                    className="w-full min-w-0 lg:col-span-2 px-3 py-2 rounded-lg border border-slate-200"
                  >
                    <option value="all">All Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={row.annual_days ?? ""}
                    onChange={(e) =>
                      updateTypeRow(index, "annual_days", e.target.value)
                    }
                    className="w-full min-w-0 lg:col-span-2 px-3 py-2 rounded-lg border border-slate-200"
                  />
                  <select
                    value={row.leave_bucket || "home"}
                    onChange={(e) =>
                      updateTypeRow(index, "leave_bucket", e.target.value)
                    }
                    className="w-full min-w-0 lg:col-span-2 px-3 py-2 rounded-lg border border-slate-200"
                  >
                    <option value="home">Home Bucket</option>
                    <option value="sick">Sick Bucket</option>
                    <option value="unpaid">Unpaid</option>
                  </select>
                  <div className="lg:col-span-2 flex items-center justify-start sm:justify-end gap-2">
                    <label className="inline-flex items-center gap-2 text-xs text-slate-600 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={Boolean(row.is_active)}
                        onChange={(e) =>
                          updateTypeRow(index, "is_active", e.target.checked)
                        }
                      />
                      Active
                    </label>
                    <button
                      type="button"
                      onClick={() => removeLeaveType(index)}
                      className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-slate-200 p-4">
            <h4 className="text-sm font-semibold text-slate-800">
              Leave Approval Workflow
            </h4>
            <p className="text-xs text-slate-500">
              Define how leave requests move from pending to final approval.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-xl border border-slate-200 p-3">
              <div className="md:col-span-2">
                <label className="block text-xs text-slate-600 mb-1">
                  Approval Mode
                </label>
                <select
                  value={workflow.approval_mode}
                  onChange={(e) =>
                    setWorkflow((prev) => ({
                      ...prev,
                      approval_mode: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                >
                  <option value="single_step">
                    Single Step (Admin/Superadmin final approval)
                  </option>
                  <option value="manager_then_admin">
                    Manager Then Admin (two-stage approval)
                  </option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs text-slate-600 mb-1">
                  Admin Direct Approval
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={workflow.allow_admin_direct_approval}
                    onChange={(e) =>
                      setWorkflow((prev) => ({
                        ...prev,
                        allow_admin_direct_approval: e.target.checked,
                      }))
                    }
                  />
                  Allow Admin Bypass
                </label>
                <button
                  type="button"
                  disabled={workflowSaving}
                  onClick={handleSaveWorkflow}
                  className="w-full px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {workflowSaving ? "Saving..." : "Save Workflow"}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-slate-200 p-4">
            <h4 className="text-sm font-semibold text-slate-800">
              Company Calendar (Nepali Date)
            </h4>
            <p className="text-xs text-slate-500">
              Define whether a Nepali date is a leave day or a working day.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 rounded-xl border border-slate-200 p-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  Date (BS)
                </label>
                <NepaliDatePicker
                  value={holidayForm.date_bs}
                  onChange={(value) =>
                    setHolidayForm((prev) => ({ ...prev, date_bs: value }))
                  }
                  placeholder="Select BS date"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  Title
                </label>
                <input
                  value={holidayForm.title}
                  onChange={(e) =>
                    setHolidayForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="Holiday title"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  Type
                </label>
                <select
                  value={holidayForm.holiday_type}
                  onChange={(e) =>
                    setHolidayForm((prev) => ({
                      ...prev,
                      holiday_type: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                >
                  <option value="administrative">Administrative</option>
                  <option value="public_holiday">Public Holiday</option>
                  <option value="company_event">Company Event</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs text-slate-600 mb-1">
                  Day Rule
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={holidayForm.is_leave_day}
                    onChange={(e) =>
                      setHolidayForm((prev) => ({
                        ...prev,
                        is_leave_day: e.target.checked,
                      }))
                    }
                  />
                  Mark as Leave Day
                </label>
                <button
                  type="button"
                  disabled={holidaySaving}
                  onClick={handleSaveCalendarDay}
                  className="w-full px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {holidaySaving ? "Saving..." : "Save Day"}
                </button>
              </div>
            </div>

            <div className="max-h-[280px] overflow-auto rounded-xl border border-slate-200">
              {holidayLoading ? (
                <div className="p-4 text-sm text-slate-500">
                  Loading company calendar...
                </div>
              ) : holidays.length === 0 ? (
                <div className="p-4 text-sm text-slate-500">
                  No calendar days configured yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {holidays.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {item.title || "Company Calendar Day"}
                        </p>
                        <p className="text-xs text-slate-500">
                          BS: {adToBsYmd(item.date_ad) || "-"} | AD:{" "}
                          {item.date_ad}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.is_working_day ? "Working Day" : "Leave Day"} |{" "}
                          {item.holiday_type}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={deletingHolidayId === item.id}
                        onClick={() => handleDeleteHoliday(item.id)}
                        className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/40 p-4">
            <h4 className="text-sm font-semibold text-slate-800">
              Recalculate Past Absences
            </h4>
            <p className="text-xs text-slate-600">
              Admin-only controlled action. Preview first, then confirm to
              create absent rows and deduct leave for historical dates.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  Start Date (BS)
                </label>
                <NepaliDatePicker
                  value={recalcForm.start_date_bs}
                  onChange={(value) =>
                    setRecalcForm((prev) => ({ ...prev, start_date_bs: value }))
                  }
                  placeholder="Select start date"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  End Date (BS)
                </label>
                <NepaliDatePicker
                  value={recalcForm.end_date_bs}
                  onChange={(value) =>
                    setRecalcForm((prev) => ({ ...prev, end_date_bs: value }))
                  }
                  placeholder="Select end date"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  Insufficient Balance
                </label>
                <select
                  value={recalcForm.insufficient_strategy}
                  onChange={(e) =>
                    setRecalcForm((prev) => ({
                      ...prev,
                      insufficient_strategy: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                >
                  <option value="negative">Allow Negative Home Leave</option>
                  <option value="unpaid">Fallback to Unpaid</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={handlePreviewAbsentRecalculation}
                  disabled={previewLoading}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                >
                  {previewLoading ? "Loading..." : "Preview"}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAbsentRecalculation}
                  disabled={confirmLoading || !recalcPreview}
                  className="px-3 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-60"
                >
                  {confirmLoading ? "Applying..." : "Confirm"}
                </button>
              </div>
            </div>

            {recalcPreview && (
              <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                <p className="text-xs text-slate-600">
                  Candidates:{" "}
                  <span className="font-semibold text-slate-800">
                    {recalcPreview.total_candidates}
                  </span>
                </p>
                {Array.isArray(recalcPreview.candidates) &&
                recalcPreview.candidates.length > 0 ? (
                  <div className="max-h-48 overflow-auto divide-y divide-slate-100">
                    {recalcPreview.candidates.map((item, index) => (
                      <div
                        key={`${item.user_id}-${item.date}-${index}`}
                        className="py-2 text-xs text-slate-700"
                      >
                        {item.user_name} ({item.user_id}) -{" "}
                        {item.date_bs || item.date}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    No candidate rows found for selected range.
                  </p>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
};

export default LeavePolicySettings;
