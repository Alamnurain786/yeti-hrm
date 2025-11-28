import { memo } from "react";
import { Users } from "lucide-react";
import NepaliDatePicker from "../NepaliDatePicker";
import NepaliDate from "nepali-date-converter";

const EmployeeInfoSection = memo(({ form, handleChange }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center mb-4 text-slate-800 font-semibold text-lg">
        <Users className="mr-2 text-blue-600" /> Employee Information / कर्मचारी
        जानकारी
      </div>

      <div className="space-y-4">
        {/* Read-only HR fields */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-slate-600 font-medium">
              Role / भूमिका
            </label>
            <input
              value={form.role}
              readOnly
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm capitalize"
            />
          </div>
          <div>
            <label className="text-xs text-slate-600 font-medium">
              Department / विभाग
            </label>
            <input
              value={form.department}
              readOnly
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-600 font-medium">
              Manager / प्रबन्धक
            </label>
            <input
              value={form.manager}
              readOnly
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-600 font-medium">
              Joining Date (AD) / भर्ना मिति
            </label>
            <input
              type="date"
              value={form.joiningDate}
              readOnly
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm"
            />
          </div>
        </div>

        {/* User editable fields */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-slate-600 font-medium">
              Joining Date (BS) / भर्ना मिति (बि.सं.)
            </label>
            <input
              value={form.joiningDateBS}
              readOnly
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm"
              placeholder="YYYY-MM-DD (BS)"
            />
          </div>
          <div>
            <label className="text-xs text-slate-600 font-medium">
              Date of Birth (BS) / जन्म मिति (बि.सं.)
            </label>
            <NepaliDatePicker
              value={form.dobBS}
              onChange={(bsDate) => {
                handleChange("dobBS", bsDate);
                // Convert BS to AD and calculate age
                if (bsDate) {
                  try {
                    const [year, month, day] = bsDate.split("-").map(Number);
                    const nepaliDate = new NepaliDate(year, month - 1, day);
                    const adDate = nepaliDate.toJsDate();
                    handleChange(
                      "dateOfBirth",
                      adDate.toISOString().split("T")[0]
                    );

                    // Calculate age
                    const today = new Date();
                    let age = today.getFullYear() - adDate.getFullYear();
                    const monthDiff = today.getMonth() - adDate.getMonth();
                    if (
                      monthDiff < 0 ||
                      (monthDiff === 0 && today.getDate() < adDate.getDate())
                    ) {
                      age--;
                    }
                    handleChange("age", age.toString());
                  } catch (error) {
                    console.log("Invalid Nepali date");
                  }
                }
              }}
              placeholder="जन्म मिति छान्नुहोस्"
            />
          </div>
          <div>
            <label className="text-xs text-slate-600 font-medium">
              Age / उमेर
            </label>
            <div className="flex items-center space-x-2">
              <input
                value={form.age}
                readOnly
                className="w-20 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-center font-semibold"
              />
              <span className="text-xs text-slate-500">years / वर्ष</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-600 font-medium">
              Gender / लिङ्ग
            </label>
            <input
              value={form.gender}
              readOnly
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm capitalize"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-slate-600 font-medium">
              Religion / धर्म
            </label>
            <select
              value={form.religion}
              onChange={(e) => handleChange("religion", e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-blue-500"
            >
              <option value="">Select Religion</option>
              <option value="Hinduism">Hinduism / हिन्दू धर्म</option>
              <option value="Buddhism">Buddhism / बौद्ध धर्म</option>
              <option value="Islam">Islam / इस्लाम धर्म</option>
              <option value="Christianity">Christianity / इसाई धर्म</option>
              <option value="Kirat">Kirat / किरात धर्म</option>
              <option value="Other">Other / अन्य</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-600 font-medium">
              Nationality / राष्ट्रियता
            </label>
            <input
              value={form.nationality}
              onChange={(e) => handleChange("nationality", e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
});

EmployeeInfoSection.displayName = "EmployeeInfoSection";

export default EmployeeInfoSection;
