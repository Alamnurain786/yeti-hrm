/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
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
import { useUnsavedChanges } from "../hooks/useUnsavedChanges";
import { useAutoSave } from "../hooks/useAutoSave";
import { exportProfileToPDF } from "../utils/pdfExport";
import {
  getApiErrorMessage,
  getApiValidationErrors,
  profileAPI,
  profileFileAPI,
  userAPI,
} from "../services/backendApi";
import NepaliDate from "nepali-date-converter";

const emptyIdentification = {
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
};

const emptyAddress = {
  houseNo: "",
  wardNo: "",
  street: "",
  municipality: "",
  district: "",
  mobile: "",
  email: "",
};

const isDataUri = (value) =>
  typeof value === "string" && value.trim().toLowerCase().startsWith("data:");
const isBlobUrl = (value) =>
  typeof value === "string" && value.trim().toLowerCase().startsWith("blob:");

const sanitizeDocumentValue = (value) => (isDataUri(value) ? "" : value || "");
const sanitizeProfileImageValue = (value) =>
  isDataUri(value) || isBlobUrl(value) ? "" : value || "";
const isHttpUrl = (value) =>
  typeof value === "string" && /^https?:\/\//i.test(value.trim());

const resolveProfileImageForSave = (formValue, userValue) => {
  const formSanitized = sanitizeProfileImageValue(formValue);
  if (formSanitized) return formSanitized;
  const userSanitized = sanitizeProfileImageValue(userValue);
  return userSanitized || "";
};

const toPreviewImageSrc = (value) => {
  const sanitized = sanitizeProfileImageValue(value);
  if (!sanitized) return "";
  return isHttpUrl(sanitized) ? sanitized : "";
};

const toAdDateFromBs = (bsValue) => {
  if (!bsValue || typeof bsValue !== "string") return "";
  const parts = bsValue.split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return "";

  try {
    const [year, month, day] = parts;
    const nepaliDate = new NepaliDate(year, month - 1, day);
    return nepaliDate.toJsDate().toISOString().split("T")[0];
  } catch {
    return "";
  }
};

const toAgeFromAd = (adValue) => {
  if (!adValue || typeof adValue !== "string") return "";
  const adDate = new Date(adValue);
  if (Number.isNaN(adDate.getTime())) return "";

  const today = new Date();
  let age = today.getFullYear() - adDate.getFullYear();
  const monthDiff = today.getMonth() - adDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < adDate.getDate())
  ) {
    age--;
  }
  return age >= 0 ? String(age) : "";
};

const sanitizeProfileData = (data = {}) => {
  const identification = data.identification || {};
  const education = Array.isArray(data.education) ? data.education : [];

  return {
    ...data,
    profileImage: sanitizeProfileImageValue(data.profileImage),
    identification: {
      ...identification,
      citizenshipDocument: sanitizeDocumentValue(
        identification.citizenshipDocument,
      ),
      nationalIdCardDocument: sanitizeDocumentValue(
        identification.nationalIdCardDocument,
      ),
      drivingLicenseDocument: sanitizeDocumentValue(
        identification.drivingLicenseDocument,
      ),
      panDocument: sanitizeDocumentValue(identification.panDocument),
    },
    education: education.map((item) => ({
      ...item,
      document: sanitizeDocumentValue(item.document),
    })),
  };
};

const ALLOWED_PROFILE_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
];
const ALLOWED_DOC_MIME_TYPES = ["image/jpeg", "image/jpg", "application/pdf"];
const UNSAVED_TOAST_COOLDOWN_MS = 8000;
const PROFILE_REVIEW_PENDING_REASON = "Profile update submitted for review";
const MOBILE_REGEX = /^\d{10}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const buildInitialForm = (user, profileData = null) => {
  const sanitized = sanitizeProfileData(profileData || {});
  const joiningDateBS = sanitized?.joiningDateBS || user?.joiningDateBS || "";
  const dateOfBirth = sanitized?.dateOfBirth || user?.dateOfBirth || "";
  const derivedJoiningDate = toAdDateFromBs(joiningDateBS);
  const derivedAge = toAgeFromAd(dateOfBirth);

  return {
    profileImage: toPreviewImageSrc(
      sanitized?.profileImage || user?.profileImage,
    ),
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    role: sanitized?.role || user?.role || "",
    department: sanitized?.department || user?.department || "",
    manager: sanitized?.manager || user?.manager || "",
    joiningDate:
      sanitized?.joiningDate || user?.joiningDate || derivedJoiningDate,
    joiningDateBS,
    dateOfBirth,
    dobBS: sanitized?.dobBS || user?.dobBS || "",
    gender: sanitized?.gender || user?.gender || "",
    age: sanitized?.age || user?.age || derivedAge,
    religion: sanitized?.religion || user?.religion || "",
    nationality: sanitized?.nationality || user?.nationality || "",
    identification: {
      ...emptyIdentification,
      ...(sanitized?.identification || {}),
    },
    familyMembers: sanitized?.familyMembers || user?.familyMembers || [],
    education: sanitized?.education || user?.education || [],
    currentAddress: {
      ...emptyAddress,
      ...(sanitized?.currentAddress || user?.currentAddress || {}),
    },
    permanentAddress: {
      ...emptyAddress,
      ...(sanitized?.permanentAddress || user?.permanentAddress || {}),
    },
  };
};

