export default function PdfModal({ fileUrl, title, onClose }) {
  if (!fileUrl) return null;

  return (
    <div className="pdf-modal-overlay" onClick={onClose}>
      <div className="pdf-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pdf-modal-header">
          <span>{title}</span>
          <button onClick={onClose}>關閉 ×</button>
        </div>

        <iframe src={fileUrl} title={title} className="pdf-modal-frame" />

        <a href={fileUrl} download className="pdf-modal-download">
          下載原始檔案
        </a>
      </div>
    </div>
  );
}
