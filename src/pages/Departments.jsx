import { useState } from "react";
import { Plus, Search, Building2, Users, Pencil, Trash2 } from "lucide-react";
import { useMockData } from "../context/MockData";
import { useToast } from "../context/ToastContext";

const Departments = () => {
  const {
    departments,
    users,
    addDepartment,
    updateDepartment,
    deleteDepartment,
  } = useMockData();
  const { showToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    headOfDepartment: "",
  });

  // Confirmation modal state
  const [confirmData, setConfirmData] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  const openConfirm = ({ title, message, onConfirm }) => {
    setConfirmData({ open: true, title, message, onConfirm });
  };
  const closeConfirm = () =>
    setConfirmData({ open: false, title: "", message: "", onConfirm: null });

  // Calculate employee count per department
  const getDepartmentStats = (deptName) => {
    return users.filter((u) => u.department === deptName).length;
  };

  // Filter departments based on search
  const filteredDepartments = Array.isArray(departments)
    ? departments.filter((dept) => {
        const deptName = typeof dept === "string" ? dept : dept.name;
        return deptName.toLowerCase().includes(searchTerm.toLowerCase());
      })
    : [];

  const handleOpenModal = (dept = null) => {
    if (dept) {
      // Edit mode: populate form with existing data
      const deptData =
        typeof dept === "string"
          ? { name: dept, description: "", headOfDepartment: "" }
          : dept;

      setEditingDept(deptData);
      setFormData({
        name: deptData.name || "",
        description: deptData.description || "",
        headOfDepartment: deptData.headOfDepartment || "",
      });
    } else {
      // Add mode: reset form
      setEditingDept(null);
      setFormData({
        name: "",
        description: "",
        headOfDepartment: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDept(null);
    setFormData({ name: "", description: "", headOfDepartment: "" });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showToast("error", "Department name is required", {
        title: "Validation Error",
      });
      return;
    }

    if (editingDept) {
      // Update existing department
      const oldName = editingDept.name || editingDept;
      updateDepartment(oldName, formData);
      showToast("success", `${formData.name} updated successfully`, {
        title: "Department Updated",
      });
    } else {
      // Add new department
      addDepartment(formData);
      showToast("success", `${formData.name} added successfully`, {
        title: "Department Added",
      });
    }

    handleCloseModal();
  };

  const handleDelete = (dept) => {
    const deptName = typeof dept === "string" ? dept : dept.name;
    const employeeCount = getDepartmentStats(deptName);

    if (employeeCount > 0) {
      showToast(
        "error",
        `Cannot delete ${deptName}. ${employeeCount} employees assigned.`,
        {
          title: "Delete Failed",
        }
      );
      return;
    }

    openConfirm({
      title: "Delete Department",
      message: `Are you sure you want to delete ${deptName}?`,
      onConfirm: () => {
        deleteDepartment(deptName);
        showToast("success", `${deptName} deleted successfully`, {
          title: "Department Deleted",
        });
        closeConfirm();
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Departments</h1>
          <p className="text-slate-500 mt-1">
            Manage organizational departments and their information.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center transition-colors shadow-lg shadow-blue-600/30"
        >
          <Plus size={20} className="mr-2" />
          Add Department
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center bg-slate-50 rounded-xl px-4 py-2 w-64 border border-slate-100">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none ml-3 w-full text-sm text-slate-600 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          {filteredDepartments.length > 0 ? (
            filteredDepartments.map((dept, index) => {
              const deptName = typeof dept === "string" ? dept : dept.name;
              const deptDescription =
                typeof dept === "string"
                  ? "No description available"
                  : dept.description || "No description available";
              const deptHead =
                typeof dept === "string"
                  ? "Not assigned"
                  : dept.headOfDepartment || "Not assigned";
              const employeeCount = getDepartmentStats(deptName);

              return (
                <div
                  key={dept.id || index}
                  className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl p-6 border border-slate-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Building2 size={24} />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenModal(dept)}
                        className="p-2 rounded-lg bg-white hover:bg-slate-200 text-slate-700 transition-colors"
                        aria-label={`Edit ${deptName}`}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(dept)}
                        className="p-2 rounded-lg bg-white hover:bg-red-100 text-red-600 transition-colors"
                        aria-label={`Delete ${deptName}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-slate-800 mb-2">
                    {deptName}
                  </h3>
                  <p className="text-sm text-slate-600 mb-3 line-clamp-2 min-h-[2.5rem]">
                    {deptDescription}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                    <div className="flex items-center text-sm text-slate-600">
                      <Users size={16} className="mr-1.5" />
                      <span>{employeeCount} Employees</span>
                    </div>
                    {deptHead && deptHead !== "Not assigned" && (
                      <span
                        className="text-xs text-slate-500 truncate max-w-[120px]"
                        title={`Head: ${deptHead}`}
                      >
                        Head: {deptHead}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12">
              <Building2 size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">No departments found</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Department Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md">
            <div className="p-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800">
                {editingDept ? "Edit Department" : "Add Department"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Department Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Engineering"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Brief description of the department"
                />
              </div>

              <div>
                <label
                  htmlFor="headOfDepartment"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Head of Department
                </label>
                <input
                  type="text"
                  id="headOfDepartment"
                  name="headOfDepartment"
                  value={formData.headOfDepartment}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., John Doe"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm shadow-lg shadow-blue-600/30"
                >
                  {editingDept ? "Update" : "Add"} Department
                </button>
              </div>
            </form>
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
            </div>
            <div className="p-4 flex justify-end gap-2 border-t border-slate-100">
              <button
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm"
                onClick={closeConfirm}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm shadow-lg shadow-red-600/30"
                onClick={() => confirmData.onConfirm && confirmData.onConfirm()}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
