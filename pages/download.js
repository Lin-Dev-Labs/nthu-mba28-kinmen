import { useEffect, useState } from 'react';
import ProfileForm from '../components/ProfileForm';
import { generatePersonalizedPdf, downloadPdfBytes } from '../components/PdfGenerator';
import profileTemplate from '../data/profile-template.json';
import { getAllCourses } from '../lib/courses';

const STORAGE_KEY = 'mba-profile';

export default function Download({ courses, reportSlugs, photoPaths, graduationPaths }) {
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
  const [includeGraduation, setIncludeGraduation] = useState(false);
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
        graduationPaths: includeGraduation ? graduationPaths : {},
      });

      downloadPdfBytes(bytes, `${profile.name || '學習歷程'}.pdf`);
    } catch (err) {
      console.error(err);
      setError('PDF 生成失敗，請確認資料格式或稍後再試');
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

      {(graduationPaths.certificateImage || graduationPaths.thesisPdf) && (
        <fieldset>
          <legend>畢業證書 / 論文</legend>
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

  const graduationDir = path.join(process.cwd(), 'public', 'graduation');
  let graduationPaths = {};
  if (fs.existsSync(graduationDir)) {
    const files = fs.readdirSync(graduationDir);
    const cert = files.find((f) => /\.(png|jpe?g)$/i.test(f));
    const thesis = files.find((f) => f.endsWith('.pdf'));
    graduationPaths = {
      certificateImage: cert ? `/graduation/${cert}` : null,
      thesisPdf: thesis ? `/graduation/${thesis}` : null,
    };
  }

  return { props: { courses, reportSlugs, photoPaths, graduationPaths } };
}
