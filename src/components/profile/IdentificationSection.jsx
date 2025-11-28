import { memo } from "react";
import { IdCard, Upload, FileText } from "lucide-react";
import NepaliDatePicker from "../NepaliDatePicker";
import NepaliDate from "nepali-date-converter";
import { useToast } from "../../context/ToastContext";

const IdentificationSection = memo(({ form, handleNestedChange, errors }) => {
  const { showToast } = useToast();

  const handleDocumentUpload = (field, e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast("error", "File size should be less than 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        handleNestedChange("identification", field, reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center mb-4 text-slate-800 font-semibold text-lg">
        <IdCard className="mr-2 text-orange-600" /> Identification Details /
        परिचय विवरण
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-600 font-medium">
              देवनागरीमा ( Name in Nepali){" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              value={form.identification.accountHolderNameNepali}
              onChange={(e) =>
                handleNestedChange(
                  "identification",
                  "accountHolderNameNepali",
                  e.target.value
                )
              }
              lang="ne"
              className={`w-full px-3 py-2 rounded-xl border text-sm ${
                errors["identification.accountHolderNameNepali"]
                  ? "border-red-300 focus:border-red-500"
                  : "border-slate-200 focus:border-blue-500"
              }`}
              placeholder="देवनागरीमा"
            />
            {errors["identification.accountHolderNameNepali"] && (
              <p className="text-xs text-red-600 mt-1">
                {errors["identification.accountHolderNameNepali"]}
              </p>
            )}
          </div>
        </div>

        {/* Citizenship */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-slate-600 font-medium">
              Citizenship No. / नागरिकता नं.{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              value={form.identification.citizenshipNo}
              onChange={(e) =>
                handleNestedChange(
                  "identification",
                  "citizenshipNo",
                  e.target.value
                )
              }
              className={`w-full px-3 py-2 rounded-xl border text-sm ${
                errors["identification.citizenshipNo"]
                  ? "border-red-300 focus:border-red-500"
                  : "border-slate-200 focus:border-blue-500"
              }`}
            />
            {errors["identification.citizenshipNo"] && (
              <p className="text-xs text-red-600 mt-1">
                {errors["identification.citizenshipNo"]}
              </p>
            )}
          </div>
          <div>
            <label className="text-xs text-slate-600 font-medium">
              Date of Issuance (BS) / जारी मिति (बि.सं.)
            </label>
            <NepaliDatePicker
              value={form.identification.citizenshipIssueDateBS}
              onChange={(bsDate) => {
                handleNestedChange(
                  "identification",
                  "citizenshipIssueDateBS",
                  bsDate
                );
                if (bsDate) {
                  try {
                    const [year, month, day] = bsDate.split("-").map(Number);
                    const nepaliDate = new NepaliDate(year, month - 1, day);
                    const adDate = nepaliDate.toJsDate();
                    handleNestedChange(
                      "identification",
                      "citizenshipIssueDate",
                      adDate.toISOString().split("T")[0]
                    );
                  } catch (error) {
                    console.log("Invalid Nepali date");
                  }
                }
              }}
              placeholder="मिति छान्नुहोस्"
            />
          </div>
          <div>
            <label className="text-xs text-slate-600 font-medium">
              Place of Issuance / जारी स्थान{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              value={form.identification.citizenshipIssuePlace}
              onChange={(e) =>
                handleNestedChange(
                  "identification",
                  "citizenshipIssuePlace",
                  e.target.value
                )
              }
              className={`w-full px-3 py-2 rounded-xl border text-sm ${
                errors["identification.citizenshipIssuePlace"]
                  ? "border-red-300 focus:border-red-500"
                  : "border-slate-200 focus:border-blue-500"
              }`}
            />
            {errors["identification.citizenshipIssuePlace"] && (
              <p className="text-xs text-red-600 mt-1">
                {errors["identification.citizenshipIssuePlace"]}
              </p>
            )}
          </div>
          <div>
            <label className="text-xs text-slate-600 font-medium">
              Document Upload / कागजात
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleDocumentUpload("citizenshipDocument", e)}
                className="hidden"
                id="citizenship-doc"
              />
              <label
                htmlFor="citizenship-doc"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white hover:bg-slate-50 cursor-pointer flex items-center justify-center"
              >
                <Upload size={16} className="mr-2" />
                {form.identification.citizenshipDocument ? "Change" : "Upload"}
              </label>
              {form.identification.citizenshipDocument && (
                <FileText className="text-green-600" size={20} />
              )}
            </div>
          </div>
        </div>

        {/* National ID Card */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-slate-600 font-medium">
              National ID Card No. / राष्ट्रिय परिचय पत्र नं.
            </label>
            <input
              value={form.identification.nationalIdCardNo}
              onChange={(e) =>
                handleNestedChange(
                  "identification",
                  "nationalIdCardNo",
                  e.target.value
                )
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-600 font-medium">
              Date of Issuance (BS) / जारी मिति (बि.सं.)
            </label>
            <NepaliDatePicker
              value={form.identification.nationalIdCardIssueDateBS}
              onChange={(bsDate) => {
                handleNestedChange(
                  "identification",
                  "nationalIdCardIssueDateBS",
                  bsDate
                );
                if (bsDate) {
                  try {
                    const [year, month, day] = bsDate.split("-").map(Number);
                    const nepaliDate = new NepaliDate(year, month - 1, day);
                    const adDate = nepaliDate.toJsDate();
                    handleNestedChange(
                      "identification",
                      "nationalIdCardIssueDate",
                      adDate.toISOString().split("T")[0]
                    );
                  } catch (error) {
                    console.log("Invalid Nepali date");
                  }
                }
              }}
              placeholder="मिति छान्नुहोस्"
            />
          </div>
          <div>
            <label className="text-xs text-slate-600 font-medium">
              Place of Issuance / जारी स्थान
            </label>
            <input
              value={form.identification.nationalIdCardIssuePlace}
              onChange={(e) =>
                handleNestedChange(
                  "identification",
                  "nationalIdCardIssuePlace",
                  e.target.value
                )
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-600 font-medium">
              Document Upload / कागजात
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) =>
                  handleDocumentUpload("nationalIdCardDocument", e)
                }
                className="hidden"
                id="national-id-doc"
              />
              <label
                htmlFor="national-id-doc"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white hover:bg-slate-50 cursor-pointer flex items-center justify-center"
              >
                <Upload size={16} className="mr-2" />
                {form.identification.nationalIdCardDocument
                  ? "Change"
                  : "Upload"}
              </label>
              {form.identification.nationalIdCardDocument && (
                <FileText className="text-green-600" size={20} />
              )}
            </div>
          </div>
        </div>

        {/* Driving License */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-slate-600 font-medium">
              Driving License No. / सवारी चालक अनुमतिपत्र नं.
            </label>
            <input
              value={form.identification.drivingLicenseNo}
              onChange={(e) =>
                handleNestedChange(
                  "identification",
                  "drivingLicenseNo",
                  e.target.value
                )
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-blue-500"
              placeholder="License number"
            />
          </div>
          <div>
            <label className="text-xs text-slate-600 font-medium">
              Date of Issuance (BS) / जारी मिति (बि.सं.)
            </label>
            <NepaliDatePicker
              value={form.identification.drivingLicenseIssueDateBS}
              onChange={(bsDate) => {
                handleNestedChange(
                  "identification",
                  "drivingLicenseIssueDateBS",
                  bsDate
                );
                if (bsDate) {
                  try {
                    const [year, month, day] = bsDate.split("-").map(Number);
                    const nepaliDate = new NepaliDate(year, month - 1, day);
                    const adDate = nepaliDate.toJsDate();
                    handleNestedChange(
                      "identification",
                      "drivingLicenseIssueDate",
                      adDate.toISOString().split("T")[0]
                    );
                  } catch (error) {
                    console.log("Invalid Nepali date");
                  }
                }
              }}
              placeholder="मिति छान्नुहोस्"
            />
          </div>
          <div>
            <label className="text-xs text-slate-600 font-medium">
              Issuing Authority / जारी निकाय
            </label>
            <input
              value={form.identification.drivingLicenseIssuingAuthority}
              onChange={(e) =>
                handleNestedChange(
                  "identification",
                  "drivingLicenseIssuingAuthority",
                  e.target.value
                )
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-blue-500"
              placeholder="Authority name"
            />
          </div>
          <div>
            <label className="text-xs text-slate-600 font-medium">
              Document Upload / कागजात
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) =>
                  handleDocumentUpload("drivingLicenseDocument", e)
                }
                className="hidden"
                id="license-doc"
              />
              <label
                htmlFor="license-doc"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white hover:bg-slate-50 cursor-pointer flex items-center justify-center"
              >
                <Upload size={16} className="mr-2" />
                {form.identification.drivingLicenseDocument
                  ? "Change"
                  : "Upload"}
              </label>
              {form.identification.drivingLicenseDocument && (
                <FileText className="text-green-600" size={20} />
              )}
            </div>
          </div>
        </div>

        {/* PAN */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-slate-600 font-medium">
              Self PAN No. / आफ्नो स्था. ले. नं.{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              value={form.identification.panNo}
              onChange={(e) =>
                handleNestedChange("identification", "panNo", e.target.value)
              }
              className={`w-full px-3 py-2 rounded-xl border text-sm ${
                errors["identification.panNo"]
                  ? "border-red-300 focus:border-red-500"
                  : "border-slate-200 focus:border-blue-500"
              }`}
            />
            {errors["identification.panNo"] && (
              <p className="text-xs text-red-600 mt-1">
                {errors["identification.panNo"]}
              </p>
            )}
          </div>
          <div>
            <label className="text-xs text-slate-600 font-medium">
              PAN Document Upload / स्था. ले. कागजात
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleDocumentUpload("panDocument", e)}
                className="hidden"
                id="pan-doc"
              />
              <label
                htmlFor="pan-doc"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white hover:bg-slate-50 cursor-pointer flex items-center justify-center"
              >
                <Upload size={16} className="mr-2" />
                {form.identification.panDocument ? "Change" : "Upload"}
              </label>
              {form.identification.panDocument && (
                <FileText className="text-green-600" size={20} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

IdentificationSection.displayName = "IdentificationSection";

export default IdentificationSection;
