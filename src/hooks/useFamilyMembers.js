import { useCallback } from "react";

/**
 * Custom hook for managing family members in profile form
 * @param {function} setForm - Form state setter
 * @param {function} setHasUnsavedChanges - Unsaved changes setter
 * @returns {object} Family member management functions
 */
export const useFamilyMembers = (setForm, setHasUnsavedChanges) => {
  const addFamilyMember = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      familyDetails: {
        ...prev.familyDetails,
        members: [
          ...prev.familyDetails.members,
          {
            id: Date.now().toString(),
            name: "",
            relation: "",
            contact: "",
            occupation: "",
          },
        ],
      },
    }));
    setHasUnsavedChanges(true);
  }, [setForm, setHasUnsavedChanges]);

  const removeFamilyMember = useCallback(
    (id) => {
      setForm((prev) => ({
        ...prev,
        familyDetails: {
          ...prev.familyDetails,
          members: prev.familyDetails.members.filter((m) => m.id !== id),
        },
      }));
      setHasUnsavedChanges(true);
    },
    [setForm, setHasUnsavedChanges]
  );

  const updateFamilyMember = useCallback(
    (id, field, value) => {
      setForm((prev) => ({
        ...prev,
        familyDetails: {
          ...prev.familyDetails,
          members: prev.familyDetails.members.map((m) =>
            m.id === id ? { ...m, [field]: value } : m
          ),
        },
      }));
      setHasUnsavedChanges(true);
    },
    [setForm, setHasUnsavedChanges]
  );

  const addBulkFamilyMembers = useCallback(
    (members) => {
      const newMembers = members.map((member) => ({
        id: Date.now().toString() + Math.random(),
        name: member.name || "",
        relation: member.relation || "",
        contact: member.contact || "",
        occupation: member.occupation || "",
      }));

      setForm((prev) => ({
        ...prev,
        familyDetails: {
          ...prev.familyDetails,
          members: [...prev.familyDetails.members, ...newMembers],
        },
      }));
      setHasUnsavedChanges(true);
    },
    [setForm, setHasUnsavedChanges]
  );

  return {
    addFamilyMember,
    removeFamilyMember,
    updateFamilyMember,
    addBulkFamilyMembers,
  };
};
