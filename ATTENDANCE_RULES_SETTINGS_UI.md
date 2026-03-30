# Attendance Rules Settings UI - Usage Guide

## Overview
The **Attendance Rules Settings** component provides admins with a user-friendly interface to configure attendance rules for their company. All changes are automatically synced with the backend API and can trigger attendance record rebuilds.

## Access
- **Location**: Settings page (right sidebar navigation) → Scroll to "Admin Settings" section → "Attendance Rules"
- **Permission**: Admin or Superadmin role only
- **URL**: `/settings` (when logged in as admin)

## Features

### 1. Load Current Rules
When the component mounts, it automatically:
- Fetches the active attendance rule for the current company (`GET /attendance-rules/company/{company_id}`)
- Displays all current values in the form
- Shows creation timestamp if a rule exists
- Uses system defaults if no rule has been configured yet

### 2. Edit Attendance Rules

The form provides editable controls for all 6 rule parameters:

#### Grace Period (minutes)
- **Range**: 0-120 minutes
- **Default**: 0 (no grace)
- **Purpose**: Allow employees to check in N minutes late without being marked late
- **Example**: 15 minutes grace means check-in until 10:30 is still on time (if late threshold is 10:15)

#### Late Check-In Time
- **Format**: Time picker (HH:MM, 24-hour format)
- **Default**: 10:15
- **Purpose**: Define the cutoff time after which check-in is marked as late
- **Example**: 10:15 means any check-in after 10:15 AM (after grace period) is marked late

#### Full Day Minimum Hours
- **Range**: 0-24 hours (can be decimal, e.g., 8.5)
- **Default**: 8.0 hours
- **Purpose**: Minimum working hours required to mark attendance as "Full Day"
- **Example**: 8 hours means employee must work at least 8 hours for a full day status

#### Half Day Minimum Hours
- **Range**: 0-24 hours (can be decimal, e.g., 5.5)
- **Default**: 5.0 hours
- **Purpose**: Minimum working hours required to avoid marking attendance as "Absent"
- **Validation**: Must be less than "Full Day Minimum Hours"
- **Example**: 5 hours means employee must work at least 5 hours (but less than 8) for half day status

#### Missing Check-Out Action
- **Options**:
  - `assume_full_day` - Use system checkout time to calculate hours (default)
  - `use_system_time` - Same as above
  - `mark_absent` - If no check-out record exists, mark as absent
- **Purpose**: Define behavior when employee has no checkout record
- **Example**: "assume_full_day" with system time of 17:30 means missing checkout assumes 17:30 as checkout

#### System Check-Out Time
- **Format**: Time picker (HH:MM, 24-hour format)
- **Default**: 17:30
- **Purpose**: Default checkout time used when missing checkout action is "assume_full_day"
- **Example**: 17:30 means day ends at 5:30 PM for hours calculation

### 3. Real-Time Validation
All fields are validated before saving:
- Grace period must be 0-120 (shows error toast if invalid)
- Full/Half day hours must be 0-24 (shows error toast if invalid)
- Half day minimum must be ≤ Full day minimum (shows error toast if violated)

### 4. Save Changes
**Button**: "Save Rules"
- Disabled until changes are made (`hasChanges` tracking)
- Shows "Saving..." state during API call
- On success:
  - Updates local form state
  - Shows green success toast: "Attendance rules saved successfully"
  - Resets `hasChanges` flag
  - Fetches updated rule from backend
- On error:
  - Shows red error toast with API error message
  - Form data remains intact for retry

### 5. Rebuild Attendance (Optional)
**Button**: "Rebuild Attendance"
- Available only if a rule exists
- When clicked:
  1. Shows confirmation dialog: "This will recalculate all attendance records based on the new rules. This may take a moment. Continue?"
  2. If confirmed:
     - Discovers all devices in company
     - Triggers sync for each device with `only_new=false` (full rebuild)
     - Shows info toast: "Attendance rebuild initiated. Changes will apply shortly."
  3. If user cancels:
     - No action taken
  4. On error:
     - Shows error toast suggesting manual sync from devices page

### 6. Cancel Changes
**Button**: "Cancel" (shown only when form has unsaved changes)
- Reverts all form fields to last saved values
- Resets `hasChanges` flag
- Useful when user wants to discard edits without saving

## How Attendance Rules Work (Backend)

When attendance is recorded/rebuilt, the system applies rules in this order:

1. **Apply Grace Period**
   - Adjusted check-in = actual check-in - grace_period_minutes
   - Prevents marking late within grace window

