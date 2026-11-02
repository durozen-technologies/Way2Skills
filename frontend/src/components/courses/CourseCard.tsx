import Link from "next/link";
import { useRef, type CSSProperties, type PointerEvent } from "react";
import { courseThemeFor, type Course } from "@/lib/coursesApi";
import type { Internship } from "@/lib/internshipsApi";
import CourseImage from "@/components/courses/CourseImage";

const themeStyles = {
  sky: {
    ring: "rgba(56, 189, 248, 0.24)",
    orb: "radial-gradient(circle at 36% 32%, #67d8ff 0%, #168dc7 38%, #1749b5 72%, #101820 100%)",
    accentColor: "#38bdf8",
    badge: "border border-sky-300/30 bg-sky-400/10 text-sky-100",
    accent: "text-sky-300",
    hoverAccent: "group-hover:text-sky-300",
    icon: "border-sky-300/30 bg-sky-400/10",
    panel: "border-white/10 bg-white/[0.04]",
    internshipPanel: "border-sky-300/15 bg-sky-300/[0.06]",
    action: "bg-blue-600 text-white hover:bg-blue-500 focus-visible:ring-blue-400",
    secondary:
      "text-sky-300 hover:text-white",
  },
  mint: {
    ring: "rgba(110, 231, 183, 0.24)",
    orb: "radial-gradient(circle at 36% 32%, #d1fae5 0%, #6ee7b7 38%, #059669 72%, #101820 100%)",
    accentColor: "#34d399",
    badge: "border border-emerald-300/30 bg-emerald-400/10 text-emerald-100",
    accent: "text-emerald-300",
    hoverAccent: "group-hover:text-emerald-300",
    icon: "border-emerald-300/30 bg-emerald-400/10",
    panel: "border-white/10 bg-white/[0.04]",
    internshipPanel: "border-emerald-300/15 bg-emerald-300/[0.06]",
    action: "bg-emerald-600 text-white hover:bg-emerald-500 focus-visible:ring-emerald-400",
    secondary:
      "text-emerald-300 hover:text-white",
  },
  amber: {
    ring: "rgba(251, 191, 36, 0.24)",
    orb: "radial-gradient(circle at 36% 32%, #fef3c7 0%, #fbbf24 38%, #d97706 72%, #101820 100%)",
    accentColor: "#fbbf24",
    badge: "border border-amber-300/30 bg-amber-400/10 text-amber-100",
    accent: "text-amber-300",
    hoverAccent: "group-hover:text-amber-300",
    icon: "border-amber-300/30 bg-amber-400/10",
    panel: "border-white/10 bg-white/[0.04]",
    internshipPanel: "border-amber-300/15 bg-amber-300/[0.06]",
    action: "bg-amber-500 text-slate-950 hover:bg-amber-400 focus-visible:ring-amber-300",
    secondary:
      "text-amber-300 hover:text-white",
  },
  violet: {
    ring: "rgba(196, 181, 253, 0.24)",
    orb: "radial-gradient(circle at 36% 32%, #ede9fe 0%, #c4b5fd 38%, #7c3aed 72%, #101820 100%)",
    accentColor: "#a78bfa",
    badge: "border border-violet-300/30 bg-violet-400/10 text-violet-100",
    accent: "text-violet-300",
    hoverAccent: "group-hover:text-violet-300",
    icon: "border-violet-300/30 bg-violet-400/10",
    panel: "border-white/10 bg-white/[0.04]",
    internshipPanel: "border-violet-300/15 bg-violet-300/[0.06]",
    action: "bg-violet-600 text-white hover:bg-violet-500 focus-visible:ring-violet-400",
    secondary:
      "text-violet-300 hover:text-white",
  },
} as const;

const typeLabels = {
  course: "Training",
  internship: "Internship",
  programme: "Programme",
} as const;

type CourseCardProps =
  | {
  course: Course;
  internship?: never;
  index: number;
}
  | {
  course?: never;
  internship: Internship;
  index: number;
};

