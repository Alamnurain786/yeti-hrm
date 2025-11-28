import { useState, useCallback, useEffect } from "react";
import { useDebounce } from "./useDebounce";

/**
 * Custom hook for form validation with debouncing
 * @param {object} form - Form data to validate
 * @param {number} debounceDelay - Delay for debouncing (default: 500ms)
 * @returns {object} Validation state and methods
 */
export const useValidation = (form, debounceDelay = 500) => {
  const [validationErrors, setValidationErrors] = useState({});
  const debouncedForm = useDebounce(form, debounceDelay);

  const validateField = useCallback((fieldName, value, rules) => {
    const errors = [];

    if (rules.required && !value) {
      errors.push(`${fieldName} is required`);
    }

    if (rules.email && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors.push("Invalid email format");
      }
    }

    if (rules.mobile && value) {
      const mobileRegex = /^\d{10}$/;
      if (!mobileRegex.test(value)) {
        errors.push("Mobile number must be 10 digits");
      }
    }

    if (rules.minLength && value && value.length < rules.minLength) {
      errors.push(`Minimum ${rules.minLength} characters required`);
    }

    if (rules.maxLength && value && value.length > rules.maxLength) {
      errors.push(`Maximum ${rules.maxLength} characters allowed`);
    }

    if (rules.pattern && value && !rules.pattern.test(value)) {
      errors.push(rules.patternMessage || "Invalid format");
    }

    return errors;
  }, []);

  const validateForm = useCallback(() => {
    const errors = {};

    // Email validation
    if (form.email) {
      const emailErrors = validateField("Email", form.email, { email: true });
      if (emailErrors.length > 0) errors.email = emailErrors[0];
    }

    // Phone validation
    if (form.phone) {
      const phoneErrors = validateField("Phone", form.phone, { mobile: true });
      if (phoneErrors.length > 0) errors.phone = phoneErrors[0];
    }

    // Citizenship validation
    if (
      form.identification?.citizenshipNo &&
      form.identification.citizenshipNo.length > 0
    ) {
      const citizenshipErrors = validateField(
        "Citizenship Number",
        form.identification.citizenshipNo,
        { minLength: 5 }
      );
      if (citizenshipErrors.length > 0)
        errors.citizenshipNo = citizenshipErrors[0];
    }

    // PAN validation
    if (form.identification?.panNo && form.identification.panNo.length > 0) {
      const panErrors = validateField("PAN Number", form.identification.panNo, {
        pattern: /^\d{9}$/,
        patternMessage: "PAN must be 9 digits",
      });
      if (panErrors.length > 0) errors.panNo = panErrors[0];
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [form, validateField]);

  // Real-time validation with debouncing
  useEffect(() => {
    if (debouncedForm) {
      validateForm();
    }
  }, [debouncedForm, validateForm]);

  const clearError = useCallback((fieldName) => {
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setValidationErrors({});
  }, []);

  return {
    validationErrors,
    setValidationErrors,
    validateForm,
    validateField,
    clearError,
    clearAllErrors,
  };
};
