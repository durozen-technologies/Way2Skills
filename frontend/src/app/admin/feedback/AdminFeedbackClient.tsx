"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useAdminAuth, useAdminPage } from "@/components/admin/AdminAuth";
import { courseRequest } from "@/lib/coursesApi";
import type { FeedbackPage, FeedbackRecord } from "@/lib/feedbackApi";

const PAGE_SIZE = 10;

export default function AdminFeedbackPage() {
  const { token } = useAdminAuth();
  useAdminPage("/admin/feedback", "Feedback");
  const [feedback, setFeedback] = useState<FeedbackRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadPage = useCallback(async (pageOffset: number, signal?: AbortSignal) => {
    if (!token) return;
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(pageOffset),
    });
    const result = await courseRequest<FeedbackPage>(
      `/api/admin/feedback?${params.toString()}`,
      token,
      { signal }
    );
    if (signal?.aborted) return;

    const lastPageOffset =
      Math.max(0, Math.ceil(result.total / PAGE_SIZE) - 1) * PAGE_SIZE;
    if (pageOffset > lastPageOffset) {
      setTotal(result.total);
      setOffset(lastPageOffset);
      return;
    }

    setFeedback(result.items);
    setTotal(result.total);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    loadPage(offset, controller.signal)
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Feedback could not be loaded."
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [loadPage, offset, token]);

  async function changeStatus(
    record: FeedbackRecord,
    nextStatus: "approved" | "rejected"
  ) {
    if (!token) return;
    setBusyId(record.id);
    setError(null);
    setNotice(null);
    try {
      await courseRequest<FeedbackRecord>(
        `/api/admin/feedback/${record.id}`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify({ status: nextStatus }),
        }
      );
      setNotice(`Feedback ${nextStatus}.`);
      try {
        await loadPage(offset);
      } catch (requestError) {
        setError(
          `Feedback ${nextStatus}, but the list could not be refreshed: ${
            requestError instanceof Error
              ? requestError.message
              : "Unknown error."
          }`
        );
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Feedback status could not be updated."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function deleteRecord(record: FeedbackRecord) {
    if (!token || !window.confirm(`Delete feedback from ${record.student_name}?`)) {
      return;
    }
    setBusyId(record.id);
    setError(null);
    setNotice(null);
    try {
      await courseRequest<void>(`/api/admin/feedback/${record.id}`, token, {
        method: "DELETE",
      });
      setNotice("Feedback deleted.");
      try {
        await loadPage(offset);
      } catch (requestError) {
        setError(
          `Feedback was deleted, but the list could not be refreshed: ${
            requestError instanceof Error
              ? requestError.message
              : "Unknown error."
          }`
        );
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Feedback could not be deleted."
      );
    } finally {
      setBusyId(null);
    }
  }

  const pageCount = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const firstPageNumber = Math.max(1, Math.min(currentPage - 2, pageCount - 4));
  const pageNumbers = Array.from(
    { length: Math.min(pageCount, 5) },
    (_, index) => firstPageNumber + index
  );
  const rangeStart = total === 0 ? 0 : offset + 1;
  const rangeEnd = Math.min(offset + feedback.length, total);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-4">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">
          Student feedback
        </h2>
        <p className="mt-0.5 text-sm text-slate-600">
          Review submissions before they appear in the public feedback section.
        </p>
      </div>

      {notice && (
        <p className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-900" role="status">
          {notice}
        </p>
      )}
      {error && (
        <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600" role="status">
          Loading feedback…
        </p>
      ) : feedback.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="font-semibold text-slate-900">No feedback submissions</h3>
          <p className="mt-0.5 text-sm text-slate-600">
            Student submissions will appear here for review.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2 lg:grid-cols-3">
          {feedback.map((record) => (
            <article
              className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-[18px]"
              key={record.id}
            >
              <div className="flex flex-wrap items-start gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="break-words font-semibold text-slate-950">
                    {record.student_name}
                  </h3>
                  <p className="mt-0.5 break-words text-sm text-slate-600">{record.course}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                    record.status === "approved"
                      ? "bg-emerald-50 text-emerald-800"
                      : record.status === "rejected"
                        ? "bg-red-50 text-red-800"
                        : "bg-amber-50 text-amber-800"
                  }`}
                >
                  {record.status}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
                <span
                  aria-label={`${record.rating} out of 5 stars`}
                  className="inline-flex items-center gap-1 font-medium text-amber-700"
                >
                  <Star aria-hidden="true" className="fill-amber-400 text-amber-500" size={15} />
                  {record.rating}/5
                </span>
                <time className="text-slate-500" dateTime={record.created_at}>
                  {new Date(record.created_at).toLocaleString()}
                </time>
              </div>
              <p className="mt-3 flex-1 whitespace-pre-wrap break-words text-sm leading-5 text-slate-700">
                {record.message}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                {record.status !== "approved" && (
                  <button
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={busyId === record.id}
                    onClick={() => changeStatus(record, "approved")}
                    type="button"
                  >
                    <Check aria-hidden="true" size={14} />
                    Approve
                  </button>
                )}
                {record.status !== "rejected" && (
                  <button
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={busyId === record.id}
                    onClick={() => changeStatus(record, "rejected")}
                    type="button"
                  >
                    <X aria-hidden="true" size={14} />
                    Reject
                  </button>
                )}
                <button
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={busyId === record.id}
                  onClick={() => deleteRecord(record)}
                  type="button"
                >
                  <Trash2 aria-hidden="true" size={14} />
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && !error && (
        <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600" aria-live="polite">
            Showing {rangeStart}–{rangeEnd} of {total} feedback submissions
          </p>
          <nav aria-label="Feedback pagination" className="flex flex-wrap items-center gap-1.5">
            <button
              aria-label="Previous page"
              className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={currentPage <= 1}
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              type="button"
            >
              <ChevronLeft aria-hidden="true" size={16} />
              Previous
            </button>
            {pageNumbers.map((pageNumber) => (
              <button
                aria-current={pageNumber === currentPage ? "page" : undefined}
                aria-label={`Page ${pageNumber}`}
                className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm font-medium transition ${
                  pageNumber === currentPage
                    ? "border-blue-700 bg-blue-700 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
                key={pageNumber}
                onClick={() => setOffset((pageNumber - 1) * PAGE_SIZE)}
                type="button"
              >
                {pageNumber}
              </button>
            ))}
            <button
              aria-label="Next page"
              className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={currentPage >= pageCount}
              onClick={() => setOffset(offset + PAGE_SIZE)}
              type="button"
            >
              Next
              <ChevronRight aria-hidden="true" size={16} />
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
