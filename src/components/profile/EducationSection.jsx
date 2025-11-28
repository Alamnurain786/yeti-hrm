import { memo } from "react";
import { School, Plus, Trash2, FileText } from "lucide-react";

const EducationSection = memo(
  ({
    education,
    addEducation,
    removeEducation,
    updateEducation,
    handleEducationDocUpload,
    errors,
  }) => {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-slate-800 font-semibold text-lg">
            <School className="mr-2 text-purple-600" /> Education Details
          </div>
          <button
            type="button"
            onClick={addEducation}
            className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-sm"
          >
            <Plus size={16} className="mr-1" /> Add Education
          </button>
        </div>

        {education.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm">
            No education records added. Click "Add Education" to start.
          </div>
        ) : (
          <div className="space-y-4">
            {education.map((edu, index) => (
              <div
                key={index}
                className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-700">
                    Education #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeEducation(index)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-slate-600 font-medium">
                      Degree / Level <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={edu.degree}
                      onChange={(e) =>
                        updateEducation(index, "degree", e.target.value)
                      }
                      className={`w-full px-3 py-2 rounded-xl border text-sm ${
                        errors[`education.${index}.degree`]
                          ? "border-red-300"
                          : "border-slate-200"
                      }`}
                      placeholder="e.g., Bachelor, Master"
                    />
                    {errors[`education.${index}.degree`] && (
                      <p className="text-xs text-red-600 mt-1">
                        {errors[`education.${index}.degree`]}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-slate-600 font-medium">
                      Institute / University{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={edu.institute}
                      onChange={(e) =>
                        updateEducation(index, "institute", e.target.value)
                      }
                      className={`w-full px-3 py-2 rounded-xl border text-sm ${
                        errors[`education.${index}.institute`]
                          ? "border-red-300"
                          : "border-slate-200"
                      }`}
                      placeholder="Institute name"
                    />
                    {errors[`education.${index}.institute`] && (
                      <p className="text-xs text-red-600 mt-1">
                        {errors[`education.${index}.institute`]}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-slate-600 font-medium">
                      Graduation Year
                    </label>
                    <input
                      type="number"
                      value={edu.year}
                      onChange={(e) =>
                        updateEducation(index, "year", e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-blue-500"
                      placeholder="YYYY"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <label className="flex items-center px-4 py-2 rounded-xl border border-slate-200 text-slate-700 cursor-pointer hover:bg-slate-50 text-sm">
                    <FileText size={16} className="mr-2" />
                    {edu.document
                      ? "Document Uploaded ✓"
                      : "Upload Certificate"}
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => handleEducationDocUpload(index, e)}
                    />
                  </label>
                  {edu.document && (
                    <span className="text-xs text-emerald-600 font-medium">
                      Certificate attached
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

EducationSection.displayName = "EducationSection";

export default EducationSection;
