import { useEffect, useState } from "react";
import {
  Sliders,
  Save,
  BellRing,
  ShieldCheck,
  Globe,
  Building2,
} from "lucide-react";
import { companyAPI, platformSettingsAPI } from "../../services/backendApi";
import { useToast } from "../../context/ToastContext";
import { usePlatformSettings } from "../../context/PlatformSettingsContext";
import SummaryCard from "../../components/SummaryCard";

const SuperadminSettings = () => {
  const { showToast } = useToast();
  const { settings: platformSettings, refreshSettings } = usePlatformSettings();
  const [settings, setSettings] = useState(platformSettings);
  const [saving, setSaving] = useState(false);
  const [companyCount, setCompanyCount] = useState(0);

  useEffect(() => {
    setSettings(platformSettings);
  }, [platformSettings]);

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const companies = await companyAPI.getAll();
        setCompanyCount(Array.isArray(companies) ? companies.length : 0);
      } catch {
        setCompanyCount(0);
      }
    };

    loadCompanies();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await platformSettingsAPI.update(settings);
      await refreshSettings();
      showToast("success", "Platform settings saved", { title: "Saved" });
    } catch {
      showToast("error", "Failed to save settings", { title: "Save Failed" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">
          Superadmin Settings
        </h1>
        <p className="text-slate-500 mt-1">
          Configure platform-wide policies for tenant onboarding and governance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          title="Total Companies"
          value={companyCount}
          icon={Building2}
          valueClassName="text-2xl"
          iconSize={18}
          iconClassName="text-current"
          iconContainerClassName="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center"
          cardClassName="bg-white p-5 border-slate-100 shadow-sm"
        />
        <SummaryCard
          title="Doc Policy"
          value={settings.require_company_docs ? "Required" : "Optional"}
          icon={ShieldCheck}
          valueClassName="text-2xl"
          iconSize={18}
          iconClassName="text-current"
          iconContainerClassName="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center"
          cardClassName="bg-white p-5 border-slate-100 shadow-sm"
        />
        <SummaryCard
          title="Creation Alerts"
          value={settings.alert_on_company_creation ? "Enabled" : "Disabled"}
          icon={BellRing}
          valueClassName="text-2xl"
          iconSize={18}
          iconClassName="text-current"
          iconContainerClassName="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center"
          cardClassName="bg-white p-5 border-slate-100 shadow-sm"
        />
      </div>

      <form
        noValidate
        onSubmit={handleSave}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Platform Name"
            name="platform_name"
            value={settings.platform_name ?? ""}
            onChange={handleChange}
            required
          />
          <InputField
            label="Support Email"
            name="support_email"
            value={settings.support_email ?? ""}
            onChange={handleChange}
            type="email"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ToggleField
            name="auto_provision_admin"
            checked={settings.auto_provision_admin ?? false}
            onChange={handleChange}
            label="Auto-provision company admin account"
          />
          <ToggleField
            name="require_company_docs"
            checked={settings.require_company_docs ?? false}
            onChange={handleChange}
            label="Require company certificate during onboarding"
          />
          <ToggleField
            name="enable_audit_trail"
            checked={settings.enable_audit_trail ?? false}
            onChange={handleChange}
            label="Enable tenant audit trail"
          />
          <ToggleField
            name="alert_on_company_creation"
            checked={settings.alert_on_company_creation ?? false}
            onChange={handleChange}
            label="Send notification on company creation"
          />
          <ToggleField
            name="enable_superadmin_companies"
            checked={settings.enable_superadmin_companies ?? true}
            onChange={handleChange}
            label="Enable Companies management page"
          />
          <ToggleField
            name="enable_superadmin_dashboard_config"
            checked={settings.enable_superadmin_dashboard_config ?? true}
            onChange={handleChange}
            label="Enable Dashboard Configuration page"
          />
          <ToggleField
            name="show_company_metrics_on_dashboard"
            checked={settings.show_company_metrics_on_dashboard ?? true}
            onChange={handleChange}
            label="Show company metrics on superadmin dashboard"
          />
          <ToggleField
            name="show_company_registry_on_dashboard"
            checked={settings.show_company_registry_on_dashboard ?? true}
            onChange={handleChange}
            label="Show company registry table on superadmin dashboard"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl inline-flex items-center transition-colors shadow-lg shadow-blue-600/30 font-medium disabled:opacity-60"
        >
          <Save size={17} className="mr-2" />
          {saving ? "Saving..." : "Save Platform Settings"}
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-slate-800 font-semibold flex items-center gap-2">
            <Globe size={17} /> Tenant Governance
          </h3>
          <p className="text-sm text-slate-500 mt-2">
            Use company onboarding policy to enforce PAN/VAT fields, contact
            data, and documents before tenant activation.
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-slate-800 font-semibold flex items-center gap-2">
            <Sliders size={17} /> Dashboard Strategy
          </h3>
          <p className="text-sm text-slate-500 mt-2">
            Keep the superadmin dashboard focused on tenant health: active
            companies, document completeness, and cross-tenant leave/attendance
            alerts.
          </p>
        </div>
      </div>
    </div>
  );
};

const InputField = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
}) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
    />
  </div>
);

const ToggleField = ({ name, checked, onChange, label }) => (
  <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
    <input type="checkbox" name={name} checked={checked} onChange={onChange} />
    <span>{label}</span>
  </label>
);

export default SuperadminSettings;
