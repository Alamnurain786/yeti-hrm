import { DollarSign, Download, TrendingUp, CreditCard } from 'lucide-react';

const Payroll = () => {
    const payrollData = [
        { id: 1, name: 'Sarah Wilson', role: 'UX Designer', salary: '$85,000', bonus: '$5,000', status: 'Paid', date: 'Oct 25, 2023' },
        { id: 2, name: 'Michael Chen', role: 'Senior Developer', salary: '$120,000', bonus: '$8,000', status: 'Processing', date: 'Oct 25, 2023' },
        { id: 3, name: 'Emma Thompson', role: 'HR Specialist', salary: '$65,000', bonus: '$3,000', status: 'Paid', date: 'Oct 25, 2023' },
        { id: 4, name: 'James Rodriguez', role: 'Product Manager', salary: '$95,000', bonus: '$6,000', status: 'Paid', date: 'Oct 25, 2023' },
        { id: 5, name: 'Lisa Park', role: 'Marketing Director', salary: '$110,000', bonus: '$7,500', status: 'Pending', date: 'Oct 25, 2023' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Payroll</h1>
                    <p className="text-slate-500 mt-1">Manage salaries and payment history.</p>
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
                            <h3 className="text-3xl font-bold mt-2">$475,000</h3>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                            <DollarSign size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-blue-100">
                        <TrendingUp size={16} className="mr-1" />
                        <span>+2.5% from last month</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 font-medium">Pending Payments</p>
                            <h3 className="text-3xl font-bold text-slate-800 mt-2">$230,000</h3>
                        </div>
                        <div className="p-3 bg-orange-100 rounded-xl text-orange-600">
                            <Clock size={24} />
                        </div>
                    </div>
                    <div className="mt-4 text-sm text-slate-500">
                        5 employees pending
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 font-medium">Average Salary</p>
                            <h3 className="text-3xl font-bold text-slate-800 mt-2">$95,000</h3>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
                            <CreditCard size={24} />
                        </div>
                    </div>
                    <div className="mt-4 text-sm text-slate-500">
                        Across 12 departments
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800">Recent Transactions</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Base Salary</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Bonus</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {payrollData.map((record) => (
                                <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-800">{record.name}</td>
                                    <td className="px-6 py-4 text-slate-600">{record.role}</td>
                                    <td className="px-6 py-4 text-slate-600">{record.salary}</td>
                                    <td className="px-6 py-4 text-emerald-600">+{record.bonus}</td>
                                    <td className="px-6 py-4 text-slate-600">{record.date}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${record.status === 'Paid' ? 'bg-emerald-100 text-emerald-600' :
                                                record.status === 'Processing' ? 'bg-blue-100 text-blue-600' :
                                                    'bg-orange-100 text-orange-600'
                                            }`}>
                                            {record.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors" title="Download Slip">
                                            <Download size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// Missing import fix
import { Clock } from 'lucide-react';

export default Payroll;
