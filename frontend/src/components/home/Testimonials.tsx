"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";
import { courseRequest } from "@/lib/coursesApi";
import "./Testimonials.css";

type Feedback = {
  id: string;
  student_name: string;
  course: string;
  rating: number;
  message: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

type FeedbackForm = {
  student_name: string;
  course: string;
  rating: string;
  message: string;
};

const EMPTY_FORM: FeedbackForm = {
  student_name: "",
  course: "",
  rating: "",
  message: "",
};

function FeedbackCard({ feedback }: { feedback: Feedback }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (event: MouseEvent<HTMLElement>) => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !window.matchMedia("(hover: hover)").matches
    ) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    setTilt({
      x: (0.5 - y) * 7,
      y: (x - 0.5) * 7,
    });
  };

  return (
    <article
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      className="w2s-review-single-card group relative w-full max-w-sm overflow-hidden rounded-xl border border-white/80 bg-white/90 p-4 shadow-[0_12px_32px_rgba(20,80,110,0.12)] backdrop-blur-xl sm:rounded-2xl sm:p-[18px]"
      style={{
        transform: `perspective(1100px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition:
          "transform 180ms ease-out, border-color 300ms ease, box-shadow 300ms ease",
      }}
    >
      <div
        aria-hidden="true"
        className="w2s-card-accent absolute left-0 top-0 h-1 w-full"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-sky-300/30 blur-[60px] transition-transform duration-500 group-hover:scale-125"
      />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-sky-100 bg-gradient-to-br from-sky-100 to-white text-xl font-bold text-sky-700 shadow-sm sm:h-10 sm:w-10 sm:rounded-xl sm:text-2xl">
          “
        </div>
        <span className="rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-sky-800">
          Learner Stories
        </span>
      </div>

      <div className="relative z-10 mt-3 sm:mt-4">
        <div
          aria-label={`${feedback.rating} out of 5 stars`}
          className="text-sm tracking-[0.12em] text-amber-600"
        >
          {"★".repeat(feedback.rating)}
          <span className="sr-only"> {feedback.rating} out of 5 stars</span>
        </div>
        <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-5 text-slate-700 sm:mt-2 sm:leading-6">
          {feedback.message}
        </p>
      </div>

      <div className="relative z-10 mt-3 flex items-center gap-2.5 border-t border-slate-100 pt-3 sm:mt-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-sky-200 bg-gradient-to-br from-sky-100 to-blue-100 text-sm font-bold text-sky-800 shadow-sm">
          {feedback.student_name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-slate-900 sm:text-sm">
            {feedback.student_name}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            {feedback.course}
          </p>
        </div>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-sky-100 bg-sky-50 text-sm text-sky-700 transition-all duration-300 group-hover:translate-x-1 group-hover:border-sky-300">
          ↗
        </span>
      </div>
    </article>
  );
}

export default function Testimonials() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const approvedFeedback = Array.from(
    new Map(
      feedback
        .filter((item) => item.status === "approved")
        .map((item) => [item.id, item])
    ).values()
  );
  const shouldAnimateFeedback = approvedFeedback.length >= 4;

  useEffect(() => {
    let active = true;
    courseRequest<Feedback[]>("/api/feedback")
      .then((result) => {
        if (active) setFeedback(result);
      })
      .catch((requestError: unknown) => {
        if (active) {
          setLoadError(
            requestError instanceof Error
              ? requestError.message
              : "Student feedback could not be loaded."
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

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialogOpen && dialog && !dialog.open) {
      dialog.showModal();
      firstInputRef.current?.focus();
    } else if (!dialogOpen && dialog?.open) {
      dialog.close();
    }
  }, [dialogOpen]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      await courseRequest<Feedback>("/api/feedback", undefined, {
        method: "POST",
        body: JSON.stringify({
          student_name: form.student_name,
          course: form.course,
          rating: Number(form.rating),
          message: form.message,
        }),
      });
      setSubmitted(true);
      setForm(EMPTY_FORM);
    } catch (requestError) {
      setSubmitError(
        requestError instanceof Error
          ? requestError.message
          : "Feedback could not be submitted. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function closeDialog() {
    setDialogOpen(false);
    setSubmitError(null);
    setSubmitted(false);
  }

  return (
    <section
      id="student-stories"
      // className="relative isolate overflow-hidden bg-[#EAF7FC] px-4 py-12 text-[#101820] sm:px-8 sm:py-20 lg:py-24"
      className="relative isolate overflow-hidden bg-white px-4 py-12 text-[#101820] sm:px-8 sm:py-20 lg:py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-10 -z-10 h-80 w-80 rounded-full bg-sky-300/35 blur-[100px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 bottom-0 -z-10 h-80 w-80 rounded-full bg-blue-300/25 blur-[100px]"
      />

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:mt-5 sm:text-4xl lg:text-5xl">
            Every journey has a story.
            <span className="mt-1 block text-sky-700 sm:mt-2">
              Yours starts here.
            </span>
          </h2>
          <p className="mx-auto mt-2.5 max-w-xl text-xs leading-6 text-slate-600 sm:mt-4 sm:text-base sm:leading-7">
            We look forward to sharing genuine experiences from the
            Way2Skills learning community.
          </p>
        </div>

        <div className="mt-7 sm:mt-14">
          {loading ? (
            <p className="rounded-2xl border border-white/80 bg-white/80 p-6 text-center text-sm text-slate-600" role="status">
              Loading student feedback…
            </p>
          ) : loadError ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-800" role="alert">
              Student feedback is unavailable. {loadError}
            </p>
          ) : approvedFeedback.length ? (
            <div
              aria-label="Approved student feedback"
              className="w2s-feedback-marquee__viewport"
            >
              <div
                className={`w2s-feedback-marquee__track ${
                  shouldAnimateFeedback
                    ? "w2s-feedback-marquee__track--animated"
                    : ""
                }`}
              >
                <div className="w2s-feedback-marquee__group">
                    {approvedFeedback.map((item) => (
                      <FeedbackCard feedback={item} key={item.id} />
                    ))}
                </div>
                {shouldAnimateFeedback && (
                  <div
                    aria-hidden="true"
                    className="w2s-feedback-marquee__group w2s-feedback-marquee__duplicate"
                  >
                    {approvedFeedback.map((item) => (
                      <FeedbackCard
                        feedback={item}
                        key={`decorative-${item.id}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <article
                onMouseMove={(event) => {
                  if (
                    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
                    !window.matchMedia("(hover: hover)").matches
                  ) {
                    return;
                  }
                  const rect = event.currentTarget.getBoundingClientRect();
                  const x = (event.clientX - rect.left) / rect.width;
                  const y = (event.clientY - rect.top) / rect.height;
                  event.currentTarget.style.transform = `perspective(1100px) rotateX(${(0.5 - y) * 7}deg) rotateY(${(x - 0.5) * 7}deg)`;
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.transform =
                    "perspective(1100px) rotateX(0deg) rotateY(0deg)";
                }}
                className="w2s-review-single-card group relative w-full max-w-sm overflow-hidden rounded-xl border border-white/80 bg-white/90 p-4 shadow-[0_12px_32px_rgba(20,80,110,0.12)] backdrop-blur-xl sm:rounded-2xl sm:p-[18px]"
                style={{
                  transform: "perspective(1100px) rotateX(0deg) rotateY(0deg)",
                  transition:
                    "transform 180ms ease-out, border-color 300ms ease, box-shadow 300ms ease",
                }}
              >
                <div
                  aria-hidden="true"
                  className="w2s-card-accent absolute left-0 top-0 h-1 w-full"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-sky-300/30 blur-[60px] transition-transform duration-500 group-hover:scale-125"
                />
                <div className="relative z-10 flex items-start justify-between gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-sky-100 bg-gradient-to-br from-sky-100 to-white text-xl font-bold text-sky-700 shadow-sm sm:h-10 sm:w-10 sm:rounded-xl sm:text-2xl">
                    “
                  </div>
                  <span className="rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-sky-800">
                    Learner Stories
                  </span>
                </div>
                <div className="relative z-10 mt-3 sm:mt-4">
                  <h3 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                    Your story could be next.
                  </h3>
                  <p className="mt-1.5 max-w-lg text-xs leading-5 text-slate-600 sm:mt-2 sm:text-sm sm:leading-6">
                    We&apos;re preparing this space for genuine student feedback.
                    Published reviews will appear here once learner experiences
                    have been collected and approved.
                  </p>
                </div>
                <div className="relative z-10 mt-3 flex items-center gap-2.5 border-t border-slate-100 pt-3 sm:mt-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-sky-200 bg-gradient-to-br from-sky-100 to-blue-100 text-sm font-bold text-sky-800 shadow-sm">
                    W
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 sm:text-sm">
                      Way2Skills Community
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
                      Student feedback space
                    </p>
                  </div>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-sky-100 bg-sky-50 text-sm text-sky-700 transition-all duration-300 group-hover:translate-x-1 group-hover:border-sky-300">
                    ↗
                  </span>
                </div>
              </article>
            </div>
          )}
        </div>

        <p className="mt-5 text-center text-xs tracking-wide text-slate-500 sm:mt-7">
          Learn · Create · Grow
        </p>
        <div className="mt-5 flex justify-center sm:mt-7">
          <button
            className="inline-flex min-h-12 w-full max-w-xs items-center justify-center rounded-full bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(29,78,216,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-[0_12px_28px_rgba(29,78,216,0.24)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-2 sm:w-auto"
            onClick={() => setDialogOpen(true)}
            type="button"
          >
            Share your feedback
          </button>
        </div>
      </div>

      <dialog
        aria-labelledby="feedback-dialog-title"
        className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/50"
        onClose={() => {
          setDialogOpen(false);
          setSubmitError(null);
          setSubmitted(false);
        }}
        ref={dialogRef}
      >
        <div className="p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight" id="feedback-dialog-title">
                Share your feedback
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Your feedback will be reviewed before it appears publicly.
              </p>
            </div>
            <button
              aria-label="Close feedback form"
              className="rounded-full p-2 text-xl leading-none text-slate-500 hover:bg-slate-100"
              onClick={closeDialog}
              type="button"
            >
              ×
            </button>
          </div>

          {submitted ? (
            <div className="mt-6" role="status">
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
                Thank you. Your feedback has been submitted for approval.
              </p>
              <button
                className="mt-5 inline-flex min-h-10 items-center justify-center rounded-full bg-blue-700 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                onClick={closeDialog}
                type="button"
              >
                Done
              </button>
            </div>
          ) : (
            <form className="mt-5 space-y-4" onSubmit={submit}>
              <label className="block text-sm font-medium text-slate-700">
                Student name
                <input
                  autoComplete="name"
                  className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                  maxLength={100}
                  minLength={2}
                  onChange={(event) =>
                    setForm({ ...form, student_name: event.target.value })
                  }
                  ref={firstInputRef}
                  required
                  value={form.student_name}
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Course or programme
                <input
                  className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                  maxLength={180}
                  minLength={2}
                  onChange={(event) => setForm({ ...form, course: event.target.value })}
                  required
                  value={form.course}
                />
              </label>
              <fieldset>
                <legend className="text-sm font-medium text-slate-700">
                  Rating
                </legend>
                <div className="mt-2 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <label className="cursor-pointer rounded-md p-1 focus-within:ring-2 focus-within:ring-sky-600" key={rating}>
                      <input
                        aria-label={`${rating} ${rating === 1 ? "star" : "stars"}`}
                        className="sr-only"
                        name="rating"
                        onChange={() => setForm({ ...form, rating: String(rating) })}
                        required={rating === 1}
                        type="radio"
                        value={rating}
                      />
                      <span
                        aria-hidden="true"
                        className={`text-3xl ${
                          Number(form.rating) >= rating
                            ? "text-amber-500"
                            : "text-slate-300"
                        }`}
                      >
                        ★
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="block text-sm font-medium text-slate-700">
                Feedback message
                <textarea
                  className="mt-1.5 min-h-28 w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                  maxLength={2000}
                  minLength={5}
                  onChange={(event) => setForm({ ...form, message: event.target.value })}
                  required
                  value={form.message}
                />
              </label>
              {submitError && (
                <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
                  {submitError}
                </p>
              )}
              <button
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={submitting}
                type="submit"
              >
                {submitting ? "Submitting…" : "Submit feedback"}
              </button>
            </form>
          )}
        </div>
      </dialog>
    </section>
  );
}
