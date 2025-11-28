import { useCallback } from "react";

/**
 * Custom hook for managing education entries in profile form
 * @param {function} setForm - Form state setter
 * @param {function} setHasUnsavedChanges - Unsaved changes setter
 * @returns {object} Education management functions
 */
export const useEducation = (setForm, setHasUnsavedChanges) => {
  const addEducation = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        {
          id: Date.now().toString(),
          level: "",
          institution: "",
          board: "",
          passedYear: "",
          grade: "",
          document: "",
        },
      ],
    }));
    setHasUnsavedChanges(true);
  }, [setForm, setHasUnsavedChanges]);

  const removeEducation = useCallback(
    (id) => {
      setForm((prev) => ({
        ...prev,
        education: prev.education.filter((e) => e.id !== id),
      }));
      setHasUnsavedChanges(true);
    },
    [setForm, setHasUnsavedChanges]
  );

  const updateEducation = useCallback(
    (id, field, value) => {
      setForm((prev) => ({
        ...prev,
        education: prev.education.map((e) =>
          e.id === id ? { ...e, [field]: value } : e
        ),
      }));
      setHasUnsavedChanges(true);
    },
    [setForm, setHasUnsavedChanges]
  );

  const handleEducationDocUpload = useCallback(
    (id, e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          updateEducation(id, "document", reader.result);
        };
        reader.readAsDataURL(file);
      }
    },
    [updateEducation]
  );

  const addBulkEducation = useCallback(
    (educationList) => {
      const newEducation = educationList.map((edu) => ({
        id: Date.now().toString() + Math.random(),
        level: edu.level || "",
        institution: edu.institution || "",
        board: edu.board || "",
        passedYear: edu.passedYear || "",
        grade: edu.grade || "",
        document: edu.document || "",
      }));

      setForm((prev) => ({
        ...prev,
        education: [...prev.education, ...newEducation],
      }));
      setHasUnsavedChanges(true);
    },
    [setForm, setHasUnsavedChanges]
  );

  return {
    addEducation,
    removeEducation,
    updateEducation,
    handleEducationDocUpload,
    addBulkEducation,
  };
};
