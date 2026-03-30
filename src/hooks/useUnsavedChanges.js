import { useEffect } from "react";

export const useUnsavedChanges = (hasUnsavedChanges, onWarnUnsavedChanges) => {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "hidden") return;
      if (hasUnsavedChanges) {
        onWarnUnsavedChanges?.();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [hasUnsavedChanges, onWarnUnsavedChanges]);
};
