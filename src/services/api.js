// API Service for fetching dummy data from external APIs
// Uses JSONPlaceholder for basic data and RandomUser API for employee profiles

const API_ENDPOINTS = {
  randomUser: "https://randomuser.me/api/",
  jsonPlaceholder: "https://jsonplaceholder.typicode.com",
};

/**
 * Fetch random user profiles from RandomUser API
 * @param {number} count - Number of users to fetch
 * @returns {Promise<Array>} - Array of user objects
 */
export const fetchRandomUsers = async (count = 10) => {
  try {
    const response = await fetch(
      `${API_ENDPOINTS.randomUser}?results=${count}&nat=us,gb,au`
    );
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error("Error fetching random users:", error);
    return [];
  }
};

/**
 * Transform RandomUser API data to HRM user format
 * @param {Array} apiUsers - Users from RandomUser API
 * @param {string} role - Role to assign (hr, employee)
 * @returns {Array} - Formatted HRM users
 */
export const transformToHRMUsers = (apiUsers, role = "employee") => {
  const departments = [
    "Human Resources",
    "Engineering",
    "Sales",
    "Marketing",
    "Finance",
    "Operations",
  ];

  return apiUsers.map((user, index) => {
    const firstName = user.name.first;
    const lastName = user.name.last;
    const fullName = `${firstName} ${lastName}`;
    const email = user.email;
    const phone = user.phone;
    const department = departments[index % departments.length];

    // Generate avatar initials
    const avatar = `${firstName[0]}${lastName[0]}`.toUpperCase();

    // Calculate joining date (random date within last 2 years)
    const joiningDate = new Date();
    joiningDate.setDate(
      joiningDate.getDate() - Math.floor(Math.random() * 730)
    );

    // Calculate DOB (age between 22-55)
    const dobAD = new Date();
    const age = 22 + Math.floor(Math.random() * 33);
    dobAD.setFullYear(dobAD.getFullYear() - age);

    return {
      id: `EMP${(1000 + index).toString()}`,
      name: fullName,
      email: email,
      password: "password123", // Default password for all dummy users
      phone: phone,
      role: role,
      department: department,
      avatar: avatar,
      status:
        index % 10 === 0 ? "On Leave" : index % 15 === 0 ? "Remote" : "Active",
      joiningDate: joiningDate.toISOString().split("T")[0],
      dobAD: dobAD.toISOString().split("T")[0],
      gender: user.gender === "male" ? "Male" : "Female",
      manager: role === "employee" ? "HR Manager" : "Super Admin",
    };
  });
};

/**
 * Generate random attendance records for users
 * @param {Array} users - Array of HRM users
 * @param {number} days - Number of past days to generate records for
 * @returns {Array} - Attendance records
 */
export const generateAttendanceRecords = (users, days = 30) => {
  const records = [];
  const today = new Date();

  users.forEach((user) => {
    // Generate records for past days (skip weekends)
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Skip weekends
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      // 90% attendance rate
      if (Math.random() > 0.9) continue;

      // Generate check-in time (8:30 AM - 10:00 AM)
      const checkInHour = 8 + Math.floor(Math.random() * 2);
      const checkInMinute = Math.floor(Math.random() * 60);
      const checkIn = `${checkInHour
        .toString()
        .padStart(2, "0")}:${checkInMinute.toString().padStart(2, "0")}:00`;

      // Generate check-out time (5:00 PM - 7:00 PM)
      const checkOutHour = 17 + Math.floor(Math.random() * 2);
      const checkOutMinute = Math.floor(Math.random() * 60);
      const checkOut = `${checkOutHour
        .toString()
        .padStart(2, "0")}:${checkOutMinute.toString().padStart(2, "0")}:00`;

      // Determine status
      const isLate =
        checkInHour > 9 || (checkInHour === 9 && checkInMinute > 30);
      const status = isLate ? "Late" : "Present";

      records.push({
        userId: user.id,
        name: user.name,
        date: date.toLocaleDateString(),
        checkIn: checkIn,
        checkOut: checkOut,
        status: status,
        lateReason: isLate ? "Traffic delay" : null,
      });
    }
  });

  return records;
};

