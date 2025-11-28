import { createContext, useContext, useState, useEffect } from "react";
import { initializeDummyData } from "../services/api";

const MockDataContext = createContext();

export const MockDataProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  // Dashboard configuration: superadmin can assign which cards show for high-level roles
  const [dashboardConfig, setDashboardConfig] = useState({});

  // Initialize Data
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);

      const storedUsers = JSON.parse(localStorage.getItem("hrm_users")) || [];
      const storedDepts =
        JSON.parse(localStorage.getItem("hrm_departments")) || [];
      const storedRoles = JSON.parse(localStorage.getItem("hrm_roles")) || [];
      const storedAttendance =
        JSON.parse(localStorage.getItem("hrm_attendance")) || [];
      const storedLeaves = JSON.parse(localStorage.getItem("hrm_leaves")) || [];
      const storedDashboardConfig =
        JSON.parse(localStorage.getItem("hrm_dashboard_config")) || null;

      // Check if data already exists in localStorage
      if (storedUsers.length === 0) {
        console.log("Fetching dummy data from API...");

        // Fetch data from dummy APIs
        const dummyData = await initializeDummyData();

        // Store in localStorage
        localStorage.setItem("hrm_users", JSON.stringify(dummyData.users));
        localStorage.setItem(
          "hrm_attendance",
          JSON.stringify(dummyData.attendance)
        );
        localStorage.setItem("hrm_leaves", JSON.stringify(dummyData.leaves));

        setUsers(dummyData.users);
        setAttendance(dummyData.attendance);
        setLeaves(dummyData.leaves);

        console.log(`Loaded ${dummyData.users.length} users from API`);
      } else {
        // Use existing localStorage data
        setUsers(storedUsers);
        setAttendance(storedAttendance);
        setLeaves(storedLeaves);
      }

      // Initialize departments
      if (storedDepts.length === 0) {
        const defaultDepts = [
          {
            id: "DEPT001",
            name: "Management",
            description: "Executive management and leadership",
            headOfDepartment: "",
          },
          {
            id: "DEPT002",
            name: "Human Resources",
            description: "HR operations and employee management",
            headOfDepartment: "",
          },
          {
            id: "DEPT003",
            name: "Engineering",
            description: "Software development and technical operations",
            headOfDepartment: "",
          },
          {
            id: "DEPT004",
            name: "Sales",
            description: "Sales and business development",
            headOfDepartment: "",
          },
          {
            id: "DEPT005",
            name: "Marketing",
            description: "Marketing and brand management",
            headOfDepartment: "",
          },
          {
            id: "DEPT006",
            name: "Finance",
            description: "Financial operations and accounting",
            headOfDepartment: "",
          },
          {
            id: "DEPT007",
            name: "Operations",
            description: "Business operations and support",
            headOfDepartment: "",
          },
        ];
        localStorage.setItem("hrm_departments", JSON.stringify(defaultDepts));
        setDepartments(defaultDepts);
      } else {
        setDepartments(storedDepts);
      }

      // Initialize roles
      if (storedRoles.length === 0) {
        const defaultRoles = [];
        localStorage.setItem("hrm_roles", JSON.stringify(defaultRoles));
        setRoles(defaultRoles);
      } else {
        setRoles(storedRoles);
      }

      setLoading(false);

      // Initialize dashboard config with sensible defaults if absent
      if (!storedDashboardConfig) {
        const defaultConfig = {
          superadmin: [
            "totalEmployees",
            "leaveBalance",
            "newHires",
            "attendanceRate",
          ],
          hr: ["totalEmployees", "leaveBalance", "attendanceRate"],
          employee: ["leaveBalance"], // minimal; can be empty if not needed
        };
        localStorage.setItem(
          "hrm_dashboard_config",
          JSON.stringify(defaultConfig)
        );
        setDashboardConfig(defaultConfig);
      } else {
        setDashboardConfig(storedDashboardConfig);
      }
    };

    initializeData();
  }, []);

  // Helper Functions
  const addUser = (user) => {
    const newUsers = [
      ...users,
      { ...user, id: `EMP${Date.now().toString().slice(-4)}` },
    ];
    setUsers(newUsers);
    localStorage.setItem("hrm_users", JSON.stringify(newUsers));
  };

  const addAttendance = (record) => {
    const newAttendance = [...attendance, record];
    setAttendance(newAttendance);
    localStorage.setItem("hrm_attendance", JSON.stringify(newAttendance));
  };

  const addLeaveRequest = (request) => {
    const newLeaves = [
      ...leaves,
      {
        ...request,
        id: `L${Date.now().toString().slice(-4)}`,
        status: "Pending",
      },
    ];
    setLeaves(newLeaves);
    localStorage.setItem("hrm_leaves", JSON.stringify(newLeaves));
  };

  const updateLeaveStatus = (id, status, approvedBy) => {
    const newLeaves = leaves.map((leave) =>
      leave.id === id
        ? { ...leave, status, approvedBy, approvedAt: new Date().toISOString() }
        : leave
    );
    setLeaves(newLeaves);
    localStorage.setItem("hrm_leaves", JSON.stringify(newLeaves));
  };

  const addDepartment = (department) => {
    const newDept = {
      ...department,
      id: `DEPT${Date.now().toString().slice(-4)}`,
    };
    const newDepartments = [...departments, newDept];
    setDepartments(newDepartments);
    localStorage.setItem("hrm_departments", JSON.stringify(newDepartments));
  };

  const updateDepartment = (oldNameOrId, updatedData) => {
    const newDepartments = departments.map((dept) => {
      const deptId = typeof dept === "string" ? dept : dept.id || dept.name;
      const matchId =
        typeof oldNameOrId === "string"
          ? oldNameOrId
          : oldNameOrId.id || oldNameOrId.name;

      if (
        deptId === matchId ||
        (typeof dept === "object" && dept.name === oldNameOrId)
      ) {
        return typeof dept === "string"
          ? {
              id: `DEPT${Date.now().toString().slice(-4)}`,
              name: updatedData.name,
              description: updatedData.description || "",
              headOfDepartment: updatedData.headOfDepartment || "",
            }
          : { ...dept, ...updatedData };
      }
      return dept;
    });
    setDepartments(newDepartments);
    localStorage.setItem("hrm_departments", JSON.stringify(newDepartments));
  };

  const deleteDepartment = (nameOrId) => {
    const newDepartments = departments.filter((dept) => {
      const deptIdentifier =
        typeof dept === "string" ? dept : dept.id || dept.name;
      return (
        deptIdentifier !== nameOrId &&
        (typeof dept === "object" ? dept.name !== nameOrId : true)
      );
    });
    setDepartments(newDepartments);
    localStorage.setItem("hrm_departments", JSON.stringify(newDepartments));
  };

  const addRole = (role) => {
    const newRole = {
      ...role,
      id: `ROLE${Date.now().toString().slice(-4)}`,
      minSalary: parseInt(role.minSalary),
      maxSalary: parseInt(role.maxSalary),
    };
    const newRoles = [...roles, newRole];
    setRoles(newRoles);
    localStorage.setItem("hrm_roles", JSON.stringify(newRoles));
  };

  // Update current user's profile fields
  const updateUserProfile = (userId, updates) => {
    const newUsers = users.map((u) =>
      u.id === userId ? { ...u, ...updates } : u
    );
    setUsers(newUsers);
    localStorage.setItem("hrm_users", JSON.stringify(newUsers));
  };

  // Update dashboard cards for a role
  const setDashboardConfigForRole = (role, cards) => {
    const newConfig = { ...dashboardConfig, [role]: cards };
    setDashboardConfig(newConfig);
    localStorage.setItem("hrm_dashboard_config", JSON.stringify(newConfig));
  };

  // Available cards metadata
  const dashboardCards = [
    { id: "totalEmployees", title: "Total Employees" },
    { id: "leaveBalance", title: "Leave Balance" },
    { id: "newHires", title: "New Hires" },
    { id: "attendanceRate", title: "Attendance" },
  ];

  return (
    <MockDataContext.Provider
      value={{
        users,
        departments,
        roles,
        attendance,
        leaves,
        loading,
        addUser,
        addAttendance,
        addLeaveRequest,
        updateLeaveStatus,
        addDepartment,
        updateDepartment,
        deleteDepartment,
        addRole,
        updateUserProfile,
        dashboardConfig,
        dashboardCards,
        setDashboardConfigForRole,
      }}
    >
      {children}
    </MockDataContext.Provider>
  );
};

export const useMockData = () => useContext(MockDataContext);
