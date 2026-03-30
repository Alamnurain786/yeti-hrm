import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Network, Pencil, Trash2, Users } from "lucide-react";
import {
  departmentAPI,
  getApiErrorMessage,
  getApiValidationErrors,
  userAPI,
} from "../services/backendApi";
import { useToast } from "../context/ToastContext";

const EMPTY_FORM = {
  departmentId: "",
  name: "",
  description: "",
  isActive: true,
};

const Sections = () => {
  const { showToast } = useToast();
  const [sections, setSections] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  const loadData = async () => {
    try {
      const [sectionList, departmentList, userList] = await Promise.all([
        departmentAPI.getSections(),
        departmentAPI.getAll(),
        userAPI.getAll(),
      ]);
      setSections(Array.isArray(sectionList) ? sectionList : []);
      setDepartments(Array.isArray(departmentList) ? departmentList : []);
      setUsers(Array.isArray(userList) ? userList : []);
    } catch {
      showToast("error", "Failed to load sections", { title: "Load Failed" });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredSections = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return sections.filter((section) => {
      const values = [
        section.name,
        section.department_name,
        section.manager_name,
        section.description,
      ];
      return values.some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(search),
      );
    });
  }, [sections, searchTerm]);

  const groupedSections = useMemo(() => {
    return filteredSections.reduce((acc, section) => {
      const key = section.department_name || "Unassigned Department";
      acc[key] = acc[key] || [];
      acc[key].push(section);
      return acc;
    }, {});
  }, [filteredSections]);

  const openModal = (section = null) => {
    setEditingSection(section);
    setFormData(
      section
        ? {
            departmentId: section.department_id || "",
            name: section.name || "",
            description: section.description || "",
            isActive: section.is_active ?? true,
          }
        : EMPTY_FORM,
    );
    setShowModal(true);
    setErrors({});
    setHasChanges(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSection(null);
    setFormData(EMPTY_FORM);
    setErrors({});
    setHasChanges(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setHasChanges(true);
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleCloseWithGuard = () => {
    if (hasChanges) {
      showToast("info", "You have unsaved changes in this form.", {
        title: "Unsaved Changes",
        duration: 6000,
        actions: [
          {
            label: "Discard",
            variant: "danger",
            onClick: closeModal,
          },
          {
            label: "Keep Editing",
            onClick: () => {},
          },
        ],
      });
      return;
    }
    closeModal();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      department_id: formData.departmentId,
      name: formData.name,
      description: formData.description || null,
      is_active: Boolean(formData.isActive),
    };

    try {
      if (editingSection) {
        await departmentAPI.updateSection(editingSection.id, payload);
        showToast("success", "Section updated successfully", {
          title: "Section Updated",
        });
      } else {
        await departmentAPI.createSection(payload);
        showToast("success", "Section created successfully", {
          title: "Section Added",
        });
      }
      closeModal();
      await loadData();
    } catch (error) {
      const validationErrors = getApiValidationErrors(error, {
        department_id: "departmentId",
        is_active: "isActive",
      });

      if (Object.keys(validationErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...validationErrors }));
      }

      showToast("error", getApiErrorMessage(error, "Failed to save section"), {
        title: "Save Failed",
      });
    }
  };

  const handleDelete = async (section) => {
    if (!window.confirm(`Delete section ${section.name}?`)) {
      return;
    }

    try {
      await departmentAPI.deleteSection(section.id);
      showToast("success", "Section deleted successfully", {
        title: "Section Deleted",
      });
      await loadData();
    } catch (error) {
      showToast(
        "error",
        error?.response?.data?.detail || "Failed to delete section",
        { title: "Delete Failed" },
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Sections</h1>
          <p className="text-slate-500 mt-1">
            Manage sections inside each department. Section managers are
            assigned from employee records.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center transition-colors shadow-lg shadow-blue-600/30"
        >
          <Plus size={20} className="mr-2" />
          Add Section
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center bg-slate-50 rounded-xl px-4 py-2 w-full sm:w-72 border border-slate-100">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search sections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none ml-3 w-full text-sm text-slate-600 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="p-6 space-y-6">
          {Object.keys(groupedSections).length > 0 ? (
            Object.entries(groupedSections).map(
              ([departmentName, departmentSections]) => (
                <div key={departmentName} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Network size={18} className="text-blue-600" />
                    <h2 className="text-lg font-semibold text-slate-800">
                      {departmentName}
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {departmentSections.map((section) => {
                      const employeeCount = users.filter(
                        (user) =>
                          user.section_id === section.id ||
                          user.section_name === section.name,
                      ).length;
                      return (
                        <div
                          key={section.id}
                          className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-lg font-semibold text-slate-800">
                                {section.name}
                              </h3>
                              <p className="text-sm text-slate-500 mt-1">
                                {section.description ||
                                  "No description provided"}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => openModal(section)}
                                className="p-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(section)}
                                className="p-2 rounded-lg bg-white hover:bg-red-100 text-red-600"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
                            <div>
                              <span className="block text-xs text-slate-400">
                                Manager
                              </span>
                              <span>
                                {section.manager_name || "Not assigned"}
                              </span>
                            </div>
                            <div>
                              <span className="block text-xs text-slate-400">
                                Employees
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Users size={14} /> {employeeCount}
                              </span>
                            </div>
                            <div>
                              <span className="block text-xs text-slate-400">
                                Status
                              </span>
                              <span>
                                {section.is_active ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ),
            )
          ) : (
            <div className="text-center py-12 text-slate-500">
              No sections found.
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">
                {editingSection ? "Edit Section" : "Add Section"}
              </h2>
            </div>
            <form noValidate onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-xl border outline-none ${errors.departmentId ? "border-red-500 bg-red-50" : "border-slate-200 focus:border-blue-500"}`}
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
                {errors.departmentId && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.departmentId}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Section Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-xl border outline-none ${errors.name ? "border-red-500 bg-red-50" : "border-slate-200 focus:border-blue-500"}`}
                  required
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className={`w-full px-4 py-2.5 rounded-xl border outline-none ${errors.description ? "border-red-500 bg-red-50" : "border-slate-200 focus:border-blue-500"}`}
                />
                {errors.description && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.description}
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                Section managers are assigned when creating or editing an
                employee in that section.
              </div>
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                />
                <span>Section is active</span>
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseWithGuard}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/30"
                >
                  {editingSection ? "Update Section" : "Save Section"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sections;
