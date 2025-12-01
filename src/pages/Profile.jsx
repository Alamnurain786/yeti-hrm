import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
// import { useMockData } from "../context/MockData";
import {
  Save,
  Clock,
  AlertCircle,
  Eye,
  Download,
  FileDown,
} from "lucide-react";
import { useToast } from "../context/ToastContext";
import ProfileImageSection from "../components/profile/ProfileImageSection";
import EmployeeInfoSection from "../components/profile/EmployeeInfoSection";
import IdentificationSection from "../components/profile/IdentificationSection";
import FamilyDetailsSection from "../components/profile/FamilyDetailsSection";
import EducationSection from "../components/profile/EducationSection";
import AddressSection from "../components/profile/AddressSection";
import ProfileProgress from "../components/ProfileProgress";
import SuccessAnimation from "../components/SuccessAnimation";
import ProfileCompletenessBadge from "../components/ProfileCompletenessBadge";
import DocumentPreviewModal from "../components/DocumentPreviewModal";
import { useDebounce } from "../hooks/useDebounce";
import { useUnsavedChanges } from "../hooks/useUnsavedChanges";
import { useAutoSave } from "../hooks/useAutoSave";
import { useProfileForm } from "../hooks/useProfileForm";
import { useValidation } from "../hooks/useValidation";
import { useFamilyMembers } from "../hooks/useFamilyMembers";
import { useEducation } from "../hooks/useEducation";
import { exportProfileToPDF } from "../utils/pdfExport";

