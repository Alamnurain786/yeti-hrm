import { useState } from "react";
import { Plus, Search, Briefcase, TrendingUp } from "lucide-react";
import { useMockData } from "../context/MockData";
import AddRoleForm from "../components/AddRoleForm";

const Roles = () => {
  const { roles } = useMockData();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter roles based on search
  const filteredRoles = Array.isArray(roles)
    ? roles.filter(
        (role) =>
          role.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          role.department.toLowerCase().includes(searchTerm.toLowerCase())
      )
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Roles</h1>
          <p className="text-slate-500 mt-1">
            Manage job roles and position definitions.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center transition-colors shadow-lg shadow-blue-600/30"
        >
          <Plus size={20} className="mr-2" />
          Add Role
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center bg-slate-50 rounded-xl px-4 py-2 w-64 border border-slate-100">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none ml-3 w-full text-sm text-slate-600 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Role Title
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
                filteredRoles.map((role) => (
                  <tr
                    key={role.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                          <Briefcase size={20} className="text-blue-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-semibold text-slate-800">
                            {role.title}
                          </p>
                          <p className="text-xs text-slate-500">
                            ID: #{role.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-700">
                        {role.department}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getLevelColor(
                          role.level
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
                          NPR {role.minSalary.toLocaleString()} -{" "}
                          {role.maxSalary.toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600 line-clamp-2 max-w-xs">
                        {role.description}
                      </p>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <Briefcase
                      size={48}
                      className="mx-auto text-slate-300 mb-4"
                    />
                    <p className="text-slate-500">No roles found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Role Modal */}
      <AddRoleForm showModal={showModal} setShowModal={setShowModal} />
    </div>
  );
};

export default Roles;
