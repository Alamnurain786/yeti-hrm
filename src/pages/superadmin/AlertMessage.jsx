import { useEffect, useMemo, useState } from "react";
import {
  BellRing,
  Send,
  Building2,
  Loader2,
  Megaphone,
  Receipt,
  Wrench,
  ShieldAlert,
} from "lucide-react";
import { companyAPI, notificationAPI } from "../../services/backendApi";
import { useToast } from "../../context/ToastContext";

const templates = {
  service: {
    subject: "Service Notice",
    message:
      "<h3>Service Update</h3><p>We have an important service update for your company admin team.</p>",
  },
  billing: {
    subject: "Billing Reminder",
    message:
      "<h3>Billing Reminder</h3><p>Your billing cycle is due soon. Please review your invoices in time.</p>",
  },
  maintenance: {
    subject: "Scheduled Maintenance",
    message:
      "<h3>Maintenance Window</h3><p>We will perform scheduled maintenance. Some features may be temporarily unavailable.</p>",
  },
  security: {
    subject: "Security Advisory",
    message:
      "<h3>Security Advisory</h3><p>Please review your account security settings and password policies.</p>",
  },
};

const AlertMessage = () => {
  const { showToast } = useToast();
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [companies, setCompanies] = useState([]);

  const [targetMode, setTargetMode] = useState("all");
  const [selectedCompanyIds, setSelectedCompanyIds] = useState([]);
  const [subject, setSubject] = useState(templates.service.subject);
  const [message, setMessage] = useState(templates.service.message);

  useEffect(() => {
    const loadCompanies = async () => {
      setLoadingCompanies(true);
      try {
        const list = await companyAPI.getAll();
        setCompanies(Array.isArray(list) ? list : []);
      } catch (error) {
        showToast(
          "error",
          error?.response?.data?.detail || "Failed to load companies",
          { title: "Load Failed" },
        );
      } finally {
        setLoadingCompanies(false);
      }
    };

    loadCompanies();
  }, [showToast]);

  const selectedCount = useMemo(
    () => selectedCompanyIds.length,
    [selectedCompanyIds],
  );

  const applyTemplate = (key) => {
    const tpl = templates[key];
    if (!tpl) return;
    setSubject(tpl.subject);
    setMessage(tpl.message);
  };

  const toggleCompany = (companyId) => {
    setSelectedCompanyIds((prev) =>
      prev.includes(companyId)
        ? prev.filter((id) => id !== companyId)
        : [...prev, companyId],
    );
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const trimmedSubject = String(subject || "").trim();
    const trimmedMessage = String(message || "").trim();

    if (!trimmedSubject || !trimmedMessage) {
      showToast("error", "Subject and message are required", {
        title: "Validation Error",
      });
      return;
    }

    if (targetMode === "company_ids" && selectedCompanyIds.length === 0) {
      showToast("error", "Select at least one company", {
        title: "Validation Error",
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        subject: trimmedSubject,
        message: trimmedMessage,
        target: targetMode,
      };

      if (targetMode === "company_ids") {
        payload.company_ids = selectedCompanyIds;
      }

      const result = await notificationAPI.sendSuperadminAlert(payload);
      if (result?.email_sent) {
        showToast(
          "success",
          `Alert sent. Notifications: ${result?.created_notifications || 0}, Emails: ${result?.recipients_count || 0}`,
          { title: "Alert Sent" },
        );
      } else {
        showToast(
          "info",
          result?.email_error
            ? `Alert created but email failed: ${result.email_error}`
            : "Alert created but email was not sent",
          { title: "Partial Delivery" },
        );
      }
    } catch (error) {
      showToast(
        "error",
        error?.response?.data?.detail || "Failed to send alert",
        { title: "Send Failed" },
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
            <BellRing size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Company Alert Message
            </h1>
            <p className="text-slate-600 text-sm">
              Send service, billing, maintenance, or urgent notices to company
              admins.
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6"
      >
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">
            Quick Templates
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyTemplate("service")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
            >
              <Megaphone size={16} /> Service
            </button>
            <button
              type="button"
              onClick={() => applyTemplate("billing")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
            >
              <Receipt size={16} /> Billing
            </button>
            <button
              type="button"
              onClick={() => applyTemplate("maintenance")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
            >
              <Wrench size={16} /> Maintenance
            </button>
            <button
              type="button"
              onClick={() => applyTemplate("security")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
            >
              <ShieldAlert size={16} /> Security
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Target
            </label>
            <select
              value={targetMode}
              onChange={(e) => setTargetMode(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
            >
              <option value="all">All company admins</option>
              <option value="company_ids">Specific companies</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Subject
            </label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              placeholder="e.g. Billing reminder"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            HTML Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={8}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            placeholder="Write HTML email content"
          />
        </div>

        {targetMode === "company_ids" && (
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm font-medium text-slate-700 mb-3">
              Select Companies ({selectedCount} selected)
            </p>
            {loadingCompanies ? (
              <p className="text-sm text-slate-500">Loading companies...</p>
            ) : companies.length === 0 ? (
              <p className="text-sm text-slate-500">No companies available.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-56 overflow-auto">
                {companies.map((company) => (
                  <label
                    key={company.id}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCompanyIds.includes(company.id)}
                      onChange={() => toggleCompany(company.id)}
                    />
                    <Building2 size={16} className="text-slate-500" />
                    <span className="text-sm text-slate-700">
                      {company.name} ({company.code})
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            {submitting ? "Sending..." : "Send Alert"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AlertMessage;
