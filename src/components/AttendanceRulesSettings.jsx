import { useState, useEffect } from "react";
import { Clock, AlertCircle, Save } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { attendanceRulesAPI } from "../services/backendApi";

const AttendanceRulesSettings = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const companyId = user?.tenant_id;

  const [loading, setLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rules, setRules] = useState(null);
  const [formData, setFormData] = useState({
    grace_period_minutes: 0,
    late_check_in_time: "10:15",
    full_day_minimum_hours: 8.0,
    half_day_minimum_hours: 5.0,
    missing_checkout_action: "mark_absent",
    system_checkout_time: "17:30",
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [rebuildingAttendance, setRebuildingAttendance] = useState(false);
  const [showRebuildConfirm, setShowRebuildConfirm] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    fetchRules();
  }, [companyId]);

  const fetchRules = async () => {
    setLoading(true);
    setAccessDenied(false);
    try {
      const data = await attendanceRulesAPI.getForCompany(companyId);
      setRules(data);
      setFormData({
        grace_period_minutes: data.grace_period_minutes || 0,
        late_check_in_time: data.late_check_in_time || "10:15",
        full_day_minimum_hours: data.full_day_minimum_hours || 8.0,
        half_day_minimum_hours: data.half_day_minimum_hours || 5.0,
        missing_checkout_action: data.missing_checkout_action || "mark_absent",
        system_checkout_time: data.system_checkout_time || "17:30",
      });
    } catch (error) {
      if (error?.response?.status === 403) {
        setAccessDenied(true);
        return;
      }
      // If no rules exist, use defaults
      if (error?.response?.status === 404) {
        showToast(
          "info",
          "No rules configured. Using system defaults. Save to create custom rules.",
          { title: "Default Rules Active" },
        );
      } else {
        const errorMsg =
          error?.response?.data?.detail || "Failed to load attendance rules";
        showToast("error", errorMsg, { title: "Load Failed" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let parsedValue = value;

    if (
      name === "grace_period_minutes" ||
      name === "full_day_minimum_hours" ||
      name === "half_day_minimum_hours"
    ) {
      parsedValue = parseFloat(value) || 0;
    }

    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
    setHasChanges(true);
  };

  const validateForm = () => {
    if (
      formData.grace_period_minutes < 0 ||
      formData.grace_period_minutes > 120
    ) {
      showToast("error", "Grace period must be between 0-120 minutes", {
        title: "Validation Error",
      });
      return false;
    }

    if (
      formData.full_day_minimum_hours < 0 ||
      formData.full_day_minimum_hours > 24
    ) {
      showToast("error", "Full day minimum must be between 0-24 hours", {
        title: "Validation Error",
      });
      return false;
    }

    if (
      formData.half_day_minimum_hours < 0 ||
      formData.half_day_minimum_hours > 24
    ) {
      showToast("error", "Half day minimum must be between 0-24 hours", {
        title: "Validation Error",
      });
      return false;
    }

    if (formData.half_day_minimum_hours > formData.full_day_minimum_hours) {
      showToast(
        "error",
        "Half day minimum must be less than full day minimum",
        {
          title: "Validation Error",
        },
      );
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const payload = {
        grace_period_minutes: parseInt(formData.grace_period_minutes),
        late_check_in_time: formData.late_check_in_time,
        full_day_minimum_hours: parseFloat(formData.full_day_minimum_hours),
        half_day_minimum_hours: parseFloat(formData.half_day_minimum_hours),
        missing_checkout_action: formData.missing_checkout_action,
        system_checkout_time: formData.system_checkout_time,
        is_active: true,
      };

      const result = await attendanceRulesAPI.createOrUpdate(
        companyId,
        payload,
      );
      setRules(result);
      setHasChanges(false);
      showToast(
        "success",
        "Rules will apply to new attendance records from today onwards. Use 'Rebuild Attendance' to apply to historical records.",
        {
          title: "Attendance Rules Saved",
        },
      );
    } catch (error) {
      const errorMsg =
        error?.response?.data?.detail || "Failed to save attendance rules";
      showToast("error", errorMsg, { title: "Save Failed" });
    } finally {
      setSaving(false);
    }
  };

  const handleRebuildAttendance = () => {
    if (!rules?.id) {
      showToast("error", "Please save rules first before rebuilding", {
        title: "No Rules",
      });
      return;
    }

    setShowRebuildConfirm(true);
  };

  const confirmRebuildAttendance = async () => {
    setShowRebuildConfirm(false);
    setRebuildingAttendance(true);
    try {
      const rebuildResult =
        await attendanceRulesAPI.rebuildCompanyAttendance(companyId);

      showToast(
        "success",
        `Attendance rebuilt. Updated ${rebuildResult?.attendance_rows_upserted ?? 0} rows from transaction and mapping data.`,
        {
          title: "Rebuild Complete",
        },
      );
    } catch (error) {
      console.error("Rebuild error:", error);
      let errorMsg =
        "Failed to rebuild attendance from transactions and mappings.";

      if (error?.response?.data?.detail) {
        errorMsg = error.response.data.detail;
      } else if (error?.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error?.message) {
        errorMsg = error.message;
      }

      showToast("error", errorMsg, { title: "Rebuild Error" });
    } finally {
      setRebuildingAttendance(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
            <Clock size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              Attendance Rules
            </h3>
            <p className="text-sm text-slate-500">
              Configure when employees are marked late, half day, or absent.
            </p>
          </div>
        </div>
        <div className="text-center py-4 text-slate-500">Loading rules...</div>
      </div>
    );
  }

  if (accessDenied || !companyId) return null;

  return (
    <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
          <Clock size={20} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800">
            Attendance Rules
          </h3>
          <p className="text-sm text-slate-500">
            Configure when employees are marked late, half day, or absent.
          </p>
        </div>
      </div>

      {rules && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800 flex gap-2">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>
            Current rule active since{" "}
            {new Date(rules.created_at).toLocaleDateString()}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Grace Period */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Grace Period (minutes)
          </label>
          <input
            type="number"
            name="grace_period_minutes"
            value={formData.grace_period_minutes}
            onChange={handleChange}
            min="0"
            max="120"
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <p className="mt-1 text-xs text-slate-500">
            Allow employees to check in up to N minutes before marking late
            (0-120 min)
          </p>
        </div>

        {/* Late Check-In Time */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Late Check-In Time
          </label>
          <input
            type="time"
            name="late_check_in_time"
            value={formData.late_check_in_time}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <p className="mt-1 text-xs text-slate-500">
            Time after which check-in is marked as late
          </p>
        </div>

        {/* Full Day Minimum Hours */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Full Day Minimum Hours
          </label>
          <input
            type="number"
            name="full_day_minimum_hours"
            value={formData.full_day_minimum_hours}
            onChange={handleChange}
            min="0"
            max="24"
            step="0.5"
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <p className="mt-1 text-xs text-slate-500">
            Hours required to mark attendance as full day (0-24 hours)
          </p>
        </div>

        {/* Half Day Minimum Hours */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Half Day Minimum Hours
          </label>
          <input
            type="number"
            name="half_day_minimum_hours"
            value={formData.half_day_minimum_hours}
            onChange={handleChange}
            min="0"
            max="24"
            step="0.5"
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <p className="mt-1 text-xs text-slate-500">
            Hours required to mark attendance as half day (0-24 hours)
          </p>
        </div>

        {/* Missing Checkout Action */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Missing Check-Out Action
          </label>
          <select
            name="missing_checkout_action"
            value={formData.missing_checkout_action}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="present_full_day">
              ✓ Present (Full Day) - Trust-based approach
            </option>
            <option value="present_half_day">
              ✓ Present (Half Day) - Conservative approach
            </option>
            <option value="present_if_minimum">
              ✓ Present if Minimum Hours - Smart validation
            </option>
            <option value="mark_absent">
              ✗ Mark as Absent - Strict policy
            </option>
          </select>
          <p className="mt-1 text-xs text-slate-500">
            What to do when checkout is missing and hours can't be calculated
          </p>
        </div>

        {/* System Checkout Time */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            System Check-Out Time
          </label>
          <input
            type="time"
            name="system_checkout_time"
            value={formData.system_checkout_time}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <p className="mt-1 text-xs text-slate-500">
            Default checkout time when using assumed check-out
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-4">
        <div>
          <h4 className="font-medium text-slate-800 text-sm mb-2">
            How Rules Work:
          </h4>
          <ul className="text-xs text-slate-600 space-y-1">
            <li>
              • Grace period is subtracted from check-in time before comparing
              with late threshold
            </li>
            <li>
              • Working hours are calculated from check-in to check-out (or
              system time if missing)
            </li>
            <li>
              • Status is determined: Half Day (if below half-day min) → Late
              (if after threshold) → Present
            </li>
          </ul>
        </div>

        <div className="border-t border-slate-200 pt-3">
          <h4 className="font-medium text-slate-800 text-sm mb-2">
            Missing Check-Out Strategies:
          </h4>
          <ul className="text-xs text-slate-600 space-y-1.5">
            <li>
              <strong>✓ Present (Full Day):</strong> Employee marked present for
              full day. Use when checkout records are unreliable.
            </li>
            <li>
              <strong>✓ Present (Half Day):</strong> Employee marked present for
              half day. Balanced approach.
            </li>
            <li>
              <strong>✓ Present if Minimum Hours:</strong> Smart validation -
              mark present only if check-in exists and time ago is ≥ half-day
              minimum hours, else absent.
            </li>
            <li>
              <strong>✗ Mark as Absent:</strong> Strict approach - no checkout
              record = absent. Best for time-tracking strict orgs.
            </li>
          </ul>
        </div>

        <div className="border-t border-slate-200 pt-3">
          <h4 className="font-medium text-slate-800 text-sm mb-2">
            When Do Rules Apply?
          </h4>
          <ul className="text-xs text-slate-600 space-y-1">
            <li>
              • <strong>New attendance</strong> records use rules from today
              onwards automatically
            </li>
            <li>
              • <strong>Past attendance</strong> is preserved as-is (not
              affected by new rules)
            </li>
            <li>
              • Use <strong>"Rebuild Attendance"</strong> to recalculate all
              historical records using current rules
            </li>
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-purple-600 bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          <Save size={16} />
          {saving ? "Saving..." : "Save Rules"}
        </button>

        {rules && (
          <button
            onClick={handleRebuildAttendance}
            disabled={rebuildingAttendance}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            <Clock size={16} />
            {rebuildingAttendance ? "Rebuilding..." : "Rebuild Attendance"}
          </button>
        )}

        {hasChanges && (
          <button
            onClick={() => (
              setFormData({
                grace_period_minutes: rules?.grace_period_minutes || 0,
                late_check_in_time: rules?.late_check_in_time || "10:15",
                full_day_minimum_hours: rules?.full_day_minimum_hours || 8.0,
                half_day_minimum_hours: rules?.half_day_minimum_hours || 5.0,
                missing_checkout_action:
                  rules?.missing_checkout_action || "present_full_day",
                system_checkout_time: rules?.system_checkout_time || "17:30",
              }),
              setHasChanges(false)
            )}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {showRebuildConfirm && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          <p className="font-medium">Rebuild attendance now?</p>
          <p className="mt-1 text-blue-800">
            This will recalculate attendance using stored attendance
            transactions and mapped users.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={confirmRebuildAttendance}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              OK
            </button>
            <button
              onClick={() => setShowRebuildConfirm(false)}
              className="px-3 py-1.5 rounded-lg border border-blue-300 text-blue-800 hover:bg-blue-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default AttendanceRulesSettings;
