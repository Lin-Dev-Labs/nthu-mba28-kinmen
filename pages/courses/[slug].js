import { useState } from 'react';
import PdfModal from '../../components/PdfModal';
import { getAllCourseSlugs, getCourseBySlug } from '../../lib/courses';
import { withBasePath } from '../../lib/basePath';

export default function CoursePage({ slug, course, reportUrl }) {
  const [modalUrl, setModalUrl] = useState(null);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  return (
    <section>
      <h1>
        {course.week} {course.courseTitle}
      </h1>

      {course.instructor?.name && (
        <div className="instructor">
          {course.instructor.photo && (
            <img src={withBasePath(course.instructor.photo)} alt={course.instructor.name} />
          )}
          <div>
            <strong>{course.instructor.name}</strong>
            <p>{course.instructor.title}</p>
            <p>{course.instructor.bio}</p>
          </div>
        </div>
      )}

      {course.content && (
        <div>
          <h2>課程內容</h2>
          <p>{course.content}</p>
        </div>
      )}

      {course.caseDiscussion && (
        <div>
          <h2>個案討論</h2>
          <p>{course.caseDiscussion}</p>
        </div>
      )}

      {course.groupProject && (
        <div>
          <h2>分組報告</h2>
          <p>{course.groupProject}</p>
        </div>
      )}

      {reportUrl && (
        <div>
          <h2>分組報告檔案</h2>
          <button onClick={() => setModalUrl(reportUrl)}>瀏覽報告</button>
        </div>
      )}

      {course.photos?.length > 0 && (
        <div>
          <h2>課堂照片</h2>
          <div className="photo-gallery">
            {course.photos.map((src) => (
              <img
                key={src}
                src={withBasePath(src)}
                alt="課堂照片"
                className="photo-thumb"
                onClick={() => setLightboxPhoto(src)}
              />
            ))}
          </div>
        </div>
      )}

      {modalUrl && (
        <PdfModal fileUrl={withBasePath(modalUrl)} title="分組報告" onClose={() => setModalUrl(null)} />
      )}

      {lightboxPhoto && (
        <div className="lightbox-overlay" onClick={() => setLightboxPhoto(null)}>
          <img src={withBasePath(lightboxPhoto)} alt="課堂照片放大" />
        </div>
      )}
    </section>
  );
}

export async function getStaticPaths() {
  const slugs = getAllCourseSlugs();
  return {
    paths: slugs.map((slug) => ({ params: { slug } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const course = getCourseBySlug(params.slug);
  const fs = require('fs');
  const path = require('path');
  const reportsDir = path.join(process.cwd(), 'public', 'reports');
  let reportUrl = null;
  if (fs.existsSync(reportsDir)) {
    const match = fs
      .readdirSync(reportsDir)
      .find((f) => f.startsWith(params.slug) && f.endsWith('.pdf'));
    if (match) reportUrl = `/reports/${match}`;
  }

  return { props: { slug: params.slug, course, reportUrl } };
}
