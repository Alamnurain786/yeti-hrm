import { useState } from "react";
import { useMockData } from "../../context/MockData";
import { useToast } from "../../context/ToastContext";
import { UserPlus, Save } from "lucide-react";

const CreateHR = () => {
  const { addUser } = useMockData();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    department: "Human Resources",
  });
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newUser = {
      ...formData,
      role: "hr",
      avatar: formData.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2),
      status: "Active",
    };
    addUser(newUser);
    setSuccess("HR Admin created successfully!");
    showToast("success", "HR Admin created successfully!", {
      title: "HR Created",
    });
    setFormData({
      name: "",
      email: "",
      password: "",
      phone: "",
      department: "Human Resources",
    });
    setTimeout(() => setSuccess(""), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Create HR Admin</h1>
        <p className="text-slate-500 mt-1">
          Add a new HR administrator to the system.
        </p>
      </div>

      {success && (
        <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl border border-emerald-100 flex items-center">
          <UserPlus size={20} className="mr-2" />
          {success}
        </div>
      )}

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
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
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                placeholder="john@hrm.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                placeholder="••••••••"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                placeholder="+977 9800000000"
                required
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center transition-colors shadow-lg shadow-blue-600/30 font-medium"
            >
              <Save size={20} className="mr-2" />
              Create HR Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateHR;
