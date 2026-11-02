"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Award,
  BookOpen,
  Check,
  Clock3,
  Monitor,
  Signal,
  Star,
  Tag,
} from "lucide-react";
import "./CourseDetails.css";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import CourseImage from "@/components/courses/CourseImage";
import { courseRequest, type Course } from "@/lib/coursesApi";

type CourseDetailsProps = {
  slug: string;
};

export default function CourseDetails({ slug }: CourseDetailsProps) {
  const [course, setCourse] = useState<Course | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [descriptionCanExpand, setDescriptionCanExpand] = useState(false);
  const descriptionTextRef = useRef<HTMLParagraphElement>(null);

  const benefits = course?.benefits
    ?.split(/\r?\n/)
    .map((benefit) => benefit.trim())
    .filter(Boolean);
  useEffect(() => {
    const text = descriptionTextRef.current;
    if (!text || descriptionExpanded) return;

    const measureOverflow = () => {
      setDescriptionCanExpand(text.scrollHeight > text.clientHeight + 1);
    };
    measureOverflow();
    const observer = new ResizeObserver(measureOverflow);
    observer.observe(text);
    return () => observer.disconnect();
  }, [descriptionExpanded, course?.full_description]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    courseRequest<Course>(`/api/courses/${encodeURIComponent(slug)}`)
      .then((record) => {
        if (active) {
          setCourse(record);
          setDescriptionExpanded(false);
          setDescriptionCanExpand(false);
        }
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Course details could not be loaded."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  const priceValue = course?.price?.trim();
  const numericPrice = priceValue ? Number(priceValue) : Number.NaN;
  const displayPrice =
    Number.isFinite(numericPrice) && numericPrice > 0
      ? new Intl.NumberFormat("en-IN", {
          maximumFractionDigits: 2,
        }).format(numericPrice)
      : null;

  return (
    <main className="min-h-screen overflow-x-clip bg-[#F5FAFD] text-slate-900">
      <Navbar />
      <section className="course-details-page px-4 pb-16 pt-24 sm:px-8 sm:pb-20 sm:pt-32">
        <div className="course-details-container mx-auto max-w-6xl">
          {loading ? (
            <p className="text-center text-sm text-slate-600" role="status">
              Loading course details…
            </p>
          ) : error || !course ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
              <p className="text-sm text-amber-950" role="alert">
                {error ?? "This course is not currently available."}
              </p>
              <Link
                className="course-button course-button-primary mt-4"
                href="/"
              >
                Back to homepage
              </Link>
            </div>
          ) : (
            <>
              <section className="course-hero" aria-labelledby="course-title">
                <div className="course-image-frame">
                  <CourseImage
                    alt={`${course.title} course`}
                    className="course-hero-image"
                    fallback={
                      <div
                        aria-hidden="true"
                        className="course-image-fallback"
                      >
                        <BookOpen aria-hidden="true" size={40} />
                      </div>
                    }
                    src={course.image_url}
                  />
                </div>

                <div className="course-hero-content">
                  <p className="course-category">
                    {course.category} <span aria-hidden="true">·</span>{" "}
                    {course.course_type}
                  </p>
                  <h1 className="course-title" id="course-title">
                    {course.title}
                  </h1>
                  <p className="course-description">
                    {course.short_description || course.full_description}
                  </p>

                  <dl className="course-metadata">
                    <div className="course-metadata-item">
                      <dt>
                        <Clock3 aria-hidden="true" size={15} />
                        Duration
                      </dt>
                      <dd>{course.duration}</dd>
                    </div>
                    {Number(course.internship_duration_months ?? course.internship_period) > 0 && (
                      <div className="course-metadata-item">
                        <dt>
                          <Award aria-hidden="true" size={15} />
                          Internship
                        </dt>
                        <dd>
                          {Number(course.internship_duration_months ?? course.internship_period)}{" "}
                          Month{Number(course.internship_duration_months ?? course.internship_period) === 1 ? "" : "s"}*
                        </dd>
                      </div>
                    )}
                    <div className="course-metadata-item">
                      <dt>
                        <Signal aria-hidden="true" size={15} />
                        Level
                      </dt>
                      <dd>{course.level}</dd>
                    </div>
                    <div className="course-metadata-item">
                      <dt>
                        <Monitor aria-hidden="true" size={15} />
                        Mode
                      </dt>
                      <dd>{course.delivery_mode}</dd>
                    </div>
                    <div className="course-metadata-item">
                      <dt>
                        <Tag aria-hidden="true" size={15} />
                        Category
                      </dt>
                      <dd>{course.category}</dd>
                    </div>
                  </dl>

                  {displayPrice && (
                    <p className="course-price">
                      <span>Programme fee</span>
                      <strong>₹{displayPrice}</strong>
                    </p>
                  )}

                  <div className="course-actions">
                    {course.course_type === "internship" ? (
                      <Link
                        className="course-button course-button-primary"
                        href="/contact"
                      >
                        Enquire about this internship
                      </Link>
                    ) : (
                      <Link
                        className="course-button course-button-primary"
                        href={`/admissions?course=${encodeURIComponent(course.slug)}`}
                      >
                        Enquire about this programme
                      </Link>
                    )}
                    <Link
                      className="course-button course-button-secondary"
                      href="/"
                    >
                      Explore more
                    </Link>
                  </div>
                </div>
              </section>

              {course.full_description.trim() && (
                <section className="course-content-card course-curriculum">
                  <div className="course-section-icon course-curriculum-icon">
                    <BookOpen aria-hidden="true" size={23} />
                  </div>
                  <div className="course-curriculum-copy">
                    <h2>About the Course</h2>
                    <span className="course-curriculum-accent" aria-hidden="true" />
                    <p
                      ref={descriptionTextRef}
                      className={
                        !descriptionExpanded
                          ? "course-curriculum-text course-curriculum-text-collapsed"
                          : "course-curriculum-text"
                      }
                    >
                      {course.full_description}
                    </p>
                    {descriptionCanExpand && (
                      <button
                        aria-expanded={descriptionExpanded}
                        className="course-curriculum-toggle"
                        onClick={() =>
                          setDescriptionExpanded((expanded) => !expanded)
                        }
                        type="button"
                      >
                        {descriptionExpanded ? "Show less" : "Read more"}
                      </button>
                    )}
                  </div>
                </section>
              )}

              {(benefits && benefits.length > 0 ||
                course.certificates.length > 0) && (
                <div
                  className={`course-lower-content ${
                    benefits &&
                    benefits.length > 0 &&
                    course.certificates.length > 0
                      ? "course-lower-content-balanced"
                      : ""
                  }`}
                >
                  {benefits && benefits.length > 0 && (
                    <section className="course-content-card course-benefits">
                      <div className="course-section-heading">
                        <div className="course-section-icon">
                          <Star aria-hidden="true" size={22} />
                        </div>
                        <h2>Course / Internship / Program Benefits</h2>
                      </div>
                      <ul>
                        {benefits.map((benefit, index) => (
                          <li key={`${index}-${benefit}`}>
                            <Check aria-hidden="true" size={17} />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                  {course.certificates.length > 0 && (
                    <section className="course-content-card course-certificates">
                      <div className="course-section-heading">
                        <div className="course-section-icon">
                          <Award aria-hidden="true" size={22} />
                        </div>
                        <h2>Certificates</h2>
                      </div>
                      <ul>
                        {course.certificates.map((certificate) => (
                          <li key={certificate}>
                            <span className="course-certificate-check">
                              <Check aria-hidden="true" size={14} />
                            </span>
                            <span>{certificate}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
