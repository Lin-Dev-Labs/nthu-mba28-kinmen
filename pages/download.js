import { useEffect, useState } from 'react';
import ProfileForm from '../components/ProfileForm';
import { generatePersonalizedPdf, downloadPdfBytes } from '../components/PdfGenerator';
import profileTemplate from '../data/profile-template.json';
import { getAllCourses } from '../lib/courses';
import { useGraduation } from '../lib/GraduationContext';

const STORAGE_KEY = 'mba-profile';

export default function Download({ courses, reportSlugs, photoPaths }) {
  const [profile, setProfile] = useState(profileTemplate);
  const [selectedCourses, setSelectedCourses] = useState(() =>
    Object.fromEntries(courses.map((c) => [c.slug, true]))
  );
  const [selectedReports, setSelectedReports] = useState(() =>
    Object.fromEntries(reportSlugs.map((r) => [r.path, false]))
  );
  const [selectedPhotos, setSelectedPhotos] = useState(() =>
    Object.fromEntries(photoPaths.map((p) => [p, false]))
  );
  const { certificate, thesis } = useGraduation();
  const [includeGraduation, setIncludeGraduation] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setProfile(JSON.parse(stored));
      } catch (err) {
        console.warn('無法解析已儲存的個人資料', err);
      }
    }
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const coursesToInclude = courses.filter((c) => selectedCourses[c.slug]);
      const reportPaths = reportSlugs
        .filter((r) => selectedReports[r.path])
        .map((r) => r.path);
      const photosToInclude = Object.entries(selectedPhotos)
        .filter(([, checked]) => checked)
        .map(([p]) => p);

      const bytes = await generatePersonalizedPdf({
        profile,
        courses: coursesToInclude,
        selectedReportPaths: reportPaths,
        selectedPhotoPaths: photosToInclude,
        graduationCertificate: includeGraduation ? certificate : null,
        graduationThesis: includeGraduation ? thesis : null,
      });

      downloadPdfBytes(bytes, `${profile.name || '學習歷程'}.pdf`);
    } catch (err) {
      console.error(err);
      setError(err.message || 'PDF 生成失敗，請確認資料格式或稍後再試');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <section>
      <h1>下載個人化學習歷程 PDF</h1>

      <details open>
        <summary>確認個人資料</summary>
        <ProfileForm profile={profile} onChange={setProfile} />
      </details>

      <fieldset>
        <legend>選擇要收錄的課程</legend>
        {courses.map((c) => (
          <label key={c.slug} className="checkbox-row">
            <input
              type="checkbox"
              checked={!!selectedCourses[c.slug]}
              onChange={(e) =>
                setSelectedCourses((prev) => ({ ...prev, [c.slug]: e.target.checked }))
              }
            />
            {c.data.week} {c.data.courseTitle}
          </label>
        ))}
      </fieldset>

      {reportSlugs.length > 0 && (
        <fieldset>
          <legend>選擇要收錄的分組報告</legend>
          {reportSlugs.map((r) => (
            <label key={r.path} className="checkbox-row">
              <input
                type="checkbox"
                checked={!!selectedReports[r.path]}
                onChange={(e) =>
                  setSelectedReports((prev) => ({ ...prev, [r.path]: e.target.checked }))
                }
              />
              {r.filename}
            </label>
          ))}
        </fieldset>
      )}

      {photoPaths.length > 0 && (
        <fieldset>
          <legend>選擇要收錄的課堂照片</legend>
          {photoPaths.map((p) => (
            <label key={p} className="checkbox-row">
              <input
                type="checkbox"
                checked={!!selectedPhotos[p]}
                onChange={(e) =>
                  setSelectedPhotos((prev) => ({ ...prev, [p]: e.target.checked }))
                }
              />
              {p}
            </label>
          ))}
        </fieldset>
      )}

      {(certificate || thesis) && (
        <fieldset>
          <legend>我的畢業證書 / 論文</legend>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={includeGraduation}
              onChange={(e) => setIncludeGraduation(e.target.checked)}
            />
            收錄畢業證書與論文
          </label>
        </fieldset>
      )}
      {!certificate && !thesis && (
        <p>
          尚未上傳畢業證書/論文，如果要收錄進 PDF，請先到「我的畢業證書/論文」頁面上傳（同一分頁內有效）。
        </p>
      )}

      <button onClick={handleGenerate} disabled={generating}>
        {generating ? '生成中...' : '生成並下載 PDF'}
      </button>
      {error && <p className="error">{error}</p>}
    </section>
  );
}

export async function getStaticProps() {
  const fs = require('fs');
  const path = require('path');

  const courses = getAllCourses();

  const reportsDir = path.join(process.cwd(), 'public', 'reports');
  const reportSlugs = fs.existsSync(reportsDir)
    ? fs
        .readdirSync(reportsDir)
        .filter((f) => f.endsWith('.pdf'))
        .map((filename) => ({ filename, path: `/reports/${filename}` }))
    : [];

  const photoPaths = courses.flatMap((c) => c.data.photos || []);

  return { props: { courses, reportSlugs, photoPaths } };
}
