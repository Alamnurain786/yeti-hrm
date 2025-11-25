import { Bell, Search, User } from 'lucide-react';

const Header = () => {
    return (
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 fixed top-0 right-0 left-64 z-40 px-8 flex items-center justify-between">
            <div className="flex items-center bg-slate-100 rounded-full px-4 py-2 w-96">
                <Search size={18} className="text-slate-400" />
                <input
                    type="text"
                    placeholder="Search employees, departments..."
                    className="bg-transparent border-none outline-none ml-3 w-full text-sm text-slate-600 placeholder:text-slate-400"
                />
            </div>

            <div className="flex items-center space-x-6">
                <button className="relative p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>

                <div className="flex items-center space-x-3 pl-6 border-l border-slate-200">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-semibold text-slate-700">Edward User</p>
                        <p className="text-xs text-slate-500">HR Manager</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30">
                        EU
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
