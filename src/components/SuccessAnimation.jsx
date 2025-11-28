import { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";

const SuccessAnimation = ({ show, onComplete }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="animate-scale-in">
        <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 border-2 border-green-500">
          <div className="relative">
            <CheckCircle className="w-20 h-20 text-green-500 animate-bounce" />
            <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-bold text-slate-800 mb-1">Success!</h3>
            <p className="text-slate-600">Profile updated successfully</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessAnimation;
