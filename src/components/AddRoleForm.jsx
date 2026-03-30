import { useState } from "react";
import { X, Save } from "lucide-react";
import { useToast } from "../context/ToastContext";
import {
  getApiErrorMessage,
  getApiValidationErrors,
} from "../services/backendApi";

const AddRoleForm = ({ showModal, setShowModal, departments, onSubmit }) => {
  const { showToast } = useToast();
  const safeDepartments = Array.isArray(departments) ? departments : [];

  const [formData, setFormData] = useState({
    name: "",
    department: "", // department name for display
    departmentId: "", // department ID for backend
    description: "",
    level: "Junior",
    minSalary: "",
    maxSalary: "",
  });
  const [errors, setErrors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  const resetForm = () => {
    setFormData({
      name: "",
      department: "",
      departmentId: "",
      description: "",
      level: "Junior",
      minSalary: "",
      maxSalary: "",
    });
    setErrors({});
    setHasChanges(false);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // If department is changed, also update departmentId
    if (name === "department") {
      const selectedDept = safeDepartments.find(
        (dept) => (dept.name || dept) === value,
      );
      setFormData({
        ...formData,
        department: value,
        departmentId: selectedDept?.id || "",
      });
      setHasChanges(true);
    } else {
      setFormData({ ...formData, [name]: value });
      setHasChanges(true);
    }

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSubmit({
        name: formData.name,
        department_id: formData.departmentId,
        level: formData.level,
        min_salary: parseFloat(formData.minSalary),
        max_salary: parseFloat(formData.maxSalary),
        description: formData.description,
      });
      closeModal();
      showToast("success", "Designation added successfully!", {
        title: "Designation Added",
      });
    } catch (error) {
      const validationErrors = getApiValidationErrors(error, {
        department_id: "department",
        min_salary: "minSalary",
        max_salary: "maxSalary",
      });

      if (Object.keys(validationErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...validationErrors }));
      }

      showToast("error", getApiErrorMessage(error, "Failed to create role"), {
        title: "Error",
      });
    }
  };

  if (!showModal) return null;

  const handleClose = () => {
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">
            Add New Designation
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form noValidate onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Designation Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Senior Software Engineer"
              className={`w-full px-4 py-2.5 rounded-xl border outline-none ${errors.name ? "border-red-500 bg-red-50" : "border-slate-200 focus:border-blue-500"}`}
              required
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Department <span className="text-red-500">*</span>
            </label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 rounded-xl border outline-none ${errors.department ? "border-red-500 bg-red-50" : "border-slate-200 focus:border-blue-500"}`}
              required
            >
              <option value="">Select Department</option>
              {safeDepartments.map((dept) => (
                <option key={dept.id || dept} value={dept.name || dept}>
                  {dept.name || dept}
                </option>
              ))}
            </select>
            {errors.department && (
              <p className="text-red-500 text-xs mt-1">{errors.department}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Level <span className="text-red-500">*</span>
            </label>
            <select
              name="level"
              value={formData.level}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
              required
            >
              <option value="Intern">Intern</option>
              <option value="Junior">Junior</option>
              <option value="Mid-Level">Mid-Level</option>
              <option value="Senior">Senior</option>
              <option value="Lead">Lead</option>
              <option value="Manager">Manager</option>
              <option value="Director">Director</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Designation responsibilities and requirements..."
              rows="3"
              className={`w-full px-4 py-2.5 rounded-xl border outline-none resize-none ${errors.description ? "border-red-500 bg-red-50" : "border-slate-200 focus:border-blue-500"}`}
              required
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Min Salary (NPR) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="minSalary"
                value={formData.minSalary}
                onChange={handleChange}
                placeholder="50000"
                className={`w-full px-4 py-2.5 rounded-xl border outline-none ${errors.minSalary ? "border-red-500 bg-red-50" : "border-slate-200 focus:border-blue-500"}`}
                required
              />
              {errors.minSalary && (
                <p className="text-red-500 text-xs mt-1">{errors.minSalary}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Max Salary (NPR) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="maxSalary"
                value={formData.maxSalary}
                onChange={handleChange}
                placeholder="100000"
                className={`w-full px-4 py-2.5 rounded-xl border outline-none ${errors.maxSalary ? "border-red-500 bg-red-50" : "border-slate-200 focus:border-blue-500"}`}
                required
              />
              {errors.maxSalary && (
                <p className="text-red-500 text-xs mt-1">{errors.maxSalary}</p>
              )}
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl flex items-center transition-colors shadow-lg shadow-blue-600/30 font-medium"
            >
              <Save size={18} className="mr-2" />
              Save Designation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRoleForm;