export default function CourseCard(props: CourseCardProps) {
  const { index } = props;
  const internship = props.internship;
  const course = props.course;
  const isInternship = internship !== undefined;
  const theme = themeStyles[
    courseThemeFor(
      { card_theme: course?.card_theme ?? null },
      index
    )
  ];
  const cardRef = useRef<HTMLElement>(null);
  const animationFrame = useRef<number | null>(null);
  const pendingPointer = useRef({ x: 0, y: 0 });
  const cardNumber = String(
    course && course.display_order > 0 ? course.display_order : index + 1
  ).padStart(2, "0");
  const title = internship?.title ?? course?.title ?? "";
  const slug = internship?.slug ?? course?.slug ?? "";
  const description =
    internship?.short_description ?? course?.short_description ?? "";
  const duration = internship
    ? `${internship.duration_months} month${internship.duration_months === 1 ? "" : "s"}`
    : course?.duration ?? "";
  const imageUrl = internship?.cover_image_url ?? course?.image_url ?? null;
  const category = isInternship ? "Internship opportunity" : course?.category ?? "";

  // Conditional internship check: safe Number conversion, must be > 0
  const rawInternshipMonths = isInternship
    ? null
    : course?.internship_duration_months ?? course?.internship_period;
  const parsedMonths =
    rawInternshipMonths != null && !Number.isNaN(Number(rawInternshipMonths))
      ? Number(rawInternshipMonths)
      : 0;
  const hasInternship = !isInternship && parsedMonths > 0;
  const internshipDurationText = hasInternship
    ? `${parsedMonths} Month${parsedMonths === 1 ? "" : "s"}*`
    : "";

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    if (
      event.pointerType === "touch" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !window.matchMedia("(hover: hover)").matches
    ) {
      return;
    }

    pendingPointer.current = { x: event.clientX, y: event.clientY };
    if (animationFrame.current !== null) return;

    animationFrame.current = window.requestAnimationFrame(() => {
      const card = cardRef.current;
      animationFrame.current = null;
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const x = (pendingPointer.current.x - rect.left) / rect.width;
      const y = (pendingPointer.current.y - rect.top) / rect.height;
      card.style.setProperty("--course-tilt-x", `${(0.5 - y) * 9.4}deg`);
      card.style.setProperty("--course-tilt-y", `${(x - 0.5) * 8.7}deg`);
    });
  }

  function resetTilt() {
    if (animationFrame.current !== null) {
      window.cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
    }
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty("--course-tilt-x", "0deg");
    card.style.setProperty("--course-tilt-y", "0deg");
  }

  return (
    <article
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
      className="w2s-course-card group relative flex min-h-0 w-full max-w-[407px] min-w-0 flex-col overflow-hidden rounded-[30px] border border-white/10 p-5 text-white sm:min-h-[548px] sm:p-7"
      style={{ "--course-accent": theme.accentColor } as CSSProperties}
    >
      <div aria-hidden="true" className="w2s-course-orb absolute -right-12 top-16 z-0 h-48 w-48 rounded-full" style={{ background: theme.orb, boxShadow: `0 0 45px ${theme.ring}` }} />
      <div aria-hidden="true" className="w2s-course-ring absolute -right-5 top-24 z-0 h-40 w-40 rounded-full border" />
      <div aria-hidden="true" className="w2s-course-ring absolute right-4 top-32 z-0 h-28 w-28 rounded-full border" />

      <div className="relative z-10 flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-[0.2em] text-white/55 sm:text-xs">
          W2S / {cardNumber}
        </span>
        {course?.is_featured ? (
          <span className="rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-white/80 sm:px-3.5 sm:py-2 sm:text-[10px]">
            Featured
          </span>
        ) : (
          <span className={`rounded-full px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider sm:px-3.5 sm:py-2 sm:text-[10px] ${theme.badge}`}>
            {isInternship ? "Internship" : typeLabels[course?.course_type ?? "course"]}
          </span>
        )}
      </div>

      <div className="relative z-10 mt-3.5 flex h-16 items-center sm:mt-6 sm:h-24">
        <CourseImage
          alt={`${title} ${isInternship ? "internship" : "course"}`}
          className="h-14 w-14 rounded-2xl border border-white/15 object-cover sm:h-20 sm:w-20 sm:rounded-[25px]"
          fallback={
            <div className={`w2s-course-icon flex h-14 w-14 items-center justify-center rounded-2xl sm:h-20 sm:w-20 sm:rounded-[25px] ${theme.icon}`}>
              <span className="text-2xl font-semibold text-white sm:text-3xl">
                {"</>"}
              </span>
            </div>
          }
          src={imageUrl}
        />
      </div>

      <div className="relative z-10 mt-2 sm:mt-3">
        <span className={`text-[9px] font-bold uppercase tracking-[0.2em] sm:text-[10px] ${theme.accent}`}>
          {category}
        </span>
        <h3 className={`mt-1.5 max-w-[310px] text-lg font-bold leading-tight tracking-tight text-white transition-colors duration-300 sm:mt-3 sm:text-2xl ${theme.hoverAccent}`}>
          {title}
        </h3>
        <p className="mt-2 text-xs leading-5 text-white/65 sm:mt-3 sm:text-sm sm:leading-6">
          {description}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-medium text-white/70 sm:text-xs">
          {course?.level && (
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1">
              {course.level}
            </span>
          )}
          {internship?.internship_type && (
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 capitalize">
              {internship.internship_type}
            </span>
          )}
        </div>
      </div>

      {hasInternship ? (
        /* Course WITH Internship: Two equal-width cards side by side */
        <div className="relative z-10 mt-3.5 grid grid-cols-1 min-[340px]:grid-cols-2 sm:grid-cols-2 gap-2.5 sm:mt-5 sm:gap-3">
          <div className={`rounded-xl border p-2.5 sm:p-3 ${theme.panel}`}>
            <p className="text-[9px] uppercase tracking-wider text-white/45 sm:text-[10px]">
              TRAINING
            </p>
            <p className="mt-1 text-xs font-semibold text-white sm:mt-1.5 sm:text-sm">
              {course?.duration}
            </p>
          </div>
          <div className={`rounded-xl border p-2.5 sm:p-3 ${theme.internshipPanel}`}>
            <p className={`text-[9px] uppercase tracking-wider sm:text-[10px] ${theme.accent}`}>
              INTERNSHIP
            </p>
            <p className={`mt-1 text-xs font-semibold sm:mt-1.5 sm:text-sm ${theme.accent}`}>
              {internshipDurationText}
            </p>
          </div>
        </div>
      ) : (
        /* Course WITHOUT Internship (or standalone Internship): Single full-width card */
        <div className="relative z-10 mt-3.5 grid grid-cols-1 gap-2.5 sm:mt-5 sm:gap-3">
          <div className={`rounded-xl border p-2.5 sm:p-3 ${theme.panel}`}>
            <p className="text-[9px] uppercase tracking-wider text-white/45 sm:text-[10px]">
              {isInternship ? "INTERNSHIP DURATION" : "TRAINING"}
            </p>
            <p className="mt-1 text-xs font-semibold text-white sm:mt-1.5 sm:text-sm">
              {duration}
            </p>
          </div>
        </div>
      )}

      <div className="relative z-10 mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-3.5 sm:mt-auto sm:pt-5">
        <Link
          className={`inline-flex min-h-[38px] items-center gap-1.5 text-xs font-semibold transition-colors duration-300 sm:text-sm ${theme.secondary}`}
          href={isInternship ? `/internships/${slug}` : `/courses/${slug}`}
        >
          {isInternship ? "View Details" : "View Programme"}
          <span aria-hidden="true">↗</span>
        </Link>
        {internship ? (
          <Link
            className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#101820] sm:px-4 sm:py-2.5 sm:text-sm ${theme.action}`}
            href={`/admissions?type=internship&internship=${encodeURIComponent(internship.slug)}`}
          >
            Enquire Now
            <span aria-hidden="true">↗</span>
          </Link>
        ) : course ? (
          <Link
            className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#101820] sm:px-4 sm:py-2.5 sm:text-sm ${theme.action}`}
            href={`/admissions?course=${encodeURIComponent(course.slug)}`}
          >
            Apply Now
            <span aria-hidden="true">↗</span>
          </Link>
        ) : null}
      </div>
      <div aria-hidden="true" className="w2s-course-accent absolute bottom-0 left-0 z-10 h-1 w-full" style={{ background: theme.accentColor }} />
    </article>
  );
}
