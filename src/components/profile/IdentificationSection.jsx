import { memo } from "react";
import { IdCard, Upload, FileText } from "lucide-react";
import NepaliDatePicker from "../NepaliDatePicker";
import NepaliDate from "nepali-date-converter";
import { useToast } from "../../context/ToastContext";

const IdentificationSection = memo(
  ({
    form,
    handleNestedChange,
    handleDocumentUpload: onDocumentUpload,
    errors = {},
  }) => {
    const { showToast } = useToast();
    const fieldError = (field) => errors[`identification.${field}`];

    const handleDocumentUpload = async (field, e) => {
      const file = e.target.files?.[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          showToast("error", "File size should be less than 5MB.");
          return;
        }

        if (onDocumentUpload) {
          await onDocumentUpload(field, file);
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
                    e.target.value,
                  )
                }
                lang="ne"
                className={`w-full px-3 py-2 rounded-xl border text-sm ${
                  fieldError("accountHolderNameNepali")
                    ? "border-red-300 bg-red-50 focus:border-red-500"
                    : "border-slate-200 focus:border-blue-500"
                }`}
                placeholder="देवनागरीमा"
              />
              {fieldError("accountHolderNameNepali") && (
                <p className="text-xs text-red-600 mt-1">
                  {fieldError("accountHolderNameNepali")}
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
                    e.target.value,
                  )
                }
                className={`w-full px-3 py-2 rounded-xl border text-sm ${
                  fieldError("citizenshipNo")
                    ? "border-red-300 bg-red-50 focus:border-red-500"
                    : "border-slate-200 focus:border-blue-500"
                }`}
              />
              {fieldError("citizenshipNo") && (
                <p className="text-xs text-red-600 mt-1">
                  {fieldError("citizenshipNo")}
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
                    bsDate,
                  );
                  if (bsDate) {
                    try {
                      const [year, month, day] = bsDate.split("-").map(Number);
                      const nepaliDate = new NepaliDate(year, month - 1, day);
                      const adDate = nepaliDate.toJsDate();
                      handleNestedChange(
                        "identification",
                        "citizenshipIssueDate",
                        adDate.toISOString().split("T")[0],
                      );
                    } catch {
                      handleNestedChange(
                        "identification",
                        "citizenshipIssueDate",
                        "",
                      );
                    }
                  }
                }}
                className={
                  fieldError("citizenshipIssueDateBS")
                    ? "border-red-300 bg-red-50"
                    : ""
                }
                placeholder="मिति छान्नुहोस्"
              />
              {fieldError("citizenshipIssueDateBS") && (
                <p className="text-xs text-red-600 mt-1">
                  {fieldError("citizenshipIssueDateBS")}
                </p>
              )}
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
                    e.target.value,
                  )
                }
                className={`w-full px-3 py-2 rounded-xl border text-sm ${
                  fieldError("citizenshipIssuePlace")
                    ? "border-red-300 bg-red-50 focus:border-red-500"
                    : "border-slate-200 focus:border-blue-500"
                }`}
              />
              {fieldError("citizenshipIssuePlace") && (
                <p className="text-xs text-red-600 mt-1">
                  {fieldError("citizenshipIssuePlace")}
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
                  accept=".jpg,.jpeg,.pdf"
                  onChange={(e) =>
                    handleDocumentUpload("citizenshipDocument", e)
                  }
                  className="hidden"
                  id="citizenship-doc"
                />
                <label
                  htmlFor="citizenship-doc"
                  className={`flex-1 px-3 py-2 rounded-xl border text-sm bg-white hover:bg-slate-50 cursor-pointer flex items-center justify-center ${
                    fieldError("citizenshipDocument")
                      ? "border-red-300 bg-red-50"
                      : "border-slate-200"
                  }`}
                >
                  <Upload size={16} className="mr-2" />
                  {form.identification.citizenshipDocument
                    ? "Change"
                    : "Upload"}
                </label>
                {form.identification.citizenshipDocument && (
                  <FileText className="text-green-600" size={20} />
                )}
              </div>
              {fieldError("citizenshipDocument") && (
                <p className="text-xs text-red-600 mt-1">
                  {fieldError("citizenshipDocument")}
                </p>
              )}
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
                    e.target.value,
                  )
                }
                className={`w-full px-3 py-2 rounded-xl border text-sm ${
                  fieldError("nationalIdCardNo")
                    ? "border-red-300 bg-red-50 focus:border-red-500"
                    : "border-slate-200 focus:border-blue-500"
                }`}
              />
              {fieldError("nationalIdCardNo") && (
                <p className="text-xs text-red-600 mt-1">
                  {fieldError("nationalIdCardNo")}
                </p>
              )}
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
                    bsDate,
                  );
                  if (bsDate) {
                    try {
                      const [year, month, day] = bsDate.split("-").map(Number);
                      const nepaliDate = new NepaliDate(year, month - 1, day);
                      const adDate = nepaliDate.toJsDate();
                      handleNestedChange(
                        "identification",
                        "nationalIdCardIssueDate",
                        adDate.toISOString().split("T")[0],
                      );
                    } catch {
                      handleNestedChange(
                        "identification",
                        "nationalIdCardIssueDate",
                        "",
                      );
                    }
                  }
                }}
                className={
                  fieldError("nationalIdCardIssueDateBS")
                    ? "border-red-300 bg-red-50"
                    : ""
                }
                placeholder="मिति छान्नुहोस्"
              />
              {fieldError("nationalIdCardIssueDateBS") && (
                <p className="text-xs text-red-600 mt-1">
                  {fieldError("nationalIdCardIssueDateBS")}
                </p>
              )}
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
                    e.target.value,
                  )
                }
                className={`w-full px-3 py-2 rounded-xl border text-sm ${
                  fieldError("nationalIdCardIssuePlace")
                    ? "border-red-300 bg-red-50 focus:border-red-500"
                    : "border-slate-200 focus:border-blue-500"
                }`}
              />
              {fieldError("nationalIdCardIssuePlace") && (
                <p className="text-xs text-red-600 mt-1">
                  {fieldError("nationalIdCardIssuePlace")}
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
                  accept=".jpg,.jpeg,.pdf"
                  onChange={(e) =>
                    handleDocumentUpload("nationalIdCardDocument", e)
                  }
                  className="hidden"
                  id="national-id-doc"
                />
                <label
                  htmlFor="national-id-doc"
                  className={`flex-1 px-3 py-2 rounded-xl border text-sm bg-white hover:bg-slate-50 cursor-pointer flex items-center justify-center ${
                    fieldError("nationalIdCardDocument")
                      ? "border-red-300 bg-red-50"
                      : "border-slate-200"
                  }`}
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
              {fieldError("nationalIdCardDocument") && (
                <p className="text-xs text-red-600 mt-1">
                  {fieldError("nationalIdCardDocument")}
                </p>
              )}
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
                    e.target.value,
                  )
                }
                className={`w-full px-3 py-2 rounded-xl border text-sm ${
                  fieldError("drivingLicenseNo")
                    ? "border-red-300 bg-red-50 focus:border-red-500"
                    : "border-slate-200 focus:border-blue-500"
                }`}
                placeholder="License number"
              />
              {fieldError("drivingLicenseNo") && (
                <p className="text-xs text-red-600 mt-1">
                  {fieldError("drivingLicenseNo")}
                </p>
              )}
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
                    bsDate,
                  );
                  if (bsDate) {
                    try {
                      const [year, month, day] = bsDate.split("-").map(Number);
                      const nepaliDate = new NepaliDate(year, month - 1, day);
                      const adDate = nepaliDate.toJsDate();
                      handleNestedChange(
                        "identification",
                        "drivingLicenseIssueDate",
                        adDate.toISOString().split("T")[0],
                      );
                    } catch {
                      handleNestedChange(
                        "identification",
                        "drivingLicenseIssueDate",
                        "",
                      );
                    }
                  }
                }}
                className={
                  fieldError("drivingLicenseIssueDateBS")
                    ? "border-red-300 bg-red-50"
                    : ""
                }
                placeholder="मिति छान्नुहोस्"
              />
              {fieldError("drivingLicenseIssueDateBS") && (
                <p className="text-xs text-red-600 mt-1">
                  {fieldError("drivingLicenseIssueDateBS")}
                </p>
              )}
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
                    e.target.value,
                  )
                }
                className={`w-full px-3 py-2 rounded-xl border text-sm ${
                  fieldError("drivingLicenseIssuingAuthority")
                    ? "border-red-300 bg-red-50 focus:border-red-500"
                    : "border-slate-200 focus:border-blue-500"
                }`}
                placeholder="Authority name"
              />
              {fieldError("drivingLicenseIssuingAuthority") && (
                <p className="text-xs text-red-600 mt-1">
                  {fieldError("drivingLicenseIssuingAuthority")}
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
                  accept=".jpg,.jpeg,.pdf"
                  onChange={(e) =>
                    handleDocumentUpload("drivingLicenseDocument", e)
                  }
                  className="hidden"
                  id="license-doc"
                />
                <label
                  htmlFor="license-doc"
                  className={`flex-1 px-3 py-2 rounded-xl border text-sm bg-white hover:bg-slate-50 cursor-pointer flex items-center justify-center ${
                    fieldError("drivingLicenseDocument")
                      ? "border-red-300 bg-red-50"
                      : "border-slate-200"
                  }`}
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
              {fieldError("drivingLicenseDocument") && (
                <p className="text-xs text-red-600 mt-1">
                  {fieldError("drivingLicenseDocument")}
                </p>
              )}
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
                  fieldError("panNo")
                    ? "border-red-300 bg-red-50 focus:border-red-500"
                    : "border-slate-200 focus:border-blue-500"
                }`}
              />
              {fieldError("panNo") && (
                <p className="text-xs text-red-600 mt-1">
                  {fieldError("panNo")}
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
                  accept=".jpg,.jpeg,.pdf"
                  onChange={(e) => handleDocumentUpload("panDocument", e)}
                  className="hidden"
                  id="pan-doc"
                />
                <label
                  htmlFor="pan-doc"
                  className={`flex-1 px-3 py-2 rounded-xl border text-sm bg-white hover:bg-slate-50 cursor-pointer flex items-center justify-center ${
                    fieldError("panDocument")
                      ? "border-red-300 bg-red-50"
                      : "border-slate-200"
                  }`}
                >
                  <Upload size={16} className="mr-2" />
                  {form.identification.panDocument ? "Change" : "Upload"}
                </label>
                {form.identification.panDocument && (
                  <FileText className="text-green-600" size={20} />
                )}
              </div>
              {fieldError("panDocument") && (
                <p className="text-xs text-red-600 mt-1">
                  {fieldError("panDocument")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

IdentificationSection.displayName = "IdentificationSection";

export default IdentificationSection;
