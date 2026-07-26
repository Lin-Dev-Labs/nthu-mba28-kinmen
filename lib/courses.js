import fs from 'fs';
import path from 'path';

const coursesDir = path.join(process.cwd(), 'data', 'courses');

export function getAllCourseSlugs() {
  return fs
    .readdirSync(coursesDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''))
    .sort();
}

export function getCourseBySlug(slug) {
  const filePath = path.join(coursesDir, `${slug}.json`);
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

export function getAllCourses() {
  return getAllCourseSlugs().map((slug) => ({
    slug,
    data: getCourseBySlug(slug),
  }));
}
