import { Plus, Search, MoreVertical, Mail, Phone, MapPin } from 'lucide-react';

const Employees = () => {
    const employees = [
        { id: 1, name: 'Sarah Wilson', role: 'UX Designer', department: 'Design', email: 'sarah.w@hrm.com', phone: '+1 234 567 890', status: 'Active', avatar: 'SW' },
        { id: 2, name: 'Michael Chen', role: 'Senior Developer', department: 'Engineering', email: 'michael.c@hrm.com', phone: '+1 234 567 891', status: 'On Leave', avatar: 'MC' },
        { id: 3, name: 'Emma Thompson', role: 'HR Specialist', department: 'Human Resources', email: 'emma.t@hrm.com', phone: '+1 234 567 892', status: 'Active', avatar: 'ET' },
        { id: 4, name: 'James Rodriguez', role: 'Product Manager', department: 'Product', email: 'james.r@hrm.com', phone: '+1 234 567 893', status: 'Active', avatar: 'JR' },
        { id: 5, name: 'Lisa Park', role: 'Marketing Director', department: 'Marketing', email: 'lisa.p@hrm.com', phone: '+1 234 567 894', status: 'Remote', avatar: 'LP' },
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'Active': return 'bg-emerald-100 text-emerald-600';
            case 'On Leave': return 'bg-orange-100 text-orange-600';
            case 'Remote': return 'bg-blue-100 text-blue-600';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Employees</h1>
                    <p className="text-slate-500 mt-1">Manage your team members and their roles.</p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center transition-colors shadow-lg shadow-blue-600/30">
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
                            className="bg-transparent border-none outline-none ml-3 w-full text-sm text-slate-600 placeholder:text-slate-400"
                        />
                    </div>
                    <div className="flex space-x-2">
                        <select className="bg-slate-50 border border-slate-100 text-slate-600 text-sm rounded-xl px-3 py-2 outline-none focus:border-blue-500 transition-colors">
                            <option>All Departments</option>
                            <option>Design</option>
                            <option>Engineering</option>
                            <option>Marketing</option>
                        </select>
                        <select className="bg-slate-50 border border-slate-100 text-slate-600 text-sm rounded-xl px-3 py-2 outline-none focus:border-blue-500 transition-colors">
                            <option>All Status</option>
                            <option>Active</option>
                            <option>On Leave</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role & Dept</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {employees.map((employee) => (
                                <tr key={employee.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                                                {employee.avatar}
                                            </div>
                                            <div className="ml-4">
                                                <p className="text-sm font-semibold text-slate-800">{employee.name}</p>
                                                <p className="text-xs text-slate-500">ID: #{employee.id.toString().padStart(4, '0')}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-slate-700 font-medium">{employee.role}</p>
                                        <p className="text-xs text-slate-500">{employee.department}</p>
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
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(employee.status)}`}>
                                            {employee.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                                            <MoreVertical size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
                    <p>Showing 1 to 5 of 12 entries</p>
                    <div className="flex space-x-2">
                        <button className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50" disabled>Previous</button>
                        <button className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Employees;
