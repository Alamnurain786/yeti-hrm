import { memo } from "react";
import PropTypes from "prop-types";
import { MapPin, Copy } from "lucide-react";

const AddressSection = memo(
  ({ form, handleNestedChange, errors = {}, onCopyAddress }) => {
    const fieldError = (section, field) => errors[`${section}.${field}`];
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center mb-4 text-slate-800 font-semibold text-lg">
          <MapPin className="mr-2 text-emerald-600" /> Address / ठेगाना
        </div>

        {/* Current Address */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 bg-slate-50 px-3 py-2 rounded-lg">
            Current Address (हालको ठेगाना)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-600 font-medium">
                House No. (घर नं.) <span className="text-red-500">*</span>
              </label>
              <input
                value={form.currentAddress.houseNo}
                onChange={(e) =>
                  handleNestedChange(
                    "currentAddress",
                    "houseNo",
                    e.target.value,
                  )
                }
                className={`w-full px-3 py-2 rounded-xl border text-sm ${
                  fieldError("currentAddress", "houseNo")
                    ? "border-red-300 bg-red-50 focus:border-red-500"
                    : "border-slate-200 focus:border-blue-500"
                }`}
              />
              {fieldError("currentAddress", "houseNo") && (
                <p className="text-xs text-red-600 mt-1">
                  {fieldError("currentAddress", "houseNo")}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs text-slate-600 font-medium">
                Ward No. (वडा नं.) <span className="text-red-500">*</span>
              </label>
              <input
                value={form.currentAddress.wardNo}
                onChange={(e) =>
                  handleNestedChange("currentAddress", "wardNo", e.target.value)
                }
                className={`w-full px-3 py-2 rounded-xl border text-sm ${
                  fieldError("currentAddress", "wardNo")
                    ? "border-red-300 bg-red-50 focus:border-red-500"
                    : "border-slate-200 focus:border-blue-500"
                }`}
              />
              {fieldError("currentAddress", "wardNo") && (
                <p className="text-xs text-red-600 mt-1">
                  {fieldError("currentAddress", "wardNo")}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs text-slate-600 font-medium">
                Street/Tole (सडक/टोल)
              </label>
              <input
                value={form.currentAddress.street}
                onChange={(e) =>
                  handleNestedChange("currentAddress", "street", e.target.value)
                }
                className={`w-full px-3 py-2 rounded-xl border text-sm ${
                  fieldError("currentAddress", "street")
                    ? "border-red-300 bg-red-50 focus:border-red-500"
                    : "border-slate-200 focus:border-blue-500"
                }`}
              />
              {fieldError("currentAddress", "street") && (
                <p className="text-xs text-red-600 mt-1">
                  {fieldError("currentAddress", "street")}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs text-slate-600 font-medium">
                Municipality/VDC (नपा/गाविस)
                <span className="text-red-500">*</span>
              </label>
              <input
                value={form.currentAddress.municipality}
                onChange={(e) =>
                  handleNestedChange(
                    "currentAddress",
                    "municipality",
                    e.target.value,
                  )
                }
                className={`w-full px-3 py-2 rounded-xl border text-sm ${
                  fieldError("currentAddress", "municipality")
                    ? "border-red-300 bg-red-50 focus:border-red-500"
                    : "border-slate-200 focus:border-blue-500"
                }`}
              />
              {fieldError("currentAddress", "municipality") && (
                <p className="text-xs text-red-600 mt-1">
                  {fieldError("currentAddress", "municipality")}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs text-slate-600 font-medium">
                District (जिल्ला) <span className="text-red-500">*</span>
              </label>
              <input
                value={form.currentAddress.district}
                onChange={(e) =>
                  handleNestedChange(
                    "currentAddress",
                    "district",
                    e.target.value,
                  )
                }
                className={`w-full px-3 py-2 rounded-xl border text-sm ${
                  fieldError("currentAddress", "district")
                    ? "border-red-300 bg-red-50 focus:border-red-500"
                    : "border-slate-200 focus:border-blue-500"
                }`}
              />
              {fieldError("currentAddress", "district") && (
                <p className="text-xs text-red-600 mt-1">
                  {fieldError("currentAddress", "district")}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs text-slate-600 font-medium">
                Mobile (मोबाईल) <span className="text-red-500">*</span>
              </label>
              <input
                value={form.currentAddress.mobile}
                onChange={(e) =>
                  handleNestedChange("currentAddress", "mobile", e.target.value)
                }
                className={`w-full px-3 py-2 rounded-xl border text-sm ${
                  fieldError("currentAddress", "mobile")
                    ? "border-red-300 bg-red-50 focus:border-red-500"
                    : "border-slate-200 focus:border-blue-500"
                }`}
                placeholder="10 digits"
              />
              {fieldError("currentAddress", "mobile") && (
                <p className="text-xs text-red-600 mt-1">
                  {fieldError("currentAddress", "mobile")}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs text-slate-600 font-medium">
                Email (इमेल)
              </label>
              <input
                type="email"
                value={form.currentAddress.email}
                onChange={(e) =>
                  handleNestedChange("currentAddress", "email", e.target.value)
                }
                className={`w-full px-3 py-2 rounded-xl border text-sm ${
                  fieldError("currentAddress", "email")
                    ? "border-red-300 bg-red-50 focus:border-red-500"
                    : "border-slate-200 focus:border-blue-500"
                }`}
              />
              {fieldError("currentAddress", "email") && (
                <p className="text-xs text-red-600 mt-1">
                  {fieldError("currentAddress", "email")}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Permanent Address */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700 bg-slate-50 px-3 py-2 rounded-lg">
              Permanent Address (स्थायी ठेगाना)
            </h3>
            <button
              type="button"
              onClick={onCopyAddress}
              className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Copy size={16} />
              Copy from Current Address
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-600 font-medium">
                House No. (घर नं.) <span className="text-red-500">*</span>
              </label>
              <input
                value={form.permanentAddress.houseNo}
                onChange={(e) =>
                  handleNestedChange(
                    "permanentAddress",
                    "houseNo",
                    e.target.value,
                  )
                }
                className={`w-full px-3 py-2 rounded-xl border text-sm ${
                  fieldError("permanentAddress", "houseNo")
                    ? "border-red-300 bg-red-50 focus:border-red-500"
                    : "border-slate-200 focus:border-blue-500"
                }`}
              />
              {fieldError("permanentAddress", "houseNo") && (
                <p className="text-xs text-red-600 mt-1">
                  {fieldError("permanentAddress", "houseNo")}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs text-slate-600 font-medium">
                Ward No. (वडा नं.) <span className="text-red-500">*</span>
              </label>
              <input
                value={form.permanentAddress.wardNo}
                onChange={(e) =>
                  handleNestedChange(
                    "permanentAddress",
                    "wardNo",
                    e.target.value,
                  )
                }
                className={`w-full px-3 py-2 rounded-xl border text-sm ${
                  fieldError("permanentAddress", "wardNo")
                    ? "border-red-300 bg-red-50 focus:border-red-500"
                    : "border-slate-200 focus:border-blue-500"
                }`}
              />
              {fieldError("permanentAddress", "wardNo") && (
                <p className="text-xs text-red-600 mt-1">
                  {fieldError("permanentAddress", "wardNo")}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs text-slate-600 font-medium">
                Street/Tole (सडक/टोल)
              </label>
              <input
                value={form.permanentAddress.street}
                onChange={(e) =>
                  handleNestedChange(
                    "permanentAddress",
                    "street",
                    e.target.value,
                  )
                }
                className={`w-full px-3 py-2 rounded-xl border text-sm ${
                  fieldError("permanentAddress", "street")
                    ? "border-red-300 bg-red-50 focus:border-red-500"
                    : "border-slate-200 focus:border-blue-500"
                }`}
              />
              {fieldError("permanentAddress", "street") && (
                <p className="text-xs text-red-600 mt-1">
                  {fieldError("permanentAddress", "street")}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs text-slate-600 font-medium">
                Municipality/VDC (नपा/गाविस)
                <span className="text-red-500">*</span>
              </label>
              <input
                value={form.permanentAddress.municipality}
                onChange={(e) =>
                  handleNestedChange(
                    "permanentAddress",
                    "municipality",
                    e.target.value,
                  )
                }
                className={`w-full px-3 py-2 rounded-xl border text-sm ${
                  fieldError("permanentAddress", "municipality")
                    ? "border-red-300 bg-red-50 focus:border-red-500"
                    : "border-slate-200 focus:border-blue-500"
                }`}
              />
              {fieldError("permanentAddress", "municipality") && (
                <p className="text-xs text-red-600 mt-1">
                  {fieldError("permanentAddress", "municipality")}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs text-slate-600 font-medium">
                District (जिल्ला) <span className="text-red-500">*</span>
              </label>
              <input
                value={form.permanentAddress.district}
                onChange={(e) =>
                  handleNestedChange(
                    "permanentAddress",
                    "district",
                    e.target.value,
                  )
                }
                className={`w-full px-3 py-2 rounded-xl border text-sm ${
                  fieldError("permanentAddress", "district")
                    ? "border-red-300 bg-red-50 focus:border-red-500"
                    : "border-slate-200 focus:border-blue-500"
                }`}
              />
              {fieldError("permanentAddress", "district") && (
                <p className="text-xs text-red-600 mt-1">
                  {fieldError("permanentAddress", "district")}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs text-slate-600 font-medium">
                Mobile (मोबाईल) <span className="text-red-500">*</span>
              </label>
              <input
                value={form.permanentAddress.mobile}
                onChange={(e) =>
                  handleNestedChange(
                    "permanentAddress",
                    "mobile",
                    e.target.value,
                  )
                }
                className={`w-full px-3 py-2 rounded-xl border text-sm ${
                  fieldError("permanentAddress", "mobile")
                    ? "border-red-300 bg-red-50 focus:border-red-500"
                    : "border-slate-200 focus:border-blue-500"
                }`}
                placeholder="10 digits"
              />
              {fieldError("permanentAddress", "mobile") && (
                <p className="text-xs text-red-600 mt-1">
                  {fieldError("permanentAddress", "mobile")}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs text-slate-600 font-medium">
                Email (इमेल)
              </label>
              <input
                type="email"
                value={form.permanentAddress.email}
                onChange={(e) =>
                  handleNestedChange(
                    "permanentAddress",
                    "email",
                    e.target.value,
                  )
                }
                className={`w-full px-3 py-2 rounded-xl border text-sm ${
                  fieldError("permanentAddress", "email")
                    ? "border-red-300 bg-red-50 focus:border-red-500"
                    : "border-slate-200 focus:border-blue-500"
                }`}
              />
              {fieldError("permanentAddress", "email") && (
                <p className="text-xs text-red-600 mt-1">
                  {fieldError("permanentAddress", "email")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

AddressSection.displayName = "AddressSection";

AddressSection.propTypes = {
  form: PropTypes.shape({
    currentAddress: PropTypes.shape({
      houseNo: PropTypes.string,
      wardNo: PropTypes.string,
      street: PropTypes.string,
      municipality: PropTypes.string,
      district: PropTypes.string,
      province: PropTypes.string,
      mobile: PropTypes.string,
      email: PropTypes.string,
    }).isRequired,
    permanentAddress: PropTypes.shape({
      houseNo: PropTypes.string,
      wardNo: PropTypes.string,
      street: PropTypes.string,
      municipality: PropTypes.string,
      district: PropTypes.string,
      province: PropTypes.string,
      mobile: PropTypes.string,
      email: PropTypes.string,
    }).isRequired,
  }).isRequired,
  handleNestedChange: PropTypes.func.isRequired,
  errors: PropTypes.object,
  onCopyAddress: PropTypes.func.isRequired,
};

export default AddressSection;
