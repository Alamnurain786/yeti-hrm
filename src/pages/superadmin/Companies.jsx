import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Save,
  FileBadge,
  Image as ImageIcon,
} from "lucide-react";
import { companyAPI } from "../../services/backendApi";
import { useToast } from "../../context/ToastContext";
import {
  hasValidationErrors,
  validateCompanyCreateForm,
  validateCompanyField,
  validateCompanyProfileForm,
} from "../../utils/companyValidation";

const PAGE_SIZE = 10;
const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

const EMPTY_FORM = {
  companyName: "",
  companyCode: "",
  address: "",
  contactPersonName: "",
  contactNumber: "",
  contactEmail: "",
  panNumber: "",
  website: "",
  notes: "",
  adminName: "",
  adminEmail: "",
  adminPassword: "",
  adminPhone: "",
};

const normalizeCode = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);

const normalizeTax = (value) =>
  String(value || "")
    .trim()
    .toUpperCase();

const formatFileSize = (size) => {
  if (!size) return "";
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
};

const Companies = () => {
  const { showToast } = useToast();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [logoFile, setLogoFile] = useState(null);
  const [certificateFile, setCertificateFile] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [cleanupDays, setCleanupDays] = useState(180);
  const [cleanupDryRun, setCleanupDryRun] = useState(true);
  const [cleanupRunning, setCleanupRunning] = useState(false);

  const [editingCompany, setEditingCompany] = useState(null);
  const [editData, setEditData] = useState({
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
  const [editErrors, setEditErrors] = useState({});
  const [editLogoFile, setEditLogoFile] = useState(null);
  const [editCertificateFile, setEditCertificateFile] = useState(null);
  const [statusModal, setStatusModal] = useState({
    company: null,
    nextStatus: "ACTIVE",
    reason: "",
  });

  const loadCompanies = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const filteredCompanies = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((company) =>
      [
        company.name,
        company.code,
        company.address,
        company.contact_person_name,
        company.contact_number,
        company.contact_email,
        company.pan_number,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(q),
      ),
    );
  }, [companies, searchTerm]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCompanies.length / PAGE_SIZE),
  );
  const paginatedCompanies = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredCompanies.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredCompanies]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, companies.length]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      if (name === "companyName") {
        const nextName = value;
        const nextCode = prev.companyCode
          ? prev.companyCode
          : normalizeCode(nextName);
        return {
          ...prev,
          companyName: nextName,
          companyCode: nextCode,
        };
      }

      if (name === "companyCode") {
        return {
          ...prev,
          companyCode: normalizeCode(value),
        };
      }

      if (name === "panNumber") {
        return {
          ...prev,
          [name]: normalizeTax(value),
        };
      }

      return {
        ...prev,
        [name]: value,
      };
    });

    setFormErrors((prev) => ({
      ...prev,
      [name]: validateCompanyField(name, value, {
        required: [
          "companyName",
          "companyCode",
          "address",
          "contactPersonName",
          "contactNumber",
          "panNumber",
          "adminName",
          "adminEmail",
          "adminPassword",
        ].includes(name),
      }),
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

  const clearCreateForm = () => {
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setLogoFile(null);
    setCertificateFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nextErrors = validateCompanyCreateForm(formData);
    setFormErrors(nextErrors);
    if (hasValidationErrors(nextErrors)) {
      showToast("error", "Please fix the highlighted company fields", {
        title: "Validation Error",
      });
      return;
    }

    const payload = {
      company: {
        name: formData.companyName.trim(),
        code: normalizeCode(formData.companyCode),
        address: formData.address.trim() || null,
        contact_person_name: formData.contactPersonName.trim() || null,
        contact_number: formData.contactNumber.trim() || null,
        contact_email: formData.contactEmail.trim() || null,
        pan_number: normalizeTax(formData.panNumber) || null,
        website: formData.website.trim() || null,
        notes: formData.notes.trim() || null,
      },
      admin: {
        name: formData.adminName.trim(),
        email: formData.adminEmail.trim(),
        password: formData.adminPassword,
        phone: formData.adminPhone.trim() || null,
      },
    };

    if (!payload.company.code) {
      showToast("error", "Company code is required", {
        title: "Validation Error",
      });
      return;
    }

    if (!payload.company.address || !payload.company.contact_person_name) {
      showToast("error", "Address and contact person are required", {
        title: "Validation Error",
      });
      return;
    }

    if (!certificateFile) {
      showToast("error", "Company certificate is required", {
        title: "Validation Error",
      });
      return;
    }

    setSubmitting(true);
    try {
      const createdCompany = await companyAPI.createWithAdmin(payload);
      const emailSent = Boolean(createdCompany?.email_sent);
      const emailError = String(createdCompany?.email_error || "").trim();

      if (logoFile) {
        await companyAPI.uploadFile(createdCompany.id, "logo", logoFile);
      }
      if (certificateFile) {
        await companyAPI.uploadFile(
          createdCompany.id,
          "certificate",
          certificateFile,
        );
      }

      if (emailSent) {
        showToast("success", "Company created + onboarding email sent", {
          title: "Company Created",
        });
      } else {
        showToast(
          "info",
          emailError
            ? `Company created + email failed: ${emailError}`
            : "Company created + onboarding email failed",
          { title: "Company Created" },
        );
      }
      clearCreateForm();
      await loadCompanies();
    } catch (error) {
      // Parse backend error details for field-level validation errors
      const errorDetails = error?.response?.data?.error?.details || {};
      const hasFieldErrors = Object.keys(errorDetails).length > 0;

      if (hasFieldErrors) {
        // Map backend error keys to form field names
        const fieldErrorMap = {
          email: "adminEmail",
          name: "companyName",
          code: "companyCode",
          pan_number: "panNumber",
          contact_person_name: "contactPersonName",
          contact_number: "contactNumber",
          contact_email: "contactEmail",
        };

        const nextErrors = {};
        Object.entries(errorDetails).forEach(([key, message]) => {
          const formFieldName = fieldErrorMap[key] || key;
          nextErrors[formFieldName] = String(message);
        });

        setFormErrors(nextErrors);
        showToast(
          "error",
          error?.response?.data?.error?.message ||
            "Please fix the highlighted fields",
          { title: "Validation Error" },
        );
      } else {
        showToast(
          "error",
          error?.response?.data?.detail ||
            error?.response?.data?.error?.message ||
            "Failed to create company",
          { title: "Create Failed" },
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (company) => {
    setEditingCompany(company);
    setEditData({
      name: company.name || "",
      code: company.code || "",
      address: company.address || "",
      contactPersonName: company.contact_person_name || "",
      contactNumber: company.contact_number || "",
      contactEmail: company.contact_email || "",
      panNumber: company.pan_number || "",
      website: company.website || "",
      notes: company.notes || "",
    });
    setEditLogoFile(null);
    setEditCertificateFile(null);
  };

  const closeEditModal = () => {
    setEditingCompany(null);
    setEditData({
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
    setEditErrors({});
    setEditLogoFile(null);
    setEditCertificateFile(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    const nextValue =
      name === "code"
        ? normalizeCode(value)
        : name === "panNumber"
          ? normalizeTax(value)
          : value;

    setEditData((prev) => ({
      ...prev,
      [name]: nextValue,
    }));

    setEditErrors((prev) => ({
      ...prev,
      [name]: validateCompanyField(name, nextValue, {
        required: [
          "name",
          "code",
          "address",
          "contactPersonName",
          "contactNumber",
          "panNumber",
        ].includes(name),
      }),
    }));
  };

  const handleUpdateCompany = async (e) => {
    e.preventDefault();
    if (!editingCompany) return;

    const nextErrors = validateCompanyProfileForm(editData);
    setEditErrors(nextErrors);
    if (hasValidationErrors(nextErrors)) {
      showToast("error", "Please fix the highlighted company fields", {
        title: "Validation Error",
      });
      return;
    }

    setSubmitting(true);
    try {
      await companyAPI.update(editingCompany.id, {
        name: editData.name.trim(),
        code: normalizeCode(editData.code),
        address: editData.address.trim() || null,
        contact_person_name: editData.contactPersonName.trim() || null,
        contact_number: editData.contactNumber.trim() || null,
        contact_email: editData.contactEmail.trim() || null,
        pan_number: normalizeTax(editData.panNumber) || null,
        website: editData.website.trim() || null,
        notes: editData.notes.trim() || null,
      });

      if (editLogoFile) {
        await companyAPI.uploadFile(editingCompany.id, "logo", editLogoFile);
      }
      if (editCertificateFile) {
        await companyAPI.uploadFile(
          editingCompany.id,
          "certificate",
          editCertificateFile,
        );
      }

      showToast("success", "Company updated successfully", {
        title: "Company Updated",
      });
      closeEditModal();
      await loadCompanies();
    } catch (error) {
      showToast(
        "error",
        error?.response?.data?.detail || "Failed to update company",
        { title: "Update Failed" },
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openCompanyFile = async (companyId, fileType) => {
    try {
      await companyAPI.openFileInNewTab(companyId, fileType);
    } catch (error) {
      const errorMsg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.detail ||
        "Unable to open file";
      showToast("error", errorMsg, { title: "Open Failed" });
    }
  };

  const openStatusModal = (company, nextStatus) => {
    if (!company?.id) return;
    setStatusModal({
      company,
      nextStatus,
      reason: company.status_reason || "",
    });
  };

  const closeStatusModal = () => {
    setStatusModal({
      company: null,
      nextStatus: "ACTIVE",
      reason: "",
    });
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!statusModal.company) return;

    const trimmedReason = statusModal.reason.trim();
    if (!trimmedReason) {
      showToast("error", "Status reason is required", {
        title: "Validation Error",
      });
      return;
    }

    setSubmitting(true);
    try {
      await companyAPI.updateStatus(statusModal.company.id, {
        status: statusModal.nextStatus,
        reason: trimmedReason,
      });
      showToast(
        "success",
        `${statusModal.company.name} marked as ${statusModal.nextStatus.toLowerCase()}`,
        { title: "Status Updated" },
      );
      closeStatusModal();
      await loadCompanies();
    } catch (error) {
      showToast(
        "error",
        error?.response?.data?.detail || "Failed to update company status",
        { title: "Update Failed" },
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusClasses = (status) => {
    if (status === "INACTIVE") return "bg-amber-100 text-amber-700";
    return "bg-emerald-100 text-emerald-700";
  };

  const handleCleanup = async () => {
    setCleanupRunning(true);
    try {
      const result = await companyAPI.deactivateStale({
        days_inactive: Number(cleanupDays) || 180,
        dry_run: cleanupDryRun,
        only_active: true,
      });
      showToast(
        "success",
        cleanupDryRun
          ? `Dry run: ${result.deactivated_count} companies would be deactivated`
          : `${result.deactivated_count} companies deactivated`,
        { title: "Cleanup Complete" },
      );
      await loadCompanies();
    } catch (error) {
      showToast(
        "error",
        error?.response?.data?.detail || "Failed to run cleanup",
        { title: "Cleanup Failed" },
      );
    } finally {
      setCleanupRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Companies</h1>
          <p className="text-slate-500 mt-1">
            Create companies with full statutory profile, bootstrap first admin,
            and maintain branding documents.
          </p>
        </div>
        <button
          onClick={loadCompanies}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl flex items-center transition-colors"
        >
          <RefreshCw size={18} className="mr-2" />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Deactivate companies inactive for (days)
            </label>
            <input
              type="number"
              min={1}
              value={cleanupDays}
              onChange={(e) => setCleanupDays(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={cleanupDryRun}
                onChange={(e) => setCleanupDryRun(e.target.checked)}
              />
              Dry run only
            </label>
            <button
              type="button"
              onClick={handleCleanup}
              disabled={cleanupRunning}
              className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-sm disabled:opacity-60"
            >
              {cleanupRunning ? "Running..." : "Run Cleanup"}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">
          Create Company + First Admin
        </h2>
        <form
          noValidate
          autoComplete="off"
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <InputField
              label="Company Name"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              error={formErrors.companyName}
              required
            />
            <InputField
              label="Company Code"
              name="companyCode"
              value={formData.companyCode}
              onChange={handleChange}
              error={formErrors.companyCode}
              required
            />
            <InputField
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              error={formErrors.address}
              required
            />
            <InputField
              label="Contact Person"
              name="contactPersonName"
              value={formData.contactPersonName}
              onChange={handleChange}
              error={formErrors.contactPersonName}
              required
            />
            <InputField
              label="Contact Number"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              error={formErrors.contactNumber}
              required
            />
            <InputField
              label="Contact Email"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              type="email"
              error={formErrors.contactEmail}
            />
            <InputField
              label="PAN Number"
              name="panNumber"
              value={formData.panNumber}
              onChange={handleChange}
              error={formErrors.panNumber}
              required
            />
            <InputField
              label="Website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              error={formErrors.website}
              placeholder="https://example.com"
            />
            <InputField
              label="Admin Name"
              name="adminName"
              value={formData.adminName}
              onChange={handleChange}
              error={formErrors.adminName}
              required
            />
            <InputField
              label="Admin Email"
              name="adminEmail"
              value={formData.adminEmail}
              onChange={handleChange}
              type="email"
              error={formErrors.adminEmail}
              autoComplete="off"
              required
            />
            <InputField
              label="Admin Password"
              name="adminPassword"
              value={formData.adminPassword}
              onChange={handleChange}
              type="password"
              error={formErrors.adminPassword}
              autoComplete="new-password"
              required
            />
            <InputField
              label="Admin Phone"
              name="adminPhone"
              value={formData.adminPhone}
              onChange={handleChange}
              error={formErrors.adminPhone}
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
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Company Logo (Optional)
              </label>
              <p className="text-xs text-slate-500 mb-3">
                JPG, PNG, WEBP up to 5MB. Can be uploaded later by company
                admin.
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
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Company Certificate <span className="text-red-500">*</span>
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
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center transition-colors shadow-lg shadow-blue-600/30 font-medium disabled:opacity-60"
          >
            <Plus size={18} className="mr-2" />
            {submitting ? "Creating..." : "Create Company"}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Company Registry
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Showing {(currentPage - 1) * PAGE_SIZE + 1} to{" "}
              {Math.min(currentPage * PAGE_SIZE, filteredCompanies.length)} of{" "}
              {filteredCompanies.length} companies
            </p>
          </div>
          <div className="flex items-center bg-slate-50 rounded-xl px-4 py-2 w-full sm:w-72 border border-slate-100">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none ml-3 w-full text-sm text-slate-600 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-10 text-slate-500">
              Loading companies...
            </div>
          ) : filteredCompanies.length > 0 ? (
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left">Company</th>
                  <th className="px-4 py-3 text-left">Contact</th>
                  <th className="px-4 py-3 text-left">PAN/VAT</th>
                  <th className="px-4 py-3 text-left">Address</th>
                  <th className="px-4 py-3 text-left">Docs</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCompanies.map((company) => (
                  <tr key={company.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">
                        {company.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {company.code}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{company.contact_person_name || "-"}</div>
                      <div className="text-xs text-slate-500">
                        {company.contact_number || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>PAN: {company.pan_number || "-"}</div>
                    </td>
                    <td
                      className="px-4 py-3 max-w-48 truncate"
                      title={company.address || "-"}
                    >
                      {company.address || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openCompanyFile(company.id, "logo")}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50"
                        >
                          <ImageIcon size={13} /> Logo
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            openCompanyFile(company.id, "certificate")
                          }
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50"
                        >
                          <FileBadge size={13} /> Cert
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2">
                        <span
                          className={`inline-flex w-fit items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusClasses(company.status)}`}
                        >
                          {company.status || "ACTIVE"}
                        </span>
                        {company.status_reason && (
                          <p className="text-xs text-slate-500 max-w-52">
                            {company.status_reason}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => openEditModal(company)}
                          className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700"
                          title="Edit Company"
                        >
                          <Pencil size={15} />
                        </button>
                        {company.status === "ACTIVE" && (
                          <button
                            onClick={() => openStatusModal(company, "INACTIVE")}
                            className="px-3 py-2 rounded-lg bg-white border border-amber-200 hover:bg-amber-50 text-amber-700 text-xs font-medium"
                            title="Deactivate Company"
                          >
                            Deactivate
                          </button>
                        )}
                        {company.status === "INACTIVE" && (
                          <button
                            onClick={() => openStatusModal(company, "ACTIVE")}
                            className="px-3 py-2 rounded-lg bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-700 text-xs font-medium"
                            title="Activate Company"
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 text-slate-500">
              No companies found.
            </div>
          )}
        </div>

        {filteredCompanies.length > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              {Array.from({ length: totalPages }, (_, index) => index + 1)
                .slice(
                  Math.max(0, currentPage - 3),
                  Math.max(5, currentPage + 2),
                )
                .map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`h-9 min-w-9 rounded-lg px-3 ${
                      currentPage === page
                        ? "bg-blue-600 text-white"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
            </div>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {editingCompany && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Edit Company</h2>
            </div>
            <form
              noValidate
              onSubmit={handleUpdateCompany}
              className="p-6 space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputField
                  label="Company Name"
                  name="name"
                  value={editData.name}
                  onChange={handleEditChange}
                  error={editErrors.name}
                  required
                />
                <InputField
                  label="Company Code"
                  name="code"
                  value={editData.code}
                  onChange={handleEditChange}
                  error={editErrors.code}
                  required
                />
                <InputField
                  label="Address"
                  name="address"
                  value={editData.address}
                  onChange={handleEditChange}
                  error={editErrors.address}
                />
                <InputField
                  label="Contact Person"
                  name="contactPersonName"
                  value={editData.contactPersonName}
                  onChange={handleEditChange}
                  error={editErrors.contactPersonName}
                />
                <InputField
                  label="Contact Number"
                  name="contactNumber"
                  value={editData.contactNumber}
                  onChange={handleEditChange}
                  error={editErrors.contactNumber}
                />
                <InputField
                  label="Contact Email"
                  name="contactEmail"
                  value={editData.contactEmail}
                  onChange={handleEditChange}
                  type="email"
                  error={editErrors.contactEmail}
                />
                <InputField
                  label="PAN Number"
                  name="panNumber"
                  value={editData.panNumber}
                  onChange={handleEditChange}
                  error={editErrors.panNumber}
                />
                <InputField
                  label="Website"
                  name="website"
                  value={editData.website}
                  onChange={handleEditChange}
                  error={editErrors.website}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={editData.notes}
                  onChange={handleEditChange}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Replace Logo (Optional)
                  </label>
                  <p className="text-xs text-slate-500 mb-3">
                    JPG, PNG, WEBP up to 5MB.
                  </p>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={(e) =>
                      handleUploadChange(e, "Logo", setEditLogoFile)
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  />
                  {editLogoFile && (
                    <p className="mt-2 text-xs text-slate-600">
                      Selected: {editLogoFile.name} (
                      {formatFileSize(editLogoFile.size)})
                    </p>
                  )}
                </div>
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Replace Certificate
                  </label>
                  <p className="text-xs text-slate-500 mb-3">
                    PDF, JPG, PNG up to 5MB.
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) =>
                      handleUploadChange(
                        e,
                        "Certificate",
                        setEditCertificateFile,
                      )
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  />
                  {editCertificateFile && (
                    <p className="mt-2 text-xs text-slate-600">
                      Selected: {editCertificateFile.name} (
                      {formatFileSize(editCertificateFile.size)})
                    </p>
                  )}
                </div>
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                <span>
                  Current status: {editingCompany.status || "ACTIVE"}
                  {editingCompany.status_reason
                    ? ` (${editingCompany.status_reason})`
                    : ""}
                </span>
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center transition-colors shadow-lg shadow-blue-600/30 font-medium disabled:opacity-60"
                >
                  <Save size={16} className="mr-2" />
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {statusModal.company && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">
                {statusModal.nextStatus === "ACTIVE"
                  ? "Activate Company"
                  : "Deactivate Company"}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {statusModal.company.name}
              </p>
            </div>
            <form
              noValidate
              onSubmit={handleStatusUpdate}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Reason
                </label>
                <textarea
                  value={statusModal.reason}
                  onChange={(e) =>
                    setStatusModal((prev) => ({
                      ...prev,
                      reason: e.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="Enter the reason for this status change"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeStatusModal}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-blue-600/30 font-medium disabled:opacity-60"
                >
                  {submitting ? "Saving..." : "Confirm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
  autoComplete = "off",
  error = "",
}) => {
  const [showPassword, setShowPassword] = useState(
    type === "password" ? false : true,
  );
  const isPasswordField = type === "password";
  const inputType = isPasswordField && showPassword ? "text" : type;

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type={inputType}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className={`w-full px-4 py-2.5 rounded-xl border outline-none pr-${isPasswordField ? "12" : "4"} ${
            error
              ? "border-red-300 focus:border-red-500"
              : "border-slate-200 focus:border-blue-500"
          }`}
        />
        {isPasswordField && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
            tabIndex={-1}
          >
            {showPassword ? (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-4.753 4.753m4.753-4.753L3.596 3.039m10.318 10.318L21 21M3 3l18 18"
                />
              </svg>
            )}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default Companies;
