import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useToast } from "../context/ToastContext";

const typeStyles = {
  success: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    icon: <CheckCircle2 size={18} className="text-emerald-600" />,
  },
  error: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    icon: <AlertCircle size={18} className="text-red-600" />,
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    icon: <Info size={18} className="text-blue-600" />,
  },
  default: {
    bg: "bg-slate-50",
    border: "border-slate-200",
    text: "text-slate-700",
    icon: <Info size={18} className="text-slate-600" />,
  },
};

const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-3 w-[320px]">
      {toasts.map((t) => {
        const style = typeStyles[t.type] ?? typeStyles.default;
        return (
          <div
            key={t.id}
            className={`flex items-start gap-3 p-4 rounded-xl shadow-lg border ${style.bg} ${style.border} animate-fade-in`}
          >
            <div className="mt-0.5">{style.icon}</div>
            <div className="flex-1">
              <p className={`text-sm font-semibold ${style.text}`}>{t.title}</p>
              <p className="text-sm text-slate-600 mt-1">{t.message}</p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="p-1 rounded hover:bg-slate-200/50"
            >
              <X size={16} className="text-slate-500" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
