const PHONE_REGEX = /^\+?[0-9][0-9\s-]{6,19}$/;
const TAX_REGEX = /^[A-Z0-9][A-Z0-9/-]{5,19}$/;
const COMPANY_CODE_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const hasValue = (value) => String(value || "").trim().length > 0;

const validateWebsite = (value) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "Website must start with http:// or https://";
    }
    return "";
  } catch {
    return "Enter a valid website URL";
  }
};

export const validateCompanyField = (
  name,
  value,
  { required = false } = {},
) => {
  const trimmed = String(value || "").trim();

  if (required && !trimmed) {
    return "This field is required";
  }

  if (!trimmed) {
    return "";
  }

  switch (name) {
    case "companyCode":
    case "code":
      return COMPANY_CODE_REGEX.test(trimmed)
        ? ""
        : "Use lowercase letters, numbers, and hyphens only";
    case "contactNumber":
    case "adminPhone":
      return PHONE_REGEX.test(trimmed) ? "" : "Enter a valid phone number";
    case "contactEmail":
    case "adminEmail":
      return EMAIL_REGEX.test(trimmed) ? "" : "Enter a valid email address";
    case "panNumber":
      return TAX_REGEX.test(trimmed.toUpperCase())
        ? ""
        : "Use 6-20 letters, numbers, / or -";
    case "website":
      return validateWebsite(trimmed);
    case "adminPassword":
      return trimmed.length >= 8
        ? ""
        : "Password must be at least 8 characters";
    default:
      return "";
  }
};

export const validateCompanyCreateForm = (formData) => {
  const rules = {
    companyName: true,
    companyCode: true,
    address: true,
    contactPersonName: true,
    contactNumber: true,
    contactEmail: false,
    panNumber: true,
    website: false,
    adminName: true,
    adminEmail: true,
    adminPassword: true,
    adminPhone: false,
  };

  return Object.entries(rules).reduce((acc, [field, required]) => {
    const error = validateCompanyField(field, formData[field], { required });
    if (error) acc[field] = error;
    return acc;
  }, {});
};

export const validateCompanyProfileForm = (formData) => {
  const rules = {
    name: true,
    code: true,
    address: true,
    contactPersonName: true,
    contactNumber: true,
    contactEmail: false,
    panNumber: true,
    website: false,
  };

  return Object.entries(rules).reduce((acc, [field, required]) => {
    const error = validateCompanyField(field, formData[field], { required });
    if (error) acc[field] = error;
    return acc;
  }, {});
};

export const hasValidationErrors = (errors) =>
  Object.values(errors || {}).some((value) => hasValue(value));
