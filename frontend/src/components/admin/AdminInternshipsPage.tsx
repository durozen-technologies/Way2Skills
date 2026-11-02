"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  BriefcaseBusiness,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useAdminAuth, useAdminPage } from "@/components/admin/AdminAuth";
import {
  COURSE_CERTIFICATES,
  type CourseCertificate,
} from "@/lib/coursesApi";
import {
  internshipRequest,
  type Internship,
  type InternshipPage,
} from "@/lib/internshipsApi";
import AdminPagination from "@/components/admin/AdminPagination";

type InternshipDraft = {
  title: string;
  slug: string;
  short_description: string;
  full_description: string;
  duration_months: string;
  eligibility: string;
  cover_image_url: string;
  skills: string;
  certificates: CourseCertificate[];
  internship_type: "" | "onsite" | "remote" | "hybrid";
  stipend_details: string;
  start_date: string;
  application_deadline: string;
  positions: string;
  is_published: boolean;
};

const PAGE_SIZE = 10;

const emptyDraft: InternshipDraft = {
  title: "",
  slug: "",
  short_description: "",
  full_description: "",
  duration_months: "",
  eligibility: "",
  cover_image_url: "",
  skills: "",
  certificates: [],
  internship_type: "",
  stipend_details: "",
  start_date: "",
  application_deadline: "",
  positions: "",
  is_published: false,
};

function slugFromTitle(title: string): string {
  const slug = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug.length >= 2 ? slug : "internship";
}

function toDraft(internship: Internship): InternshipDraft {
  return {
    title: internship.title,
    slug: internship.slug,
    short_description: internship.short_description,
    full_description: internship.full_description,
    duration_months: String(internship.duration_months),
    eligibility: internship.eligibility ?? "",
    cover_image_url: internship.cover_image_url ?? "",
    skills: internship.skills.join("\n"),
    certificates: internship.certificates ?? [],
    internship_type: internship.internship_type ?? "",
    stipend_details: internship.stipend_details ?? "",
    start_date: internship.start_date ?? "",
    application_deadline: internship.application_deadline ?? "",
    positions: internship.positions == null ? "" : String(internship.positions),
    is_published: internship.is_published,
  };
}

function optionalText(value: string): string | null {
  return value.trim() || null;
}

