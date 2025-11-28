# Quick Reference Guide - Advanced Profile Features

## 🚀 Quick Start

### Using Custom Hooks

```jsx
// 1. Form Management
import { useProfileForm } from "../hooks/useProfileForm";

const {
  form, // Current form state
  handleChange, // Update simple fields
  handleNestedChange, // Update nested objects
  handleImageUpload, // Handle profile image
  hasUnsavedChanges, // Track if form is dirty
  resetForm, // Reset to initial state
} = useProfileForm(initialData);

// 2. Validation
import { useValidation } from "../hooks/useValidation";

const {
  validationErrors, // Object with field errors
  validateForm, // Validate entire form
  validateField, // Validate single field
  clearError, // Clear specific error
  clearAllErrors, // Clear all errors
} = useValidation(form, 500); // 500ms debounce

// 3. Family Members
import { useFamilyMembers } from "../hooks/useFamilyMembers";

const {
  addFamilyMember, // Add one member
  removeFamilyMember, // Remove by ID
  updateFamilyMember, // Update specific field
  addBulkFamilyMembers, // Add multiple at once
} = useFamilyMembers(setForm, setHasUnsavedChanges);

// 4. Education
import { useEducation } from "../hooks/useEducation";

const {
  addEducation, // Add one entry
  removeEducation, // Remove by ID
  updateEducation, // Update specific field
  handleEducationDocUpload, // Upload document
  addBulkEducation, // Add multiple at once
} = useEducation(setForm, setHasUnsavedChanges);
```

### Mobile Helpers

```jsx
import {
  useSwipeGesture,
  useIsMobile,
  useMobileValidation,
  useMobileFilePicker,
} from "../hooks/useMobileHelpers";

// Swipe Detection
const swipeHandlers = useSwipeGesture(
  () => console.log("Left swipe - delete"),
  () => console.log("Right swipe - cancel")
);

<div {...swipeHandlers}>Swipeable Item</div>;

// Device Detection
const { isMobile, isTablet, isDesktop } = useIsMobile();

// Mobile Validation
const { displayMobileErrors } = useMobileValidation(isMobile);
displayMobileErrors({ email: "Invalid email" });

// Mobile File Picker
const { openFilePicker } = useMobileFilePicker();
const file = await openFilePicker("image/*");
```

## 🎨 UI Components

### Profile Completeness Badge

```jsx
import ProfileCompletenessBadge from "../components/ProfileCompletenessBadge";

<ProfileCompletenessBadge form={form} />;
```

**Colors**:

- 🟢 Green (100%): Complete
- 🔵 Blue (75-99%): Almost Done
- 🟡 Yellow (50-74%): In Progress
- 🔴 Red (0-49%): Just Started

### Document Preview Modal

```jsx
import DocumentPreviewModal from '../components/DocumentPreviewModal';

const [preview, setPreview] = useState(null);

<DocumentPreviewModal
  document={preview}
  title="Citizenship Document"
  onClose={() => setPreview(null)}
/>

// Open preview
<button onClick={() => setPreview(documentURL)}>
  View Document
</button>
```

## 🔒 Security Features

### Field Masking

```jsx
import { maskSensitiveData, MaskedInput } from "../utils/maskUtils";

// Direct masking
const masked = maskSensitiveData("1234567890", "citizenship");
// Result: "123****890"

// Masked Input Component
<MaskedInput
  value={form.identification.panNo}
  type="pan"
  showUnmasked={false}
  onChange={(e) => handleChange("panNo", e.target.value)}
  className="input-class"
/>;
```

**Mask Types**:

- `citizenship`: Shows first 3 and last 2
- `pan`: Shows first 3 and last 2
- `account`: Shows last 4
- `passport`: Shows first 2 and last 2
- `phone`: Shows last 4

## 📄 PDF Export

```jsx
import { exportProfileToPDF } from "../utils/pdfExport";

<button onClick={() => exportProfileToPDF(user, form)}>
  <FileDown size={16} />
  Export PDF
</button>;
```

## ♿ Accessibility

### ARIA Live Announcements

```jsx
const [ariaMessage, setAriaMessage] = useState("");

const announce = (message) => {
  setAriaMessage(message);
  setTimeout(() => setAriaMessage(""), 3000);
};

// Screen reader only div
<div role="status" aria-live="polite" className="sr-only">
  {ariaMessage}
</div>;

// Use it
announce("Profile saved successfully");
```

### Keyboard Navigation

```jsx
// Auto-focus first error
const firstError = Object.keys(errors)[0];
const errorElement = document.querySelector(
  `[name="${firstError}"], [data-error-field="${firstError}"]`
);
if (errorElement) {
  errorElement.focus();
  errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
}
```

### ARIA Labels

```jsx
// Form
<form aria-label="Employee profile form">

// Buttons
<button aria-label="Save profile changes" aria-busy={isSaving}>

// Alerts
<div role="alert" aria-live="assertive">
  Error message
</div>

// Status
<div role="status" aria-label="Profile 80% complete">
```

