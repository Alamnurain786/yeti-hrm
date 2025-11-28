import { Loader2 } from "lucide-react";

const LoadingSpinner = () => {
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center space-y-4">
        <Loader2 size={48} className="text-blue-600 animate-spin" />
        <div className="text-center">
          <h3 className="text-xl font-bold text-slate-800">
            Loading HRM System
          </h3>
          <p className="text-slate-500 mt-2">Fetching data from API...</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
