import { memo } from "react";
import { CheckCircle, AlertCircle, Clock, Award } from "lucide-react";

/**
 * Profile Completeness Badge Component
 * Displays a visual indicator of profile completion with color-coded status
 */
const ProfileCompletenessBadge = memo(({ form }) => {
  const calculateCompleteness = () => {
    let completed = 0;
    let total = 0;

    // Profile Image (1 point)
    total++;
    if (form.profileImage) completed++;

    // Basic Info (5 points)
    const basicFields = ["religion", "nationality", "gender", "dateOfBirth"];
    basicFields.forEach((field) => {
      total++;
      if (form[field]) completed++;
    });

    // Identification (6 points)
    const idFields = [
      "citizenshipNo",
      "panNo",
      "nationalIdCardNo",
      "passportNo",
      "accountNo",
      "accountHolderNameNepali",
    ];
    idFields.forEach((field) => {
      total++;
      if (form.identification?.[field]) completed++;
    });

    // Family (1 point - at least one member)
    total++;
    if (form.familyDetails?.members?.length > 0) completed++;

    // Education (1 point - at least one entry)
    total++;
    if (form.education?.length > 0) completed++;

    // Address (2 points - current and permanent)
    total += 2;
    const hasCurrentAddress =
      form.currentAddress?.province &&
      form.currentAddress?.district &&
      form.currentAddress?.municipality;
    const hasPermanentAddress =
      form.permanentAddress?.province &&
      form.permanentAddress?.district &&
      form.permanentAddress?.municipality;
    if (hasCurrentAddress) completed++;
    if (hasPermanentAddress) completed++;

    const percentage = Math.round((completed / total) * 100);
    return { percentage, completed, total };
  };

  const { percentage, completed, total } = calculateCompleteness();

  const getBadgeColor = () => {
    if (percentage === 100)
      return "bg-green-100 text-green-700 border-green-300";
    if (percentage >= 75) return "bg-blue-100 text-blue-700 border-blue-300";
    if (percentage >= 50)
      return "bg-yellow-100 text-yellow-700 border-yellow-300";
    return "bg-red-100 text-red-700 border-red-300";
  };

  const getIcon = () => {
    if (percentage === 100) return <CheckCircle className="w-5 h-5" />;
    if (percentage >= 75) return <Award className="w-5 h-5" />;
    if (percentage >= 50) return <Clock className="w-5 h-5" />;
    return <AlertCircle className="w-5 h-5" />;
  };

  const getStatusText = () => {
    if (percentage === 100) return "Complete";
    if (percentage >= 75) return "Almost Done";
    if (percentage >= 50) return "In Progress";
    return "Just Started";
  };

  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 ${getBadgeColor()} font-semibold text-sm transition-all duration-300`}
      role="status"
      aria-label={`Profile ${percentage}% complete, ${completed} of ${total} sections filled`}
    >
      {getIcon()}
      <span>
        {percentage}% {getStatusText}
      </span>
      <span className="text-xs opacity-75">
        ({completed}/{total})
      </span>
    </div>
  );
});

ProfileCompletenessBadge.displayName = "ProfileCompletenessBadge";

export default ProfileCompletenessBadge;
