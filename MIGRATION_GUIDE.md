# 🔄 Migration Guide - Upgrading to Advanced Profile System

## Overview

This guide helps developers integrate the new advanced profile features into existing projects or upgrade from the basic version.

## Prerequisites

- React 18+
- Node.js 16+
- npm or yarn
- Basic understanding of React hooks

## Installation Steps

### Step 1: Install Dependencies

```bash
npm install prop-types
```

### Step 2: Copy New Files

Copy these directories and files to your project:

```
src/
├── hooks/
│   ├── useProfileForm.js           ✨ NEW
│   ├── useValidation.js            ✨ NEW
│   ├── useFamilyMembers.js         ✨ NEW
│   ├── useEducation.js             ✨ NEW
│   ├── useDebounce.js              ✨ NEW
│   ├── useUnsavedChanges.js        ✨ NEW
│   ├── useAutoSave.js              ✨ NEW
│   └── useMobileHelpers.js         ✨ NEW
│
├── components/
│   ├── ProfileProgress.jsx         ✨ NEW
│   ├── SuccessAnimation.jsx        ✨ NEW
│   ├── ProfileCompletenessBadge.jsx ✨ NEW
│   └── DocumentPreviewModal.jsx    ✨ NEW
│
└── utils/
    ├── maskUtils.js                ✨ NEW
    └── pdfExport.js                ✨ NEW
```

### Step 3: Update index.css

Add these styles to your `src/index.css`:

```css
/* Screen reader only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Print styles */
@media print {
  .no-print,
  button,
  nav,
  header,
  .sidebar {
    display: none !important;
  }
  body {
    background: white;
    color: black;
  }
  .bg-white {
    page-break-inside: avoid;
  }
  .shadow-sm,
  .shadow-lg,
  .shadow-xl {
    box-shadow: none !important;
  }
}
```

## Migrating Existing Profile Component

### Before (Old Version)

```jsx
const Profile = () => {
  const [form, setForm] = useState(initialData);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Save logic
  };

  return <form onSubmit={handleSubmit}>{/* Form fields */}</form>;
};
```

### After (New Version)

```jsx
import { useProfileForm } from "../hooks/useProfileForm";
import { useValidation } from "../hooks/useValidation";
import { useFamilyMembers } from "../hooks/useFamilyMembers";
import { useEducation } from "../hooks/useEducation";
import ProfileCompletenessBadge from "../components/ProfileCompletenessBadge";
import DocumentPreviewModal from "../components/DocumentPreviewModal";
import { exportProfileToPDF } from "../utils/pdfExport";

const Profile = () => {
  const { user } = useAuth();

  // Use custom hooks
  const {
    form,
    setForm,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    handleChange,
    handleNestedChange,
    handleImageUpload,
  } = useProfileForm(user);

  const { validationErrors, validateForm } = useValidation(form);
  const familyHandlers = useFamilyMembers(setForm, setHasUnsavedChanges);
  const educationHandlers = useEducation(setForm, setHasUnsavedChanges);

  // ARIA announcements
  const [ariaMessage, setAriaMessage] = useState("");
  const announce = (msg) => {
    setAriaMessage(msg);
    setTimeout(() => setAriaMessage(""), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      announce("Form has errors. Please review and correct.");
      return;
    }

    // Save logic
    announce("Profile saved successfully");
  };

  return (
    <>
      {/* ARIA Live Region */}
      <div role="status" aria-live="polite" className="sr-only">
        {ariaMessage}
      </div>

      <form onSubmit={handleSubmit} aria-label="Employee profile form">
        {/* Completeness Badge */}
        <ProfileCompletenessBadge form={form} />

        {/* Export PDF Button */}
        <button
          type="button"
          onClick={() => exportProfileToPDF(user, form)}
          aria-label="Export profile to PDF"
        >
          Export PDF
        </button>

        {/* Form fields with improved accessibility */}
        {/* ... */}
      </form>
    </>
  );
};
```

## Step-by-Step Feature Integration

### 1. Add Form Management Hook

```jsx
// Before
const [form, setForm] = useState(initialData);
const handleChange = (field, value) => {
  setForm((prev) => ({ ...prev, [field]: value }));
};

// After
import { useProfileForm } from "../hooks/useProfileForm";
const { form, handleChange, handleNestedChange, hasUnsavedChanges } =
  useProfileForm(initialData);
```

### 2. Add Validation Hook

```jsx
// Before
const validateForm = () => {
  const errors = {};
  if (!form.email) errors.email = "Required";
  return Object.keys(errors).length === 0;
};

// After
import { useValidation } from "../hooks/useValidation";
const { validationErrors, validateForm } = useValidation(form);
```

### 3. Add Family Members Hook

```jsx
// Before
const addFamily = () => {
  setForm((prev) => ({
    ...prev,
    familyMembers: [...prev.familyMembers, newMember],
  }));
};

// After
import { useFamilyMembers } from "../hooks/useFamilyMembers";
const { addFamilyMember, removeFamilyMember } = useFamilyMembers(
  setForm,
  setHasUnsavedChanges
);
```

### 4. Add Completeness Badge

```jsx
import ProfileCompletenessBadge from "../components/ProfileCompletenessBadge";

// In your render
<ProfileCompletenessBadge form={form} />;
```

