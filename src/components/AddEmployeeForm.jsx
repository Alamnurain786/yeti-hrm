/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import {
  X,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
} from "lucide-react";
import {
  departmentAPI,
  deviceAPI,
  getApiErrorMessage,
  getApiValidationErrors,
  positionAPI,
  userAPI,
} from "../services/backendApi";
import { useToast } from "../context/ToastContext";
import NepaliDate from "nepali-date-converter";
import NepaliDatePicker from "./NepaliDatePicker";

const EMPTY_FORM_DATA = {
  name: "",
  email: "",
  phone: "",
  department: "",
  sectionId: "",
  position: "",
  manager: "",
  isSectionManager: false,
  joiningDateBS: "",
  password: "",
  deviceId: "",
  deviceUserId: "",
  mapWithDeviceUser: false,
  createOnDevice: false,
  dobAD: "",
  dobBS: "",
  gender: "Male",
  role: "user",
};

const VALIDATION_RULES = {
  name: {
    required: true,
    test: (val) => val && val.trim().length >= 2,
    message: "Name must be at least 2 characters",
  },
  email: {
    required: true,
    test: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    message: "Invalid email format",
  },
  phone: {
    required: true,
    test: (val) => /^[0-9+\-\s()]{7,}$/.test(val),
    message: "Invalid phone number format",
  },
  department: {
    required: true,
    test: (val) => val.length > 0,
    message: "Department is required",
  },
  position: {
    required: true,
    test: (val) => val.length > 0,
    message: "Position is required",
  },
  joiningDateBS: {
    required: true,
    test: (val) => val.length > 0,
    message: "Joining date is required",
  },
  password: {
    required: true,
    test: (val) => val && val.length >= 8,
    message: "Password must be at least 8 characters",
  },
};

