import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import ToastContainer from "./components/ToastContainer.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { PlatformSettingsProvider } from "./context/PlatformSettingsContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <PlatformSettingsProvider>
        <ToastProvider>
          <App />
          <ToastContainer />
        </ToastProvider>
      </PlatformSettingsProvider>
    </AuthProvider>
  </StrictMode>,
);
