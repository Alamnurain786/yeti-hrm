# Migration to Backend API - Files Requiring Updates

The following components still reference the old `useMockData` hook and need to be updated to use backend API calls:

## Components to Update:

### Forms:
- `src/components/AddRoleForm.jsx` - Use `roleAPI.create()`
- `src/components/AddEmployeeForm.jsx` - Use `userAPI.create()`
- `src/components/AddDepartmentForm.jsx` - Use `departmentAPI.create()`

### Pages:
- `src/pages/Roles.jsx` - Use `roleAPI.getAll()`
- `src/pages/Employees.jsx` - Use `userAPI.getAll()` and `userAPI.update()`
- `src/pages/Departments.jsx` - Use `departmentAPI` methods
- `src/pages/Dashboard.jsx` - Use `userAPI`, `attendanceAPI`, `leaveAPI`
- `src/pages/AttendanceManagement.jsx` - Use `attendanceAPI.getMy()`
- `src/pages/LeaveApprovals.jsx` - Use `leaveAPI.getAll()` and `leaveAPI.update()`
- `src/pages/LeaveManagement.jsx` - Use `leaveAPI.getMy()` and `leaveAPI.create()`
- `src/pages/LeaveRequest.jsx` - Use `leaveAPI.create()`
- `src/pages/Profile.jsx` - Use `userAPI.update()`
- `src/pages/superadmin/CreateHR.jsx` - Use `userAPI.create()` with role="hr"
- `src/pages/superadmin/DashboardConfig.jsx` - To be implemented in backend

## Pattern for Migration:

### Before (MockData):
```jsx
import { useMockData } from "../context/MockData";

const { users, addUser } = useMockData();
```

### After (Backend API):
```jsx
import { useState, useEffect } from 'react';
import { userAPI } from '../services/backendApi';

const [users, setUsers] = useState([]);

useEffect(() => {
  const fetchUsers = async () => {
    try {
      const data = await userAPI.getAll();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };
  fetchUsers();
}, []);

const handleAddUser = async (userData) => {
  try {
    const newUser = await userAPI.create(userData);
    setUsers([...users, newUser]);
  } catch (error) {
    console.error('Error creating user:', error);
  }
};
```

## Next Steps:

1. Update each component one by one
2. Replace `useMockData()` with appropriate API calls from `backendApi.js`
3. Add loading states and error handling
4. Test each component after migration
5. Remove localStorage references (data now comes from backend database)
