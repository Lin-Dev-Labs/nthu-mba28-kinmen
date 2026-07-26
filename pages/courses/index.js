import CourseCard from '../../components/CourseCard';
import { getAllCourses } from '../../lib/courses';

export default function Courses({ courses }) {
  return (
    <section>
      <h1>課程總覽</h1>
      <div className="course-grid">
        {courses.map(({ slug, data }) => (
          <CourseCard key={slug} slug={slug} course={data} />
        ))}
      </div>
    </section>
  );
}

export async function getStaticProps() {
  const courses = getAllCourses();
  return { props: { courses } };
}
