"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, BriefcaseBusiness, CircleCheck, FileEdit } from "lucide-react";
import { courseRequest, type CoursePage } from "@/lib/coursesApi";
import { type InternshipPage } from "@/lib/internshipsApi";
import { useAdminAuth, useAdminPage } from "@/components/admin/AdminAuth";

type DashboardSummary = {
  total: number;
  published: number;
  drafts: number;
  internships: number;
};

export default function AdminPage() {
  const { token } = useAdminAuth();
  useAdminPage("/admin", "Dashboard");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let active = true;
    Promise.all([
      courseRequest<CoursePage>("/api/admin/courses?limit=1", token),
      courseRequest<CoursePage>(
        "/api/admin/courses?limit=1&is_published=true",
        token
      ),
      courseRequest<CoursePage>(
        "/api/admin/courses?limit=1&is_published=false",
        token
      ),
      courseRequest<InternshipPage>(
        "/api/admin/internships?limit=1",
        token
      ),
    ])
      .then(([all, published, drafts, internships]) => {
        if (active) {
          setSummary({
            total: all.total,
            published: published.total,
            drafts: drafts.total,
            internships: internships.total,
          });
        }
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Dashboard information could not be loaded."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const stats = summary
    ? [
        { label: "Total courses", value: summary.total, icon: BookOpen },
        { label: "Published", value: summary.published, icon: CircleCheck },
        { label: "Drafts", value: summary.drafts, icon: FileEdit },
        { label: "Internships", value: summary.internships, icon: BriefcaseBusiness },
      ]
    : [];

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">
          Overview
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Current course and internship records from your Way2Skills database.
        </p>
      </div>

      {loading ? (
        <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600" role="status">
          Loading dashboard…
        </p>
      ) : error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800" role="alert">
          Dashboard data is unavailable. {error}
        </p>
      ) : summary && summary.total === 0 && summary.internships === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="font-semibold text-slate-900">No records yet</h3>
          <p className="mt-1 text-sm text-slate-600">
            Add a course or internship to begin managing your catalogue.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
              href="/admin/courses"
            >
              Add a course <ArrowRight aria-hidden="true" size={16} />
            </Link>
            <Link
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              href="/admin/internships"
            >
              Add an internship <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
        </div>
      ) : (
        <>
          <section
            aria-label="Course and internship totals"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            {stats.map(({ label, value, icon: Icon }) => (
              <article
                className="rounded-xl border border-slate-200 bg-white p-5"
                key={label}
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-slate-600">{label}</p>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-800">
                    <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
                  </span>
                </div>
                <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                  {value}
                </p>
              </article>
            ))}
          </section>
          <section className="mt-6 grid gap-4 md:grid-cols-2">
            <Link
              className="group rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
              href="/admin/courses"
            >
              <span className="flex items-center gap-2 font-semibold text-slate-900">
                <BookOpen aria-hidden="true" className="text-sky-700" size={18} />
                Manage courses
                <ArrowRight aria-hidden="true" className="ml-auto text-slate-400 transition-transform group-hover:translate-x-0.5" size={17} />
              </span>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Create, update, publish, or remove course listings.
              </p>
            </Link>
            <Link
              className="group rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
              href="/admin/internships"
            >
              <span className="flex items-center gap-2 font-semibold text-slate-900">
                <BriefcaseBusiness aria-hidden="true" className="text-sky-700" size={18} />
                View internships
                <ArrowRight aria-hidden="true" className="ml-auto text-slate-400 transition-transform group-hover:translate-x-0.5" size={17} />
              </span>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Create and manage internships independently from courses.
              </p>
            </Link>
          </section>
        </>
      )}
    </div>
  );
}
