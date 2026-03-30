import { useEffect, useState } from "react";
import { Plus, Search, BadgeCheck, TrendingUp } from "lucide-react";
import { useToast } from "../context/ToastContext";
import { departmentAPI, positionAPI } from "../services/backendApi";
import AddRoleForm from "../components/AddRoleForm";

const Roles = () => {
  const { showToast } = useToast();
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = async () => {
    try {
      const [rolesList, departmentsList] = await Promise.all([
        positionAPI.getAll(),
        departmentAPI.getAll(),
      ]);
      setRoles(rolesList);
      setDepartments(departmentsList);
    } catch {
      showToast("error", "Failed to load positions", {
        title: "Load Failed",
      });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateRole = async (payload) => {
    await positionAPI.create(payload);
    await loadData();
  };

  const filteredRoles = Array.isArray(roles)
    ? roles.filter((role) => {
        const dept = departments.find((d) => d.id === role.department_id);
        const deptName = dept ? dept.name : "";
        const search = searchTerm.toLowerCase();
        return (
          String(role.name || "")
            .toLowerCase()
            .includes(search) ||
          String(role.level || "")
            .toLowerCase()
            .includes(search) ||
          deptName.toLowerCase().includes(search)
        );
      })
    : [];

  const getLevelColor = (level) => {
    switch (level) {
      case "Intern":
        return "bg-gray-100 text-gray-600";
      case "Junior":
        return "bg-green-100 text-green-600";
      case "Mid-Level":
        return "bg-blue-100 text-blue-600";
      case "Senior":
        return "bg-purple-100 text-purple-600";
      case "Lead":
        return "bg-orange-100 text-orange-600";
      case "Manager":
        return "bg-red-100 text-red-600";
      case "Director":
        return "bg-indigo-100 text-indigo-600";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Designations</h1>
          <p className="text-slate-500 mt-1">
            Manage designations and position definitions.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center transition-colors shadow-lg shadow-blue-600/30"
        >
          <Plus size={20} className="mr-2" />
          Add Designation
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center bg-slate-50 rounded-xl px-4 py-2 w-full sm:w-64 border border-slate-100">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search designations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none ml-3 w-full text-sm text-slate-600 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="md:hidden p-4 space-y-3">
          {filteredRoles.length > 0 ? (
            filteredRoles.map((role) => {
              const dept = departments.find((d) => d.id === role.department_id);
              const deptName = dept ? dept.name : "Unknown";
              return (
                <div
                  key={role.id}
                  className="rounded-xl border border-slate-200 p-4 bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {role.name}
                      </p>
                      <p className="text-xs text-slate-500">ID: #{role.id}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getLevelColor(
                        role.level,
                      )}`}
                    >
                      {role.level}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-slate-600">
                    <p>Department: {deptName}</p>
                    <p>
                      Salary: NPR{" "}
                      {Number(role.min_salary ?? 0).toLocaleString()} -{" "}
                      {Number(role.max_salary ?? 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500">
                      {role.description || "-"}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-3 py-8 text-center text-slate-500">
              No designations found
            </div>
          )}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Designation Name
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Salary Range
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRoles.length > 0 ? (
                filteredRoles.map((role) => {
                  const dept = departments.find(
                    (d) => d.id === role.department_id,
                  );
                  const deptName = dept ? dept.name : "Unknown";
                  return (
                    <tr
                      key={role.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                            <BadgeCheck size={20} className="text-blue-600" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-semibold text-slate-800">
                              {role.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              ID: #{role.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-700">{deptName}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getLevelColor(
                            role.level,
                          )}`}
                        >
                          {role.level}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-slate-700">
                          <TrendingUp
                            size={14}
                            className="mr-1 text-emerald-500"
                          />
                          <span>
                            NPR {Number(role.min_salary ?? 0).toLocaleString()}{" "}
                            - {Number(role.max_salary ?? 0).toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600 line-clamp-2 max-w-xs">
                          {role.description}
                        </p>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <BadgeCheck
                      size={48}
                      className="mx-auto text-slate-300 mb-4"
                    />
                    <p className="text-slate-500">No designations found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddRoleForm
        showModal={showModal}
        setShowModal={setShowModal}
        departments={departments}
        onSubmit={handleCreateRole}
      />
    </div>
  );
};

export default Roles;
