import { memo, useState } from "react";
import {
  X,
  ZoomIn,
  Download,
  FileText,
  Image as ImageIcon,
} from "lucide-react";

/**
 * Document Preview Modal Component
 * Displays uploaded documents (images/PDFs) in a modal with zoom and download options
 */
const DocumentPreviewModal = memo(({ document, title, onClose }) => {
  const [zoom, setZoom] = useState(100);

  if (!document) return null;

  const isImage = document.startsWith("data:image");
  const isPDF = document.startsWith("data:application/pdf");

  const handleDownload = () => {
    const link = window.document.createElement("a");
    link.href = document;
    link.download = `${title.replace(/\s+/g, "_")}.${isImage ? "png" : "pdf"}`;
    link.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="document-preview-title"
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            {isImage ? (
              <ImageIcon className="w-5 h-5 text-blue-600" />
            ) : (
              <FileText className="w-5 h-5 text-red-600" />
            )}
            <h3
              id="document-preview-title"
              className="font-semibold text-slate-800"
            >
              {title}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {isImage && (
              <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-lg border border-slate-200">
                <button
                  onClick={() => setZoom(Math.max(50, zoom - 25))}
                  className="text-slate-600 hover:text-slate-800 px-2"
                  aria-label="Zoom out"
                >
                  -
                </button>
                <span className="text-sm font-medium text-slate-700 min-w-[50px] text-center">
                  {zoom}%
                </span>
                <button
                  onClick={() => setZoom(Math.min(200, zoom + 25))}
                  className="text-slate-600 hover:text-slate-800 px-2"
                  aria-label="Zoom in"
                >
                  +
                </button>
              </div>
            )}
            <button
              onClick={handleDownload}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              aria-label="Download document"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Close preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Content */}
        <div className="overflow-auto max-h-[calc(90vh-80px)] p-4 bg-slate-100 flex items-center justify-center">
          {isImage ? (
            <img
              src={document}
              alt={title}
              style={{ transform: `scale(${zoom / 100})` }}
              className="transition-transform duration-200 max-w-full h-auto rounded-lg shadow-lg"
            />
          ) : isPDF ? (
            <iframe
              src={document}
              title={title}
              className="w-full h-[70vh] rounded-lg shadow-lg bg-white"
            />
          ) : (
            <div className="text-center p-8">
              <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">
                Preview not available for this file type
              </p>
              <button
                onClick={handleDownload}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Download File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

DocumentPreviewModal.displayName = "DocumentPreviewModal";

export default DocumentPreviewModal;