### 5. Add Document Preview

```jsx
import DocumentPreviewModal from "../components/DocumentPreviewModal";

const [preview, setPreview] = useState(null);
const [previewTitle, setPreviewTitle] = useState("");

// In your render
{
  preview && (
    <DocumentPreviewModal
      document={preview}
      title={previewTitle}
      onClose={() => setPreview(null)}
    />
  );
}

// To preview a document
<button
  onClick={() => {
    setPreview(documentURL);
    setPreviewTitle("Document Name");
  }}
>
  Preview
</button>;
```

### 6. Add Field Masking

```jsx
import { maskSensitiveData } from "../utils/maskUtils";

// In your render
<input
  value={maskSensitiveData(form.citizenship, "citizenship")}
  onFocus={(e) => (e.target.value = form.citizenship)}
  onBlur={(e) =>
    (e.target.value = maskSensitiveData(form.citizenship, "citizenship"))
  }
/>;
```

### 7. Add PDF Export

```jsx
import { exportProfileToPDF } from "../utils/pdfExport";

// In your render
<button onClick={() => exportProfileToPDF(user, form)}>Export PDF</button>;
```

### 8. Add Mobile Support

```jsx
import { useIsMobile, useSwipeGesture } from "../hooks/useMobileHelpers";

const { isMobile } = useIsMobile();
const swipeHandlers = useSwipeGesture(onDelete, null);

// Conditional rendering
{
  isMobile ? <MobileView /> : <DesktopView />;
}

// Swipeable item
<div {...swipeHandlers}>Swipeable</div>;
```

### 9. Add ARIA Support

```jsx
// Add ARIA labels
<button aria-label="Save changes">Save</button>

// Add ARIA live region
<div role="status" aria-live="polite" className="sr-only">
  {statusMessage}
</div>

// Add ARIA to form
<form aria-label="Employee profile form">

// Add ARIA to alerts
<div role="alert" aria-live="assertive">
  Error message
</div>
```

### 10. Add PropTypes

```jsx
import PropTypes from "prop-types";

const MyComponent = ({ form, onChange }) => {
  // Component logic
};

MyComponent.propTypes = {
  form: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default MyComponent;
```

## Common Migration Issues

### Issue 1: Hook Dependencies

**Problem**: Hooks show stale data

**Solution**: Ensure dependencies are correct

```jsx
// Bad
useEffect(() => {
  validateForm();
}, []); // Missing dependency

// Good
useEffect(() => {
  validateForm();
}, [validateForm, form]);
```

### Issue 2: Infinite Loops

**Problem**: Too many re-renders

**Solution**: Use useCallback properly

```jsx
// Bad
const handleChange = (field, value) => {
  setForm({ ...form, [field]: value });
};

// Good
const handleChange = useCallback((field, value) => {
  setForm((prev) => ({ ...prev, [field]: value }));
}, []);
```

### Issue 3: PropTypes Warnings

**Problem**: Console warnings about props

**Solution**: Define all prop types

```jsx
Component.propTypes = {
  // Define all props
  form: PropTypes.object.isRequired,
  onChange: PropTypes.func,
  children: PropTypes.node,
};

Component.defaultProps = {
  onChange: () => {},
  children: null,
};
```

## Breaking Changes

### 1. Form State Structure

Old structure may not work with new hooks. Update your form structure to match:

```jsx
const form = {
  profileImage: "",
  identification: {
    citizenshipNo: "",
    panNo: "",
    // ...
  },
  familyMembers: [],
  education: [],
  currentAddress: {},
  permanentAddress: {},
};
```

### 2. Handler Signatures

Some handlers have new signatures:

```jsx
// Old
onChange(value, field);

// New
onChange(field, value);
```

### 3. Validation Returns

```jsx
// Old
const isValid = validateForm(); // returns boolean

// New
const { validationErrors, validateForm } = useValidation(form);
const isValid = validateForm(); // still returns boolean
```

## Testing After Migration

1. **Functionality Test**

   - [ ] All form fields work
   - [ ] Validation works
   - [ ] Submission works
   - [ ] Auto-save works

2. **Accessibility Test**

   - [ ] Keyboard navigation
   - [ ] Screen reader
   - [ ] ARIA announcements

3. **Mobile Test**

   - [ ] Responsive layout
   - [ ] Touch gestures
   - [ ] Mobile validation

4. **Performance Test**
   - [ ] No console errors
   - [ ] No re-render issues
   - [ ] Smooth interactions

## Rollback Plan

If issues occur, you can rollback:

1. Keep old component as backup
2. Use feature flags for gradual rollout
3. Test in staging first
4. Monitor console for errors

## Support

- Check `QUICK_REFERENCE.md` for usage examples
- Read `ADVANCED_IMPROVEMENTS.md` for details
- Review `TESTING_CHECKLIST.md` for testing
- See `ARCHITECTURE.md` for system design

## Next Steps

After successful migration:

1. Remove old code
2. Update tests
3. Update documentation
4. Train team members
5. Monitor production

---

**Migration Difficulty**: Medium  
**Estimated Time**: 2-4 hours  
**Risk Level**: Low (backward compatible)  
**Rollback Time**: < 30 minutes
