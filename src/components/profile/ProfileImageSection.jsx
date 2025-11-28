import { memo } from "react";
import { Upload } from "lucide-react";

const ProfileImageSection = memo(
  ({
    form,
    handleImageUpload,
    imageCropModal,
    tempImage,
    handleImageCrop,
    setImageCropModal,
  }) => {
    return (
      <>
        {/* Profile Image and Basic Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-2xl border-2 border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center">
                {form.profileImage ? (
                  <img
                    src={form.profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-slate-400 text-sm">No Image</span>
                )}
              </div>
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-500 font-medium">
                    Full Name
                  </label>
                  <input
                    value={form.name}
                    readOnly
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium">
                    Email
                  </label>
                  <input
                    value={form.email}
                    readOnly
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium">
                    Phone
                  </label>
                  <input
                    value={form.phone}
                    readOnly
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="inline-flex items-center px-4 py-2 rounded-xl border border-slate-200 text-slate-700 cursor-pointer hover:bg-slate-50 text-sm">
                  <Upload size={16} className="mr-2" /> Upload Profile Image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Image Crop Modal */}
        {imageCropModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Crop Image</h3>
              <div className="mb-4 flex items-center justify-center">
                <img
                  src={tempImage}
                  alt="Preview"
                  className="max-w-full max-h-96 rounded-xl"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setImageCropModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImageCrop}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                >
                  Use This Image
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
);

ProfileImageSection.displayName = "ProfileImageSection";

export default ProfileImageSection;