## 🎯 Common Patterns

### Complete Form Setup

```jsx
import { useState, useCallback } from "react";
import { useProfileForm } from "../hooks/useProfileForm";
import { useValidation } from "../hooks/useValidation";
import { useFamilyMembers } from "../hooks/useFamilyMembers";
import { useEducation } from "../hooks/useEducation";
import { useIsMobile } from "../hooks/useMobileHelpers";
import { exportProfileToPDF } from "../utils/pdfExport";
import ProfileCompletenessBadge from "../components/ProfileCompletenessBadge";

const ProfilePage = () => {
  const { user } = useAuth();

  // Form management
  const {
    form,
    setForm,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    handleChange,
    handleNestedChange,
    handleImageUpload,
    resetForm,
  } = useProfileForm(user);

  // Validation
  const { validationErrors, validateForm, clearError } = useValidation(form);

  // Family & Education
  const familyHandlers = useFamilyMembers(setForm, setHasUnsavedChanges);
  const educationHandlers = useEducation(setForm, setHasUnsavedChanges);

  // Mobile
  const { isMobile } = useIsMobile();

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Save logic
    await saveProfile(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <ProfileCompletenessBadge form={form} />
      <button onClick={() => exportProfileToPDF(user, form)}>Export PDF</button>
      {/* Form fields */}
    </form>
  );
};
```

### Swipeable List Item

```jsx
import { useSwipeGesture } from "../hooks/useMobileHelpers";

const SwipeableItem = ({ item, onDelete }) => {
  const swipeHandlers = useSwipeGesture(
    () => onDelete(item.id), // Left swipe = delete
    null, // Right swipe = nothing
    100 // 100px threshold
  );

  return (
    <div {...swipeHandlers} className="swipeable-item">
      {item.name}
    </div>
  );
};
```

### Mobile-Optimized Validation

```jsx
import { useIsMobile, useMobileValidation } from "../hooks/useMobileHelpers";

const MyForm = () => {
  const { isMobile } = useIsMobile();
  const { showMobileErrors, mobileErrorList, displayMobileErrors } =
    useMobileValidation(isMobile);

  const handleSubmit = () => {
    const errors = validateForm();

    if (isMobile) {
      displayMobileErrors(errors);
    } else {
      setInlineErrors(errors);
    }
  };

  return (
    <>
      {showMobileErrors && (
        <div className="mobile-error-toast">
          {mobileErrorList.map((err) => (
            <div key={err.field}>{err.message}</div>
          ))}
        </div>
      )}
      {/* Form */}
    </>
  );
};
```

## 📊 PropTypes Example

```jsx
import PropTypes from "prop-types";

const MyComponent = ({ user, onSave, settings }) => {
  // Component logic
};

MyComponent.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    email: PropTypes.string,
  }).isRequired,
  onSave: PropTypes.func.isRequired,
  settings: PropTypes.object,
};

MyComponent.defaultProps = {
  settings: {},
};

export default MyComponent;
```

## 🎨 Print Optimization

Add `no-print` class to elements you don't want printed:

```jsx
<nav className="sidebar no-print">
  Navigation
</nav>

<button className="no-print">
  Save
</button>
```

## 📱 Responsive Design

```jsx
const { isMobile, isTablet, isDesktop, screenWidth } = useIsMobile();

return (
  <div>
    {isMobile && <MobileView />}
    {isTablet && <TabletView />}
    {isDesktop && <DesktopView />}

    {screenWidth < 640 && <ExtraSmallView />}
  </div>
);
```

## 🔧 Validation Rules

```jsx
const { validateField } = useValidation(form);

// Email validation
validateField("Email", email, { email: true });

// Mobile validation
validateField("Phone", phone, { mobile: true });

// Required field
validateField("Name", name, { required: true });

// Length validation
validateField("Password", password, {
  minLength: 8,
  maxLength: 20,
});

// Custom pattern
validateField("PAN", pan, {
  pattern: /^\d{9}$/,
  patternMessage: "PAN must be 9 digits",
});
```

## 💡 Tips & Best Practices

### Performance

- Use `useCallback` for event handlers
- Debounce validation (500ms is good default)
- Memoize expensive calculations
- Use React.memo for components

### Accessibility

- Always add aria-labels to buttons
- Use semantic HTML (`<button>`, `<form>`, etc.)
- Ensure keyboard navigation works
- Test with screen reader

### Mobile

- Use touch-friendly button sizes (min 44x44px)
- Optimize for vertical scrolling
- Test on actual devices
- Consider network conditions

### Security

- Always mask sensitive data
- Validate on both client and server
- Never store passwords in plain text
- Use HTTPS in production

---

**Need Help?** Check `ADVANCED_IMPROVEMENTS.md` for detailed documentation.