/**
 * Generate random leave requests for users
 * @param {Array} users - Array of HRM users
 * @param {Array} managers - Array of HR/Superadmin users
 * @returns {Array} - Leave requests
 */
export const generateLeaveRequests = (users, managers) => {
  const leaveTypes = [
    "Casual Leave",
    "Sick Leave",
    "Earned Leave",
    "Unpaid Leave",
  ];
  const statuses = ["Pending", "Approved", "Rejected"];
  const reasons = [
    "Personal family matter",
    "Medical appointment",
    "Family emergency",
    "Vacation trip",
    "Home renovation",
    "Attending wedding ceremony",
    "Health checkup",
    "Religious festival",
  ];

  const leaves = [];

  users.forEach((user, index) => {
    // Generate 1-3 leave requests per employee
    const leaveCount = 1 + Math.floor(Math.random() * 3);

    for (let i = 0; i < leaveCount; i++) {
      const startDate = new Date();
      startDate.setDate(
        startDate.getDate() + Math.floor(Math.random() * 60) - 30
      );

      const duration = 1 + Math.floor(Math.random() * 5); // 1-5 days
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + duration);

      const manager = managers[Math.floor(Math.random() * managers.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      leaves.push({
        id: `L${(1000 + leaves.length).toString()}`,
        userId: user.id,
        userName: user.name,
        type: leaveTypes[Math.floor(Math.random() * leaveTypes.length)],
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        reason: reasons[Math.floor(Math.random() * reasons.length)],
        managerId: manager.id,
        managerName: manager.name,
        status: status,
        approvedBy: status !== "Pending" ? manager.name : null,
        approvedAt: status !== "Pending" ? new Date().toISOString() : null,
        requestedAt: new Date(
          startDate.getTime() - 86400000 * 7
        ).toLocaleDateString(), // 7 days before start
      });
    }
  });

  return leaves;
};

/**
 * Initialize HRM system with dummy data from APIs
 * @returns {Promise<Object>} - Object containing users, attendance, and leaves
 */
export const initializeDummyData = async () => {
  try {
    // Fetch random users from API
    const apiUsers = await fetchRandomUsers(20);

    // Create superadmin
    const superadmin = {
      id: "SA001",
      name: "Super Admin",
      email: "admin@hrm.com",
      password: "admin",
      role: "superadmin",
      department: "Management",
      avatar: "SA",
      status: "Active",
    };

    // Create HR users (2 HR admins)
    const hrUsers = transformToHRMUsers(apiUsers.slice(0, 2), "hr");
    hrUsers.forEach((user) => {
      user.email = `hr.${user.name.toLowerCase().replace(/\s+/g, ".")}@hrm.com`;
      user.department = "Human Resources";
    });

    // Create employee users
    const employees = transformToHRMUsers(apiUsers.slice(2), "employee");

    // Combine all users
    const allUsers = [superadmin, ...hrUsers, ...employees];

    // Generate attendance records
    const attendance = generateAttendanceRecords(
      [...hrUsers, ...employees],
      30
    );

    // Generate leave requests
    const leaves = generateLeaveRequests(employees, [superadmin, ...hrUsers]);

    return {
      users: allUsers,
      attendance,
      leaves,
    };
  } catch (error) {
    console.error("Error initializing dummy data:", error);
    // Return minimal data if API fails
    return {
      users: [
        {
          id: "SA001",
          name: "Super Admin",
          email: "admin@hrm.com",
          password: "admin",
          role: "superadmin",
          department: "Management",
          avatar: "SA",
          status: "Active",
        },
      ],
      attendance: [],
      leaves: [],
    };
  }
};
