import { useState } from 'react';
import PdfModal from '../components/PdfModal';
import { withBasePath } from '../lib/basePath';

export default function Graduation({ certificateImage, thesisPdf }) {
  const [showThesis, setShowThesis] = useState(false);

  return (
    <section>
      <h1>畢業證書與畢業論文</h1>

      <div>
        <h2>畢業證書</h2>
        {certificateImage ? (
          <img src={withBasePath(certificateImage)} alt="畢業證書" className="certificate-image" />
        ) : (
          <p>尚未上傳畢業證書，請將圖片放置於 /public/graduation/</p>
        )}
      </div>

      <div>
        <h2>畢業論文</h2>
        {thesisPdf ? (
          <button onClick={() => setShowThesis(true)}>瀏覽畢業論文</button>
        ) : (
          <p>尚未上傳畢業論文，請將 PDF 放置於 /public/graduation/</p>
        )}
      </div>

      {showThesis && (
        <PdfModal
          fileUrl={withBasePath(thesisPdf)}
          title="畢業論文"
          onClose={() => setShowThesis(false)}
        />
      )}
    </section>
  );
}

export async function getStaticProps() {
  const fs = require('fs');
  const path = require('path');

  const graduationDir = path.join(process.cwd(), 'public', 'graduation');
  let certificateImage = null;
  let thesisPdf = null;

  if (fs.existsSync(graduationDir)) {
    const files = fs.readdirSync(graduationDir);
    const cert = files.find((f) => /\.(png|jpe?g)$/i.test(f));
    const thesis = files.find((f) => f.endsWith('.pdf'));
    certificateImage = cert ? `/graduation/${cert}` : null;
    thesisPdf = thesis ? `/graduation/${thesis}` : null;
  }

  return { props: { certificateImage, thesisPdf } };
}
