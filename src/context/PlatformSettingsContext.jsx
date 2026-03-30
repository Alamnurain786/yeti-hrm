/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { platformSettingsAPI } from "../services/backendApi";
import { useAuth } from "./AuthContext";

const PlatformSettingsContext = createContext(null);

const DEFAULT_PLATFORM_SETTINGS = {
  id: "global",
  platform_name: "HRM Platform",
  support_email: "support@hrm.com",
  auto_provision_admin: true,
  require_company_docs: true,
  enable_audit_trail: true,
  alert_on_company_creation: true,
  enable_superadmin_companies: true,
  enable_superadmin_user_access: true,
  enable_superadmin_devices: true,
  enable_superadmin_dashboard_config: true,
  show_company_metrics_on_dashboard: true,
  show_company_registry_on_dashboard: true,
};

export const PlatformSettingsProvider = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_PLATFORM_SETTINGS);
  const [loading, setLoading] = useState(false);

  const refreshSettings = async () => {
    if (!user) {
      setSettings(DEFAULT_PLATFORM_SETTINGS);
      return DEFAULT_PLATFORM_SETTINGS;
    }

    setLoading(true);
    try {
      const data = await platformSettingsAPI.get();
      const next = {
        ...DEFAULT_PLATFORM_SETTINGS,
        ...(data && typeof data === "object" ? data : {}),
      };
      setSettings(next);
      return next;
    } catch {
      setSettings(DEFAULT_PLATFORM_SETTINGS);
      return DEFAULT_PLATFORM_SETTINGS;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, [user?.id, user?.role]);

  const value = useMemo(
    () => ({
      settings,
      loading,
      refreshSettings,
      isFeatureEnabled: (key) => Boolean(settings?.[key]),
    }),
    [loading, settings],
  );

  return (
    <PlatformSettingsContext.Provider value={value}>
      {children}
    </PlatformSettingsContext.Provider>
  );
};

export const usePlatformSettings = () => {
  const context = useContext(PlatformSettingsContext);
  if (!context) {
    throw new Error("usePlatformSettings must be used within PlatformSettingsProvider");
  }
  return context;
};

export { DEFAULT_PLATFORM_SETTINGS };