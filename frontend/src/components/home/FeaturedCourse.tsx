"use client";

import { useEffect, useMemo, useState } from "react";
import CourseCard from "@/components/courses/CourseCard";
import { courseRequest, type Course } from "@/lib/coursesApi";

export default function FeaturedCourse() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      courseRequest<Course[]>("/api/courses"),
      courseRequest<Course[]>("/api/programmes"),
    ])
      .then(([courseItems, programmeItems]) => {
        if (active) setCourses([...courseItems, ...programmeItems]);
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Courses could not be loaded."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(
    () => ["All", ...new Set(courses.map((course) => course.category))],
    [courses]
  );
  
  const visibleCourses = useMemo(
    () =>
      (activeCategory === "All"
        ? courses
        : courses.filter((course) => course.category === activeCategory)
      ).slice(0, 6),
    [activeCategory, courses]
  );


  return (
    <section
      id="course"
      className="w2s-course-section relative isolate overflow-hidden px-4 py-12 text-slate-900 sm:px-8 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 text-left sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700">
              Learn with Way2Skills
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#101820] sm:text-4xl lg:text-5xl">
              Explore Our Courses
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
              Explore published courses and programmes built around practical learning.
            </p>
          </div>
          {!loading && !error && (
            <span className="w-fit rounded-full border border-sky-200 bg-white/60 px-3.5 py-1.5 text-xs font-semibold text-sky-900 sm:px-4 sm:py-2">
              Showing {Math.min(visibleCourses.length, 6)} of {courses.length} Published Courses & Programmes
            </span>
          )}
        </header>

        {!loading && !error && categories.length > 1 && (
          <div
            aria-label="Filter courses by category"
            className="mt-7 flex flex-wrap justify-start gap-2"
          >
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                aria-pressed={activeCategory === category}
                onClick={() => setActiveCategory(category)}
                className={`min-h-10 rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-2 ${
                  activeCategory === category
                    ? "border-blue-700 bg-blue-700 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-sky-400 hover:text-sky-800"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <p className="mt-8 text-center text-sm text-slate-600" role="status">
            Loading courses…
          </p>
        ) : error ? (
          <div
            className="mx-auto mt-8 max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-5 text-center text-sm text-red-800"
            role="alert"
          >
            Courses are temporarily unavailable. {error}
          </div>
        ) : visibleCourses.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
            {courses.length === 0
              ? "No published courses are available yet."
              : "No courses are available in this category."}
          </p>
        
        ) : (
          <>
            <div
              id="featured-courses"
              className="mt-8 grid min-w-0 grid-cols-1 justify-items-center gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3"
            >
              {visibleCourses.map((course) => (
                <CourseCard
                  course={course}
                  index={courses.findIndex((item) => item.id === course.id)}
                  key={course.id}
                />
              ))}
            </div>

            <div className="mt-10 flex justify-center">
              <a
                href="/courses"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-sky-700 bg-blue-700 px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:border-sky-800 hover:bg-sky-800 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-2"
              >
                View All Courses
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

