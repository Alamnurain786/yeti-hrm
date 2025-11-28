import {
  createContext,
  useContext,
  useCallback,
  useState,
  useRef,
  useEffect,
} from "react";

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type, message, options = {}) => {
      const id = `${Date.now()}_${counter.current++}`;
      const duration = options.duration ?? 3000;
      const title =
        options.title ??
        (type === "success"
          ? "Success"
          : type === "error"
          ? "Error"
          : type === "info"
          ? "Info"
          : "Notice");

      const toast = { id, type, message, title, duration };
      setToasts((prev) => [...prev, toast]);

      // auto dismiss
      setTimeout(() => removeToast(id), duration);
    },
    [removeToast]
  );

  const value = { toasts, showToast, removeToast };
  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
