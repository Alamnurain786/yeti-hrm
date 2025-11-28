# 🧪 Testing Checklist - Profile System

## ✅ Feature Testing

### 1. Form Management

- [ ] Fill out all form fields
- [ ] Check that form state updates correctly
- [ ] Verify hasUnsavedChanges flag works
- [ ] Test reset form functionality
- [ ] Verify nested field updates work

### 2. Validation

- [ ] Enter invalid email → Should show error
- [ ] Enter invalid phone (not 10 digits) → Should show error
- [ ] Leave required fields empty → Should show error
- [ ] Fix errors → Should clear automatically
- [ ] Submit with errors → Should focus first error field
- [ ] Verify debouncing (wait 500ms before validation)

### 3. Auto-Save

- [ ] Make changes → Wait 30 seconds → Check localStorage
- [ ] Reload page → Should prompt to restore draft
- [ ] Accept draft → Should load saved data
- [ ] Reject draft → Should use original data
- [ ] Save form → Should clear draft from localStorage

### 4. Unsaved Changes Warning

- [ ] Make changes without saving
- [ ] Try to close tab → Should show browser warning
- [ ] Try to navigate away → Should show browser warning
- [ ] Save changes → Warning should disappear

### 5. Profile Completeness Badge

- [ ] Empty profile → Should show red (0-49%)
- [ ] Partial profile → Should show yellow (50-74%)
- [ ] Almost complete → Should show blue (75-99%)
- [ ] Complete profile → Should show green (100%)
- [ ] Verify percentage calculation is accurate
- [ ] Check field count matches (X/17)

### 6. Progress Indicator

- [ ] Shows all sections (Profile, ID, Family, Education, Address)
- [ ] Checkmarks appear when sections complete
- [ ] Progress bar fills proportionally
- [ ] Updates in real-time as form changes

### 7. Document Preview

- [ ] Upload image document → Click preview
- [ ] Should open modal with image
- [ ] Test zoom controls (50%, 75%, 100%, 125%, 200%)
- [ ] Test download button
- [ ] Upload PDF → Should show iframe preview
- [ ] Click outside modal → Should close
- [ ] Press ESC → Should close

### 8. Field Masking

- [ ] Enter citizenship number → Should mask (123\*\*\*\*89)
- [ ] Enter PAN number → Should mask (123\*\*\*\*89)
- [ ] Enter account number → Should mask (\*\*\*\*1234)
- [ ] Focus field → Should unmask for editing
- [ ] Blur field → Should mask again
- [ ] Masked data should be readable

### 9. Export to PDF

- [ ] Click "Export PDF" button
- [ ] Should open print dialog
- [ ] Verify all sections appear in PDF
- [ ] Check formatting is professional
- [ ] Test "Save as PDF" functionality
- [ ] Verify timestamp in footer

### 10. Copy Address

- [ ] Fill current address
- [ ] Click "Copy from Current Address"
- [ ] Permanent address should match current
- [ ] Should show success toast
- [ ] Form should be marked as unsaved

### 11. Success Animation

- [ ] Submit form successfully
- [ ] Green checkmark should appear
- [ ] Should have bounce animation
- [ ] Should auto-dismiss after 2 seconds
- [ ] Should not block interaction

### 12. Loading States

- [ ] Click "Save Changes"
- [ ] Button should show spinner
- [ ] Text should change to "Saving..."
- [ ] Button should be disabled
- [ ] Should work for ~1 second

## ♿ Accessibility Testing

### Keyboard Navigation

- [ ] Tab through all form fields
- [ ] Tab order is logical (top to bottom)
- [ ] All buttons are keyboard accessible
- [ ] Space/Enter activates buttons
- [ ] ESC closes modals
- [ ] Focus visible indicator appears
- [ ] No keyboard traps

### Screen Reader

- [ ] Test with NVDA/JAWS/VoiceOver
- [ ] Form has aria-label
- [ ] Buttons have descriptive aria-labels
- [ ] Errors announced in live region
- [ ] Success messages announced
- [ ] Loading state announced (aria-busy)
- [ ] Badge status announced
- [ ] Modal has proper ARIA attributes

### Focus Management

- [ ] Submit with errors → First error gets focus
- [ ] Error field scrolls into view smoothly
- [ ] Opening modal → Focus trapped in modal
- [ ] Closing modal → Focus returns to trigger
- [ ] Tab within modal → Focus cycles

### ARIA Live Regions

- [ ] Validation errors announced
- [ ] "X errors found" announced
- [ ] "Profile saved" announced
- [ ] "Address copied" announced
- [ ] "Document preview opened" announced
- [ ] Messages clear after 3 seconds

## 📱 Mobile Testing

### Device Detection

- [ ] Test on phone (< 768px)
- [ ] Test on tablet (768-1024px)
- [ ] Test on desktop (> 1024px)
- [ ] useIsMobile returns correct values
- [ ] Resize window → Detection updates

### Touch Gestures

- [ ] Swipe left on family member → Should delete
- [ ] Swipe right → Should cancel
- [ ] Verify 50px threshold works
- [ ] Test on actual mobile device
- [ ] Gestures don't interfere with scrolling

### Mobile Validation