const Profile = () => {
  const { user } = useAuth();
  const { updateUserProfile } = useMockData();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    profileImage: user?.profileImage || "",
    // Non-editable HR fields shown read-only
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    role: user?.role || "",
    department: user?.department || "",
    manager: user?.manager || "",
    joiningDate: user?.joiningDate || "",
    joiningDateBS: user?.joiningDateBS || "",
    dateOfBirth: user?.dateOfBirth || "",
    dobBS: user?.dobBS || "",
    gender: user?.gender || "",
    age: user?.age || "",
    religion: user?.religion || "",
    nationality: user?.nationality || "",
    // Identification Details
    identification: user?.identification || {
      accountHolderNameNepali: "",
      citizenshipNo: "",
      citizenshipIssueDate: "",
      citizenshipIssueDateBS: "",
      citizenshipIssuePlace: "",
      citizenshipDocument: "",
      nationalIdCardNo: "",
      nationalIdCardIssueDate: "",
      nationalIdCardIssueDateBS: "",
      nationalIdCardIssuePlace: "",
      nationalIdCardDocument: "",
      drivingLicenseNo: "",
      drivingLicenseIssueDate: "",
      drivingLicenseIssueDateBS: "",
      drivingLicenseIssuingAuthority: "",
      drivingLicenseDocument: "",
      panNo: "",
      panDocument: "",
    },
    // Family Members (table format)
    familyMembers: user?.familyMembers || [],
    // Education (multi-entry with documents)
    education: user?.education || [],
    // Address sections
    currentAddress: user?.currentAddress || {
      houseNo: "",
      wardNo: "",
      street: "",
      municipality: "",
      district: "",
      tel: "",
      fax: "",
      mobile: "",
      email: "",
    },
    permanentAddress: user?.permanentAddress || {
      houseNo: "",
      wardNo: "",
      street: "",
      municipality: "",
      district: "",
      tel: "",
      fax: "",
      mobile: "",
      email: "",
    },
  });

  const [errors, setErrors] = useState({});
  const [imageCropModal, setImageCropModal] = useState(false);
  const [tempImage, setTempImage] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [validationErrors, setValidationErrors] = useState(0);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [ariaLiveMessage, setAriaLiveMessage] = useState("");

  // Ref for error announcement
  const errorAnnouncementRef = useRef(null);

  // Debounce form for validation
  const debouncedForm = useDebounce(form, 500);

  // Unsaved changes warning
  useUnsavedChanges(hasUnsavedChanges);

  // Auto-save draft to localStorage
  useAutoSave(
    form,
    useCallback(() => {
      if (hasUnsavedChanges) {
        localStorage.setItem(
          `profile_draft_${user.id}`,
          JSON.stringify({
            data: form,
            timestamp: Date.now(),
          })
        );
        setLastSaved(new Date());
      }
    }, [form, hasUnsavedChanges, user.id]),
    30000
  ); // Auto-save every 30 seconds

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem(`profile_draft_${user.id}`);
    if (draft) {
      try {
        const { data, timestamp } = JSON.parse(draft);
        // Only load draft if it's less than 24 hours old
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          const loadDraft = window.confirm(
            "Found an unsaved draft. Would you like to restore it?"
          );
          if (loadDraft) {
            setForm(data);
            setHasUnsavedChanges(true);
          }
        }
      } catch (error) {
        console.error("Failed to load draft:", error);
      }
    }
  }, [user.id]);

  // Helper function to announce messages to screen readers
  const announceToScreenReader = useCallback((message) => {
    setAriaLiveMessage(message);
    setTimeout(() => setAriaLiveMessage(""), 3000);
  }, []);

  // Real-time validation
  useEffect(() => {
    const errors = validateFormRealtime(debouncedForm);
    const errorCount = Object.keys(errors).length;
    setValidationErrors(errorCount);

    // Announce validation status to screen readers
    if (errorCount > 0) {
      announceToScreenReader(
        `${errorCount} validation error${errorCount > 1 ? "s" : ""} found`
      );
    }
  }, [debouncedForm, announceToScreenReader]);

  // Memoized handlers
  const handleChange = useCallback(
    (path, value) => {
      setForm((prev) => ({ ...prev, [path]: value }));
      setHasUnsavedChanges(true);
      if (errors[path]) {
        setErrors((prev) => ({ ...prev, [path]: "" }));
      }
    },
    [errors]
  );

  const handleNestedChange = useCallback(
    (section, field, value) => {
      setForm((prev) => ({
        ...prev,
        [section]: { ...prev[section], [field]: value },
      }));
      setHasUnsavedChanges(true);
      if (errors[`${section}.${field}`]) {
        setErrors((prev) => ({ ...prev, [`${section}.${field}`]: "" }));
      }
    },
    [errors]
  );

  const handleImageUpload = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        showToast("error", "Please upload a valid image file.", {
          title: "Invalid File",
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        showToast("error", "Image size should be less than 5MB.", {
          title: "File Too Large",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setTempImage(reader.result);
        setImageCropModal(true);
      };
      reader.readAsDataURL(file);
    },
    [showToast]
  );

  const handleImageCrop = useCallback(() => {
    handleChange("profileImage", tempImage);
    setImageCropModal(false);
    setTempImage(null);
    showToast("success", "Profile image updated.", { title: "Image Uploaded" });
  }, [tempImage, handleChange, showToast]);

  const addFamilyMember = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      familyMembers: [
        ...prev.familyMembers,
        { relationship: "", name: "", remarks: "" },
      ],
    }));
    setHasUnsavedChanges(true);
  }, []);

  const removeFamilyMember = useCallback((index) => {
    setForm((prev) => ({
      ...prev,
      familyMembers: prev.familyMembers.filter((_, i) => i !== index),
    }));
    setHasUnsavedChanges(true);
  }, []);

  const updateFamilyMember = useCallback(
    (index, field, value) => {
      setForm((prev) => ({
        ...prev,
        familyMembers: prev.familyMembers.map((member, i) =>
          i === index ? { ...member, [field]: value } : member
        ),
      }));
      setHasUnsavedChanges(true);
      if (errors[`familyMember.${index}.${field}`]) {
        setErrors((prev) => ({
          ...prev,
          [`familyMember.${index}.${field}`]: "",
        }));
      }
    },
    [errors]
  );

  const addEducation = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        { degree: "", institute: "", year: "", document: "" },
      ],
    }));
    setHasUnsavedChanges(true);
  }, []);

  const removeEducation = useCallback((index) => {
    setForm((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }));
    setHasUnsavedChanges(true);
  }, []);

  const updateEducation = useCallback(
    (index, field, value) => {
      setForm((prev) => ({
        ...prev,
        education: prev.education.map((edu, i) =>
          i === index ? { ...edu, [field]: value } : edu
        ),
      }));
      setHasUnsavedChanges(true);
      if (errors[`education.${index}.${field}`]) {
        setErrors((prev) => ({ ...prev, [`education.${index}.${field}`]: "" }));
      }
    },
    [errors]
  );

  const handleEducationDocUpload = useCallback(
    (index, e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        updateEducation(index, "document", reader.result);
      };
      reader.readAsDataURL(file);
    },
    [updateEducation]
  );

  const handleCopyAddress = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      permanentAddress: { ...prev.currentAddress },
    }));
    setHasUnsavedChanges(true);
    showToast("success", "Address copied successfully!");
    announceToScreenReader("Current address copied to permanent address");
  }, [showToast, announceToScreenReader]);

  // Document preview handler
  const handlePreviewDocument = useCallback(
    (document, title) => {
      setPreviewDocument(document);
      setPreviewTitle(title);
      announceToScreenReader(`Opening preview for ${title}`);
    },
    [announceToScreenReader]
  );

  // Export profile to PDF
  const handleExportPDF = useCallback(() => {
    exportProfileToPDF(user, form);
    announceToScreenReader("Exporting profile to PDF");
    showToast(
      "success",
      "Profile export initiated. Please use browser's print function to save as PDF."
    );
  }, [user, form, announceToScreenReader, showToast]);

  // Real-time validation function
  const validateFormRealtime = (formData) => {
    const newErrors = {};

    if (formData.identification.accountHolderNameNepali) {
      if (!formData.identification.accountHolderNameNepali.trim()) {
        newErrors["identification.accountHolderNameNepali"] =
          "Nepali name is required";
      }
    }

    if (formData.identification.citizenshipNo) {
      if (!formData.identification.citizenshipNo.trim()) {
        newErrors["identification.citizenshipNo"] =
          "Citizenship number is required";
      }
    }

    if (formData.identification.citizenshipIssuePlace) {
      if (!formData.identification.citizenshipIssuePlace.trim()) {
        newErrors["identification.citizenshipIssuePlace"] =
          "Issue place is required";
      }
    }

    if (formData.identification.panNo) {
      if (!formData.identification.panNo.trim()) {
        newErrors["identification.panNo"] = "PAN number is required";
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (
      formData.currentAddress.email &&
      !emailRegex.test(formData.currentAddress.email)
    ) {
      newErrors["currentAddress.email"] = "Invalid email format";
    }
    if (
      formData.permanentAddress.email &&
      !emailRegex.test(formData.permanentAddress.email)
    ) {
      newErrors["permanentAddress.email"] = "Invalid email format";
    }

    const mobileRegex = /^\d{10}$/;
    if (
      formData.currentAddress.mobile &&
      !mobileRegex.test(formData.currentAddress.mobile)
    ) {
      newErrors["currentAddress.mobile"] = "Mobile must be 10 digits";
    }
    if (
      formData.permanentAddress.mobile &&
      !mobileRegex.test(formData.permanentAddress.mobile)
    ) {
      newErrors["permanentAddress.mobile"] = "Mobile must be 10 digits";
    }

    return newErrors;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.identification.accountHolderNameNepali.trim()) {
      newErrors["identification.accountHolderNameNepali"] =
        "Nepali name is required";
    }
    if (!form.identification.citizenshipNo.trim()) {
      newErrors["identification.citizenshipNo"] =
        "Citizenship number is required";
    }
    if (!form.identification.citizenshipIssuePlace.trim()) {
      newErrors["identification.citizenshipIssuePlace"] =
        "Issue place is required";
    }
    if (!form.identification.panNo.trim()) {
      newErrors["identification.panNo"] = "PAN number is required";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (
      form.currentAddress.email &&
      !emailRegex.test(form.currentAddress.email)
    ) {
      newErrors["currentAddress.email"] = "Invalid email format";
    }
    if (
      form.permanentAddress.email &&
      !emailRegex.test(form.permanentAddress.email)
    ) {
      newErrors["permanentAddress.email"] = "Invalid email format";
    }

    const mobileRegex = /^\d{10}$/;
    if (
      form.currentAddress.mobile &&
      !mobileRegex.test(form.currentAddress.mobile)
    ) {
      newErrors["currentAddress.mobile"] = "Mobile must be 10 digits";
    }
    if (
      form.permanentAddress.mobile &&
      !mobileRegex.test(form.permanentAddress.mobile)
    ) {
      newErrors["permanentAddress.mobile"] = "Mobile must be 10 digits";
    }

    form.familyMembers.forEach((member, index) => {
      if (!member.relationship.trim()) {
        newErrors[`familyMember.${index}.relationship`] =
          "Relationship is required";
      }
      if (!member.name.trim()) {
        newErrors[`familyMember.${index}.name`] = "Name is required";
      }
    });

    form.education.forEach((edu, index) => {
      if (!edu.degree.trim()) {
        newErrors[`education.${index}.degree`] = "Degree is required";
      }
      if (!edu.institute.trim()) {
        newErrors[`education.${index}.institute`] = "Institute is required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      const errorCount = Object.keys(errors).length;
      showToast("error", "Please fix all validation errors.", {
        title: "Validation Failed",
      });

      // Announce errors to screen readers
      announceToScreenReader(
        `Form validation failed. ${errorCount} error${
          errorCount > 1 ? "s" : ""
        } found. Please review and correct.`
      );

      // Focus first error field for keyboard navigation
      const firstErrorKey = Object.keys(errors)[0];
      const errorElement = document.querySelector(
        `[name="${firstErrorKey}"], [data-error-field="${firstErrorKey}"]`
      );
      if (errorElement) {
        errorElement.focus();
        errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setIsSaving(true);
    announceToScreenReader("Saving profile changes");

    // Simulate API delay for loading state
    await new Promise((resolve) => setTimeout(resolve, 1000));

    updateUserProfile(user.id, {
      profileImage: form.profileImage,
      identification: form.identification,
      familyMembers: form.familyMembers,
      education: form.education,
      currentAddress: form.currentAddress,
      permanentAddress: form.permanentAddress,
      nationality: form.nationality,
      religion: form.religion,
      dobBS: form.dobBS,
      joiningDateBS: form.joiningDateBS,
      gender: form.gender,
      age: form.age,
    });

    // Clear draft from localStorage
    localStorage.removeItem(`profile_draft_${user.id}`);

    setHasUnsavedChanges(false);
    setIsSaving(false);
    setShowSuccess(true);
    setLastSaved(new Date());

    // Announce success to screen readers
    announceToScreenReader("Profile saved successfully");
    showToast("success", "Profile updated successfully!", { title: "Success" });
  };

  return (
    <>
      {/* ARIA Live Region for Screen Reader Announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        ref={errorAnnouncementRef}
      >
        {ariaLiveMessage}
      </div>

      <SuccessAnimation
        show={showSuccess}
        onComplete={() => setShowSuccess(false)}
      />

      {/* Document Preview Modal */}
      {previewDocument && (
        <DocumentPreviewModal
          document={previewDocument}
          title={previewTitle}
          onClose={() => {
            setPreviewDocument(null);
            setPreviewTitle("");
            announceToScreenReader("Document preview closed");
          }}
        />
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-8"
        aria-label="Employee profile form"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">My Profile</h1>
            <p className="text-slate-500 mt-1">
              View and update your personal details.
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <ProfileCompletenessBadge form={form} />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium shadow-lg shadow-green-600/20"
                aria-label="Export profile to PDF"
              >
                <FileDown size={16} />
                Export PDF
              </button>
              {lastSaved && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock size={14} />
                  <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
                </div>
              )}
              {hasUnsavedChanges && (
                <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium">
                  <AlertCircle size={14} />
                  Unsaved changes
                </div>
              )}
            </div>
          </div>
        </div>

        <ProfileProgress form={form} />

        {validationErrors > 0 && (
          <div
            className="bg-red-50 border border-red-200 rounded-xl p-4"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle size={20} aria-hidden="true" />
              <p className="font-medium">
                {validationErrors} validation error
                {validationErrors > 1 ? "s" : ""} found
              </p>
            </div>
            <p className="text-sm text-red-600 mt-1">
              Please fix the errors highlighted in red below.
            </p>
          </div>
        )}

        <ProfileImageSection
          form={form}
          handleImageUpload={handleImageUpload}
          imageCropModal={imageCropModal}
          tempImage={tempImage}
          handleImageCrop={handleImageCrop}
          setImageCropModal={setImageCropModal}
        />

        <EmployeeInfoSection form={form} handleChange={handleChange} />

        <IdentificationSection
          form={form}
          handleNestedChange={handleNestedChange}
          errors={errors}
        />

        <FamilyDetailsSection
          familyMembers={form.familyMembers}
          addFamilyMember={addFamilyMember}
          removeFamilyMember={removeFamilyMember}
          updateFamilyMember={updateFamilyMember}
          errors={errors}
        />

        <EducationSection
          education={form.education}
          addEducation={addEducation}
          removeEducation={removeEducation}
          updateEducation={updateEducation}
          handleEducationDocUpload={handleEducationDocUpload}
          errors={errors}
        />

        <AddressSection
          form={form}
          handleNestedChange={handleNestedChange}
          errors={errors}
          onCopyAddress={handleCopyAddress}
        />

        <div
          className="flex justify-end gap-3"
          role="group"
          aria-label="Form actions"
        >
          <button
            type="button"
            aria-label="Discard all unsaved changes"
            onClick={() => {
              const draft = localStorage.getItem(`profile_draft_${user.id}`);
              if (draft) {
                const loadDraft = window.confirm(
                  "This will discard all unsaved changes. Continue?"
                );
                if (loadDraft) {
                  setForm({
                    ...form,
                    profileImage: user?.profileImage || "",
                    name: user?.name || "",
                    email: user?.email || "",
                    phone: user?.phone || "",
                  });
                  setHasUnsavedChanges(false);
                  localStorage.removeItem(`profile_draft_${user.id}`);
                }
              }
            }}
            className="px-6 py-3 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors font-medium"
            disabled={isSaving || !hasUnsavedChanges}
          >
            Discard Changes
          </button>
          <button
            type="submit"
            disabled={isSaving}
            aria-label={
              isSaving ? "Saving profile changes" : "Save profile changes"
            }
            aria-busy={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center transition-colors shadow-lg shadow-blue-600/30 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} className="mr-2" /> Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </>
  );
};

export default Profile;
