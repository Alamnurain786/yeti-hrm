import { Calendar as CalendarIcon, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const Attendance = () => {
    const attendanceData = [
        { id: 1, name: 'Sarah Wilson', date: 'Oct 24, 2023', checkIn: '09:00 AM', checkOut: '05:00 PM', status: 'Present', hours: '8h 00m' },
        { id: 2, name: 'Michael Chen', date: 'Oct 24, 2023', checkIn: '-', checkOut: '-', status: 'Absent', hours: '-' },
        { id: 3, name: 'Emma Thompson', date: 'Oct 24, 2023', checkIn: '09:15 AM', checkOut: '05:15 PM', status: 'Late', hours: '8h 00m' },
        { id: 4, name: 'James Rodriguez', date: 'Oct 24, 2023', checkIn: '08:45 AM', checkOut: '04:45 PM', status: 'Present', hours: '8h 00m' },
        { id: 5, name: 'Lisa Park', date: 'Oct 24, 2023', checkIn: '09:00 AM', checkOut: '01:00 PM', status: 'Half Day', hours: '4h 00m' },
    ];

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Present': return 'bg-emerald-100 text-emerald-600';
            case 'Absent': return 'bg-red-100 text-red-600';
            case 'Late': return 'bg-orange-100 text-orange-600';
            case 'Half Day': return 'bg-blue-100 text-blue-600';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Attendance</h1>
                    <p className="text-slate-500 mt-1">Track daily attendance and leave requests.</p>
                </div>
                <div className="flex space-x-3">
                    <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl flex items-center hover:bg-slate-50 transition-colors">
                        <CalendarIcon size={18} className="mr-2" />
                        Select Date
                    </button>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors shadow-lg shadow-blue-600/30">
                        Export Report
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Present Today</p>
                            <h3 className="text-2xl font-bold text-slate-800 mt-1">45/50</h3>
                        </div>
                        <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                            <CheckCircle size={24} />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Late Arrivals</p>
                            <h3 className="text-2xl font-bold text-slate-800 mt-1">3</h3>
                        </div>
                        <div className="p-3 bg-orange-100 rounded-xl text-orange-600">
                            <Clock size={24} />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Absent</p>
                            <h3 className="text-2xl font-bold text-slate-800 mt-1">2</h3>
                        </div>
                        <div className="p-3 bg-red-100 rounded-xl text-red-600">
                            <XCircle size={24} />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">On Leave</p>
                            <h3 className="text-2xl font-bold text-slate-800 mt-1">5</h3>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                            <AlertCircle size={24} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800">Daily Attendance Log</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Check In</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Check Out</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Work Hours</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {attendanceData.map((record) => (
                                <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-800">{record.name}</td>
                                    <td className="px-6 py-4 text-slate-600">{record.date}</td>
                                    <td className="px-6 py-4 text-slate-600">{record.checkIn}</td>
                                    <td className="px-6 py-4 text-slate-600">{record.checkOut}</td>
                                    <td className="px-6 py-4 text-slate-600">{record.hours}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(record.status)}`}>
                                            {record.status}
                                        </span>
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

export default Attendance;