- [ ] Errors display as toast on mobile
- [ ] Toast auto-hides after 5 seconds
- [ ] Error list shows all issues
- [ ] Touch-friendly error display

### Mobile File Picker

- [ ] Click upload button
- [ ] Native file picker opens
- [ ] Select image → Should upload
- [ ] Cancel picker → No error
- [ ] Accept attribute works (image/\*)

### Responsive Layout

- [ ] Form stacks vertically on mobile
- [ ] Buttons are touch-friendly (44x44px min)
- [ ] Text is readable without zoom
- [ ] Images scale properly
- [ ] No horizontal scroll

## 🔒 Security Testing

### Field Masking

- [ ] Citizenship masked by default
- [ ] PAN masked by default
- [ ] Account masked by default
- [ ] Passport masked by default
- [ ] Phone masked by default
- [ ] Unmasking works on focus

### Input Validation

- [ ] XSS prevention (test with `<script>alert('xss')</script>`)
- [ ] SQL injection prevention (test with `' OR '1'='1`)
- [ ] Email format validation
- [ ] Phone number format validation
- [ ] Length limits enforced

### PropTypes

- [ ] Invalid prop types trigger console warnings
- [ ] Required props enforced
- [ ] Shape validation works
- [ ] Function props validated

## 🖨️ Print Testing

### Print Layout

- [ ] Click browser print (Ctrl+P)
- [ ] Navigation should be hidden
- [ ] Buttons should be hidden
- [ ] Sidebar should be hidden
- [ ] Form should be clean and readable

### Print Styles

- [ ] Background colors removed
- [ ] Shadows removed
- [ ] Page breaks work correctly
- [ ] All content fits on page
- [ ] Text is black on white

## 🎨 UI/UX Testing

### Visual Feedback

- [ ] Hover states work on buttons
- [ ] Active states work on inputs
- [ ] Focus outlines visible
- [ ] Error fields have red border
- [ ] Success messages are green

### Animations

- [ ] Success animation smooth
- [ ] Modal transitions smooth
- [ ] No jank or stuttering
- [ ] Animations don't block interaction

### Icons

- [ ] All icons display correctly
- [ ] Icons have proper sizing
- [ ] Icons align with text
- [ ] Icons are accessible (aria-hidden)

## 🚀 Performance Testing

### Load Time

- [ ] Page loads in < 2 seconds
- [ ] No console errors
- [ ] No console warnings (except PropTypes in dev)
- [ ] Images load quickly

### Debouncing

- [ ] Validation waits 500ms
- [ ] Typing doesn't lag
- [ ] No stuttering during input

### Re-renders

- [ ] Only changed sections re-render
- [ ] React DevTools shows minimal re-renders
- [ ] No infinite loops

### Memory

- [ ] No memory leaks
- [ ] Event listeners cleaned up
- [ ] Intervals cleared on unmount

## 🔄 Integration Testing

### Context Integration

- [ ] useAuth works correctly
- [ ] useMockData works correctly
- [ ] useToast works correctly
- [ ] All contexts accessible

### localStorage

- [ ] Draft saves correctly
- [ ] Draft loads correctly
- [ ] Draft clears on save
- [ ] Old drafts expire (24 hours)
- [ ] Data persists across sessions

### Navigation

- [ ] Form in main layout
- [ ] Sidebar visible
- [ ] Header visible
- [ ] Routes work correctly

## 🐛 Error Handling

### Edge Cases

- [ ] Empty form submission
- [ ] Very long text input
- [ ] Special characters in input
- [ ] Extremely large images
- [ ] No internet connection
- [ ] Slow network simulation

### Error Messages

- [ ] Errors are user-friendly
- [ ] Errors are specific
- [ ] Errors are actionable
- [ ] Errors clear when fixed

## 📊 Cross-Browser Testing

### Desktop Browsers

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers

- [ ] Chrome Mobile
- [ ] Safari iOS
- [ ] Samsung Internet
- [ ] Firefox Mobile

## ✅ Final Checks

### Code Quality

- [ ] No console errors
- [ ] No console warnings (production)
- [ ] No unused imports
- [ ] No commented code
- [ ] Consistent formatting

### Documentation

- [ ] All hooks documented
- [ ] All components documented
- [ ] PropTypes complete
- [ ] README up to date

### Production Ready

- [ ] Build succeeds (`npm run build`)
- [ ] Preview works (`npm run preview`)
- [ ] No TypeScript errors (if applicable)
- [ ] ESLint passes (`npm run lint`)

---

## 🎯 Test Results Template

```
Date: _____________
Tester: ___________
Environment: ______

Features Tested: ___/12
Passed: ___
Failed: ___
Blocked: ___

Accessibility: ___/4
Passed: ___
Failed: ___

Mobile: ___/5
Passed: ___
Failed: ___

Overall Status: ☐ Pass ☐ Fail ☐ Needs Work

Issues Found:
1. _________________________
2. _________________________
3. _________________________

Notes:
_______________________________
_______________________________
```

---

**Priority Legend:**

- 🔴 Critical - Must fix before launch
- 🟡 Important - Should fix soon
- 🟢 Nice to have - Can fix later

**Test Coverage Target:** 95%+
