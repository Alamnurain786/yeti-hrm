import { useState, useCallback } from "react";

/**
 * Custom hook for managing profile form state and handlers
 * @param {object} initialForm - Initial form values
 * @returns {object} Form state and handlers
 */
export const useProfileForm = (initialForm) => {
  const [form, setForm] = useState(initialForm);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleChange = useCallback((path, value) => {
    setForm((prev) => ({ ...prev, [path]: value }));
    setHasUnsavedChanges(true);
  }, []);

  const handleNestedChange = useCallback((parent, field, value) => {
    setForm((prev) => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value },
    }));
    setHasUnsavedChanges(true);
  }, []);

  const handleImageUpload = useCallback((imageData) => {
    setForm((prev) => ({ ...prev, profileImage: imageData }));
    setHasUnsavedChanges(true);
  }, []);

  const resetForm = useCallback(() => {
    setForm(initialForm);
    setHasUnsavedChanges(false);
  }, [initialForm]);

  const updateForm = useCallback((newForm) => {
    setForm(newForm);
  }, []);

  return {
    form,
    setForm,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    handleChange,
    handleNestedChange,
    handleImageUpload,
    resetForm,
    updateForm,
  };
};
