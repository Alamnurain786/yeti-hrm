import { Users, UserPlus, Clock, TrendingUp } from 'lucide-react';

const StatCard = ({ title, value, change, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <h3 className="text-3xl font-bold text-slate-800 mt-2">{value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon size={24} className="text-white" />
            </div>
        </div>
        <div className="mt-4 flex items-center text-sm">
            <span className="text-emerald-500 font-medium flex items-center">
                <TrendingUp size={16} className="mr-1" />
                {change}
            </span>
            <span className="text-slate-400 ml-2">vs last month</span>
        </div>
    </div>
);

const Dashboard = () => {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">Dashboard Overview</h1>
                <p className="text-slate-500 mt-1">Welcome back, Edward. Here's what's happening today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Employees"
                    value="1,234"
                    change="+12%"
                    icon={Users}
                    color="bg-blue-500"
                />
                <StatCard
                    title="New Hires"
                    value="42"
                    change="+5%"
                    icon={UserPlus}
                    color="bg-purple-500"
                />
                <StatCard
                    title="On Leave"
                    value="18"
                    change="-2%"
                    icon={Clock}
                    color="bg-orange-500"
                />
                <StatCard
                    title="Avg. Attendance"
                    value="95%"
                    change="+1%"
                    icon={TrendingUp}
                    color="bg-emerald-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center p-3 hover:bg-slate-50 rounded-xl transition-colors">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                    JD
                                </div>
                                <div className="ml-4 flex-1">
                                    <p className="text-sm font-medium text-slate-800">John Doe requested leave</p>
                                    <p className="text-xs text-slate-500">2 hours ago</p>
                                </div>
                                <span className="px-3 py-1 text-xs font-medium text-orange-600 bg-orange-100 rounded-full">
                                    Pending
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Upcoming Holidays</h3>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl">
                                <div className="flex items-center">
                                    <div className="w-12 h-12 rounded-xl bg-purple-50 flex flex-col items-center justify-center text-purple-600">
                                        <span className="text-xs font-bold">DEC</span>
                                        <span className="text-lg font-bold">25</span>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-slate-800">Christmas Day</p>
                                        <p className="text-xs text-slate-500">Monday</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
