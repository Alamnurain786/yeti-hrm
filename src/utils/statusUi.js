export const getAttendanceStatusColor = (status) => {
  switch (status) {
    case "Present":
      return "bg-emerald-100 text-emerald-700";
    case "Late":
      return "bg-orange-100 text-orange-700";
    case "Half Day":
      return "bg-amber-100 text-amber-700";
    case "Absent":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

export const getLeaveRequestStatusColor = (status) => {
  switch (status) {
    case "Approved":
      return "bg-emerald-100 text-emerald-600";
    case "Approved by Manager":
      return "bg-blue-100 text-blue-600";
    case "Cancellation Requested":
      return "bg-violet-100 text-violet-700";
    case "Cancelled":
      return "bg-slate-200 text-slate-700";
    case "Rejected":
      return "bg-red-100 text-red-600";
    default:
      return "bg-orange-100 text-orange-600";
  }
};

export const getLeaveApprovalStatusColor = (status) => {
  switch (status) {
    case "Approved":
      return "bg-emerald-100 text-emerald-600";
    case "Approved by Manager":
      return "bg-blue-100 text-blue-600";
    case "Cancellation Requested":
      return "bg-violet-100 text-violet-700";
    case "Cancelled":
      return "bg-slate-200 text-slate-700";
    case "Rejected":
      return "bg-red-100 text-red-600";
    default:
      return "bg-orange-100 text-orange-600";
  }
};

export const getEmployeeStatusColor = (status) => {
  switch (status) {
    case "Active":
      return "bg-emerald-100 text-emerald-600";
    case "Deactive":
      return "bg-slate-200 text-slate-700";
    case "Resigned":
      return "bg-red-100 text-red-600";
    default:
      return "bg-slate-100 text-slate-600";
  }
};

export const getVerificationStatusColor = (status) => {
  switch (status) {
    case "Approved":
      return "bg-emerald-100 text-emerald-700";
    case "Rejected":
      return "bg-red-100 text-red-700";
    default:
      return "bg-amber-100 text-amber-700";
  }
};
