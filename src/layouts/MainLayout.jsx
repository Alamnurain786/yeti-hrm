import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const MainLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-slate-50">
            <Sidebar />
            <Header />
            <main className="pl-64 pt-16 min-h-screen transition-all duration-300">
                <div className="p-8 max-w-7xl mx-auto animate-fade-in">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
