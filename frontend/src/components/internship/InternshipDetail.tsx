
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Award,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  Clock3,
  MapPin,
  Star,
  Users,
} from "lucide-react";

import CourseImage from "@/components/courses/CourseImage";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";

import {
  internshipRequest,
  type Internship,
} from "@/lib/internshipsApi";

import "@/components/courses/CourseDetails.css";

export default function InternshipDetail({
  slug,
}: {
  slug: string;
}) {
  const [internship, setInternship] = useState<Internship | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError(null);
    setInternship(null);

    internshipRequest<Internship>(
      `/api/internships/${encodeURIComponent(slug)}`
    )
      .then((record) => {
        if (active) {
          setInternship(record);
        }
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Internship details could not be loaded."
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [slug]);

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen bg-[#F5FAFD] text-slate-900">
        <Navbar />

        <section className="course-details-page px-4 pb-16 pt-24 sm:px-8 sm:pt-32">
          <div className="mx-auto max-w-6xl">
            <p
              className="text-center text-sm text-slate-600"
              role="status"
            >
              Loading internship details…
            </p>
          </div>
        </section>

        <Footer />
      </main>
    );
  }

  // Error or not-found state
  if (error || !internship) {
    return (
      <main className="min-h-screen bg-[#F5FAFD] text-slate-900">
        <Navbar />

        <section className="course-details-page px-4 pb-16 pt-24 sm:px-8 sm:pt-32">
          <div className="mx-auto max-w-6xl">
            <div
              className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center"
              role="alert"
            >
              <p className="text-sm text-amber-950">
                {error ?? "This internship is not currently available."}
              </p>

              <Link
                className="course-button course-button-primary mt-4"
                href="/internship"
              >
                Browse internships
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    );
  }

  // Available internship information
  const hasSkills = internship.skills.length > 0;
  const hasEligibility = Boolean(internship.eligibility?.trim());
  const hasStartDate = Boolean(internship.start_date);
  const hasCertificates = internship.certificates.length > 0;
  const hasDetails =
    hasSkills ||
    hasEligibility ||
    hasStartDate ||
    hasCertificates;

  return (
    <main className="min-h-screen overflow-x-clip bg-[#F5FAFD] text-slate-900">
      <Navbar />

      <section className="course-details-page px-4 pb-16 pt-24 sm:px-8 sm:pb-20 sm:pt-32">
        <div className="course-details-container mx-auto max-w-6xl">

          {/* =========================================
              INTERNSHIP HERO
          ========================================= */}
          <section
            className="course-hero internship-detail-hero"
            aria-labelledby="internship-title"
          >
            <div className="course-image-frame">
              <CourseImage
                alt={`${internship.title} internship`}
                className="course-hero-image"
                fallback={
                  <div
                    aria-hidden="true"
                    className="course-image-fallback"
                  >
                    <BriefcaseBusiness size={40} />
                  </div>
                }
                src={internship.cover_image_url}
              />
            </div>

            <div className="course-hero-content">
              <p className="course-category">
                Internship opportunity

                {internship.internship_type && (
                  <>
                    <span aria-hidden="true"> · </span>
                    {internship.internship_type}
                  </>
                )}
              </p>

              <h1
                className="course-title"
                id="internship-title"
              >
                {internship.title}
              </h1>

              {internship.short_description && (
                <p className="course-description">
                  {internship.short_description}
                </p>
              )}

              {/* Internship metadata */}
              <dl className="course-metadata">
                <div className="course-metadata-item">
                  <dt>
                    <Clock3 aria-hidden="true" size={15} />
                    Duration
                  </dt>

                  <dd>
                    {internship.duration_months} month
                    {internship.duration_months === 1 ? "" : "s"}
                  </dd>
                </div>

                {internship.internship_type && (
                  <div className="course-metadata-item">
                    <dt>
                      <MapPin aria-hidden="true" size={15} />
                      Type
                    </dt>

                    <dd className="capitalize">
                      {internship.internship_type}
                    </dd>
                  </div>
                )}

                {internship.application_deadline && (
                  <div className="course-metadata-item">
                    <dt>
                      <CalendarDays aria-hidden="true" size={15} />
                      Deadline
                    </dt>

                    <dd>{internship.application_deadline}</dd>
                  </div>
                )}

                {internship.positions != null && (
                  <div className="course-metadata-item">
                    <dt>
                      <Users aria-hidden="true" size={15} />
                      Positions
                    </dt>

                    <dd>{internship.positions}</dd>
                  </div>
                )}
              </dl>

              {/* Stipend is informational, not a cart price */}
              {internship.stipend_details && (
                <p className="course-price">
                  <span>Stipend information</span>
                  <strong>{internship.stipend_details}</strong>
                </p>
              )}

              {/* Hero actions */}
              <div className="course-actions">
                <Link
                  className="course-button course-button-primary"
                  href={`/admissions?type=internship&internship=${encodeURIComponent(
                    internship.slug
                  )}`}
                >
                  Apply for Internship
                </Link>

                <Link
                  className="course-button course-button-secondary"
                  href="/internship"
                >
                  Explore More
                </Link>
              </div>
            </div>
          </section>

          {/* =========================================
              ABOUT THIS INTERNSHIP
          ========================================= */}
          {internship.full_description?.trim() && (
            <section className="course-content-card course-curriculum">
              <div className="course-section-icon course-curriculum-icon">
                <BriefcaseBusiness
                  aria-hidden="true"
                  size={23}
                />
              </div>

              <div className="course-curriculum-copy">
                <h2>About This Internship</h2>

                <span
                  className="course-curriculum-accent"
                  aria-hidden="true"
                />

                <p className="course-curriculum-text whitespace-pre-line">
                  {internship.full_description}
                </p>
              </div>
            </section>
          )}

          {/* =========================================
              INTERNSHIP INFORMATION — 2 x 2 GRID

              Row 1: Eligibility | Starting Date
              Row 2: Internship Skills | Certificates
          ========================================= */}
          {hasDetails && (
            <div className="internship-detail-grid">

              {/* ROW 1 — ELIGIBILITY */}
              {hasEligibility && (
                <section
                  className="course-content-card internship-info-card internship-detail-card"
                  aria-labelledby="internship-eligibility"
                >
                  <div className="course-section-heading">
                    <div className="course-section-icon">
                      <Users
                        aria-hidden="true"
                        size={21}
                      />
                    </div>

                    <h2 id="internship-eligibility">
                      Eligibility
                    </h2>
                  </div>

                  <p className="internship-info-text whitespace-pre-line">
                    {internship.eligibility}
                  </p>
                </section>
              )}

              {/* ROW 1 — STARTING DATE */}
              {hasStartDate && (
                <section
                  className="course-content-card internship-info-card internship-detail-card"
                  aria-labelledby="internship-start-date"
                >
                  <div className="course-section-heading">
                    <div className="course-section-icon">
                      <CalendarDays
                        aria-hidden="true"
                        size={21}
                      />
                    </div>

                    <h2 id="internship-start-date">
                      Starting Date
                    </h2>
                  </div>

                  <div className="internship-date-content">
                    <span className="internship-info-label">
                      Internship begins
                    </span>

                    <strong>{internship.start_date}</strong>
                  </div>
                </section>
              )}

              {/* ROW 2 — INTERNSHIP SKILLS */}
              {hasSkills && (
                <section
                  className="course-content-card course-benefits internship-detail-card"
                  aria-labelledby="internship-skills"
                >
                  <div className="course-section-heading">
                    <div className="course-section-icon">
                      <Star
                        aria-hidden="true"
                        size={21}
                      />
                    </div>

                    <h2 id="internship-skills">
                      Internship Skills
                    </h2>
                  </div>

                  <ul>
                    {internship.skills.map((skill) => (
                      <li key={skill}>
                        <Check
                          aria-hidden="true"
                          size={17}
                        />

                        <span>{skill}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* ROW 2 — CERTIFICATES */}
              {hasCertificates && (
                <section
                  className="course-content-card course-certificates internship-detail-card"
                  aria-labelledby="internship-certificates"
                >
                  <div className="course-section-heading">
                    <div className="course-section-icon">
                      <Award
                        aria-hidden="true"
                        size={21}
                      />
                    </div>

                    <h2 id="internship-certificates">
                      Certificates
                    </h2>
                  </div>

                  <ul>
                    {internship.certificates.map((certificate) => (
                      <li key={certificate}>
                        <span className="course-certificate-check">
                          <Check
                            aria-hidden="true"
                            size={14}
                          />
                        </span>

                        <span>{certificate}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
