import { useEffect, useMemo, useState } from "react";
import { Mail, Save, Eye, Send, Loader2 } from "lucide-react";

import { emailTemplateAPI } from "../../services/backendApi";
import { useToast } from "../../context/ToastContext";

const templateOrder = ["welcome", "billing", "service", "maintenance"];

const sampleContextByKey = {
  welcome: {
    company_name: "Acme Pvt Ltd",
    superadmin_name: "Super Admin",
    admin_email: "admin@acme.com",
    admin_password: "TempPass123",
    login_url: "http://localhost:5173/login",
  },
  billing: {
    company_name: "Acme Pvt Ltd",
    message: "Your subscription invoice for April is due on 5th.",
  },
  service: {
    company_name: "Acme Pvt Ltd",
    message: "A service update is scheduled this weekend.",
  },
  maintenance: {
    company_name: "Acme Pvt Ltd",
    message: "Maintenance window: Saturday 10:00 PM - 11:30 PM.",
  },
};

const EmailTemplates = () => {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  const [templates, setTemplates] = useState([]);
  const [activeKey, setActiveKey] = useState("welcome");

  const [form, setForm] = useState({
    name: "",
    subject_template: "",
    html_template: "",
    text_template: "",
    is_active: true,
  });

  const [contextJson, setContextJson] = useState(
    JSON.stringify(sampleContextByKey.welcome, null, 2),
  );
  const [preview, setPreview] = useState({ subject: "", html: "", text: "" });
  const [testEmail, setTestEmail] = useState("");

  const sortedTemplates = useMemo(() => {
    const byKey = new Map((templates || []).map((item) => [item.key, item]));
    return templateOrder
      .map((key) => byKey.get(key))
      .filter(Boolean)
      .concat(
        (templates || []).filter((item) => !templateOrder.includes(item.key)),
      );
  }, [templates]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const list = await emailTemplateAPI.list();
        setTemplates(Array.isArray(list) ? list : []);

        const firstKey = (Array.isArray(list) && list[0]?.key) || "welcome";
        setActiveKey(firstKey);
      } catch (error) {
        showToast(
          "error",
          error?.response?.data?.detail || "Failed to load templates",
          { title: "Load Failed" },
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [showToast]);

  useEffect(() => {
    const current = templates.find((item) => item.key === activeKey);
    if (!current) return;

    setForm({
      name: current.name || "",
      subject_template: current.subject_template || "",
      html_template: current.html_template || "",
      text_template: current.text_template || "",
      is_active: Boolean(current.is_active),
    });

    const nextContext = sampleContextByKey[activeKey] || {};
    setContextJson(JSON.stringify(nextContext, null, 2));
    setPreview({ subject: "", html: "", text: "" });
  }, [activeKey, templates]);

  const parseContext = () => {
    try {
      const parsed = JSON.parse(contextJson || "{}");
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Context must be a JSON object");
      }
      return parsed;
    } catch (error) {
      throw new Error(error?.message || "Invalid context JSON");
    }
  };

  const handleSave = async () => {
    if (
      !form.name.trim() ||
      !form.subject_template.trim() ||
      !form.html_template.trim()
    ) {
      showToast("error", "Name, subject, and HTML are required", {
        title: "Validation Error",
      });
      return;
    }

    setSaving(true);
    try {
      const updated = await emailTemplateAPI.update(activeKey, {
        name: form.name,
        subject_template: form.subject_template,
        html_template: form.html_template,
        text_template: form.text_template || null,
        is_active: form.is_active,
      });

      setTemplates((prev) =>
        prev.map((item) => (item.key === activeKey ? updated : item)),
      );
      showToast("success", "Template saved successfully", { title: "Saved" });
    } catch (error) {
      showToast(
        "error",
        error?.response?.data?.detail || "Failed to save template",
        { title: "Save Failed" },
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    setPreviewing(true);
    try {
      const context = parseContext();
      const result = await emailTemplateAPI.preview(activeKey, context);
      setPreview({
        subject: result?.subject || "",
        html: result?.html || "",
        text: result?.text || "",
      });
      showToast("success", "Preview generated", { title: "Preview" });
    } catch (error) {
      showToast(
        "error",
        error?.message || error?.response?.data?.detail || "Failed to preview",
        { title: "Preview Failed" },
      );
    } finally {
      setPreviewing(false);
    }
  };

  const handleTestSend = async () => {
    const toEmail = String(testEmail || "").trim();
    if (!toEmail) {
      showToast("error", "Test recipient email is required", {
        title: "Validation Error",
      });
      return;
    }

    setSendingTest(true);
    try {
      const context = parseContext();
      const result = await emailTemplateAPI.testSend(activeKey, {
        to_email: toEmail,
        context,
      });

      if (result?.sent) {
        showToast("success", `Test email sent to ${toEmail}`, {
          title: "Test Sent",
        });
      } else {
        showToast("info", result?.error || "Test email failed", {
          title: "Test Failed",
        });
      }
    } catch (error) {
      showToast(
        "error",
        error?.message ||
          error?.response?.data?.detail ||
          "Failed to send test",
        { title: "Test Failed" },
      );
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-slate-500">
        Loading templates...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
            <Mail size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Email Templates
            </h1>
            <p className="text-sm text-slate-600">
              Customize onboarding and announcement templates with live preview
              and test send.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-4 space-y-2 h-fit">
          {sortedTemplates.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveKey(item.key)}
              className={`w-full text-left rounded-xl px-3 py-2 text-sm transition-colors ${
                activeKey === item.key
                  ? "bg-blue-600 text-white"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <div className="font-medium capitalize">{item.key}</div>
              <div className="text-xs opacity-80">{item.name}</div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-9 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Template Name
                </span>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </label>

              <label className="inline-flex items-center gap-2 mt-6">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      is_active: e.target.checked,
                    }))
                  }
                />
                <span className="text-sm text-slate-700">
                  Use customized template
                </span>
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Subject Template
              </span>
              <input
                value={form.subject_template}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    subject_template: e.target.value,
                  }))
                }
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                HTML Template
              </span>
              <textarea
                value={form.html_template}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    html_template: e.target.value,
                  }))
                }
                rows={10}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Text Template (optional)
              </span>
              <textarea
                value={form.text_template}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    text_template: e.target.value,
                  }))
                }
                rows={4}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {saving ? "Saving..." : "Save Template"}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Live Preview + Test Send
            </h2>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Context JSON
              </span>
              <textarea
                value={contextJson}
                onChange={(e) => setContextJson(e.target.value)}
                rows={8}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm"
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handlePreview}
                disabled={previewing}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                {previewing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Eye size={16} />
                )}
                {previewing ? "Generating..." : "Generate Preview"}
              </button>

              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test recipient email"
                className="rounded-xl border border-slate-300 px-3 py-2 min-w-72"
              />
              <button
                type="button"
                onClick={handleTestSend}
                disabled={sendingTest}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {sendingTest ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                {sendingTest ? "Sending..." : "Send Test"}
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
              <p className="text-sm font-medium text-slate-700">
                Subject Preview
              </p>
              <p className="text-slate-900 mt-1">
                {preview.subject || "(generate preview to view)"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-4 bg-white">
              <p className="text-sm font-medium text-slate-700 mb-2">
                HTML Preview
              </p>
              <div
                className="prose max-w-none text-slate-800"
                dangerouslySetInnerHTML={{
                  __html:
                    preview.html ||
                    "<p class='text-slate-500'>(generate preview to view)</p>",
                }}
              />
            </div>

            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
              <p className="text-sm font-medium text-slate-700">Text Preview</p>
              <pre className="whitespace-pre-wrap text-sm text-slate-800 mt-1">
                {preview.text || "(empty)"}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplates;
