import { useState, useEffect } from "react";
import { X, Save, RefreshCw } from "lucide-react";
import { useMockData } from "../context/MockData";
import { useToast } from "../context/ToastContext";
import NepaliDate from "nepali-date-converter";
import NepaliDatePicker from "./NepaliDatePicker";

const AddEmployeeForm = ({ showModal, setShowModal }) => {
  const { users, addUser, departments } = useMockData();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    manager: "",
    joiningDateBS: "",
    password: "",
    dobAD: "",
    dobBS: "",
    gender: "Male",
    role: "employee",
  });

  const [age, setAge] = useState(null);

  // Auto-generate password on component mount
  useEffect(() => {
    const generatePassword = () => {
      const length = 12;
      const charset =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
      let password = "";
      for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
      }
      return password;
    };

    if (showModal) {
      setFormData((prev) => ({ ...prev, password: generatePassword() }));
    }
  }, [showModal]);

  // Auto-calculate Age and AD Date when BS Date changes
  useEffect(() => {
    if (formData.dobBS) {
      try {
        // Parse BS date (format: YYYY-MM-DD)
        const [year, month, day] = formData.dobBS.split("-").map(Number);

        if (year && month && day) {
          // Convert BS to AD
          const nepaliDate = new NepaliDate(year, month - 1, day);
          const adDate = nepaliDate.toJsDate();

          // Set AD date
          const formattedAD = adDate.toISOString().split("T")[0];
          setFormData((prev) => ({ ...prev, dobAD: formattedAD }));

          // Calculate age
          const today = new Date();
          let calculatedAge = today.getFullYear() - adDate.getFullYear();
          const m = today.getMonth() - adDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < adDate.getDate())) {
            calculatedAge--;
          }
          setAge(calculatedAge);
        }
      } catch (e) {
        console.error("Date conversion error", e);
      }
    }
  }, [formData.dobBS]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newUser = {
      ...formData,
      avatar: formData.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2),
      status: "Active",
    };
    addUser(newUser);
    setShowModal(false);
    setFormData({
      name: "",
      email: "",
      phone: "",
      department: "",
      manager: "",
      joiningDateBS: "",
      password: "",
      dobAD: "",
      dobBS: "",
      gender: "Male",
      role: "employee",
    });
    setAge(null);

    // Show success toast
    showToast("success", "Employee added successfully!", {
      title: "Employee Added",
    });
  };

  const handleGeneratePassword = () => {
    const length = 12;
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setFormData((prev) => ({ ...prev, password }));
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-slate-800">Add New Employee</h2>
          <button
            onClick={() => setShowModal(false)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
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
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Manager
              </label>
              <select
                name="manager"
                value={formData.manager}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
              >
                <option value="">Select Manager</option>
                {users
                  .filter((u) => u.role === "hr" || u.role === "superadmin")
                  .map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                required
              >
                <option value="employee">Employee</option>
                <option value="hr">HR Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none font-mono text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                  title="Generate new password"
                >
                  <RefreshCw size={18} className="text-slate-600" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Auto-generated or enter custom password
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Joining Date (BS)
              </label>
              <NepaliDatePicker
                value={formData.joiningDateBS}
                onChange={(bsDate) => {
                  setFormData({ ...formData, joiningDateBS: bsDate });
                }}
                placeholder="भर्ना मिति छान्नुहोस् (e.g., 2081-08-11)"
              />
              <p className="text-xs text-slate-500 mt-1">
                Select Nepali calendar date
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Date of Birth (BS)
              </label>
              <NepaliDatePicker
                value={formData.dobBS}
                onChange={(bsDate) => {
                  setFormData({ ...formData, dobBS: bsDate });
                }}
                placeholder="जन्म मिति छान्नुहोस् (e.g., 2058-05-15)"
              />
              <p className="text-xs text-slate-500 mt-1">
                Select Nepali calendar date
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Date of Birth (AD)
              </label>
              <input
                type="text"
                name="dobAD"
                value={formData.dobAD}
                readOnly
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
              />
              <p className="text-xs text-slate-500 mt-1">
                Auto-calculated from BS date
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Age
              </label>
              <input
                type="text"
                value={age !== null ? `${age} years` : ""}
                readOnly
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
              />
              <p className="text-xs text-slate-500 mt-1">
                Auto-calculated from date of birth
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
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
              Save Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployeeForm;
