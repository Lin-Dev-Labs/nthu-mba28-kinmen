import Link from 'next/link';

export default function CourseCard({ slug, course }) {
  return (
    <Link href={`/courses/${slug}`} className="course-card">
      <div className="course-card-week">{course.week}</div>
      <h3>{course.courseTitle}</h3>
      <p>{course.instructor?.name}</p>
    </Link>
  );
}
