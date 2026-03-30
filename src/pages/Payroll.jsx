import { useEffect, useMemo, useState } from "react";
import {
  DollarSign,
  Download,
  TrendingUp,
  CreditCard,
  Clock,
} from "lucide-react";
import { payrollAPI, userAPI } from "../services/backendApi";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const Payroll = () => {
  const [payrollData, setPayrollData] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [payrollRows, userRows] = await Promise.all([
          payrollAPI.getAll(),
          userAPI.getAll(),
        ]);
        setPayrollData(Array.isArray(payrollRows) ? payrollRows : []);
        setUsers(Array.isArray(userRows) ? userRows : []);
      } catch {
        setPayrollData([]);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const usersById = useMemo(() => {
    const map = new Map();
    users.forEach((u) => map.set(String(u.id), u));
    return map;
  }, [users]);

  const stats = useMemo(() => {
    const totalPayroll = payrollData.reduce(
      (sum, row) => sum + Number(row.net_salary || 0),
      0,
    );
    const pendingCount = payrollData.filter(
      (row) => String(row.status || "").toLowerCase() !== "paid",
    ).length;
    const averageSalary =
      payrollData.length > 0 ? totalPayroll / payrollData.length : 0;

    return {
      totalPayroll,
      pendingCount,
      averageSalary,
    };
  }, [payrollData]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Payroll</h1>
          <p className="text-slate-500 mt-1">
            Manage salaries and payment history.
          </p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center transition-colors shadow-lg shadow-blue-600/30">
          <DollarSign size={20} className="mr-2" />
          Run Payroll
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-100 font-medium">Total Payroll Cost</p>
              <h3 className="text-3xl font-bold mt-2">
                {formatCurrency(stats.totalPayroll)}
              </h3>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <DollarSign size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-blue-100">
            <TrendingUp size={16} className="mr-1" />
            <span>Based on backend payroll records</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 font-medium">Pending Payments</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">
                {stats.pendingCount}
              </h3>
            </div>
            <div className="p-3 bg-orange-100 rounded-xl text-orange-600">
              <Clock size={24} />
            </div>
          </div>
          <div className="mt-4 text-sm text-slate-500">
            Unpaid payroll entries
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 font-medium">Average Net Salary</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">
                {formatCurrency(stats.averageSalary)}
              </h3>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
              <CreditCard size={24} />
            </div>
          </div>
          <div className="mt-4 text-sm text-slate-500">
            Across payroll entries
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">Recent Transactions</h3>
        </div>

        {loading ? (
          <div className="p-6 text-slate-500">Loading payroll records...</div>
        ) : (
          <>
            <div className="md:hidden p-4 space-y-3">
              {payrollData.length > 0 ? (
                payrollData.map((record) => {
                  const employee = usersById.get(String(record.user_id));
                  const role = employee?.role || "-";
                  const status = String(record.status || "Paid");
                  return (
                    <div
                      key={record.id}
                      className="rounded-xl border border-slate-200 p-4 bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {employee?.name || record.user_id}
                          </p>
                          <p className="text-xs text-slate-500 capitalize">
                            {role}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            status.toLowerCase() === "paid"
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-orange-100 text-orange-600"
                          }`}
                        >
                          {status}
                        </span>
                      </div>
                      <div className="mt-3 space-y-1 text-xs text-slate-600">
                        <p>Base: {formatCurrency(record.base_salary)}</p>
                        <p>Deductions: -{formatCurrency(record.deductions)}</p>
                        <p>Month: {record.month || "-"}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="px-3 py-8 text-center text-slate-500">
                  No payroll records available.
                </div>
              )}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Base Salary
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Deductions
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Month
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
                  {payrollData.length > 0 ? (
                    payrollData.map((record) => {
                      const employee = usersById.get(String(record.user_id));
                      const role = employee?.role || "-";
                      const status = String(record.status || "Paid");

                      return (
                        <tr
                          key={record.id}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-6 py-4 font-medium text-slate-800">
                            {employee?.name || record.user_id}
                          </td>
                          <td className="px-6 py-4 text-slate-600">{role}</td>
                          <td className="px-6 py-4 text-slate-600">
                            {formatCurrency(record.base_salary)}
                          </td>
                          <td className="px-6 py-4 text-red-600">
                            -{formatCurrency(record.deductions)}
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {record.month || "-"}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                status.toLowerCase() === "paid"
                                  ? "bg-emerald-100 text-emerald-600"
                                  : "bg-orange-100 text-orange-600"
                              }`}
                            >
                              {status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                              title="Download Slip"
                            >
                              <Download size={18} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-6 py-12 text-center text-slate-500"
                      >
                        No payroll records available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Payroll;
