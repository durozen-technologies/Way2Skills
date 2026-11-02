"use client";

import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, BookOpen, Trash2 } from "lucide-react";
import { useCart, type CartItem } from "@/components/cart/CartProvider";
import CourseImage from "@/components/courses/CourseImage";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";

function coursePrice(price: string | null): string | null {
  if (price == null || !price.trim()) return null;
  const amount = Number(price);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function CartLine({
  item,
  remove,
}: {
  item: CartItem;
  remove: () => void;
}) {
  const isCourse = item.kind === "course";
  const title = isCourse ? item.course.title : item.internship.title;
  const description = isCourse
    ? item.course.short_description
    : item.internship.short_description;
  const slug = isCourse ? item.course.slug : item.internship.slug;
  const imageUrl = isCourse
    ? item.course.image_url
    : item.internship.cover_image_url;
  const duration = isCourse
    ? item.course.duration
    : `${item.internship.duration_months} month${item.internship.duration_months === 1 ? "" : "s"}`;
  const price = isCourse ? coursePrice(item.course.price) : null;
  const stipend = isCourse ? null : item.internship.stipend_details;
  const detailsHref = isCourse ? `/courses/${slug}` : `/internships/${slug}`;
  const nextHref = isCourse
    ? `/admissions?course=${encodeURIComponent(slug)}`
    : item.internship.application_url || detailsHref;
  const external = !isCourse && Boolean(item.internship.application_url);

  const rawInternshipMonths = isCourse
    ? item.course.internship_duration_months ?? item.course.internship_period
    : null;
  const internshipMonths =
    rawInternshipMonths != null &&
    !Number.isNaN(Number(rawInternshipMonths)) &&
    Number(rawInternshipMonths) > 0
      ? Number(rawInternshipMonths)
      : null;

  return (
    <article className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[112px_minmax(0,1fr)_auto] sm:items-center sm:gap-5 sm:p-5">
      <Link
        aria-label={`View ${title}`}
        className="block h-28 overflow-hidden rounded-xl border border-slate-100 bg-slate-50"
        href={detailsHref}
      >
        <CourseImage
          alt={`${title} ${isCourse ? "course" : "internship"}`}
          className="h-full w-full object-cover"
          fallback={
            <div className="flex h-full w-full items-center justify-center bg-sky-50 text-sky-800">
              {isCourse ? (
                <BookOpen aria-hidden="true" size={27} />
              ) : (
                <BriefcaseBusiness aria-hidden="true" size={27} />
              )}
            </div>
          }
          src={imageUrl}
        />
      </Link>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-800">
          {isCourse ? "Course" : "Internship"}
        </p>
        <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">
          <Link className="hover:text-sky-800" href={detailsHref}>
            {title}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">
          {description}
        </p>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
          <span>
            <span className="font-medium text-slate-800">
              {isCourse ? "Training" : "Internship duration"}:
            </span>{" "}
            {duration}
          </span>
          {isCourse && internshipMonths !== null && (
            <span>
              <span className="font-medium text-slate-800">Internship:</span>{" "}
              {internshipMonths} Month{internshipMonths === 1 ? "" : "s"}*
            </span>
          )}
          {price && (
            <span>
              <span className="font-medium text-slate-800">Programme fee:</span>{" "}
              {price}
            </span>
          )}
          {stipend && (
            <span>
              <span className="font-medium text-slate-800">Stipend information:</span>{" "}
              {stipend}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 sm:justify-end">
        {external ? (
          <a
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2"
            href={nextHref}
            rel="noopener noreferrer"
            target="_blank"
          >
            Apply <ArrowRight aria-hidden="true" size={15} />
          </a>
        ) : (
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2"
            href={nextHref}
          >
            {isCourse ? "Continue to admission" : "View details"}
            <ArrowRight aria-hidden="true" size={15} />
          </Link>
        )}
        <button
          aria-label={`Remove ${title} from cart`}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
          onClick={remove}
          type="button"
        >
          <Trash2 aria-hidden="true" size={16} />
        </button>
      </div>
    </article>
  );
}

export default function CartPage() {
  const { items, removeCourse, removeInternship, storageError, hydrated } =
    useCart();
  const courses = items.filter(
    (item): item is Extract<CartItem, { kind: "course" }> =>
      item.kind === "course"
  );
  const internships = items.filter(
    (item): item is Extract<CartItem, { kind: "internship" }> =>
      item.kind === "internship"
  );

  return (
    <main className="min-h-screen bg-[#F5FAFD] text-slate-900">
      <Navbar />
      <section className="px-4 pb-16 pt-24 sm:px-8 sm:pb-20 sm:pt-32">
        <div className="mx-auto max-w-5xl">
          <header className="mb-7 text-center sm:mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-800">
              Way2Skills
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Your Cart
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
              Courses and internships are listed separately. Choose the next
              step available for each item.
            </p>
          </header>

          {storageError && (
            <p
              className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
              role="alert"
            >
              {storageError}
            </p>
          )}

          {!hydrated ? (
            <p className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600" role="status">
              Loading your cart…
            </p>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center shadow-sm sm:py-16">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sky-50 text-sky-800">
                <BookOpen aria-hidden="true" size={25} />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-slate-950">
                Your cart is empty
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Add a course or internship to see it here.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Link
                  className="inline-flex min-h-10 items-center rounded-full bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                  href="/courses"
                >
                  Browse courses
                </Link>
                <Link
                  className="inline-flex min-h-10 items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  href="/internship"
                >
                  Browse internships
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {courses.length > 0 && (
                <section aria-labelledby="cart-courses-title">
                  <h2
                    className="mb-3 flex items-center gap-2 text-xl font-semibold text-slate-950"
                    id="cart-courses-title"
                  >
                    <BookOpen aria-hidden="true" className="text-sky-800" size={20} />
                    Courses
                    <span className="text-sm font-medium text-slate-500">
                      ({courses.length})
                    </span>
                  </h2>
                  <div className="space-y-3">
                    {courses.map(({ course }) => (
                      <CartLine
                        item={{ kind: "course", course }}
                        key={`course:${course.id}`}
                        remove={() => removeCourse(course.id)}
                      />
                    ))}
                  </div>
                </section>
              )}
              {internships.length > 0 && (
                <section aria-labelledby="cart-internships-title">
                  <h2
                    className="mb-3 flex items-center gap-2 text-xl font-semibold text-slate-950"
                    id="cart-internships-title"
                  >
                    <BriefcaseBusiness aria-hidden="true" className="text-sky-800" size={20} />
                    Internships
                    <span className="text-sm font-medium text-slate-500">
                      ({internships.length})
                    </span>
                  </h2>
                  <div className="space-y-3">
                    {internships.map(({ internship }) => (
                      <CartLine
                        item={{ kind: "internship", internship }}
                        key={`internship:${internship.id}`}
                        remove={() => removeInternship(internship.id)}
                      />
                    ))}
                  </div>
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
