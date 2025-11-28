import { CheckCircle, Circle } from "lucide-react";

const ProfileProgress = ({ form }) => {
  const calculateProgress = () => {
    let completed = 0;
    let total = 0;

    // Profile Image
    total++;
    if (form.profileImage) completed++;

    // Identification (4 required fields)
    total += 4;
    if (form.identification.accountHolderNameNepali) completed++;
    if (form.identification.citizenshipNo) completed++;
    if (form.identification.citizenshipIssuePlace) completed++;
    if (form.identification.panNo) completed++;

    // Family Members
    total++;
    if (form.familyMembers.length > 0) completed++;

    // Education
    total++;
    if (form.education.length > 0) completed++;

    // Address (at least current address)
    total++;
    if (
      form.currentAddress.municipality ||
      form.currentAddress.district ||
      form.currentAddress.mobile
    ) {
      completed++;
    }

    // Religion & Nationality
    total += 2;
    if (form.religion) completed++;
    if (form.nationality) completed++;

    return Math.round((completed / total) * 100);
  };

  const progress = calculateProgress();
  const sections = [
    {
      name: "Profile Image",
      completed: !!form.profileImage,
    },
    {
      name: "Identification",
      completed:
        form.identification.accountHolderNameNepali &&
        form.identification.citizenshipNo &&
        form.identification.citizenshipIssuePlace &&
        form.identification.panNo,
    },
    {
      name: "Family Details",
      completed: form.familyMembers.length > 0,
    },
    {
      name: "Education",
      completed: form.education.length > 0,
    },
    {
      name: "Address",
      completed:
        form.currentAddress.municipality ||
        form.currentAddress.district ||
        form.currentAddress.mobile,
    },
  ];

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-sm border border-blue-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">
          Profile Completion
        </h3>
        <span className="text-2xl font-bold text-blue-600">{progress}%</span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4 bg-white rounded-full h-3 overflow-hidden shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Section Checklist */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {sections.map((section, index) => (
          <div
            key={index}
            className={`flex items-center gap-2 text-xs ${
              section.completed ? "text-green-600" : "text-slate-400"
            }`}
          >
            {section.completed ? (
              <CheckCircle size={16} className="flex-shrink-0" />
            ) : (
              <Circle size={16} className="flex-shrink-0" />
            )}
            <span className="truncate">{section.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileProgress;
