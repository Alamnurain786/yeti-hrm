import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Mail,
  Phone,
  Pencil,
  ToggleLeft,
  UserX,
} from "lucide-react";
import { useMockData } from "../context/MockData";
import { useToast } from "../context/ToastContext";
import AddEmployeeForm from "../components/AddEmployeeForm";

const Employees = () => {
  const { users, updateUserProfile } = useMockData();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Confirmation modal state
  const [confirmData, setConfirmData] = useState({
    open: false,
    title: "",
    message: "",
    actionLabel: "Confirm",
    onConfirm: null,
  });

  const openConfirm = ({ title, message, actionLabel, onConfirm }) => {
    setConfirmData({ open: true, title, message, actionLabel, onConfirm });
  };
  const closeConfirm = () =>
    setConfirmData({
      open: false,
      title: "",
      message: "",
      actionLabel: "Confirm",
      onConfirm: null,
    });

  // Filter only employees (exclude superadmin)
  const employees = users
    .filter((u) => u.role !== "superadmin")
    .filter(
      (u) =>
        (u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (statusFilter === "All" || u.status === statusFilter)
    );

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "bg-emerald-100 text-emerald-600";
      case "On Leave":
        return "bg-orange-100 text-orange-600";
      case "Remote":
        return "bg-blue-100 text-blue-600";
      case "Deactive":
        return "bg-slate-200 text-slate-700";
      case "Resigned":
        return "bg-red-100 text-red-600";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const handleEditEmployee = (employeeId) => {
    navigate(`/profile?userId=${employeeId}`);
  };

  const handleToggleActive = (employee) => {
    const nextStatus = employee.status === "Active" ? "Deactive" : "Active";

    openConfirm({
      title: `Change Status`,
      message: `Change ${employee.name}'s status to ${nextStatus}?`,
      actionLabel: nextStatus === "Active" ? "Activate" : "Deactivate",
      onConfirm: () => {
        updateUserProfile(employee.id, { status: nextStatus });
        showToast("success", `Status changed to ${nextStatus}`, {
          title: "Status Updated",
        });
        closeConfirm();
      },
    });
  };

  const handleMarkResigned = (employee) => {
    const today = new Date().toISOString().split("T")[0];

    openConfirm({
      title: "Mark as Resigned",
      message: `Mark ${employee.name} as Resigned? This will set status to Resigned and save resignation date (${today}).`,
      actionLabel: "Mark Resigned",
      onConfirm: () => {
        updateUserProfile(employee.id, {
          status: "Resigned",
          resignationDate: today,
        });
        showToast("success", `${employee.name} marked as Resigned`, {
          title: "Employee Resigned",
        });
        closeConfirm();
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Employees</h1>
          <p className="text-slate-500 mt-1">
            Manage your team members and their roles.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center transition-colors shadow-lg shadow-blue-600/30"
        >
          <Plus size={20} className="mr-2" />
          Add Employee
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center bg-slate-50 rounded-xl px-4 py-2 w-64 border border-slate-100">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none ml-3 w-full text-sm text-slate-600 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-3">
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

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Role & Dept
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
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
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                        {employee.avatar}
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-semibold text-slate-800">
                          {employee.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          ID: #{employee.id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-700 font-medium capitalize">
                      {employee.role}
                    </p>
                    <p className="text-xs text-slate-500">
                      {employee.department}
                    </p>
                  </td>
                  <td className="px-6 py-4">
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
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          employee.status
                        )}`}
                      >
                        {employee.status}
                      </span>
                      {employee.status === "Resigned" &&
                        employee.resignationDate && (
                          <span className="text-xs text-slate-500">
                            since {employee.resignationDate}
                          </span>
                        )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1"
                        onClick={() => handleEditEmployee(employee.id)}
                        aria-label={`Edit ${employee.name}`}
                      >
                        <Pencil size={14} /> Edit
                      </button>
                      <button
                        className="px-3 py-2 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-xs font-medium flex items-center gap-1"
                        onClick={() => handleToggleActive(employee)}
                        aria-label={`Change status for ${employee.name}`}
                      >
                        <ToggleLeft size={14} />
                        {employee.status === "Active"
                          ? "Deactivate"
                          : "Activate"}
                      </button>
                      <button
                        className="px-3 py-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium flex items-center gap-1"
                        onClick={() => handleMarkResigned(employee)}
                        aria-label={`Mark ${employee.name} as resigned`}
                      >
                        <UserX size={14} /> Resign
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      <AddEmployeeForm showModal={showModal} setShowModal={setShowModal} />

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
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm shadow-lg shadow-blue-600/30"
                onClick={() => confirmData.onConfirm && confirmData.onConfirm()}
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
