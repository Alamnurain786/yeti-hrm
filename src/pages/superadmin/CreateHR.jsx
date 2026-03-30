import { useState } from "react";
import { useToast } from "../../context/ToastContext";
import {
  Pencil,
  Save,
  Trash2,
  ToggleLeft,
  ToggleRight,
  UserPlus,
} from "lucide-react";
import {
  getApiErrorMessage,
  getApiValidationErrors,
  userAPI,
} from "../../services/backendApi";
import { useEffect } from "react";

const CreateHR = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    department: "Human Resources",
    role: "admin",
  });
  const [editingUser, setEditingUser] = useState(null);
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const loadUsers = async () => {
    try {
      const list = await userAPI.getAll();
      // Filter to show only admin and user roles
      setUsers(list.filter((u) => u.role === "admin" || u.role === "user"));
    } catch (error) {
      console.error("Failed to load users:", error);
      showToast("error", "Failed to load users", {
        title: "Load Failed",
      });
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[e.target.name];
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    try {
      if (editingUser) {
        await userAPI.update(editingUser.id, {
          name: formData.name,
          phone: formData.phone,
          department: formData.department,
          role: formData.role,
        });
        showToast("success", "User updated successfully", {
          title: "User Updated",
        });
      } else {
        await userAPI.create({
          ...formData,
          role: formData.role,
          status: "Active",
        });
        showToast("success", "User created successfully", {
          title: "User Created",
        });
      }

      setSuccess(
        editingUser
          ? "User updated successfully!"
          : "User created successfully!",
      );
      setFormData({
        name: "",
        email: "",
        password: "",
        phone: "",
        department: "Human Resources",
        role: "admin",
      });
      setErrors({});
      setEditingUser(null);
      await loadUsers();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      const validationErrors = getApiValidationErrors(error);
      if (Object.keys(validationErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...validationErrors }));
      }
      showToast("error", getApiErrorMessage(error, "Failed to save user"), {
        title: "Save Failed",
      });
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      phone: user.phone || "",
      department: user.department || "Human Resources",
      role: user.role,
    });
    setErrors({});
  };

  const toggleStatus = async (user) => {
    const nextStatus = user.status === "Active" ? "Inactive" : "Active";
    const label = nextStatus === "Active" ? "enabled" : "disabled";
    try {
      await userAPI.update(user.id, { status: nextStatus });
      showToast("success", `User ${label} successfully`, {
        title: nextStatus === "Active" ? "User Enabled" : "User Disabled",
      });
      await loadUsers();
    } catch {
      showToast("error", "Failed to update user status", {
        title: "Update Failed",
      });
    }
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Delete ${user.name}?`)) return;
    try {
      await userAPI.delete(user.id);
      showToast("success", "User deleted", { title: "Deleted" });
      await loadUsers();
    } catch (error) {
      showToast("error", getApiErrorMessage(error, "Delete failed"), {
        title: "Delete Failed",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">
          User Access Management
        </h1>
        <p className="text-slate-500 mt-1">
          Superadmin can create users and manage admin/user access.
        </p>
      </div>

      {success && (
        <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl border border-emerald-100 flex items-center">
          <UserPlus size={20} className="mr-2" />
          {success}
        </div>
      )}

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-3xl">
        <form noValidate onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border outline-none ${errors.name ? "border-red-500 bg-red-50" : "border-slate-200 focus:border-blue-500"}`}
                placeholder="John Doe"
                required
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address{" "}
                {!editingUser && <span className="text-red-500">*</span>}
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border outline-none ${errors.email ? "border-red-500 bg-red-50" : "border-slate-200 focus:border-blue-500"}`}
                placeholder="john@hrm.com"
                required={!editingUser}
                disabled={Boolean(editingUser)}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password{" "}
                {!editingUser && <span className="text-red-500">*</span>}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border outline-none ${errors.password ? "border-red-500 bg-red-50" : "border-slate-200 focus:border-blue-500"}`}
                placeholder="••••••••"
                required={!editingUser}
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border outline-none ${errors.phone ? "border-red-500 bg-red-50" : "border-slate-200 focus:border-blue-500"}`}
                placeholder="+977 9800000000"
                required
              />
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
              >
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center transition-colors shadow-lg shadow-blue-600/30 font-medium"
            >
              <Save size={20} className="mr-2" />
              {loading
                ? "Saving..."
                : editingUser
                  ? "Update User"
                  : "Create User"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">
          Admins and Users
        </h2>
        <div className="md:hidden space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="rounded-xl border border-slate-200 p-4 bg-slate-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {user.name}
                  </p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs">
                  {user.role}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full ${
                    user.status === "Active"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {user.status === "Active" ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => startEdit(user)}
                  className="px-2 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs"
                >
                  <Pencil size={14} className="inline mr-1" /> Edit
                </button>
                <button
                  onClick={() => toggleStatus(user)}
                  className={`px-2 py-1 rounded-lg border text-xs font-medium ${
                    user.status === "Active"
                      ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                      : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  {user.status === "Active" ? (
                    <>
                      <ToggleRight size={14} className="inline mr-1" /> Disable
                    </>
                  ) : (
                    <>
                      <ToggleLeft size={14} className="inline mr-1" /> Enable
                    </>
                  )}
                </button>
                <button
                  onClick={() => deleteUser(user)}
                  className="px-2 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs"
                >
                  <Trash2 size={14} className="inline mr-1" /> Delete
                </button>
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <div className="py-8 text-center text-slate-500">
              No users available.
            </div>
          )}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="py-3">Name</th>
                <th className="py-3">Email</th>
                <th className="py-3">Role</th>
                <th className="py-3">Status</th>
                <th className="py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-100">
                  <td className="py-3 font-medium text-slate-700">
                    {user.name}
                  </td>
                  <td className="py-3 text-slate-600">{user.email}</td>
                  <td className="py-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs">
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                        user.status === "Active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {user.status === "Active" ? "Enabled" : "Disabled"}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => startEdit(user)}
                        className="px-2 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                      >
                        <Pencil size={14} className="inline mr-1" /> Edit
                      </button>
                      <button
                        onClick={() => toggleStatus(user)}
                        className={`px-2 py-1 rounded-lg border text-xs font-medium ${
                          user.status === "Active"
                            ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                            : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        }`}
                      >
                        {user.status === "Active" ? (
                          <>
                            <ToggleRight size={14} className="inline mr-1" />{" "}
                            Disable
                          </>
                        ) : (
                          <>
                            <ToggleLeft size={14} className="inline mr-1" />{" "}
                            Enable
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => deleteUser(user)}
                        className="px-2 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={14} className="inline mr-1" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No users available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CreateHR;
