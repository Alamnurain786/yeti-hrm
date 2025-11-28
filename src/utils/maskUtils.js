/**
 * Utility function to mask sensitive data for privacy
 * @param {string} value - The value to mask
 * @param {string} type - The type of masking (citizenship, pan, account, passport)
 * @returns {string} Masked value
 */
export const maskSensitiveData = (value, type = "default") => {
  if (!value) return "";

  const visibleChars = {
    citizenship: 3, // Show first 3 chars: "123****89"
    pan: 3, // Show first 3 chars: "123****89"
    account: 4, // Show last 4 chars: "****1234"
    passport: 2, // Show first 2 chars: "AB****89"
    phone: 4, // Show last 4 chars: "******1234"
    default: 2,
  };

  const visible = visibleChars[type] || visibleChars.default;

  switch (type) {
    case "citizenship":
    case "pan":
    case "passport":
      // Show first N characters
      if (value.length <= visible) return value;
      return (
        value.substring(0, visible) +
        "*".repeat(value.length - visible - 2) +
        value.slice(-2)
      );

    case "account":
    case "phone":
      // Show last N characters
      if (value.length <= visible) return value;
      return "*".repeat(value.length - visible) + value.slice(-visible);

    default:
      // Default: show first and last 2 characters
      if (value.length <= 4) return value;
      return (
        value.substring(0, 2) + "*".repeat(value.length - 4) + value.slice(-2)
      );
  }
};

/**
 * Utility function to unmask data (for editing)
 * @param {string} maskedValue - The masked value
 * @param {string} originalValue - The original unmasked value
 * @returns {string} Original value
 */
export const unmaskData = (maskedValue, originalValue) => {
  // If the masked value hasn't changed, return original
  if (maskedValue.includes("*")) {
    return originalValue;
  }
  return maskedValue;
};

/**
 * Component wrapper for masked input field
 */
export const MaskedInput = ({
  value,
  type,
  showUnmasked = false,
  onChange,
  ...props
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [originalValue] = React.useState(value);

  const displayValue =
    isEditing || showUnmasked ? value : maskSensitiveData(value, type);

  const handleFocus = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  return (
    <input
      {...props}
      value={displayValue}
      onChange={onChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      autoComplete="off"
    />
  );
};
