import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Search,
  Mail,
  Phone,
  Pencil,
  ToggleLeft,
  Trash2,
  UserX,
  Eye,
  X,
  MoreHorizontal,
  Upload,
  Download,
} from "lucide-react";
import { profileAPI, profileFileAPI, userAPI } from "../services/backendApi";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import AddEmployeeForm from "../components/AddEmployeeForm";
import {
  getEmployeeStatusColor,
  getVerificationStatusColor,
} from "../utils/statusUi";

const Employees = () => {
  const { user: currentUser } = useAuth();
  const companyIdForTemplate =
    String(currentUser?.tenant_id || "").trim() || "YOUR_COMPANY_ID";
  const employeeImportTemplate = [
    "company_id,name,email,role,password,position,phone,department,section_id,section_name,is_section_manager,manager,joining_date_bs,dob_bs,dob_ad,gender,device_mapping_mode,map_with_device_user,create_on_device,device_id,device_user_id",
    `${companyIdForTemplate},John Doe,john@example.com,user,password123,Developer,9800000000,IT,SEC001,Backend,No,Jane Manager,2078-01-01,2050-01-01,1993-04-14,Male,none,No,No,,`,
    `${companyIdForTemplate},Ram KC,ram.kc@example.com,user,password123,Operator,9800000011,Operations,SEC002,Front Desk,No,Sita Manager,2079-02-10,2054-03-20,1997-07-04,Male,existing,Yes,No,DEV001,1007`,
    `${companyIdForTemplate},Gita Rai,gita.rai@example.com,user,password123,Engineer,9800000022,Engineering,SEC003,Field,No,Binod Lead,2080-03-15,2055-08-11,1998-11-27,Female,create_and_map,Yes,Yes,DEV001,`,
  ].join("\n");

  const [users, setUsers] = useState([]);
  const { showToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [viewingProfile, setViewingProfile] = useState(null);
  const [viewingFiles, setViewingFiles] = useState([]);
  const [viewingLoading, setViewingLoading] = useState(false);
  const [reviewActionLoading, setReviewActionLoading] = useState(false);
  const [openActionMenuFor, setOpenActionMenuFor] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const actionMenuRef = useRef(null);
  const objectUrlRegistryRef = useRef([]);

  const downloadEmployeeTemplate = () => {
    const blob = new Blob([employeeImportTemplate], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "employees_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEmployeeImport = async (e) => {
    e.preventDefault();
    if (!importFile) return;

    setImportLoading(true);
    setImportResults(null);

    try {
      const formData = new FormData();
      formData.append("file", importFile);
      const response = await userAPI.importEmployees(formData);
      const rows = response?.results || [];
      setImportResults(rows);

      const successCount = rows.filter(
        (row) => row.status === "success",
      ).length;
      const errorCount = rows.length - successCount;
      showToast(
        "success",
        `Employee import finished. ${successCount} success, ${errorCount} failed.`,
        { title: "Import Complete" },
      );
      await loadUsers();
    } catch (error) {
      const message =
        error?.response?.data?.detail || "Failed to import employee CSV";
      showToast("error", message, { title: "Import Failed" });
      setImportResults([{ row: "-", status: "error", error: String(message) }]);
    } finally {
      setImportLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const list = await userAPI.getAll();
      // Employees page should exclude admin and superadmin.
      setUsers(list.filter((u) => u.role === "user"));
    } catch {
      showToast("error", "Failed to load employees", {
        title: "Load Failed",
      });
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    return () => {
      objectUrlRegistryRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlRegistryRef.current = [];
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target)
      ) {
        setOpenActionMenuFor(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Confirmation modal state
  const [confirmData, setConfirmData] = useState({
    open: false,
    title: "",
    message: "",
    actionLabel: "Confirm",
    onConfirm: null,
    requireReason: false,
  });
  const [confirmReason, setConfirmReason] = useState("");

  const openConfirm = ({
    title,
    message,
    actionLabel,
    onConfirm,
    requireReason = false,
  }) => {
    setConfirmReason("");
    setConfirmData({
      open: true,
      title,
      message,
      actionLabel,
      onConfirm,
      requireReason,
    });
  };
  const closeConfirm = () =>
    setConfirmData({
      open: false,
      title: "",
      message: "",
      actionLabel: "Confirm",
      onConfirm: null,
      requireReason: false,
    });

  // Filter only employees (exclude superadmin)
  const employees = useMemo(
    () =>
      users.filter(
        (u) =>
          (u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
          (statusFilter === "All" || u.status === statusFilter),
      ),
    [users, searchTerm, statusFilter],
  );

  const getMappedColor = (mapped) =>
    mapped ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700";

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setShowModal(true);
  };

  const handleModalVisibility = (isOpen) => {
    setShowModal(isOpen);
    if (!isOpen) {
      setEditingEmployee(null);
    }
  };

  const getInitials = (name) =>
    String(name || "")
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const handleToggleActive = (employee) => {
    const nextStatus = employee.status === "Active" ? "Deactive" : "Active";

    openConfirm({
      title: "Change Status",
      message: `Change ${employee.name}'s status to ${nextStatus}?`,
      actionLabel: nextStatus === "Active" ? "Activate" : "Deactivate",
      onConfirm: async () => {
        try {
          await userAPI.update(employee.id, { status: nextStatus });
          showToast("success", `Status changed to ${nextStatus}`, {
            title: "Status Updated",
          });
          closeConfirm();
          await loadUsers();
        } catch {
          showToast("error", "Failed to update status", {
            title: "Update Failed",
          });
        }
      },
    });
  };

  const handleMarkResigned = (employee) => {
    const today = new Date().toISOString().split("T")[0];

    openConfirm({
      title: "Mark as Resigned",
      message: `Mark ${employee.name} as Resigned? This will set status to Resigned and save resignation date (${today}).`,
      actionLabel: "Mark Resigned",
      onConfirm: async () => {
        try {
          await userAPI.update(employee.id, {
            status: "Resigned",
            resignation_date: today,
          });
          showToast("success", `${employee.name} marked as Resigned`, {
            title: "Employee Resigned",
          });
          closeConfirm();
          await loadUsers();
        } catch {
          showToast("error", "Failed to mark resigned", {
            title: "Update Failed",
          });
        }
      },
    });
  };

  const handleDeleteEmployee = (employee) => {
    openConfirm({
      title: "Delete Employee",
      message: `Delete ${employee.name}? This action cannot be undone.`,
      actionLabel: "Delete",
      onConfirm: async () => {
        try {
          await userAPI.delete(employee.id);
          showToast("success", `${employee.name} deleted`, {
            title: "Employee Deleted",
          });
          closeConfirm();
          await loadUsers();
        } catch (error) {
          showToast(
            "error",
            error.response?.data?.detail || "Failed to delete employee",
            { title: "Delete Failed" },
          );
        }
      },
    });
  };

  const handleViewEmployee = (employee) => {
    setViewingLoading(true);
    setViewingEmployee(employee);
    Promise.all([
      profileAPI.getByEmployeeId(employee.id),
      profileFileAPI.list(employee.id),
    ])
      .then(async ([profile, files]) => {
        objectUrlRegistryRef.current.forEach((url) => URL.revokeObjectURL(url));
        objectUrlRegistryRef.current = [];

        const resolvedFiles = await Promise.all(
          (files || []).map(async (file) => {
            try {
              const objectUrl = await profileFileAPI.createObjectUrl(file.id);
              objectUrlRegistryRef.current.push(objectUrl);
              return { ...file, object_url: objectUrl };
            } catch {
              return { ...file, object_url: "" };
            }
          }),
        );

        setViewingProfile(profile);
        setViewingFiles(resolvedFiles);
      })
      .catch(() => {
        setViewingProfile(null);
        setViewingFiles([]);
        showToast("error", "Failed to load full profile details", {
          title: "Load Failed",
        });
      })
      .finally(() => setViewingLoading(false));
  };

  const closeViewModal = () => {
    objectUrlRegistryRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlRegistryRef.current = [];
    setViewingEmployee(null);
    setViewingProfile(null);
    setViewingFiles([]);
    setViewingLoading(false);
  };

  const getFileByFieldName = (fieldName) =>
    viewingFiles.find((file) => file.field_name === fieldName);

  const getDocumentUrl = (fieldName, fallbackValue) => {
    const matched = getFileByFieldName(fieldName);
    if (matched?.object_url) return matched.object_url;
    if (
      typeof fallbackValue === "string" &&
      /^https?:\/\//i.test(fallbackValue)
    ) {
      return fallbackValue;
    }
    return "";
  };

  const getProfileImageUrl = () => {
    const imageFile = getFileByFieldName("profileImage");
    if (imageFile?.object_url) return imageFile.object_url;
    if (
      typeof viewingProfile?.profileImage === "string" &&
      /^https?:\/\//i.test(viewingProfile.profileImage)
    ) {
      return viewingProfile.profileImage;
    }
    return "";
  };

  const handleReviewFromModal = async (verificationStatus) => {
    if (!viewingEmployee) return;

    const today = new Date().toISOString().split("T")[0];

    if (verificationStatus === "Rejected") {
      openConfirm({
        title: "Reject Profile",
        message: `Reject ${viewingEmployee.name}'s profile update?`,
        actionLabel: "Reject",
        requireReason: true,
        onConfirm: async (reason) => {
          try {
            setReviewActionLoading(true);
            await userAPI.update(viewingEmployee.id, {
              verification_status: verificationStatus,
              verified_at: today,
              verification_reason: reason,
            });

            showToast(
              "success",
              `${viewingEmployee.name} ${verificationStatus.toLowerCase()}`,
              { title: "Review Updated" },
            );
            closeConfirm();
            closeViewModal();
            await loadUsers();
          } catch {
            showToast("error", "Failed to update review status", {
              title: "Update Failed",
            });
          } finally {
            setReviewActionLoading(false);
          }
        },
      });
      return;
    }

    try {
      setReviewActionLoading(true);
      await userAPI.update(viewingEmployee.id, {
        verification_status: verificationStatus,
        verified_at: today,
        verification_reason: null,
      });

      showToast(
        "success",
        `${viewingEmployee.name} ${verificationStatus.toLowerCase()}`,
        { title: "Review Updated" },
      );
      closeViewModal();
      await loadUsers();
    } catch {
      showToast("error", "Failed to update review status", {
        title: "Update Failed",
      });
    } finally {
      setReviewActionLoading(false);
    }
  };

  const toggleActionMenu = (employeeId) => {
    setOpenActionMenuFor((prev) => (prev === employeeId ? null : employeeId));
  };

  const runAction = (callback) => {
    setOpenActionMenuFor(null);
    callback();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Employees</h1>
        <p className="text-slate-500 mt-1">
          Manage your team members and their roles.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-visible min-h-[560px]">
        <div className="p-4 border-b border-slate-100 bg-slate-50/60">
          <form
            onSubmit={handleEmployeeImport}
            className="flex flex-col gap-3 xl:flex-row xl:items-end"
          >
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-700">
                Import Employees CSV
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  setImportFile(e.target.files?.[0] || null);
                  setImportResults(null);
                }}
                className="mt-1 block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            <div className="flex gap-2 flex-wrap xl:justify-end">
              <button
                type="button"
                onClick={() => {
                  setEditingEmployee(null);
                  setShowModal(true);
                }}
                className="px-3 py-2 rounded-xl border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 text-sm inline-flex items-center gap-2"
              >
                <Plus size={16} /> Add Employee
              </button>
              <button
                type="button"
                onClick={downloadEmployeeTemplate}
                className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-sm inline-flex items-center gap-2"
              >
                <Download size={16} /> Template
              </button>
              <button
                type="submit"
                disabled={!importFile || importLoading}
                className="px-3 py-2 rounded-xl border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 text-sm inline-flex items-center gap-2"
              >
                <Upload size={16} />
                {importLoading ? "Importing..." : "Import Employees"}
              </button>
            </div>
          </form>
          {/* 
          <p className="mt-3 text-xs text-slate-600">
            Roles supported in CSV: <strong>user</strong>,{" "}
            <strong>admin</strong>, <strong>superadmin</strong>. For company
            admin imports, <strong>company_id</strong> should be your own
            company. For global superadmin imports, keep{" "}
            <strong>company_id</strong> empty.
          </p> */}

          {Array.isArray(importResults) && importResults.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs border border-slate-200">
                <thead>
                  <tr className="bg-white">
                    <th className="border px-2 py-1 text-left">Row</th>
                    <th className="border px-2 py-1 text-left">Status</th>
                    <th className="border px-2 py-1 text-left">
                      Mapping Result
                    </th>
                    <th className="border px-2 py-1 text-left">ID/Error</th>
                  </tr>
                </thead>
                <tbody>
                  {importResults.map((row, index) => (
                    <tr key={index}>
                      <td className="border px-2 py-1">{row.row}</td>
                      <td
                        className={`border px-2 py-1 ${
                          row.status === "success"
                            ? "text-emerald-700"
                            : "text-red-700"
                        }`}
                      >
                        {row.status}
                      </td>
                      <td className="border px-2 py-1">
                        {row.mapping_result === "created_and_mapped"
                          ? "created and mapped"
                          : row.mapping_result === "mapped_existing"
                            ? "mapped existing"
                            : row.mapping_result === "mapping_skipped"
                              ? "mapping skipped"
                              : row.status === "error"
                                ? "failed"
                                : "-"}
                      </td>
                      <td className="border px-2 py-1">
                        {row.user_id || row.error || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="p-4 border-b border-slate-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center bg-slate-50 rounded-xl px-4 py-2 w-full sm:w-64 border border-slate-100">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none ml-3 w-full text-sm text-slate-600 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <label htmlFor="statusFilter" className="text-sm text-slate-600">
              Status:
            </label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-2"
            >
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="Deactive">Deactive</option>
              <option value="Resigned">Resigned</option>
            </select>
          </div>
        </div>

        <div className="md:hidden p-4 space-y-3">
          {employees.map((employee) => (
            <div
              key={employee.id}
              className="rounded-xl border border-slate-200 p-4 bg-slate-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                    {getInitials(employee.name)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {employee.name}
                    </p>
                    <p className="text-xs text-slate-500">ID: #{employee.id}</p>
                    {employee.force_password_reset && (
                      <span className="inline-flex mt-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-medium">
                        Password reset pending
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getEmployeeStatusColor(
                    employee.status,
                  )}`}
                >
                  {employee.status}
                </span>
              </div>

              <div className="mt-3 space-y-1 text-xs text-slate-600">
                <p className="capitalize">
                  {employee.role} • {employee.department}
                  {employee.position ? ` • ${employee.position}` : ""}
                </p>
                <p>Email: {employee.email}</p>
                <p>Phone: {employee.phone}</p>
                <p>Verification: {employee.verification_status || "Pending"}</p>
                <p>
                  Mapped Successfully:{" "}
                  {employee.mapped_successfully ? "Yes" : "No"}
                </p>
                <p>Resignation Date: {employee.resignation_date || "-"}</p>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  className="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold"
                  onClick={() => handleViewEmployee(employee)}
                >
                  View
                </button>
                <button
                  className="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold"
                  onClick={() => handleEditEmployee(employee)}
                >
                  Edit
                </button>
                <button
                  className="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-indigo-700 text-xs font-semibold"
                  onClick={() => handleToggleActive(employee)}
                >
                  {employee.status === "Active" ? "Deactivate" : "Activate"}
                </button>
                <button
                  className="px-2 py-1 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-700 text-xs font-semibold"
                  onClick={() => handleMarkResigned(employee)}
                >
                  Resign
                </button>
                <button
                  className="px-2 py-1 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-700 text-xs font-semibold"
                  onClick={() => handleDeleteEmployee(employee)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden md:block overflow-x-auto overflow-y-visible">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/95 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky top-0 bg-slate-50/95 z-20">
                  Employee
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky top-0 bg-slate-50/95 z-20">
                  Role & Dept
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky top-0 bg-slate-50/95 z-20">
                  Contact
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky top-0 bg-slate-50/95 z-20">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky top-0 bg-slate-50/95 z-20">
                  Resignation Date
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky top-0 bg-slate-50/95 z-20">
                  Verification
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky top-0 bg-slate-50/95 z-20">
                  Mapped Successfully
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right sticky top-0 right-0 bg-slate-50/95 backdrop-blur-sm z-30 shadow-[-8px_0_12px_-8px_rgba(15,23,42,0.15)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((employee) => (
                <tr
                  key={employee.id}
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                        {getInitials(employee.name)}
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-semibold text-slate-800">
                          {employee.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          ID: #{employee.id}
                        </p>
                        {employee.force_password_reset && (
                          <span className="inline-flex mt-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-medium">
                            Password reset pending
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm text-slate-700 font-medium capitalize">
                      {employee.role}
                    </p>
                    <p className="text-xs text-slate-500">
                      {employee.department}
                      {employee.position ? ` • ${employee.position}` : ""}
                    </p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center text-xs text-slate-500">
                        <Mail size={12} className="mr-1.5" />
                        {employee.email}
                      </div>
                      <div className="flex items-center text-xs text-slate-500">
                        <Phone size={12} className="mr-1.5" />
                        {employee.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getEmployeeStatusColor(
                          employee.status,
                        )}`}
                      >
                        {employee.status}
                      </span>
                      {employee.status === "Resigned" && (
                        <span className="text-xs text-slate-500">Resigned</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-xs text-slate-600">
                    {employee.resignation_date || "-"}
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getVerificationStatusColor(
                        employee.verification_status || "Pending",
                      )}`}
                    >
                      {employee.verification_status || "Pending"}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getMappedColor(
                        Boolean(employee.mapped_successfully),
                      )}`}
                    >
                      {employee.mapped_successfully ? "Yes" : "No"}
                    </span>
                  </td>
                  <td
                    className={`px-6 py-5 text-right sticky right-0 bg-white shadow-[-8px_0_12px_-8px_rgba(15,23,42,0.12)] ${
                      openActionMenuFor === employee.id ? "z-40" : "z-10"
                    }`}
                  >
                    <div
                      ref={
                        openActionMenuFor === employee.id ? actionMenuRef : null
                      }
                      className="relative inline-block text-left overflow-visible"
                    >
                      <button
                        className={`px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold inline-flex items-center gap-1 shadow-sm ${
                          openActionMenuFor && openActionMenuFor !== employee.id
                            ? "invisible pointer-events-none"
                            : ""
                        }`}
                        onClick={() => toggleActionMenu(employee.id)}
                        aria-label={`Open actions for ${employee.name}`}
                      >
                        <MoreHorizontal size={14} /> Actions
                      </button>

                      {openActionMenuFor === employee.id && (
                        <div className="absolute right-0 mt-2 w-52 origin-top-right rounded-xl border border-slate-200 bg-white shadow-xl z-50">
                          <div className="py-1">
                            <button
                              className="w-full px-3 py-2 text-left text-xs text-blue-700 hover:bg-blue-50 flex items-center gap-2"
                              onClick={() =>
                                runAction(() => handleViewEmployee(employee))
                              }
                            >
                              <Eye size={14} /> View
                            </button>
                            <button
                              className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              onClick={() =>
                                runAction(() => handleEditEmployee(employee))
                              }
                            >
                              <Pencil size={14} /> Edit
                            </button>
                          </div>

                          <div className="border-t border-slate-100 py-1">
                            <button
                              className="w-full px-3 py-2 text-left text-xs text-indigo-700 hover:bg-indigo-50 flex items-center gap-2"
                              onClick={() =>
                                runAction(() => handleToggleActive(employee))
                              }
                            >
                              <ToggleLeft size={14} />
                              {employee.status === "Active"
                                ? "Deactivate"
                                : "Activate"}
                            </button>
                            <button
                              className="w-full px-3 py-2 text-left text-xs text-red-700 hover:bg-red-50 flex items-center gap-2"
                              onClick={() =>
                                runAction(() => handleMarkResigned(employee))
                              }
                            >
                              <UserX size={14} /> Resign
                            </button>
                            <button
                              className="w-full px-3 py-2 text-left text-xs text-red-700 hover:bg-red-50 flex items-center gap-2"
                              onClick={() =>
                                runAction(() => handleDeleteEmployee(employee))
                              }
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      <AddEmployeeForm
        showModal={showModal}
        setShowModal={handleModalVisibility}
        onCreated={loadUsers}
        editingEmployee={editingEmployee}
      />

      {viewingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">
                Employee Profile Review
              </h2>
              <button
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                onClick={closeViewModal}
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-6 text-sm">
              {viewingLoading ? (
                <div className="text-slate-500">Loading profile details...</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                      <div className="w-40 h-40 rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center">
                        {getProfileImageUrl() ? (
                          <img
                            src={getProfileImageUrl()}
                            alt={viewingEmployee.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-slate-400">No image</span>
                        )}
                      </div>
                    </div>
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-500">Employee ID:</span>{" "}
                        <span className="text-slate-800 font-medium">
                          {viewingEmployee.id || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Name:</span>{" "}
                        <span className="text-slate-800 font-medium">
                          {viewingEmployee.name || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Email:</span>{" "}
                        <span className="text-slate-800 font-medium">
                          {viewingEmployee.email || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Phone:</span>{" "}
                        <span className="text-slate-800 font-medium">
                          {viewingEmployee.phone || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Department:</span>{" "}
                        <span className="text-slate-800 font-medium">
                          {viewingProfile?.department ||
                            viewingEmployee.department ||
                            "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Role:</span>{" "}
                        <span className="text-slate-800 font-medium">
                          {viewingProfile?.role || viewingEmployee.role || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Manager:</span>{" "}
                        <span className="text-slate-800 font-medium">
                          {viewingProfile?.manager ||
                            viewingEmployee.manager ||
                            "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Status:</span>{" "}
                        <span className="text-slate-800 font-medium">
                          {viewingEmployee.status || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Verification:</span>{" "}
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getVerificationStatusColor(viewingEmployee.verification_status || "Pending")}`}
                        >
                          {viewingEmployee.verification_status || "Pending"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">
                          Verification Reason:
                        </span>{" "}
                        <span className="text-slate-800 font-medium">
                          {viewingEmployee.verification_reason || "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-slate-200 p-4">
                      <h3 className="font-semibold text-slate-800 mb-3">
                        Identification
                      </h3>
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-slate-500">
                            Citizenship No:
                          </span>{" "}
                          <span className="text-slate-800">
                            {viewingProfile?.identification?.citizenshipNo ||
                              "-"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">PAN No:</span>{" "}
                          <span className="text-slate-800">
                            {viewingProfile?.identification?.panNo || "-"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">National ID:</span>{" "}
                          <span className="text-slate-800">
                            {viewingProfile?.identification?.nationalIdCardNo ||
                              "-"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">
                            Driving License:
                          </span>{" "}
                          <span className="text-slate-800">
                            {viewingProfile?.identification?.drivingLicenseNo ||
                              "-"}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {[
                          [
                            "citizenshipDocument",
                            viewingProfile?.identification?.citizenshipDocument,
                            "Citizenship",
                          ],
                          [
                            "nationalIdCardDocument",
                            viewingProfile?.identification
                              ?.nationalIdCardDocument,
                            "National ID",
                          ],
                          [
                            "drivingLicenseDocument",
                            viewingProfile?.identification
                              ?.drivingLicenseDocument,
                            "Driving License",
                          ],
                          [
                            "panDocument",
                            viewingProfile?.identification?.panDocument,
                            "PAN",
                          ],
                        ].map(([field, value, label]) => {
                          const url = getDocumentUrl(field, value);
                          return (
                            <a
                              key={field}
                              href={url || "#"}
                              target="_blank"
                              rel="noreferrer"
                              className={`px-2 py-1 rounded-lg text-xs border ${url ? "border-blue-200 text-blue-700 hover:bg-blue-50" : "border-slate-200 text-slate-400 pointer-events-none"}`}
                            >
                              {label}
                            </a>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">
                      <h3 className="font-semibold text-slate-800 mb-3">
                        Address
                      </h3>
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-slate-500">Current:</span>{" "}
                          <span className="text-slate-800">
                            {`${viewingProfile?.currentAddress?.houseNo || ""} ${viewingProfile?.currentAddress?.street || ""}, ${viewingProfile?.currentAddress?.municipality || ""}, ${viewingProfile?.currentAddress?.district || ""}`.trim() ||
                              "-"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Permanent:</span>{" "}
                          <span className="text-slate-800">
                            {`${viewingProfile?.permanentAddress?.houseNo || ""} ${viewingProfile?.permanentAddress?.street || ""}, ${viewingProfile?.permanentAddress?.municipality || ""}, ${viewingProfile?.permanentAddress?.district || ""}`.trim() ||
                              "-"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Mobile:</span>{" "}
                          <span className="text-slate-800">
                            {viewingProfile?.currentAddress?.mobile || "-"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Email:</span>{" "}
                          <span className="text-slate-800">
                            {viewingProfile?.currentAddress?.email ||
                              viewingEmployee.email ||
                              "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-slate-200 p-4">
                      <h3 className="font-semibold text-slate-800 mb-3">
                        Family Members
                      </h3>
                      <div className="space-y-2">
                        {(viewingProfile?.familyMembers || []).length === 0 && (
                          <p className="text-xs text-slate-500">
                            No family details
                          </p>
                        )}
                        {(viewingProfile?.familyMembers || []).map(
                          (member, idx) => (
                            <div
                              key={`${member.name}-${idx}`}
                              className="text-xs text-slate-700 border border-slate-100 rounded-lg p-2"
                            >
                              <div className="font-medium">
                                {member.relationship || "-"}
                              </div>
                              <div>{member.name || "-"}</div>
                              <div className="text-slate-500">
                                {member.remarks || "-"}
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">
                      <h3 className="font-semibold text-slate-800 mb-3">
                        Education
                      </h3>
                      <div className="space-y-2">
                        {(viewingProfile?.education || []).length === 0 && (
                          <p className="text-xs text-slate-500">
                            No education details
                          </p>
                        )}
                        {(viewingProfile?.education || []).map((edu, idx) => {
                          const url = getDocumentUrl(
                            `education_${idx}`,
                            edu.document,
                          );
                          return (
                            <div
                              key={`${edu.degree}-${idx}`}
                              className="text-xs text-slate-700 border border-slate-100 rounded-lg p-2"
                            >
                              <div className="font-medium">
                                {edu.degree || "-"}
                              </div>
                              <div>{edu.institute || "-"}</div>
                              <div className="text-slate-500">
                                Year: {edu.year || "-"}
                              </div>
                              {url && (
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-block mt-1 text-blue-700 hover:underline"
                                >
                                  View Document
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="p-5 border-t border-slate-100 flex justify-between items-center gap-3">
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm disabled:opacity-50"
                  disabled={reviewActionLoading}
                  onClick={() => handleReviewFromModal("Approved")}
                >
                  Approve
                </button>
                <button
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm disabled:opacity-50"
                  disabled={reviewActionLoading}
                  onClick={() => handleReviewFromModal("Rejected")}
                >
                  Reject
                </button>
              </div>
              <button
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm"
                onClick={closeViewModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmData.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md">
            <div className="p-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800">
                {confirmData.title}
              </h2>
            </div>
            <div className="p-4 text-slate-600 text-sm">
              {confirmData.message}
              {confirmData.requireReason && (
                <div className="mt-3">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Rejection Reason
                  </label>
                  <textarea
                    value={confirmReason}
                    onChange={(e) => setConfirmReason(e.target.value)}
                    rows={3}
                    placeholder="Enter reason for rejection"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              )}
            </div>
            <div className="p-4 flex justify-end gap-2 border-t border-slate-100">
              <button
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm"
                onClick={closeConfirm}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm shadow-lg shadow-blue-600/30"
                disabled={confirmData.requireReason && !confirmReason.trim()}
                onClick={() =>
                  confirmData.onConfirm &&
                  confirmData.onConfirm(confirmReason.trim())
                }
              >
                {confirmData.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
