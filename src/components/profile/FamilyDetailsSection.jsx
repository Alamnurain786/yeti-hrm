import { memo } from "react";
import { Users, Plus, Trash2 } from "lucide-react";

const FamilyDetailsSection = memo(
  ({
    familyMembers,
    addFamilyMember,
    removeFamilyMember,
    updateFamilyMember,
    errors,
  }) => {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-slate-800 font-semibold text-lg">
            <Users className="mr-2 text-blue-600" /> Details of Family Members /
            पारिवारिक विवरण
          </div>
          <button
            type="button"
            onClick={addFamilyMember}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus size={16} className="mr-1" /> Add Member
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-xs font-semibold text-slate-600">
                  S.No.
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600">
                  Relationship / नाता <span className="text-red-500">*</span>
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600">
                  Name, Surname / नाम, थर{" "}
                  <span className="text-red-500">*</span>
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600">
                  Remarks / टिप्पणिहरू
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {familyMembers.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-4 py-6 text-center text-slate-400 text-sm"
                  >
                    No family members added. Click "Add Member" to start.
                  </td>
                </tr>
              ) : (
                familyMembers.map((member, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        value={member.relationship}
                        onChange={(e) =>
                          updateFamilyMember(
                            index,
                            "relationship",
                            e.target.value
                          )
                        }
                        className={`w-full px-2 py-1 rounded border text-sm ${
                          errors[`familyMember.${index}.relationship`]
                            ? "border-red-300"
                            : "border-slate-200"
                        }`}
                        placeholder="e.g., Spouse, Father"
                      />
                      {errors[`familyMember.${index}.relationship`] && (
                        <p className="text-xs text-red-600 mt-0.5">
                          {errors[`familyMember.${index}.relationship`]}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        value={member.name}
                        onChange={(e) =>
                          updateFamilyMember(index, "name", e.target.value)
                        }
                        className={`w-full px-2 py-1 rounded border text-sm ${
                          errors[`familyMember.${index}.name`]
                            ? "border-red-300"
                            : "border-slate-200"
                        }`}
                        placeholder="Full name"
                      />
                      {errors[`familyMember.${index}.name`] && (
                        <p className="text-xs text-red-600 mt-0.5">
                          {errors[`familyMember.${index}.name`]}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        value={member.remarks}
                        onChange={(e) =>
                          updateFamilyMember(index, "remarks", e.target.value)
                        }
                        className="w-full px-2 py-1 rounded border border-slate-200 text-sm"
                        placeholder="Optional"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => removeFamilyMember(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
);

FamilyDetailsSection.displayName = "FamilyDetailsSection";

export default FamilyDetailsSection;
