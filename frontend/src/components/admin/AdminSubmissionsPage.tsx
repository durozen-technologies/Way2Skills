"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import AdminPagination from "@/components/admin/AdminPagination";
import { useAdminAuth, useAdminPage } from "@/components/admin/AdminAuth";
import { courseRequest } from "@/lib/coursesApi";

type ContactRecord = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  topic: string | null;
  message: string;
  status: "new" | "in_progress" | "resolved";
  created_at: string;
};

type AdmissionRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  education: string;
  course: string;
  application_type: "course" | "internship" | "programme";
  message: string | null;
  status: "pending" | "in_progress" | "accepted" | "rejected";
  created_at: string;
};

type SubmissionRecord = ContactRecord | AdmissionRecord;

type PageResponse = {
  items: SubmissionRecord[];
  total: number;
  limit: number;
  offset: number;
};

type SubmissionsKind = "contacts" | "admissions";
type AdmissionGroup = "course" | "internship";

const PAGE_SIZE = 10;

const statusOptions: Record<SubmissionsKind, string[]> = {
  contacts: ["new", "in_progress", "resolved"],
  admissions: ["pending", "in_progress", "accepted", "rejected"],
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    new Date(value)
  );
}

export default function AdminSubmissionsPage({
  kind,
}: {
  kind: SubmissionsKind;
}) {
  const isContact = kind === "contacts";
  const title = isContact ? "Contact enquiries" : "Admission applications";
  const endpoint = `/api/admin/${kind}`;
  const { token } = useAdminAuth();
  useAdminPage(`/admin/${kind}`, title);

  const [records, setRecords] = useState<SubmissionRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [admissionGroup, setAdmissionGroup] =
    useState<AdmissionGroup>("course");
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRecords = useCallback(async (signal?: AbortSignal) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(offset),
    });
    if (appliedSearch) params.set("search", appliedSearch);
    if (statusFilter) params.set("status", statusFilter);
    if (!isContact) params.set("application_group", admissionGroup);
    try {
      const result = await courseRequest<PageResponse>(
        `${endpoint}?${params.toString()}`,
        token,
        { signal }
      );
      if (signal?.aborted) return;
      const lastOffset =
        Math.max(0, Math.ceil(result.total / PAGE_SIZE) - 1) * PAGE_SIZE;
      if (offset > lastOffset) {
        setTotal(result.total);
        setOffset(lastOffset);
        return;
      }
      setRecords(result.items);
      setTotal(result.total);
    } catch (requestError) {
      if (signal?.aborted) return;
      setError(
        requestError instanceof Error
          ? requestError.message
          : `${title} could not be loaded.`
      );
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [
    admissionGroup,
    appliedSearch,
    endpoint,
    isContact,
    offset,
    statusFilter,
    title,
    token,
  ]);

  useEffect(() => {
    const controller = new AbortController();
    void loadRecords(controller.signal);
    return () => controller.abort();
  }, [loadRecords]);

  function applySearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOffset(0);
    setAppliedSearch(search.trim());
  }

  async function updateStatus(record: SubmissionRecord, status: string) {
    if (!token || !statusOptions[kind].includes(status)) return;
    setBusyId(record.id);
    setError(null);
    try {
      await courseRequest<SubmissionRecord>(
        `${endpoint}/${record.id}`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }
      );
      await loadRecords();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The record status could not be updated."
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-5">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">
          {title}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Search records, review submissions, and update their status.
        </p>
      </div>

      {!isContact && (
        <div
          aria-label="Admission application type"
          className="mb-4 flex gap-2"
          role="tablist"
        >
          {(["course", "internship"] as const).map((group) => (
            <button
              aria-selected={admissionGroup === group}
              className={`min-h-10 rounded-lg px-4 py-2 text-sm font-semibold capitalize transition ${
                admissionGroup === group
                  ? "bg-blue-700 text-white"
                  : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
              key={group}
              onClick={() => {
                setOffset(0);
                setAdmissionGroup(group);
              }}
              role="tab"
              type="button"
            >
              {group === "course" ? "Course" : "Internship"}
            </button>
          ))}
        </div>
      )}

      <form
        className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row"
        onSubmit={applySearch}
      >
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search by name, email, or phone</span>
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={17}
          />
          <input
            className="min-h-10 w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, or phone"
            value={search}
          />
        </label>
        <select
          aria-label="Filter by status"
          className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
          onChange={(event) => {
            setOffset(0);
            setStatusFilter(event.target.value);
          }}
          value={statusFilter}
        >
          <option value="">All statuses</option>
          {statusOptions[kind].map((status) => (
            <option key={status} value={status}>
              {status.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <button
          className="inline-flex min-h-10 items-center justify-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
          type="submit"
        >
          Search
        </button>
      </form>

      {error && (
        <p
          className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      )}

      {loading ? (
        <p
          className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600"
          role="status"
        >
          Loading {title.toLowerCase()}…
        </p>
      ) : records.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
          No{" "}
          {isContact
            ? "contact enquiries"
            : `${admissionGroup} admission applications`}{" "}
          found.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table
            className={`w-full divide-y divide-slate-200 text-left text-sm ${
              isContact ? "min-w-[900px]" : "min-w-[1050px]"
            }`}
          >
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">
                  {isContact ? "Name / email" : "Applicant"}
                </th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                {isContact ? (
                  <th className="px-4 py-3 font-semibold">Enquiry about</th>
                ) : (
                  <>
                    <th className="px-4 py-3 font-semibold">Offering</th>
                    <th className="px-4 py-3 font-semibold">Education</th>
                  </>
                )}
                <th className="px-4 py-3 font-semibold">Message</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((record) => (
                <tr key={record.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{record.name}</p>
                    <p className="mt-0.5 text-slate-600">{record.email}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {record.phone || "—"}
                  </td>
                  {isContact ? (
                    <td className="px-4 py-3 text-slate-700">
                      {"topic" in record ? record.topic || "—" : "—"}
                    </td>
                  ) : (
                    <>
                      <td className="px-4 py-3">
                        {"course" in record ? (
                          <>
                            <p className="font-medium text-slate-900">
                              {record.course}
                            </p>
                            <p className="mt-0.5 capitalize text-slate-600">
                              {record.application_type}
                            </p>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 capitalize text-slate-700">
                        {"education" in record ? record.education : "—"}
                      </td>
                    </>
                  )}
                  <td className="max-w-xs px-4 py-3 text-slate-600">
                    <p className="line-clamp-2 whitespace-pre-wrap">
                      {record.message || "—"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      aria-label={`Status for ${record.name}`}
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium capitalize text-slate-800 disabled:opacity-50"
                      disabled={busyId === record.id}
                      onChange={(event) =>
                        void updateStatus(record, event.target.value)
                      }
                      value={record.status}
                    >
                      {statusOptions[kind].map((status) => (
                        <option key={status} value={status}>
                          {status.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {formatDate(record.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && total > PAGE_SIZE && (
        <AdminPagination
          total={total}
          offset={offset}
          pageSize={PAGE_SIZE}
          loading={loading}
          itemLabel={isContact ? "enquiries" : "applications"}
          onPageChange={setOffset}
        />
      )}
    </div>
  );
}