const generateRandomPassword = () => {
  const length = 12;
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

const calculatePasswordStrength = (password) => {
  let strength = 0;
  if (!password) return { score: 0, label: "", color: "bg-gray-200" };
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[!@#$%^&*]/.test(password)) strength++;

  if (strength <= 2)
    return { score: strength, label: "Weak", color: "bg-red-500" };
  if (strength <= 3)
    return { score: strength, label: "Fair", color: "bg-yellow-500" };
  if (strength <= 4)
    return { score: strength, label: "Good", color: "bg-blue-500" };
  return { score: strength, label: "Strong", color: "bg-green-500" };
};

const AddEmployeeForm = ({
  showModal,
  setShowModal,
  onCreated,
  editingEmployee = null,
}) => {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [devices, setDevices] = useState([]);
  const [deviceUsers, setDeviceUsers] = useState([]);
  const [deviceUsersLoading, setDeviceUsersLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [sections, setSections] = useState([]);
  const [positions, setPositions] = useState([]);
  const isEditMode = Boolean(editingEmployee?.id);

  const [formData, setFormData] = useState(EMPTY_FORM_DATA);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [age, setAge] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!showModal) return;
    const loadMeta = async () => {
      try {
        const [deptList, sectionList, usersList, positionList, deviceList] =
          await Promise.all([
            departmentAPI.getAll(),
            departmentAPI.getSections(),
            userAPI.getAll(),
            positionAPI.getAll(),
            deviceAPI.getAll(),
          ]);
        setDepartments(deptList);
        setSections(sectionList);
        setUsers(usersList);
        setPositions(positionList);
        setDevices(Array.isArray(deviceList) ? deviceList : []);
      } catch {
        showToast("error", "Failed to load form data", {
          title: "Load Failed",
        });
      }
    };
    loadMeta();
  }, [showModal, showToast]);

  useEffect(() => {
    if (!showModal || isEditMode) {
      setDeviceUsers([]);
      return;
    }

    if (!formData.deviceId || !formData.mapWithDeviceUser) {
      setDeviceUsers([]);
      return;
    }

    const loadDeviceUsers = async () => {
      setDeviceUsersLoading(true);
      try {
        const rows = await deviceAPI.getUsersFromDb(formData.deviceId);
        setDeviceUsers(Array.isArray(rows) ? rows : []);
      } catch (error) {
        console.error("Failed to load device users:", error);
        setDeviceUsers([]);
      } finally {
        setDeviceUsersLoading(false);
      }
    };

    loadDeviceUsers();
  }, [showModal, isEditMode, formData.deviceId, formData.mapWithDeviceUser]);

  // Initialize form for add/edit mode each time modal opens.
  useEffect(() => {
    if (!showModal) return;

    if (isEditMode) {
      setFormData({
        ...EMPTY_FORM_DATA,
        name: editingEmployee.name || "",
        email: editingEmployee.email || "",
        phone: editingEmployee.phone || "",
        department: editingEmployee.department || "",
        sectionId: editingEmployee.section_id || "",
        position: editingEmployee.position || "",
        manager: editingEmployee.manager || "",
        isSectionManager: Boolean(editingEmployee.is_section_manager),
        joiningDateBS:
          editingEmployee.joiningDateBS ||
          editingEmployee.joining_date_bs ||
          "",
        dobBS: editingEmployee.dobBS || editingEmployee.dob_bs || "",
        dobAD: editingEmployee.dobAD || editingEmployee.dob_ad || "",
        gender: editingEmployee.gender || "Male",
      });
      setErrors({});
      setTouched({});
      setHasChanges(false);
      setAge(null);
      return;
    }

    setFormData({
      ...EMPTY_FORM_DATA,
      password: generateRandomPassword(),
    });
    setErrors({});
    setTouched({});
    setHasChanges(false);
    setDeviceUsers([]);
    setAge(null);
  }, [showModal, isEditMode, editingEmployee]);

  // Auto-calculate Age and AD Date when BS Date changes
  useEffect(() => {
    if (formData.dobBS) {
      try {
        // Parse BS date (format: YYYY-MM-DD)
        const [year, month, day] = formData.dobBS.split("-").map(Number);

        if (year && month && day) {
          // Convert BS to AD
          const nepaliDate = new NepaliDate(year, month - 1, day);
          const adDate = nepaliDate.toJsDate();

          // Set AD date
          const formattedAD = adDate.toISOString().split("T")[0];
          setFormData((prev) => ({ ...prev, dobAD: formattedAD }));

          // Calculate age
          const today = new Date();
          let calculatedAge = today.getFullYear() - adDate.getFullYear();
          const m = today.getMonth() - adDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < adDate.getDate())) {
            calculatedAge--;
          }
          setAge(calculatedAge);
        }
      } catch (e) {
        console.error("Date conversion error", e);
      }
    }
  }, [formData.dobBS]);

  const validateField = (name, value) => {
    const rule = VALIDATION_RULES[name];
    if (!rule) return null;
    if (rule.required && !value) return `${name} is required`;
    if (value && !rule.test(value)) return rule.message;
    return null;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
        ...(name === "department"
          ? { sectionId: "", isSectionManager: false }
          : {}),
        ...(name === "mapWithDeviceUser" && !checked
          ? {
              deviceId: "",
              deviceUserId: "",
              createOnDevice: false,
            }
          : {}),
        ...(name === "deviceId" ? { deviceUserId: "" } : {}),
      };
      return updated;
    });
    setHasChanges(true);

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    const error = validateField(name, value);
    setErrors((prev) => {
      if (error) {
        return { ...prev, [name]: error };
      }
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  };

  const filteredSections = sections.filter(
    (section) => section.department_name === formData.department,
  );

  const managerCandidates = users.filter((u) => {
    const isUserRole = u.role === "user";
    const isSectionManager = Boolean(u.is_section_manager);
    const isManagerByPosition = /manager/i.test(String(u.position || ""));
    return isUserRole && (isSectionManager || isManagerByPosition);
  });

  const validateForm = () => {
    const newErrors = {};
    const fieldsToValidate = isEditMode
      ? ["name", "email", "phone", "department", "position", "joiningDateBS"]
      : [
          "name",
          "email",
          "phone",
          "department",
          "position",
          "joiningDateBS",
          "password",
        ];

    fieldsToValidate.forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast("error", "Please fix validation errors", {
        title: "Validation Error",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let createResult = null;
      if (isEditMode) {
        await userAPI.update(editingEmployee.id, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          department: formData.department,
          section_id: formData.sectionId || null,
          position: formData.position,
          manager: formData.manager || null,
          is_section_manager: Boolean(formData.isSectionManager),
          joining_date_bs: formData.joiningDateBS || null,
          dob_bs: formData.dobBS || null,
          dob_ad: formData.dobAD || null,
          gender: formData.gender || null,
          status: editingEmployee.status || "Active",
        });
      } else {
        createResult = await userAPI.create({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          department: formData.department,
          section_id: formData.sectionId || null,
          position: formData.position,
          manager: formData.manager || null,
          is_section_manager: Boolean(formData.isSectionManager),
          joining_date_bs: formData.joiningDateBS || null,
          dob_bs: formData.dobBS || null,
          dob_ad: formData.dobAD || null,
          gender: formData.gender || null,
          role: "user",
          status: "Active",
          device_id: formData.mapWithDeviceUser
            ? formData.deviceId || null
            : null,
          device_user_id: formData.mapWithDeviceUser
            ? formData.deviceUserId || null
            : null,
          map_with_device_user: Boolean(formData.mapWithDeviceUser),
          create_on_device: Boolean(
            formData.mapWithDeviceUser && formData.createOnDevice,
          ),
        });
      }

      setShowModal(false);
      setFormData(EMPTY_FORM_DATA);
      setErrors({});
      setTouched({});
      setHasChanges(false);
      setAge(null);
      if (isEditMode) {
        showToast("success", "Employee updated successfully!", {
          title: "Employee Updated",
        });
      } else {
        const emailSent = Boolean(createResult?.email_sent);
        const emailError = String(createResult?.email_error || "").trim();
        if (emailSent) {
          showToast("success", "Employee created + credentials email sent", {
            title: "Employee Added",
          });
        } else {
          showToast(
            "info",
            emailError
              ? `Employee created + email failed: ${emailError}`
              : "Employee created + credentials email failed",
            {
              title: "Employee Added",
            },
          );
        }
      }
      if (onCreated) {
        await onCreated();
      }
    } catch (error) {
      const validationErrors = getApiValidationErrors(error, {
        joining_date_bs: "joiningDateBS",
        dob_bs: "dobBS",
        dob_ad: "dobAD",
        section_id: "sectionId",
        device_id: "deviceId",
        device_user_id: "deviceUserId",
        is_section_manager: "isSectionManager",
      });

      if (Object.keys(validationErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...validationErrors }));
        setTouched((prev) => ({
          ...prev,
          ...Object.keys(validationErrors).reduce((acc, key) => {
            acc[key] = true;
            return acc;
          }, {}),
        }));
      }

      showToast(
        "error",
        getApiErrorMessage(
          error,
          isEditMode ? "Failed to update employee" : "Failed to add employee",
        ),
        {
          title: isEditMode ? "Update Failed" : "Create Failed",
        },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGeneratePassword = () => {
    const newPassword = generateRandomPassword();
    setFormData((prev) => ({ ...prev, password: newPassword }));
    setHasChanges(true);
  };

  const handleClose = () => {
    if (hasChanges) {
      showToast("info", "You have unsaved changes in this form.", {
        title: "Unsaved Changes",
        duration: 6000,
        actions: [
          {
            label: "Discard",
            variant: "danger",
            onClick: () => {
              setShowModal(false);
              setFormData(EMPTY_FORM_DATA);
              setErrors({});
              setTouched({});
              setHasChanges(false);
              setAge(null);
            },
          },
          {
            label: "Keep Editing",
            onClick: () => {},
          },
        ],
      });
      return;
    }

    setShowModal(false);
    setFormData(EMPTY_FORM_DATA);
    setErrors({});
    setTouched({});
    setHasChanges(false);
  };

  const passwordStrength = calculatePasswordStrength(formData.password);

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {isEditMode ? "Edit Employee" : "Add New Employee"}
            </h2>
            {!isEditMode && (
              <p className="text-sm text-slate-500 mt-1">
                Required fields are marked with{" "}
                <span className="text-red-500">*</span>
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form noValidate onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Information Section */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-3 border-b border-slate-200">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-2.5 rounded-xl border transition-colors outline-none ${
                    errors.name && touched.name
                      ? "border-red-500 bg-red-50"
                      : "border-slate-200 focus:border-blue-500"
                  }`}
                  placeholder="Enter full name"
                  required
                />
                {errors.name && touched.name && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle size={14} className="mr-1" /> {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-2.5 rounded-xl border transition-colors outline-none ${
                    errors.email && touched.email
                      ? "border-red-500 bg-red-50"
                      : "border-slate-200 focus:border-blue-500"
                  }`}
                  placeholder="Enter email address"
                  required
                />
                {errors.email && touched.email && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle size={14} className="mr-1" /> {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-2.5 rounded-xl border transition-colors outline-none ${
                    errors.phone && touched.phone
                      ? "border-red-500 bg-red-50"
                      : "border-slate-200 focus:border-blue-500"
                  }`}
                  placeholder="+977-9814xxxxx or 9814xxxxx"
                  required
                />
                {errors.phone && touched.phone && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle size={14} className="mr-1" /> {errors.phone}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none transition-colors"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Date of Birth (BS)
                </label>
                <NepaliDatePicker
                  value={formData.dobBS}
                  onChange={(bsDate) => {
                    setFormData({ ...formData, dobBS: bsDate });
                    setHasChanges(true);
                  }}
                  placeholder="जन्म मिति छान्नुहोस्"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Nepali calendar date
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Date of Birth (AD)
                </label>
                <input
                  type="text"
                  name="dobAD"
                  value={formData.dobAD}
                  readOnly
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-1">Auto-calculated</p>
              </div>

              {age !== null && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Age
                  </label>
                  <input
                    type="text"
                    value={`${age} years`}
                    readOnly
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed font-medium"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Employment Information Section */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-3 border-b border-slate-200">
              Employment Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-2.5 rounded-xl border transition-colors outline-none ${
                    errors.department && touched.department
                      ? "border-red-500 bg-red-50"
                      : "border-slate-200 focus:border-blue-500"
                  }`}
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => {
                    const deptName = typeof d === "string" ? d : d.name;
                    return (
                      <option key={deptName} value={deptName}>
                        {deptName}
                      </option>
                    );
                  })}
                </select>
                {errors.department && touched.department && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle size={14} className="mr-1" />{" "}
                    {errors.department}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Section
                </label>
                <select
                  name="sectionId"
                  value={formData.sectionId}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none transition-colors disabled:bg-slate-50 disabled:text-slate-500"
                  disabled={!formData.department}
                >
                  <option value="">
                    {formData.department
                      ? "Select Section (Optional)"
                      : "Select Department First"}
                  </option>
                  {filteredSections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Position <span className="text-red-500">*</span>
                </label>
                <select
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-2.5 rounded-xl border transition-colors outline-none ${
                    errors.position && touched.position
                      ? "border-red-500 bg-red-50"
                      : "border-slate-200 focus:border-blue-500"
                  }`}
                  required
                >
                  <option value="">Select Position</option>
                  {formData.position &&
                    !positions.some((p) => p.name === formData.position) && (
                      <option value={formData.position}>
                        {formData.position}
                      </option>
                    )}
                  {positions.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {errors.position && touched.position && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle size={14} className="mr-1" /> {errors.position}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Reporting Manager
                </label>
                <select
                  name="manager"
                  value={formData.manager}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none transition-colors"
                >
                  <option value="">Select Manager (Optional)</option>
                  {formData.manager &&
                    !users.some(
                      (u) =>
                        u.name === formData.manager &&
                        u.role === "user" &&
                        (Boolean(u.is_section_manager) ||
                          /manager/i.test(String(u.position || ""))),
                    ) && (
                      <option value={formData.manager}>
                        {formData.manager}
                      </option>
                    )}
                  {managerCandidates.map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name}
                      {u.is_section_manager
                        ? " (Section Manager)"
                        : u.position
                          ? ` (${u.position})`
                          : ""}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Shows employee managers and section managers only
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Joining Date (BS) <span className="text-red-500">*</span>
                </label>
                <NepaliDatePicker
                  value={formData.joiningDateBS}
                  onChange={(bsDate) => {
                    setFormData({ ...formData, joiningDateBS: bsDate });
                    setHasChanges(true);
                    if (touched.joiningDateBS && errors.joiningDateBS) {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.joiningDateBS;
                        return newErrors;
                      });
                    }
                  }}
                  onBlur={() =>
                    setTouched((prev) => ({ ...prev, joiningDateBS: true }))
                  }
                  placeholder="भर्ना मिति छान्नुहोस्"
                />
                {errors.joiningDateBS && touched.joiningDateBS && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle size={14} className="mr-1" />{" "}
                    {errors.joiningDateBS}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    name="isSectionManager"
                    checked={formData.isSectionManager}
                    onChange={handleChange}
                    disabled={!formData.sectionId}
                    className="cursor-pointer"
                  />
                  <span>
                    Mark as section manager for{" "}
                    {formData.sectionId ? "selected section" : "a section"}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Password Section (Create Mode Only) */}
          {!isEditMode && (
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-3 border-b border-slate-200">
                Authentication
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full px-4 py-2.5 rounded-xl border transition-colors outline-none font-mono text-sm ${
                          errors.password && touched.password
                            ? "border-red-500 bg-red-50"
                            : "border-slate-200 focus:border-blue-500"
                        }`}
                        required
                      />
                      {errors.password && touched.password && (
                        <p className="text-red-500 text-xs mt-1 flex items-center">
                          <AlertCircle size={14} className="mr-1" />{" "}
                          {errors.password}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-slate-600"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-slate-600"
                      title="Generate new password"
                    >
                      <RefreshCw size={18} />
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-600">
                          Strength:
                        </span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`flex-1 rounded-full transition-colors ${
                                i < passwordStrength.score
                                  ? passwordStrength.color
                                  : "bg-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                        <span
                          className={`text-xs font-medium ${
                            passwordStrength.color === "bg-red-500"
                              ? "text-red-600"
                              : passwordStrength.color === "bg-yellow-500"
                                ? "text-yellow-600"
                                : passwordStrength.color === "bg-blue-500"
                                  ? "text-blue-600"
                                  : "text-green-600"
                          }`}
                        >
                          {passwordStrength.label}
                        </span>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-slate-500 mt-2">
                    Auto-generated or enter custom. At least 8 characters
                    recommended.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Device Mapping Section (Create Mode Only) */}
          {!isEditMode && (
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-3 border-b border-slate-200">
                Device Mapping{" "}
                <span className="text-sm font-normal text-slate-500">
                  (Optional)
                </span>
              </h3>
              <div className="space-y-3 rounded-xl border border-slate-200 p-4 bg-slate-50">
                <label className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer hover:text-slate-900 transition-colors">
                  <input
                    type="checkbox"
                    name="mapWithDeviceUser"
                    checked={formData.mapWithDeviceUser}
                    onChange={handleChange}
                    className="cursor-pointer"
                  />
                  <span>Map this employee with a biometric device user</span>
                </label>

                {formData.mapWithDeviceUser && (
                  <div className="space-y-4 mt-4 pt-4 border-t border-slate-200">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Device
                      </label>
                      <select
                        name="deviceId"
                        value={formData.deviceId}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none transition-colors"
                      >
                        <option value="">Select Device</option>
                        {devices.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.id})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Device User ID{" "}
                        {deviceUsersLoading && (
                          <span className="text-xs text-slate-500 italic">
                            (Loading...)
                          </span>
                        )}
                      </label>
                      <input
                        list="device-user-options"
                        name="deviceUserId"
                        value={formData.deviceUserId}
                        onChange={handleChange}
                        placeholder="Select existing or type new ID"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none transition-colors"
                        disabled={deviceUsersLoading}
                      />
                      <datalist id="device-user-options">
                        {deviceUsers.map((du) => (
                          <option
                            key={du.zkt_user_id}
                            value={du.zkt_user_id}
                            label={`${du.name ? `${du.name} (${du.zkt_user_id})` : du.zkt_user_id}`}
                          />
                        ))}
                      </datalist>
                      <p className="text-xs text-slate-500 mt-1">
                        Existing device users are suggested from synced records.
                      </p>
                    </div>

                    <label className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer hover:text-slate-900 transition-colors">
                      <input
                        type="checkbox"
                        name="createOnDevice"
                        checked={formData.createOnDevice}
                        onChange={handleChange}
                        disabled={!formData.deviceId}
                        className="cursor-pointer"
                      />
                      <span>Create on device if not found</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-6 flex justify-end space-x-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl flex items-center transition-colors shadow-lg shadow-blue-600/30 font-medium"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={18} className="mr-2 animate-spin" />
                  {isEditMode ? "Updating..." : "Saving..."}
                </>
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  {isEditMode ? "Update Employee" : "Save Employee"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployeeForm;