const Profile = () => {
  const { user, updateCurrentUser, refreshCurrentUser } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState(() => buildInitialForm(user));

  const [managers, setManagers] = useState([]);
  const [imageCropModal, setImageCropModal] = useState(false);
  const [tempImage, setTempImage] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [ariaLiveMessage, setAriaLiveMessage] = useState("");
  const [errors, setErrors] = useState({});
  const lastUnsavedToastAtRef = useRef(0);
  const profileImageObjectUrlRef = useRef(null);
  const verificationStatus = String(user?.verification_status || "").trim();
  const verificationReason = String(user?.verification_reason || "").trim();
  const isProfileLocked =
    user?.role === "user" &&
    (verificationStatus === "Approved" ||
      (verificationStatus === "Pending" &&
        verificationReason === PROFILE_REVIEW_PENDING_REASON));

  // Ref for error announcement
  const errorAnnouncementRef = useRef(null);

  // Unsaved changes warning
  const warnUnsavedChanges = useCallback(() => {
    const now = Date.now();
    if (now - lastUnsavedToastAtRef.current < UNSAVED_TOAST_COOLDOWN_MS) {
      return;
    }

    lastUnsavedToastAtRef.current = now;
    showToast("info", "You have unsaved profile changes.", {
      title: "Unsaved Changes",
      duration: 5000,
    });
  }, [showToast]);

  useUnsavedChanges(hasUnsavedChanges, warnUnsavedChanges);

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
          }),
        );
        setLastSaved(new Date());
      }
    }, [form, hasUnsavedChanges, user.id]),
    30000,
  ); // Auto-save every 30 seconds

  // Load draft on mount
  useEffect(() => {
    if (!user?.id) return;

    const draft = localStorage.getItem(`profile_draft_${user.id}`);
    if (draft) {
      try {
        const { data, timestamp } = JSON.parse(draft);
        // Only load draft if it's less than 24 hours old
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          setForm(sanitizeProfileData(data));
          setHasUnsavedChanges(true);
          showToast("info", "Unsaved draft restored automatically.", {
            title: "Draft Restored",
            duration: 4000,
          });
        }
      } catch (error) {
        console.error("Failed to load draft:", error);
      }
    }
  }, [showToast, user?.id]);

  // Load available managers (for manager assignment in employee profile)
  useEffect(() => {
    const loadManagers = async () => {
      try {
        const allUsers = await userAPI.getAll();
        // Filter managers: those with admin role or marked as section managers
        const managersList = allUsers.filter(
          (u) =>
            u.role === "admin" ||
            u.role === "superadmin" ||
            u.is_section_manager === true,
        );
        setManagers(managersList);
      } catch (error) {
        console.error("Failed to load managers:", error);
      }
    };
    loadManagers();
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    refreshCurrentUser();

    const handleFocus = () => {
      refreshCurrentUser();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [refreshCurrentUser, user?.id]);

  // Load profile from backend tables
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      try {
        const profile = await profileAPI.getByEmployeeId(user.id);
        const initial = buildInitialForm(user, profile);
        const files = await profileFileAPI.list(user.id, "profile");
        const latestProfileImage = files.find(
          (file) => file.field_name === "profileImage",
        );
        const profileImageRef =
          latestProfileImage?.id ||
          profile?.profileImage ||
          user?.profileImage ||
          user?.profile_image;

        if (profileImageRef) {
          const objectUrl =
            await profileFileAPI.createObjectUrl(profileImageRef);
          if (profileImageObjectUrlRef.current) {
            URL.revokeObjectURL(profileImageObjectUrlRef.current);
          }
          profileImageObjectUrlRef.current = objectUrl;
          initial.profileImage = objectUrl;
        }
        setForm(initial);
      } catch (error) {
        console.error("Failed to load profile:", error);
      }
    };
    loadProfile();

    return () => {
      if (profileImageObjectUrlRef.current) {
        URL.revokeObjectURL(profileImageObjectUrlRef.current);
        profileImageObjectUrlRef.current = null;
      }
    };
  }, [user]);

  // Helper function to announce messages to screen readers
  const announceToScreenReader = useCallback((message) => {
    setAriaLiveMessage(message);
    setTimeout(() => setAriaLiveMessage(""), 3000);
  }, []);

  // Memoized handlers
  const handleChange = useCallback((path, value) => {
    setForm((prev) => ({ ...prev, [path]: value }));
    setHasUnsavedChanges(true);
    setErrors((prev) => {
      if (!prev[path]) return prev;
      const next = { ...prev };
      delete next[path];
      return next;
    });
  }, []);

  const handleNestedChange = useCallback((section, field, value) => {
    setForm((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
    setHasUnsavedChanges(true);
    const key = `${section}.${field}`;
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const validateProfileForm = useCallback(() => {
    const nextErrors = {};

    const requiredIdentificationFields = [
      "accountHolderNameNepali",
      "citizenshipNo",
      "citizenshipIssuePlace",
      "panNo",
    ];

    requiredIdentificationFields.forEach((field) => {
      if (!String(form.identification?.[field] || "").trim()) {
        nextErrors[`identification.${field}`] = "This field is required";
      }
    });

    const requiredAddressFields = [
      "houseNo",
      "wardNo",
      "municipality",
      "district",
      "mobile",
    ];

    ["currentAddress", "permanentAddress"].forEach((section) => {
      requiredAddressFields.forEach((field) => {
        if (!String(form?.[section]?.[field] || "").trim()) {
          nextErrors[`${section}.${field}`] = "This field is required";
        }
      });

      const mobile = String(form?.[section]?.mobile || "").trim();
      const email = String(form?.[section]?.email || "").trim();

      if (
        mobile &&
        !nextErrors[`${section}.mobile`] &&
        !MOBILE_REGEX.test(mobile)
      ) {
        nextErrors[`${section}.mobile`] = "Mobile number must be 10 digits";
      }

      if (email && !EMAIL_REGEX.test(email)) {
        nextErrors[`${section}.email`] = "Enter a valid email address";
      }
    });

    (form.familyMembers || []).forEach((member, index) => {
      if (!String(member?.relationship || "").trim()) {
        nextErrors[`familyMember.${index}.relationship`] =
          "Relationship is required";
      }
      if (!String(member?.name || "").trim()) {
        nextErrors[`familyMember.${index}.name`] = "Name is required";
      }
    });

    (form.education || []).forEach((edu, index) => {
      if (!String(edu?.degree || "").trim()) {
        nextErrors[`education.${index}.degree`] = "Degree is required";
      }
      if (!String(edu?.institute || "").trim()) {
        nextErrors[`education.${index}.institute`] = "Institute is required";
      }
      const year = String(edu?.year || "").trim();
      if (year && !/^\d{4}$/.test(year)) {
        nextErrors[`education.${index}.year`] = "Use YYYY format";
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [form]);

  const handleImageUpload = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        showToast("error", "Profile image must be JPG, JPEG, or PNG.", {
          title: "Invalid File",
        });
        return;
      }

      if (
        !ALLOWED_PROFILE_IMAGE_MIME_TYPES.includes(
          (file.type || "").toLowerCase(),
        )
      ) {
        showToast("error", "Profile image must be JPG, JPEG, or PNG.", {
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

      try {
        const uploaded = await profileFileAPI.upload(
          user.id,
          file,
          "profile",
          "profileImage",
        );
        const objectUrl = await profileFileAPI.createObjectUrl(uploaded.id);
        if (profileImageObjectUrlRef.current) {
          URL.revokeObjectURL(profileImageObjectUrlRef.current);
        }
        profileImageObjectUrlRef.current = objectUrl;
        handleChange("profileImage", objectUrl);
        updateCurrentUser({ profileImage: uploaded.id });
        showToast("success", "Profile image uploaded.", {
          title: "Image Uploaded",
        });
      } catch (error) {
        const detail = error.response?.data?.detail;
        const message =
          typeof detail === "string"
            ? detail
            : detail?.message || "Image upload failed.";
        showToast("error", message, {
          title: "Upload Failed",
        });
      }
    },
    [handleChange, showToast, user.id],
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

  const updateFamilyMember = useCallback((index, field, value) => {
    setForm((prev) => ({
      ...prev,
      familyMembers: prev.familyMembers.map((member, i) =>
        i === index ? { ...member, [field]: value } : member,
      ),
    }));
    setHasUnsavedChanges(true);
    setErrors((prev) => {
      const key = `familyMember.${index}.${field}`;
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

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

  const updateEducation = useCallback((index, field, value) => {
    setForm((prev) => ({
      ...prev,
      education: prev.education.map((edu, i) =>
        i === index ? { ...edu, [field]: value } : edu,
      ),
    }));
    setHasUnsavedChanges(true);
    setErrors((prev) => {
      const key = `education.${index}.${field}`;
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const handleEducationDocUpload = useCallback(
    async (index, e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!ALLOWED_DOC_MIME_TYPES.includes((file.type || "").toLowerCase())) {
        showToast("error", "Education document must be JPG, JPEG, or PDF.");
        return;
      }

      let uploaded;
      try {
        uploaded = await profileFileAPI.upload(
          user.id,
          file,
          "education",
          `education_${index}`,
        );
      } catch (error) {
        const detail = error.response?.data?.detail;
        const message =
          typeof detail === "string"
            ? detail
            : detail?.message || "Education document upload failed.";
        showToast("error", message);
        return;
      }

      // Save a backend file reference, not a base64 payload, to prevent DB overflow.
      updateEducation(
        index,
        "document",
        uploaded.file_path || String(uploaded.id),
      );
      showToast("success", "Education document uploaded.");
    },
    [showToast, updateEducation, user.id],
  );

  const handleIdentificationDocUpload = useCallback(
    async (field, file) => {
      if (!file) return;

      if (!ALLOWED_DOC_MIME_TYPES.includes((file.type || "").toLowerCase())) {
        showToast(
          "error",
          "Identification document must be JPG, JPEG, or PDF.",
        );
        return;
      }

      let uploaded;
      try {
        uploaded = await profileFileAPI.upload(
          user.id,
          file,
          "identification",
          field,
        );
      } catch (error) {
        const detail = error.response?.data?.detail;
        const message =
          typeof detail === "string"
            ? detail
            : detail?.message || "Identification document upload failed.";
        showToast("error", message);
        return;
      }

      // Save a backend file reference, not a base64 payload, to prevent DB overflow.
      handleNestedChange(
        "identification",
        field,
        uploaded.file_path || String(uploaded.id),
      );
      showToast("success", "Identification document uploaded.");
    },
    [handleNestedChange, showToast, user.id],
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

  // Export profile to PDF
  const handleExportPDF = useCallback(() => {
    exportProfileToPDF(user, form);
    announceToScreenReader("Exporting profile to PDF");
    showToast(
      "success",
      "Profile export initiated. Please use browser's print function to save as PDF.",
    );
  }, [user, form, announceToScreenReader, showToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateProfileForm()) {
      showToast("error", "Please fix validation errors before saving.", {
        title: "Validation Error",
      });
      announceToScreenReader("Please fix validation errors before saving");
      return;
    }

    setIsSaving(true);
    announceToScreenReader("Saving profile changes");

    const payload = {
      profileImage: resolveProfileImageForSave(
        form.profileImage,
        user?.profileImage || user?.profile_image,
      ),
      role: form.role,
      department: form.department,
      manager: form.manager,
      joiningDateBS: form.joiningDateBS,
      dateOfBirth: form.dateOfBirth,
      dobBS: form.dobBS,
      gender: form.gender,
      age: form.age,
      religion: form.religion,
      nationality: form.nationality,
      identification: {
        ...form.identification,
        citizenshipDocument: sanitizeDocumentValue(
          form.identification.citizenshipDocument,
        ),
        nationalIdCardDocument: sanitizeDocumentValue(
          form.identification.nationalIdCardDocument,
        ),
        drivingLicenseDocument: sanitizeDocumentValue(
          form.identification.drivingLicenseDocument,
        ),
        panDocument: sanitizeDocumentValue(form.identification.panDocument),
      },
      familyMembers: form.familyMembers,
      education: form.education.map((item) => ({
        ...item,
        document: sanitizeDocumentValue(item.document),
      })),
      currentAddress: form.currentAddress,
      permanentAddress: form.permanentAddress,
    };

    try {
      const saved = await profileAPI.updateByEmployeeId(user.id, payload);
      setForm(buildInitialForm(user, saved));
      updateCurrentUser({
        profileImage: payload.profileImage,
        department: saved.department,
        manager: saved.manager,
        dobBS: saved.dobBS,
        gender: saved.gender,
        ...(user?.role === "user"
          ? {
              verification_status: "Pending",
              verification_reason: PROFILE_REVIEW_PENDING_REASON,
            }
          : {}),
      });
    } catch (error) {
      setIsSaving(false);
      const backendFieldErrors = getApiValidationErrors(error, {
        "familyMembers.relationship": "familyMember.relationship",
        "familyMembers.name": "familyMember.name",
      });

      if (Object.keys(backendFieldErrors).length > 0) {
        const normalized = {};
        Object.entries(backendFieldErrors).forEach(([key, value]) => {
          normalized[
            key.replace(/familyMembers\.(\d+)\./g, "familyMember.$1.")
          ] = value;
        });
        setErrors((prev) => ({ ...prev, ...normalized }));
      }

      const backendMessage = getApiErrorMessage(
        error,
        "Failed to save profile.",
      );

      showToast("error", backendMessage, {
        title: "Save Failed",
      });
      announceToScreenReader(backendMessage);
      return;
    }

    // Clear draft from localStorage
    localStorage.removeItem(`profile_draft_${user.id}`);

    setHasUnsavedChanges(false);
    setIsSaving(false);
    setShowSuccess(true);
    setLastSaved(new Date());

    // Announce success to screen readers
    announceToScreenReader("Profile saved successfully");
    if (user?.role === "user") {
      showToast("success", "Profile updated and submitted for admin review.", {
        title: "Submitted",
      });
    } else {
      showToast("success", "Profile updated successfully!", {
        title: "Success",
      });
    }
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
        noValidate
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

        {user?.role === "user" &&
          verificationStatus === "Pending" &&
          verificationReason === PROFILE_REVIEW_PENDING_REASON && (
            <div
              className="bg-amber-50 border border-amber-200 rounded-xl p-4"
              role="status"
            >
              <div className="flex items-center gap-2 text-amber-800 font-medium">
                <AlertCircle size={18} aria-hidden="true" />
                Profile submitted for review
              </div>
              <p className="text-sm text-amber-700 mt-1">
                Your profile is locked until admin reviews it.
              </p>
            </div>
          )}

        {user?.role === "user" && verificationStatus === "Approved" && (
          <div
            className="bg-emerald-50 border border-emerald-200 rounded-xl p-4"
            role="status"
          >
            <div className="flex items-center gap-2 text-emerald-800 font-medium">
              <AlertCircle size={18} aria-hidden="true" />
              Profile approved
            </div>
            <p className="text-sm text-emerald-700 mt-1">
              Your latest profile information was approved by admin.
            </p>
          </div>
        )}

        {user?.role === "user" && verificationStatus === "Rejected" && (
          <div
            className="bg-rose-50 border border-rose-200 rounded-xl p-4"
            role="status"
          >
            <div className="flex items-center gap-2 text-rose-800 font-medium">
              <AlertCircle size={18} aria-hidden="true" />
              Profile rejected
            </div>
            <p className="text-sm text-rose-700 mt-1">
              {verificationReason ||
                "Admin rejected your profile update. You can edit and resubmit it."}
            </p>
          </div>
        )}

        <fieldset
          disabled={isProfileLocked}
          className={isProfileLocked ? "space-y-8 opacity-80" : "space-y-8"}
        >
          <ProfileImageSection
            form={form}
            handleImageUpload={handleImageUpload}
            imageCropModal={imageCropModal}
            tempImage={tempImage}
            handleImageCrop={handleImageCrop}
            setImageCropModal={setImageCropModal}
          />

          <EmployeeInfoSection
            form={form}
            handleChange={handleChange}
            managers={managers}
            errors={errors}
          />

          <IdentificationSection
            form={form}
            handleNestedChange={handleNestedChange}
            handleDocumentUpload={handleIdentificationDocUpload}
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
        </fieldset>

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
                  "This will discard all unsaved changes. Continue?",
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
            disabled={isSaving || !hasUnsavedChanges || isProfileLocked}
          >
            Discard Changes
          </button>
          <button
            type="submit"
            disabled={isSaving || isProfileLocked}
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
