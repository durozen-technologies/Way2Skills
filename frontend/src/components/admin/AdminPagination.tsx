"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export type AdminPaginationProps = {
  total: number;
  offset: number;
  pageSize: number;
  loading?: boolean;
  itemLabel?: string;
  onPageChange: (newOffset: number) => void;
};

export function getPageNumbers(
  currentPage: number,
  pageCount: number
): (number | "...")[] {
  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  const pages: (number | "...")[] = [];
  pages.push(1);
  if (currentPage > 3) {
    pages.push("...");
  }
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(pageCount - 1, currentPage + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  if (currentPage < pageCount - 2) {
    pages.push("...");
  }
  pages.push(pageCount);
  return pages;
}

export default function AdminPagination({
  total,
  offset,
  pageSize,
  loading = false,
  itemLabel = "records",
  onPageChange,
}: AdminPaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.floor(offset / pageSize) + 1;
  const rangeStart = total === 0 ? 0 : offset + 1;
  const rangeEnd = Math.min(offset + pageSize, total);
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= pageCount;
  const pageNumbers = getPageNumbers(currentPage, pageCount);

  return (
    <nav
      aria-label={`${itemLabel} pagination`}
      className="mt-6 flex flex-col gap-4 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-slate-600" aria-live="polite">
        {total === 0 ? (
          "No records found"
        ) : (
          <>
            Showing <span className="font-medium text-slate-900">{rangeStart}</span>–
            <span className="font-medium text-slate-900">{rangeEnd}</span> of{" "}
            <span className="font-medium text-slate-900">{total}</span> {itemLabel}
          </>
        )}
      </p>

      {total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
          {/* Previous Button */}
          <button
            aria-label="Previous page"
            className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={isFirstPage || loading}
            onClick={() => onPageChange(Math.max(0, offset - pageSize))}
            type="button"
          >
            <ChevronLeft aria-hidden="true" size={16} />
            Previous
          </button>

          {/* Compact page display on small mobile (< 640px) */}
          <span className="inline-flex items-center px-2 text-xs font-medium text-slate-600 sm:hidden">
            Page {currentPage} of {pageCount}
          </span>

          {/* Numbered page buttons on tablets and desktop (>= 640px) */}
          <div className="hidden items-center gap-1 sm:flex">
            {pageNumbers.map((pageItem, index) => {
              if (pageItem === "...") {
                return (
                  <span
                    className="inline-flex h-10 w-9 items-center justify-center text-xs font-semibold text-slate-400"
                    key={`ellipsis-${index}`}
                  >
                    …
                  </span>
                );
              }
              const isActive = pageItem === currentPage;
              return (
                <button
                  aria-current={isActive ? "page" : undefined}
                  aria-label={`Page ${pageItem}`}
                  className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                    isActive
                      ? "border-blue-700 bg-blue-700 text-white shadow-sm"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                  disabled={loading}
                  key={pageItem}
                  onClick={() => onPageChange((pageItem - 1) * pageSize)}
                  type="button"
                >
                  {pageItem}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <button
            aria-label="Next page"
            className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={isLastPage || loading}
            onClick={() => onPageChange(offset + pageSize)}
            type="button"
          >
            Next
            <ChevronRight aria-hidden="true" size={16} />
          </button>
        </div>
      )}
    </nav>
  );
}