2. **Check if Late**
   - is_late = adjusted_check_in > late_check_in_time
   - Compares adjusted time with threshold

3. **Handle Missing Check-Out**
   - If no checkout record:
     - `assume_full_day`: Use system_checkout_time for hours calculation
     - `mark_absent`: Mark as absent regardless of check-in

4. **Calculate Status**
   - Calculate working_hours = checkout_time - check_in_time (or system time if missing)
   - Determine status (priority order):
     - If hours < half_day_minimum_hours → "Half Day"
     - Else if is_late → "Late"
     - Else → "Present"
     - Or "Absent" if explicitly marked

## Example Configurations

### Standard 8-Hour Office (No Grace)
```
Grace Period: 0 minutes
Late Check-In Time: 10:15
Full Day Minimum Hours: 8.0
Half Day Minimum Hours: 5.0
Missing Checkout Action: assume_full_day
System Check-Out Time: 17:30
```

### Flexible Office (15-Min Grace, Early Closing)
```
Grace Period: 15 minutes
Late Check-In Time: 10:30
Full Day Minimum Hours: 8.0
Half Day Minimum Hours: 4.0
Missing Checkout Action: assume_full_day
System Check-Out Time: 17:00
```

### Strict Attendance (No Grace, Early Threshold)
```
Grace Period: 0 minutes
Late Check-In Time: 09:45
Full Day Minimum Hours: 8.5
Half Day Minimum Hours: 4.5
Missing Checkout Action: mark_absent
System Check-Out Time: 17:30
```

## State Management

### Component State
- `loading` - Fetching initial rule data
- `saving` - POSTing/PUTing changes
- `rules` - Current active rule object from backend
- `formData` - User-editable form values
- `hasChanges` - Track if form differs from last saved state
- `rebuildingAttendance` - During device sync operation

### Data Flow
```
1. Component Mount
   ↓
2. Fetch Current Rule (API: GET /attendance-rules/company/{companyId})
   ↓
3. Load into Form (rules → formData)
   ↓
4. User Edits Form (formData changes, hasChanges = true)
   ↓
5. Save Changes (API: POST /attendance-rules/company/{companyId})
   ↓
6. Update State (rules = new rule, hasChanges = false)
   ↓
7. Optional: Rebuild Attendance (Device Sync)
```

## API Integration

### Endpoints Used
- `GET /attendance-rules/company/{companyId}` - Load current rule
- `POST /attendance-rules/company/{companyId}` - Create/update rule
- `GET /devices` - Get all company devices (for rebuild)
- `POST /devices/{deviceId}/sync` - Trigger rebuild on each device

### Error Handling
- 404 Not Found: No rule exists yet (shows info toast, uses defaults)
- 400 Bad Request: Validation error (shows error toast with details)
- 403 Forbidden: User not authorized (rare - permission check in component)
- 500 Server Error: Backend issue (shows error toast)

## UI Patterns

### Form Grid Layout
- 2 columns on desktop (md breakpoint)
- 1 column on mobile
- Consistent spacing and styling

### Info Box
Explains how rules work in plain language:
- Grace period is subtracted before late checking
- Working hours calculated from check-in to check-out
- Status determined by priority (Half Day → Late → Present)

### Button States
- **Enabled**: Changes exist or valid state  
- **Disabled**: Waiting for API response (dimmed)
- **Hover**: Color intensifies on hover
- **Button Style**: purple-600 for primary (Save), blue-600 for secondary (Rebuild)

## Troubleshooting

### Rule Won't Save
1. Check validation errors in toast
2. Verify half-day hours < full-day hours
3. Ensure values are in valid ranges (0-120 for grace, 0-24 for hours)

### Attendance Not Rebuilding
1. Verify rule is saved first
2. Check if company has configured devices
3. Check device sync status from Devices page
4. May take time for rebuild to complete (async process)

### Form Shows Default Values on Load
- Indicates no rule has been saved yet
- Edit and save to create first rule for company

### Changes Cleared When Navigating Away
- Form state is local; only saved data persists
- Unsaved edits are lost if user navigates away
- Consider adding beforeunload warning (future enhancement)

## Future Enhancements

- [ ] Bulk rule templates for rapid setup
- [ ] Rule versioning/history
- [ ] Schedule automatic rebuilds (e.g., off-hours)
- [ ] Preview attendance impact before rebuild
- [ ] Warn user before navigating away with unsaved changes
- [ ] Export/import rule configurations
- [ ] Rule templates library (flexible office, startup, etc.)

