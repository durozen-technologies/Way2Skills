"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  CircleCheck,
  ClipboardList,
  FileEdit,
  MessageSquareText,
} from "lucide-react";
import { courseRequest, type CoursePage } from "@/lib/coursesApi";
import { type InternshipPage } from "@/lib/internshipsApi";
import { useAdminAuth, useAdminPage } from "@/components/admin/AdminAuth";

type DashboardSummary = {
  total: number;
  published: number;
  drafts: number;
  internships: number;
  enquiries: number;
  admissions: number;
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
      courseRequest<{ contacts_total: number; admissions_total: number }>(
        "/api/admin/dashboard",
        token
      ),
    ])
      .then(([all, published, drafts, internships, records]) => {
        if (active) {
          setSummary({
            total: all.total,
            published: published.total,
            drafts: drafts.total,
            internships: internships.total,
            enquiries: records.contacts_total,
            admissions: records.admissions_total,
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
        { label: "Enquiries", value: summary.enquiries, icon: MessageSquareText },
        { label: "Admissions", value: summary.admissions, icon: ClipboardList },
      ]
    : [];

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">
          Overview
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Course, internship, enquiry, and admission totals from your database.
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
      ) : (
        <>
          <section
            aria-label="Database totals"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
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
