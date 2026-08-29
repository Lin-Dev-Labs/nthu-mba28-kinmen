import { useState } from 'react';
import PdfModal from '../components/PdfModal';
import { useGraduation } from '../lib/GraduationContext';
import { normalizeImageToPngDataUrl } from '../lib/imageUtils';

function fileToArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export default function Graduation() {
  const { certificate, setCertificate, thesis, setThesis } = useGraduation();
  const [showThesis, setShowThesis] = useState(false);
  const [thesisPreviewUrl, setThesisPreviewUrl] = useState(null);
  const [certificateError, setCertificateError] = useState(null);

  async function handleCertificateChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCertificateError(null);
    try {
      const dataUrl = await normalizeImageToPngDataUrl(file);
      setCertificate({ dataUrl, isPng: true });
    } catch (err) {
      setCertificateError(err.message);
    }
  }

  async function handleThesisChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const bytes = await fileToArrayBuffer(file);
    setThesis({ bytes, name: file.name });
  }

  function openThesisPreview() {
    const blob = new Blob([thesis.bytes], { type: 'application/pdf' });
    setThesisPreviewUrl(URL.createObjectURL(blob));
    setShowThesis(true);
  }

  function closeThesisPreview() {
    setShowThesis(false);
    if (thesisPreviewUrl) URL.revokeObjectURL(thesisPreviewUrl);
    setThesisPreviewUrl(null);
  }

  return (
    <section>
      <h1>我的畢業證書與畢業論文</h1>
      <p>
        畢業證書與論文是每個人自己的文件，這裡上傳的檔案<strong>只會留在你目前這個瀏覽器分頁的記憶體中</strong>，
        不會被上傳到任何伺服器或 GitHub，離開或重新整理頁面後需要重新上傳一次。
        上傳前建議先把證書上的身分證字號、出生年月日馬賽克遮起來。
      </p>

      <div>
        <h2>畢業證書</h2>
        <label>
          選擇圖片檔（jpg / png）
          <input type="file" accept="image/*" onChange={handleCertificateChange} />
        </label>
        {certificateError && <p className="error">{certificateError}</p>}
        {certificate && (
          <img src={certificate.dataUrl} alt="我的畢業證書" className="certificate-image" />
        )}
      </div>

      <div>
        <h2>畢業論文</h2>
        <label>
          選擇 PDF 檔
          <input type="file" accept="application/pdf" onChange={handleThesisChange} />
        </label>
        {thesis && (
          <div>
            <p>{thesis.name}</p>
            <button onClick={openThesisPreview}>瀏覽我的論文</button>
          </div>
        )}
      </div>

      {showThesis && (
        <PdfModal fileUrl={thesisPreviewUrl} title="我的畢業論文" onClose={closeThesisPreview} />
      )}
    </section>
  );
}
