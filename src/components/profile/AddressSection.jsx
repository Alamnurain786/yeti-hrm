import { memo } from "react";
import PropTypes from "prop-types";
import { MapPin, Copy } from "lucide-react";

const AddressSection = memo(
  ({ form, handleNestedChange, errors, onCopyAddress }) => {
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
                House No. (घर नं.)
              </label>
              <input
                value={form.currentAddress.houseNo}
                onChange={(e) =>
                  handleNestedChange(
                    "currentAddress",
                    "houseNo",
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-medium">
                Ward No. (वडा नं.)
              </label>
              <input
                value={form.currentAddress.wardNo}
                onChange={(e) =>
                  handleNestedChange("currentAddress", "wardNo", e.target.value)
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-blue-500"
              />
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
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-medium">
                Municipality/VDC (नपा/गाविस)
              </label>
              <input
                value={form.currentAddress.municipality}
                onChange={(e) =>
                  handleNestedChange(
                    "currentAddress",
                    "municipality",
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-medium">
                District (जिल्ला)
              </label>
              <input
                value={form.currentAddress.district}
                onChange={(e) =>
                  handleNestedChange(
                    "currentAddress",
                    "district",
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-medium">
                Tel No. (टे.नं.)
              </label>
              <input
                value={form.currentAddress.tel}
                onChange={(e) =>
                  handleNestedChange("currentAddress", "tel", e.target.value)
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-medium">
                Fax No. (फ्याक्स नं.)
              </label>
              <input
                value={form.currentAddress.fax}
                onChange={(e) =>
                  handleNestedChange("currentAddress", "fax", e.target.value)
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-medium">
                Mobile (मोबाईल)
              </label>
              <input
                value={form.currentAddress.mobile}
                onChange={(e) =>
                  handleNestedChange("currentAddress", "mobile", e.target.value)
                }
                className={`w-full px-3 py-2 rounded-xl border text-sm ${
                  errors["currentAddress.mobile"]
                    ? "border-red-300 focus:border-red-500"
                    : "border-slate-200 focus:border-blue-500"
                }`}
                placeholder="10 digits"
              />
              {errors["currentAddress.mobile"] && (
                <p className="text-xs text-red-600 mt-1">
                  {errors["currentAddress.mobile"]}
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
                  errors["currentAddress.email"]
                    ? "border-red-300 focus:border-red-500"
                    : "border-slate-200 focus:border-blue-500"
                }`}
              />
              {errors["currentAddress.email"] && (
                <p className="text-xs text-red-600 mt-1">
                  {errors["currentAddress.email"]}
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
                House No. (घर नं.)
              </label>
              <input
                value={form.permanentAddress.houseNo}
                onChange={(e) =>
                  handleNestedChange(
                    "permanentAddress",
                    "houseNo",
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-medium">
                Ward No. (वडा नं.)
              </label>
              <input
                value={form.permanentAddress.wardNo}
                onChange={(e) =>
                  handleNestedChange(
                    "permanentAddress",
                    "wardNo",
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-blue-500"
              />
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
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-medium">
                Municipality/VDC (नपा/गाविस)
              </label>
              <input
                value={form.permanentAddress.municipality}
                onChange={(e) =>
                  handleNestedChange(
                    "permanentAddress",
                    "municipality",
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-medium">
                District (जिल्ला)
              </label>
              <input
                value={form.permanentAddress.district}
                onChange={(e) =>
                  handleNestedChange(
                    "permanentAddress",
                    "district",
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-medium">
                Tel No. (टे.नं.)
              </label>
              <input
                value={form.permanentAddress.tel}
                onChange={(e) =>
                  handleNestedChange("permanentAddress", "tel", e.target.value)
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-medium">
                Fax No. (फ्याक्स नं.)
              </label>
              <input
                value={form.permanentAddress.fax}
                onChange={(e) =>
                  handleNestedChange("permanentAddress", "fax", e.target.value)
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-medium">
                Mobile (मोबाईल)
              </label>
              <input
                value={form.permanentAddress.mobile}
                onChange={(e) =>
                  handleNestedChange(
                    "permanentAddress",
                    "mobile",
                    e.target.value
                  )
                }
                className={`w-full px-3 py-2 rounded-xl border text-sm ${
                  errors["permanentAddress.mobile"]
                    ? "border-red-300 focus:border-red-500"
                    : "border-slate-200 focus:border-blue-500"
                }`}
                placeholder="10 digits"
              />
              {errors["permanentAddress.mobile"] && (
                <p className="text-xs text-red-600 mt-1">
                  {errors["permanentAddress.mobile"]}
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
                    e.target.value
                  )
                }
                className={`w-full px-3 py-2 rounded-xl border text-sm ${
                  errors["permanentAddress.email"]
                    ? "border-red-300 focus:border-red-500"
                    : "border-slate-200 focus:border-blue-500"
                }`}
              />
              {errors["permanentAddress.email"] && (
                <p className="text-xs text-red-600 mt-1">
                  {errors["permanentAddress.email"]}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
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
      tel: PropTypes.string,
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
      tel: PropTypes.string,
      mobile: PropTypes.string,
      email: PropTypes.string,
    }).isRequired,
  }).isRequired,
  handleNestedChange: PropTypes.func.isRequired,
  errors: PropTypes.object,
  onCopyAddress: PropTypes.func.isRequired,
};

export default AddressSection;
