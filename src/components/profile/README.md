# Profile Components - Modular Structure

This directory contains reusable components for the Profile page, making it cleaner and easier to maintain.

## Components Created

### 1. `EmployeeInfoSection.jsx`

- Displays employee information fields
- Includes HR-managed read-only fields (Role, Department, Manager, Joining Date)
- Includes user-editable fields (DOB with Nepali calendar, Religion, Nationality)
- Auto-calculates age from Date of Birth

**Props:**

- `form` - Form state object
- `handleChange` - Function to handle form changes

### 2. `IdentificationSection.jsx`

- Handles all identification documents
- Includes Nepali calendar date pickers for document issue dates
- Document upload functionality for Citizenship, National ID, Driving License, PAN
- Validation error display

**Props:**

- `form` - Form state object
- `handleNestedChange` - Function to handle nested object changes
- `errors` - Validation errors object

## Usage Example in Profile.jsx

```jsx
import EmployeeInfoSection from "../components/profile/EmployeeInfoSection";
import IdentificationSection from "../components/profile/IdentificationSection";

// Inside Profile component:
<div className="space-y-6">
  {/* Profile Image Section */}
  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
    {/* ... existing profile image code ... */}
  </div>

  {/* Employee Information - Now Modular */}
  <EmployeeInfoSection form={form} handleChange={handleChange} />

  {/* Identification Details - Now Modular */}
  <IdentificationSection
    form={form}
    handleNestedChange={handleNestedChange}
    errors={errors}
  />

  {/* Family Details Section */}
  {/* ... existing family details code ... */}

  {/* Education Section */}
  {/* ... existing education code ... */}

  {/* Address Sections */}
  {/* ... existing address code ... */}
</div>;
```

## Benefits

1. **Cleaner Code**: Main Profile.jsx file is much shorter and easier to read
2. **Reusability**: Components can be reused in other pages (e.g., Employee Details, Admin Panel)
3. **Easier Maintenance**: Changes to a section only require editing one component
4. **Better Organization**: Related functionality is grouped together
5. **Testing**: Each component can be tested independently

## Future Improvements

All components have been created! The Profile page is now fully modularized:

### All 6 Components Complete:

1. ✅ `ProfileImageSection.jsx` - Profile picture upload and crop
2. ✅ `EmployeeInfoSection.jsx` - Employee information
3. ✅ `IdentificationSection.jsx` - Government IDs and documents
4. ✅ `FamilyDetailsSection.jsx` - Family members table
5. ✅ `EducationSection.jsx` - Education entries with documents
6. ✅ `AddressSection.jsx` - Current and permanent addresses

### Additional Components Reference:

#### 3. `FamilyDetailsSection.jsx`

**Props:**

- `familyMembers` - Array of family member objects
- `addFamilyMember`, `removeFamilyMember`, `updateFamilyMember` - CRUD functions
- `errors` - Validation errors object

#### 4. `EducationSection.jsx`

**Props:**

- `education` - Array of education objects
- `addEducation`, `removeEducation`, `updateEducation` - CRUD functions
- `handleEducationDocUpload` - Document upload handler
- `errors` - Validation errors object

#### 5. `AddressSection.jsx`

**Props:**

- `form` - Form state object
- `handleNestedChange` - Nested object change handler
- `errors` - Validation errors object

#### 6. `ProfileImageSection.jsx`

**Props:**

- `form`, `handleImageUpload`, `imageCropModal`, `tempImage`, `handleImageCrop`, `setImageCropModal`

### Complete Usage Example:

```jsx
import ProfileImageSection from "../components/profile/ProfileImageSection";
import EmployeeInfoSection from "../components/profile/EmployeeInfoSection";
import IdentificationSection from "../components/profile/IdentificationSection";
import FamilyDetailsSection from "../components/profile/FamilyDetailsSection";
import EducationSection from "../components/profile/EducationSection";
import AddressSection from "../components/profile/AddressSection";

// Use all components in Profile.jsx:
<>
  <ProfileImageSection {...imageProps} />
  <EmployeeInfoSection form={form} handleChange={handleChange} />
  <IdentificationSection
    form={form}
    handleNestedChange={handleNestedChange}
    errors={errors}
  />
  <FamilyDetailsSection
    familyMembers={form.familyMembers}
    {...familyHandlers}
    errors={errors}
  />
  <EducationSection
    education={form.education}
    {...educationHandlers}
    errors={errors}
  />
  <AddressSection
    form={form}
    handleNestedChange={handleNestedChange}
    errors={errors}
  />
</>;
```

This will make the Profile page even cleaner and more maintainable!

- `ProfileImageSection.jsx` - Profile picture upload and crop

This will make the Profile page even cleaner and more maintainable!
