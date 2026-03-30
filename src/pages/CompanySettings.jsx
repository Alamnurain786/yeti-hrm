import { useEffect, useState } from "react";
import {
  Building2,
  Save,
  Upload,
  Image as ImageIcon,
  FileBadge,
} from "lucide-react";
import { companyAPI } from "../services/backendApi";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

const formatFileSize = (size) => {
  if (!size) return "";
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
};

const CompanySettings = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [certificateFile, setCertificateFile] = useState(null);
  const [hasCertificate, setHasCertificate] = useState(false);
  const [companyId, setCompanyId] = useState(null);
  const [companyStatus, setCompanyStatus] = useState("ACTIVE");
  const [statusReason, setStatusReason] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: "",
    contactPersonName: "",
    contactNumber: "",
    contactEmail: "",
    panNumber: "",
    website: "",
    notes: "",
  });
  const isCompanyAdmin = user?.role === "admin";

  const loadCompany = async () => {
    setLoading(true);
    try {
      const data = await companyAPI.getMine();
      setCompanyId(data?.id || null);
      setCompanyStatus(data?.status || "ACTIVE");
      setStatusReason(data?.status_reason || "");
      setFormData({
        name: data?.name || "",
        code: data?.code || "",
        address: data?.address || "",
        contactPersonName: data?.contact_person_name || "",
        contactNumber: data?.contact_number || "",
        contactEmail: data?.contact_email || "",
        panNumber: data?.pan_number || "",
        website: data?.website || "",
        notes: data?.notes || "",
      });
      setHasCertificate(Boolean(data?.certificate_file_path));
    } catch (error) {
      showToast(
        "error",
        error?.response?.data?.detail || "Failed to load company profile",
        { title: "Load Failed" },
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompany();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUploadChange = (event, kind, setter) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setter(null);
      return;
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      showToast("error", `${kind} must be 5MB or less`, {
        title: "Upload Validation",
      });
      event.target.value = "";
      setter(null);
      return;
    }

    setter(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isCompanyAdmin) {
      if (!logoFile) {
        showToast("error", "Please select a logo file to update", {
          title: "Validation Error",
        });
        return;
      }

      setSubmitting(true);
      try {
        if (!companyId) {
          throw new Error("Company profile not loaded yet");
        }
        await companyAPI.uploadFile(companyId, "logo", logoFile);
        window.dispatchEvent(new Event("company-logo-updated"));
        showToast("success", "Company logo updated", {
          title: "Saved",
        });
        setLogoFile(null);
        await loadCompany();
      } catch (error) {
        const errorMsg =
          error?.response?.data?.error?.message ||
          error?.response?.data?.detail ||
          "Failed to update company logo";
        showToast("error", errorMsg, { title: "Update Failed" });
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!hasCertificate && !certificateFile) {
      showToast("error", "Company certificate is required", {
        title: "Validation Error",
      });
      return;
    }

    setSubmitting(true);
    try {
      await companyAPI.updateMine({
        name: formData.name.trim(),
        code: formData.code.trim() || null,
        address: formData.address.trim() || null,
        contact_person_name: formData.contactPersonName.trim() || null,
        contact_number: formData.contactNumber.trim() || null,
        contact_email: formData.contactEmail.trim() || null,
        pan_number: formData.panNumber.trim().toUpperCase() || null,
        website: formData.website.trim() || null,
        notes: formData.notes.trim() || null,
      });

      if (logoFile) {
        if (!companyId) {
          throw new Error("Company profile not loaded yet");
        }
        await companyAPI.uploadFile(companyId, "logo", logoFile);
        window.dispatchEvent(new Event("company-logo-updated"));
      }

      if (certificateFile) {
        if (!companyId) {
          throw new Error("Company profile not loaded yet");
        }
        await companyAPI.uploadFile(companyId, "certificate", certificateFile);
        setHasCertificate(true);
      }

      showToast("success", "Company profile updated", {
        title: "Saved",
      });
      setLogoFile(null);
      setCertificateFile(null);
      await loadCompany();
    } catch (error) {
      const errorMsg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.detail ||
        "Failed to update company profile";
      showToast("error", errorMsg, { title: "Update Failed" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenMyFile = async (fileType) => {
    try {
      if (!companyId) {
        throw new Error("Company profile not loaded yet");
      }
      await companyAPI.openFileInNewTab(companyId, fileType);
    } catch (error) {
      const errorMsg =
        error?.message ||
        error?.response?.data?.error?.message ||
        error?.response?.data?.detail ||
        "Unable to open file";
      showToast("error", errorMsg, { title: "Open Failed" });
    }
  };

  if (loading) {
    return <div className="text-slate-500">Loading company settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Company Settings</h1>
        <p className="text-slate-500 mt-1">
          Update your organization details, logo, and registration documents.
        </p>
        {isCompanyAdmin && (
          <p className="text-sm text-amber-700 mt-2">
            Company details are locked for company admins. You can only update
            the company logo.
          </p>
        )}
      </div>

      <form
        noValidate
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5"
      >
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-slate-700">Status</span>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                companyStatus === "ACTIVE"
                  ? "bg-emerald-100 text-emerald-700"
                  : companyStatus === "INACTIVE"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-200 text-slate-700"
              }`}
            >
              {companyStatus}
            </span>
          </div>
          {statusReason && (
            <p className="mt-2 text-sm text-slate-600">
              Reason: {statusReason}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField
            label="Company Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={isCompanyAdmin}
          />
          <InputField
            label="Company Code"
            name="code"
            value={formData.code}
            onChange={handleChange}
            disabled={isCompanyAdmin}
          />
          <InputField
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            disabled={isCompanyAdmin}
          />
          <InputField
            label="Contact Person"
            name="contactPersonName"
            value={formData.contactPersonName}
            onChange={handleChange}
            disabled={isCompanyAdmin}
          />
          <InputField
            label="Contact Number"
            name="contactNumber"
            value={formData.contactNumber}
            onChange={handleChange}
            disabled={isCompanyAdmin}
          />
          <InputField
            label="Contact Email"
            name="contactEmail"
            value={formData.contactEmail}
            onChange={handleChange}
            type="email"
            disabled={isCompanyAdmin}
          />
          <InputField
            label="PAN Number"
            name="panNumber"
            value={formData.panNumber}
            onChange={handleChange}
            disabled={isCompanyAdmin}
          />
          <InputField
            label="Website"
            name="website"
            value={formData.website}
            onChange={handleChange}
            placeholder="https://example.com"
            disabled={isCompanyAdmin}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            disabled={isCompanyAdmin}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
          />
        </div>

        <div
          className={`grid grid-cols-1 gap-4 ${
            isCompanyAdmin ? "md:grid-cols-1" : "md:grid-cols-2"
          }`}
        >
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <span className="inline-flex items-center gap-2">
                <ImageIcon size={16} /> Replace Logo (Optional)
              </span>
            </label>
            <p className="text-xs text-slate-500 mb-3">
              JPG, PNG, WEBP up to 5MB.
            </p>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={(e) => handleUploadChange(e, "Logo", setLogoFile)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
            />
            {logoFile && (
              <p className="mt-2 text-xs text-slate-600">
                Selected: {logoFile.name} ({formatFileSize(logoFile.size)})
              </p>
            )}
          </div>
          {!isCompanyAdmin && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <span className="inline-flex items-center gap-2">
                  <FileBadge size={16} /> Replace Certificate{" "}
                  <span className="text-red-500">*</span>
                </span>
              </label>
              <p className="text-xs text-slate-500 mb-3">
                PDF, JPG, PNG up to 5MB.
              </p>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) =>
                  handleUploadChange(e, "Certificate", setCertificateFile)
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              />
              {certificateFile && (
                <p className="mt-2 text-xs text-slate-600">
                  Selected: {certificateFile.name} (
                  {formatFileSize(certificateFile.size)})
                </p>
              )}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl inline-flex items-center transition-colors shadow-lg shadow-blue-600/30 font-medium disabled:opacity-60"
        >
          {submitting ? (
            <Upload size={17} className="mr-2" />
          ) : (
            <Save size={17} className="mr-2" />
          )}
          {submitting
            ? "Saving..."
            : isCompanyAdmin
              ? "Update Company Logo"
              : "Save Company Settings"}
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Building2 size={18} /> Company Documents
        </h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => handleOpenMyFile("logo")}
            className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm"
          >
            View Logo
          </button>
          <button
            type="button"
            onClick={() => handleOpenMyFile("certificate")}
            className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm"
          >
            View Certificate
          </button>
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
  placeholder = "",
  error = "",
  disabled = false,
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
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full px-4 py-2.5 rounded-xl border outline-none ${
        error
          ? "border-red-300 focus:border-red-500"
          : "border-slate-200 focus:border-blue-500"
      } ${
        disabled ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-white"
      }`}
    />
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

export default CompanySettings;
