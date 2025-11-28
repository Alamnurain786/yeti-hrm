import { useState } from "react";
import { X, Save } from "lucide-react";
import { useMockData } from "../context/MockData";
import { useToast } from "../context/ToastContext";

const AddRoleForm = ({ showModal, setShowModal }) => {
  const { addRole, departments } = useMockData();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    department: "",
    description: "",
    level: "Junior",
    minSalary: "",
    maxSalary: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addRole(formData);
    setShowModal(false);
    setFormData({
      title: "",
      department: "",
      description: "",
      level: "Junior",
      minSalary: "",
      maxSalary: "",
    });
    showToast("success", "Role added successfully!", { title: "Role Added" });
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Add New Role</h2>
          <button
            onClick={() => setShowModal(false)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Role Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Senior Software Engineer"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Department
            </label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
              required
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept.id || dept} value={dept.name || dept}>
                  {dept.name || dept}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Level
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
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Role responsibilities and requirements..."
              rows="3"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Min Salary (NPR)
              </label>
              <input
                type="number"
                name="minSalary"
                value={formData.minSalary}
                onChange={handleChange}
                placeholder="50000"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Max Salary (NPR)
              </label>
              <input
                type="number"
                name="maxSalary"
                value={formData.maxSalary}
                onChange={handleChange}
                placeholder="100000"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                required
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl flex items-center transition-colors shadow-lg shadow-blue-600/30 font-medium"
            >
              <Save size={18} className="mr-2" />
              Save Role
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRoleForm;