export default function AdminInternshipsPage() {
  const { token } = useAdminAuth();
  useAdminPage("/admin/internships", "Internships");
  const [page, setPage] = useState<InternshipPage | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadInternships = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    const query = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(offset),
    });
    if (search.trim()) query.set("search", search.trim());
    if (statusFilter) query.set("is_published", statusFilter);
    try {
      const result = await internshipRequest<InternshipPage>(
        `/api/admin/internships?${query.toString()}`,
        token
      );
      const lastOffset =
        Math.max(0, Math.ceil(result.total / PAGE_SIZE) - 1) * PAGE_SIZE;
      if (offset > lastOffset) {
        setOffset(lastOffset);
        return;
      }
      setPage(result);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Internship records could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }, [offset, search, statusFilter, token]);

  useEffect(() => {
    void loadInternships();
  }, [loadInternships]);

  function closeEditor() {
    setEditorOpen(false);
    setEditingId(null);
    setDraft(emptyDraft);
    setFormError(null);
  }

  function editInternship(internship: Internship) {
    setEditingId(internship.id);
    setDraft(toDraft(internship));
    setFormError(null);
    setNotice(null);
    setEditorOpen(true);
  }

  async function saveInternship(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const months = Number(draft.duration_months);
    if (!Number.isInteger(months) || months < 1) {
      setFormError("Duration must be a positive whole number of months.");
      return;
    }
    if (
      draft.positions.trim() &&
      (!/^\d+$/.test(draft.positions.trim()) || Number(draft.positions) < 1)
    ) {
      setFormError("Available positions must be a positive whole number.");
      return;
    }
    if (
      draft.start_date &&
      draft.application_deadline &&
      draft.application_deadline < draft.start_date
    ) {
      setFormError("Application deadline cannot be before the start date.");
      return;
    }

    setSaving(true);
    setFormError(null);
    setNotice(null);
    const payload = {
      ...draft,
      slug: editingId ? draft.slug : slugFromTitle(draft.title),
      duration_months: months,
      eligibility: optionalText(draft.eligibility),
      cover_image_url: optionalText(draft.cover_image_url),
      skills: draft.skills
        .split(/\r?\n/)
        .map((skill) => skill.trim())
        .filter(Boolean),
      certificates: draft.certificates,
      internship_type: draft.internship_type || null,
      stipend_details: optionalText(draft.stipend_details),
      start_date: draft.start_date || null,
      application_deadline: draft.application_deadline || null,
      positions: draft.positions.trim() ? Number(draft.positions) : null,
    };
    try {
      await internshipRequest<Internship>(
        editingId ? `/api/admin/internships/${editingId}` : "/api/admin/internships",
        token ?? undefined,
        {
          method: editingId ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        }
      );
      setNotice(editingId ? "Internship updated." : "Internship created.");
      closeEditor();
      await loadInternships();
    } catch (requestError) {
      setFormError(
        requestError instanceof Error
          ? requestError.message
          : "The internship could not be saved."
      );
    } finally {
      setSaving(false);
    }
  }

  async function togglePublication(internship: Internship) {
    if (!token) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await internshipRequest<Internship>(
        `/api/admin/internships/${internship.id}`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify({ is_published: !internship.is_published }),
        }
      );
      setNotice(internship.is_published ? "Internship unpublished." : "Internship published.");
      await loadInternships();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Publication status could not be updated."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteInternship(internship: Internship) {
    if (!token || !window.confirm(`Delete "${internship.title}"? This cannot be undone.`)) {
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await internshipRequest<void>(
        `/api/admin/internships/${internship.id}`,
        token,
        { method: "DELETE" }
      );
      setNotice("Internship deleted.");
      const nextTotal = Math.max(0, (page?.total ?? 1) - 1);
      const lastPageOffset = Math.max(0, Math.ceil(nextTotal / PAGE_SIZE) - 1) * PAGE_SIZE;
      const targetOffset = Math.min(offset, lastPageOffset);
      if (targetOffset !== offset) {
        setOffset(targetOffset);
      } else {
        await loadInternships();
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The internship could not be deleted."
      );
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100";
  const labelClass = "block text-sm font-medium text-slate-700";

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Internship management
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Manage internship records separately from training courses.
          </p>
        </div>
        <button
          className="inline-flex min-h-10 items-center gap-2 rounded-full bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 disabled:opacity-60"
          disabled={saving}
          onClick={() => {
            setEditingId(null);
            setDraft(emptyDraft);
            setFormError(null);
            setEditorOpen(true);
          }}
          type="button"
        >
          <Plus aria-hidden="true" size={17} /> Add Internship
        </button>
      </div>

      {notice && (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800" role="status">
          {notice}
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      <div className="mb-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
        <label className="relative block">
          <span className="sr-only">Search internships</span>
          <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input
            className="min-h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
            onChange={(event) => {
              setOffset(0);
              setSearch(event.target.value);
            }}
            placeholder="Search internships..."
            type="search"
            value={search}
          />
        </label>
        <label className="block">
          <span className="sr-only">Filter by publication status</span>
          <select
            className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
            onChange={(event) => {
              setOffset(0);
              setStatusFilter(event.target.value);
            }}
            value={statusFilter}
          >
            <option value="">All statuses</option>
            <option value="true">Published</option>
            <option value="false">Draft</option>
          </select>
        </label>
      </div>

      {loading ? (
        <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600" role="status">
          Loading internships…
        </p>
      ) : page?.items.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {page.items.map((internship) => (
            <article
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 sm:p-5 md:p-6"
              key={internship.id}
            >
              <div>
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-800">
                    <BriefcaseBusiness aria-hidden="true" size={19} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="break-words font-semibold text-slate-950 text-base leading-snug">
                      {internship.title}
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm text-slate-600 break-words">
                      {internship.duration_months} month{internship.duration_months === 1 ? "" : "s"}
                      {internship.internship_type && ` · ${internship.internship_type}`}
                      {internship.stipend_details && ` · ${internship.stipend_details}`}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      internship.is_published
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {internship.is_published ? "Published" : "Draft"}
                  </span>
                </div>

                <p className="mt-3 sm:mt-4 line-clamp-2 text-sm leading-6 text-slate-700 break-words">
                  {internship.short_description}
                </p>

                {/* Metadata badges */}
                <div className="mt-3 flex flex-wrap gap-1.5 sm:gap-2 text-xs">
                  <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium text-slate-700">
                    Duration: {internship.duration_months} mo
                  </span>
                  {internship.internship_type && (
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600">
                      {internship.internship_type}
                    </span>
                  )}
                  {internship.skills.length > 0 && (
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600">
                      Skills: {internship.skills.slice(0, 3).join(", ")}
                      {internship.skills.length > 3 ? "…" : ""}
                    </span>
                  )}
                  {internship.certificates.length > 0 && (
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600">
                      Certificates: {internship.certificates.length}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions Row with accessible touch targets */}
              <div className="mt-4 sm:mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-3.5 sm:pt-4">
                <button
                  className="inline-flex min-h-10 flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                  disabled={saving}
                  onClick={() => editInternship(internship)}
                  type="button"
                >
                  <Pencil aria-hidden="true" size={15} /> Edit
                </button>
                <button
                  className="inline-flex min-h-10 flex-1 sm:flex-initial items-center justify-center rounded-lg border border-slate-300 px-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                  disabled={saving}
                  onClick={() => void togglePublication(internship)}
                  type="button"
                >
                  {internship.is_published ? "Unpublish" : "Publish"}
                </button>
                <button
                  className="inline-flex min-h-10 w-full sm:w-auto items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3.5 text-sm font-medium text-red-700 hover:bg-red-50 active:bg-red-100 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
                  disabled={saving}
                  onClick={() => void deleteInternship(internship)}
                  type="button"
                >
                  <Trash2 aria-hidden="true" size={15} /> Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="font-semibold text-slate-900">No internship records</h3>
          <p className="mt-1 text-sm text-slate-600">
            {search || statusFilter
              ? "No internships match these filters."
              : "Create an internship here. It will remain a draft until published."}
          </p>
        </div>
      )}

      <AdminPagination
        itemLabel="internships"
        loading={loading}
        offset={offset}
        onPageChange={(newOffset) => {
          setOffset(newOffset);
        }}
        pageSize={PAGE_SIZE}
        total={page?.total ?? 0}
      />

      {editorOpen && (
        <div
          aria-labelledby="internship-editor-title"
          aria-modal="true"
          className="fixed inset-0 z-[60] flex items-end justify-center overflow-y-auto bg-slate-950/50 p-0 sm:items-center sm:p-5"
          role="dialog"
        >
          <form
            className="my-auto max-h-[100dvh] w-full max-w-4xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:max-h-[calc(100dvh-2.5rem)] sm:rounded-2xl sm:p-7"
            onSubmit={saveInternship}
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Internship details</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950" id="internship-editor-title">
                  {editingId ? "Edit Internship" : "Add Internship"}
                </h2>
              </div>
              <button
                aria-label="Close internship editor"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                disabled={saving}
                onClick={closeEditor}
                type="button"
              >
                <X aria-hidden="true" size={19} />
              </button>
            </header>
            {formError && (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800" role="alert">
                {formError}
              </p>
            )}
            <div className="mt-5 grid gap-x-4 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              <div className="sm:col-span-2 lg:col-span-3">
                <h3 className="text-sm font-semibold text-slate-900">Overview</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Set the internship identity, duration, and public description.
                </p>
              </div>
              <label className={labelClass}>
                Internship title
                <input className={inputClass} maxLength={160} minLength={2} onChange={(event) => setDraft({ ...draft, title: event.target.value, ...(!editingId ? { slug: slugFromTitle(event.target.value) } : {}) })} required value={draft.title} />
              </label>
              <label className={labelClass}>
                Internship duration (months)
                <input className={inputClass} min={1} onChange={(event) => setDraft({ ...draft, duration_months: event.target.value })} required step={1} type="number" value={draft.duration_months} />
              </label>
              <label className={labelClass}>
                Internship type (optional)
                <select className={inputClass} onChange={(event) => setDraft({ ...draft, internship_type: event.target.value as InternshipDraft["internship_type"] })} value={draft.internship_type}>
                  <option value="">Not specified</option>
                  <option value="onsite">Onsite</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </label>
              <label className={`${labelClass} sm:col-span-2 lg:col-span-3`}>
                Cover image URL (optional)
                <input className={inputClass} maxLength={2048} onChange={(event) => setDraft({ ...draft, cover_image_url: event.target.value })} type="url" value={draft.cover_image_url} />
              </label>
              <label className={`${labelClass} sm:col-span-2 lg:col-span-3`}>
                Short description
                <input className={inputClass} maxLength={100} onChange={(event) => setDraft({ ...draft, short_description: event.target.value })} required value={draft.short_description} />
              </label>
              <label className={`${labelClass} sm:col-span-2 lg:col-span-3`}>
                Full description
                <textarea className={inputClass} onChange={(event) => setDraft({ ...draft, full_description: event.target.value })} required rows={3} value={draft.full_description} />
              </label>

              <div className="sm:col-span-2 lg:col-span-3">
                <h3 className="text-sm font-semibold text-slate-900">Requirements and credentials</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Add prerequisites, the technologies covered, and any completion certificates offered.
                </p>
              </div>
              <label className={`${labelClass} sm:col-span-2 lg:col-span-3`}>
                Eligibility / prerequisites (optional)
                <textarea className={inputClass} onChange={(event) => setDraft({ ...draft, eligibility: event.target.value })} rows={2} value={draft.eligibility} />
              </label>
              <details className="rounded-xl border border-slate-200 bg-slate-50 sm:col-span-2 lg:col-span-2">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-slate-800 marker:content-none">
                  Skills / technologies
                  <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-900">
                    {draft.skills.split(/\r?\n/).filter((skill) => skill.trim()).length} added
                  </span>
                </summary>
                <div className="border-t border-slate-200 p-4">
                  <label className={labelClass}>
                    Enter one skill or technology per line
                    <textarea
                      aria-label="Skills and technologies"
                      className={inputClass}
                      onChange={(event) => setDraft({ ...draft, skills: event.target.value })}
                      placeholder={"React\nPython\nProject management"}
                      rows={4}
                      value={draft.skills}
                    />
                  </label>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Use separate lines so each skill can be displayed as an individual item.
                  </p>
                </div>
              </details>
              <details className="rounded-xl border border-slate-200 bg-slate-50 sm:col-span-2 lg:col-span-1">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-slate-800 marker:content-none">
                  Certificates
                  <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-900">
                    {draft.certificates.length} selected
                  </span>
                </summary>
                <div className="space-y-3 border-t border-slate-200 p-4">
                  {COURSE_CERTIFICATES.map((certificate) => (
                    <label className="flex items-start gap-2.5 text-sm leading-5 text-slate-700" key={certificate}>
                      <input
                        checked={draft.certificates.includes(certificate)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            certificates: event.target.checked
                              ? [...draft.certificates, certificate]
                              : draft.certificates.filter((item) => item !== certificate),
                          })
                        }
                        type="checkbox"
                      />
                      {certificate}
                    </label>
                  ))}
                </div>
              </details>

              <div className="sm:col-span-2 lg:col-span-3">
                <h3 className="text-sm font-semibold text-slate-900">Application details</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Add the schedule and availability for this internship.
                </p>
              </div>
              <label className={labelClass}>
                Stipend details
                <input className={inputClass} onChange={(event) => setDraft({ ...draft, stipend_details: event.target.value })} value={draft.stipend_details} />
              </label>
              <label className={labelClass}>
                Start date (optional)
                <input className={inputClass} onChange={(event) => setDraft({ ...draft, start_date: event.target.value })} type="date" value={draft.start_date} />
              </label>
              <label className={labelClass}>
                Application deadline (optional)
                <input className={inputClass} onChange={(event) => setDraft({ ...draft, application_deadline: event.target.value })} type="date" value={draft.application_deadline} />
              </label>
              <label className={labelClass}>
                Available positions (optional)
                <input className={inputClass} min={1} onChange={(event) => setDraft({ ...draft, positions: event.target.value })} step={1} type="number" value={draft.positions} />
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input checked={draft.is_published} onChange={(event) => setDraft({ ...draft, is_published: event.target.checked })} type="checkbox" />
                Published
              </label>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-4">
              <button className="min-h-10 rounded-full border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50" disabled={saving} onClick={closeEditor} type="button">
                Cancel
              </button>
              <button className="min-h-10 rounded-full bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60" disabled={saving} type="submit">
                {saving ? "Saving..." : editingId ? "Save changes" : "Create internship"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
