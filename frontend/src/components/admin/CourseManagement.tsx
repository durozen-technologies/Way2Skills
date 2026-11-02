"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  BookOpen,
  FolderOpen,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  COURSE_CERTIFICATES,
  courseRequest,
  type CourseCertificate,
  type Course,
  type CourseCategory,
  type CoursePage,
  type CourseTheme,
  type CourseType,
} from "@/lib/coursesApi";
import CourseImage from "@/components/courses/CourseImage";
import AdminPagination from "@/components/admin/AdminPagination";

const PAGE_SIZE = 10;
const DELIVERY_MODES = ["Online", "Offline", "Flexible"] as const;
const COURSE_LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;

type CourseDraft = {
  title: string;
  slug: string;
  short_description: string;
  full_description: string;
  category: string;
  course_type: CourseType;
  duration: string;
  internship_duration_months: string;
  level: string;
  delivery_mode: string;
  image_url: string;
  price: string;
  benefits: string;
  certificates: CourseCertificate[];
  card_theme: CourseTheme | "";
  is_published: boolean;
  is_featured: boolean;
  display_order: number;
};

type EditableCourseContent = Pick<
  CourseDraft,
  "short_description" | "benefits"
>;

const emptyDraft: CourseDraft = {
  title: "",
  slug: "",
  short_description: "",
  full_description: "",
  category: "",
  course_type: "course",
  duration: "",
  internship_duration_months: "",
  level: "Beginner",
  delivery_mode: "Online",
  image_url: "",
  price: "",
  benefits: "",
  certificates: [],
  card_theme: "sky",
  is_published: false,
  is_featured: false,
  display_order: 0,
};

const emptyEditableContent: EditableCourseContent = {
  short_description: "",
  benefits: "",
};

function countCharacters(value: string): number {
  return Array.from(value).length;
}

function countContentLines(value: string): number {
  return value.split(/\r?\n/).filter((line) => line.trim().length > 0).length;
}

function slugFromTitle(title: string): string {
  const slug = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug.length >= 2 ? slug : "course";
}

function fromCourse(course: Course): CourseDraft {
  const rawInternship =
    course.internship_duration_months != null
      ? course.internship_duration_months
      : course.internship_period != null
      ? course.internship_period
      : null;

  return {
    title: course.title,
    slug: course.slug,
    short_description: course.short_description,
    full_description: course.full_description,
    category: course.category,
    course_type: course.course_type,
    duration: course.duration,
    internship_duration_months:
      rawInternship != null ? String(rawInternship) : "",
    level: course.level,
    delivery_mode: course.delivery_mode,
    image_url: course.image_url ?? "",
    price: course.price ?? "",
    benefits: course.benefits ?? "",
    certificates: course.certificates ?? [],
    card_theme: course.card_theme ?? "",
    is_published: course.is_published,
    is_featured: course.is_featured,
    display_order: course.display_order,
  };
}

function messageFrom(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "The request could not be completed.";
}

function canonicalLevel(level: string): string {
  return (
    COURSE_LEVELS.find(
      (option) => option.toLowerCase() === level.trim().toLowerCase()
    ) ?? ""
  );
}

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

export default function CourseManagement({ token }: { token: string }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<CourseType>("course");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [publishedFilter, setPublishedFilter] = useState("");
  const [customCategory, setCustomCategory] = useState(false);
  const [draft, setDraft] = useState<CourseDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [originalLevel, setOriginalLevel] = useState("");
  const [originalCategory, setOriginalCategory] = useState("");
  const [originalEditableContent, setOriginalEditableContent] =
    useState<EditableCourseContent>(emptyEditableContent);
  const [levelChanged, setLevelChanged] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const categoryDeletePending = useRef(false);

  const loadCategories = useCallback(
    async (signal?: AbortSignal) => {
      setCategoriesLoading(true);
      setCategoriesError(null);
      try {
        const availableCategories = await courseRequest<CourseCategory[]>(
          "/api/admin/categories",
          token,
          { signal }
        );
        if (!signal?.aborted) setCategories(availableCategories);
      } catch (requestError) {
        if (!signal?.aborted) setCategoriesError(messageFrom(requestError));
      } finally {
        if (!signal?.aborted) setCategoriesLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadCategories(controller.signal);
    return () => controller.abort();
  }, [loadCategories]);

  const loadCourses = useCallback(
    async (requestedOffset = offset, signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(requestedOffset),
      });
      if (search.trim()) params.set("search", search.trim());
      if (typeFilter) params.set("course_type", typeFilter);
      if (categoryFilter) params.set("category", categoryFilter);
      if (publishedFilter) params.set("is_published", publishedFilter);
      try {
        const page = await courseRequest<CoursePage>(
          `/api/admin/courses?${params.toString()}`,
          token,
          { signal }
        );
        if (signal?.aborted) return;
        const lastPageOffset =
          Math.max(0, Math.ceil(page.total / PAGE_SIZE) - 1) * PAGE_SIZE;
        if (requestedOffset > lastPageOffset) {
          setTotal(page.total);
          setCourses([]);
          setOffset(lastPageOffset);
          return;
        }
        setCourses(page.items);
        setTotal(page.total);
      } catch (requestError) {
        if (!signal?.aborted) setError(messageFrom(requestError));
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [categoryFilter, offset, publishedFilter, search, token, typeFilter]
  );

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(
      () => void loadCourses(offset, controller.signal),
      200
    );
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadCourses, offset]);

  function resetEditor() {
    setEditingId(null);
    setOriginalLevel("");
    setOriginalCategory("");
    setOriginalEditableContent(emptyEditableContent);
    setLevelChanged(false);
    setDraft(emptyDraft);
    setCustomCategory(false);
    setFormError(null);
    setEditorOpen(false);
  }

  function editCourse(course: Course) {
    setEditingId(course.id);
    setOriginalLevel(course.level);
    setOriginalCategory(course.category);
    const courseDraft = fromCourse(course);
    setOriginalEditableContent({
      short_description: courseDraft.short_description,
      benefits: courseDraft.benefits,
    });
    setLevelChanged(false);
    setDraft({ ...courseDraft, level: canonicalLevel(course.level) });
    setCustomCategory(false);
    setNotice(null);
    setError(null);
    setFormError(null);
    setEditorOpen(true);
  }

  async function saveCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const wasEditing = editingId !== null;
    const shortDescriptionChanged =
      !wasEditing ||
      draft.short_description !== originalEditableContent.short_description;
    const benefitsChanged =
      !wasEditing || draft.benefits !== originalEditableContent.benefits;

    if (
      shortDescriptionChanged &&
      countCharacters(draft.short_description) > 100
    ) {
      setFormError("Short description must be no more than 100 characters.");
      return;
    }
    if (benefitsChanged && countContentLines(draft.benefits) > 5) {
      setFormError("Benefits must contain no more than 5 non-empty lines.");
      return;
    }
    const rawInternshipMonths = draft.internship_duration_months?.trim();
    let internshipDurationMonths: number | null = null;
    if (rawInternshipMonths) {
      const parsed = Number(rawInternshipMonths);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 60) {
        setFormError(
          "Internship duration must be a whole number of months (at least 1)."
        );
        return;
      }
      internshipDurationMonths = parsed;
    }
    setSaving(true);
    setError(null);
    setFormError(null);
    setNotice(null);
    const payload = {
      ...draft,
      slug: editingId ? draft.slug : slugFromTitle(draft.title),
      internship_duration_months: internshipDurationMonths,
      internship_period: internshipDurationMonths,
      ...(editingId && !levelChanged ? { level: undefined } : {}),
      ...(editingId && draft.category === originalCategory
        ? { category: undefined }
        : {}),
      ...(editingId && !shortDescriptionChanged
        ? { short_description: undefined }
        : {}),
      ...(editingId && !benefitsChanged ? { benefits: undefined } : {}),
      image_url: draft.image_url.trim() || null,
      price: draft.price.trim() ? Number(draft.price) : null,
      ...(editingId && !benefitsChanged
        ? { benefits: undefined }
        : { benefits: draft.benefits.trim() ? draft.benefits : null }),
      card_theme: draft.card_theme || null,
    };
    try {
      await courseRequest<Course>(
        editingId ? `/api/admin/courses/${editingId}` : "/api/admin/courses",
        token,
        {
          method: editingId ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        }
      );
      setNotice(wasEditing ? "Course updated." : "Course created.");
      resetEditor();
      const nextOffset = wasEditing ? offset : 0;
      if (!wasEditing) setOffset(0);
      await loadCourses(nextOffset);
      await loadCategories();
    } catch (requestError) {
      setFormError(messageFrom(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function togglePublication(course: Course) {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await courseRequest<Course>(`/api/admin/courses/${course.id}`, token, {
        method: "PATCH",
        body: JSON.stringify({ is_published: !course.is_published }),
      });
      setNotice(
        course.is_published ? "Course unpublished." : "Course published."
      );
      await loadCourses();
    } catch (requestError) {
      setError(messageFrom(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function deleteCourse(course: Course) {
    if (!window.confirm(`Delete "${course.title}"? This cannot be undone.`))
      return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await courseRequest<void>(`/api/admin/courses/${course.id}`, token, {
        method: "DELETE",
      });
      setNotice("Course deleted.");
      if (editingId === course.id) resetEditor();
      const nextTotal = Math.max(0, total - 1);
      const lastPageOffset = Math.max(0, Math.ceil(nextTotal / PAGE_SIZE) - 1) * PAGE_SIZE;
      const targetOffset = Math.min(offset, lastPageOffset);
      if (targetOffset !== offset) {
        setOffset(targetOffset);
      } else {
        await loadCourses(targetOffset);
      }
      await loadCategories();
    } catch (requestError) {
      setError(messageFrom(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(category: CourseCategory) {
    if (categoryDeletePending.current) return;
    const courseLabel = `${category.course_count} ${
      category.course_count === 1 ? "course" : "courses"
    }`;
    if (
      !window.confirm(
        `Delete "${category.name}"? ${courseLabel} will be retained with all saved details. The category will no longer be available for new assignments.`
      )
    ) {
      return;
    }

    categoryDeletePending.current = true;
    setDeletingCategory(category.name);
    setError(null);
    setNotice(null);
    try {
      await courseRequest<void>(
        `/api/admin/categories?name=${encodeURIComponent(category.name)}`,
        token,
        { method: "DELETE" }
      );
      setNotice(
        `Category "${category.name}" deleted. ${courseLabel} and their details were retained.`
      );
      await loadCategories();
      if (categoryFilter === category.name) {
        setCategoryFilter("");
        setOffset(0);
      } else {
        await loadCourses(0);
      }
    } catch (requestError) {
      setError(messageFrom(requestError));
    } finally {
      categoryDeletePending.current = false;
      setDeletingCategory(null);
    }
  }

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100";
  const labelClass = "block text-sm font-medium text-slate-700";
  const categoryNames = categories.map((category) => category.name);
  const legacyCategory =
    editingId !== null &&
    Boolean(draft.category) &&
    !categoryNames.includes(draft.category);
  const shortDescriptionCharacters = countCharacters(draft.short_description);
  const benefitLines = countContentLines(draft.benefits);
  const shortDescriptionOverLimit = shortDescriptionCharacters > 100;
  const benefitsOverLimit = benefitLines > 5;
  const shortDescriptionLegacy =
    editingId !== null &&
    shortDescriptionOverLimit &&
    draft.short_description === originalEditableContent.short_description;
  const benefitsLegacy =
    editingId !== null &&
    benefitsOverLimit &&
    draft.benefits === originalEditableContent.benefits;

  return (
    <div className="mx-auto max-w-7xl">
      {/* Page Header matching Admin Internships UI */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Course management
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Manage training courses and programmes separately from standalone internships.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
            onClick={() => setManageCategoriesOpen((open) => !open)}
            type="button"
          >
            <FolderOpen aria-hidden="true" size={17} />
            Manage Categories
          </button>
          <button
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 disabled:opacity-60"
            disabled={saving}
            onClick={() => {
              setEditingId(null);
              setOriginalLevel("");
              setOriginalCategory("");
              setLevelChanged(false);
              setDraft(emptyDraft);
              setCustomCategory(false);
              setFormError(null);
              setNotice(null);
              setError(null);
              setEditorOpen(true);
            }}
            type="button"
          >
            <Plus aria-hidden="true" size={17} /> Add Course
          </button>
        </div>
      </div>

      {notice && (
        <p
          className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
          role="status"
        >
          {notice}
        </p>
      )}
      {error && (
        <p
          className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      )}

      {/* Category Management Drawer */}
      {manageCategoriesOpen && (
        <section
          aria-labelledby="manage-categories-heading"
          className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h3
                className="font-semibold text-slate-950"
                id="manage-categories-heading"
              >
                Manage Categories
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Deleting a category keeps every course and its saved details.
              </p>
            </div>
            <button
              aria-label="Close category manager"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              onClick={() => setManageCategoriesOpen(false)}
              type="button"
            >
              <X aria-hidden="true" size={17} />
            </button>
          </div>
          {categoriesError ? (
            <p className="mt-4 text-sm text-red-700" role="alert">
              Could not load categories: {categoriesError}
            </p>
          ) : categoriesLoading ? (
            <p className="mt-4 text-sm text-slate-600" role="status">
              Loading categories…
            </p>
          ) : categories.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">
              No available categories.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {categories.map((category) => (
                <li
                  className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                  key={category.name}
                >
                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold text-slate-900">
                      {category.name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {category.course_count}{" "}
                      {category.course_count === 1 ? "course" : "courses"}{" "}
                      assigned
                    </p>
                  </div>
                  <button
                    className="inline-flex min-h-9 items-center justify-center gap-1.5 self-start rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 disabled:opacity-50 sm:self-auto"
                    disabled={deletingCategory !== null}
                    onClick={() => void deleteCategory(category)}
                    type="button"
                  >
                    <Trash2 aria-hidden="true" size={15} />
                    {deletingCategory === category.name ? "Deleting…" : "Delete"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Search and Filters matching Admin Internships layout */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.5fr)_10rem_12rem_11rem]">
        <label className="relative block">
          <span className="sr-only">Search courses</span>
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={17}
          />
          <input
            className="min-h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
            onChange={(event) => {
              setOffset(0);
              setSearch(event.target.value);
            }}
            placeholder="Search courses..."
            type="search"
            value={search}
          />
        </label>
        <label className="block">
          <span className="sr-only">Filter by offering type</span>
          <select
            className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
            onChange={(event) => {
              setOffset(0);
              setTypeFilter(event.target.value as CourseType);
            }}
            value={typeFilter}
          >
            <option value="course">Course</option>
            <option value="programme">Programme</option>
          </select>
        </label>
        <label className="block">
          <span className="sr-only">Filter by category</span>
          <select
            className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
            onChange={(event) => {
              setOffset(0);
              setCategoryFilter(event.target.value);
            }}
            value={categoryFilter}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.name} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="sr-only">Filter by publication status</span>
          <select
            className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
            onChange={(event) => {
              setOffset(0);
              setPublishedFilter(event.target.value);
            }}
            value={publishedFilter}
          >
            <option value="">All statuses</option>
            <option value="true">Published</option>
            <option value="false">Draft</option>
          </select>
        </label>
      </div>

      {/* Courses List as 2-column Card Grid matching Internships Page */}
      {loading ? (
        <p
          className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600"
          role="status"
        >
          Loading courses…
        </p>
      ) : courses.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {courses.map((course) => {
            const rawInternship =
              course.internship_duration_months != null
                ? course.internship_duration_months
                : course.internship_period != null
                ? course.internship_period
                : null;
            const hasInternship =
              rawInternship != null &&
              !Number.isNaN(Number(rawInternship)) &&
              Number(rawInternship) > 0;
            const parsedInternship = hasInternship ? Number(rawInternship) : null;
            const formattedPrice = coursePrice(course.price);

            return (
              <article
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 sm:p-5 md:p-6"
                key={course.id}
              >
                <div>
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-800">
                      <BookOpen aria-hidden="true" size={19} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="break-words font-semibold text-slate-950 text-base leading-snug">
                          {course.title}
                        </h3>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium capitalize text-slate-700">
                          {course.course_type}
                        </span>
                        {course.is_featured && (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                            Featured
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs sm:text-sm text-slate-600 break-words">
                        {course.category} · {course.duration}
                        {course.level && ` · ${course.level}`}
                        {course.delivery_mode && ` · ${course.delivery_mode}`}
                        {formattedPrice && ` · ${formattedPrice}`}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        course.is_published
                          ? "bg-emerald-50 text-emerald-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {course.is_published ? "Published" : "Draft"}
                    </span>
                  </div>

                  <p className="mt-3 sm:mt-4 line-clamp-2 text-sm leading-6 text-slate-700 break-words">
                    {course.short_description}
                  </p>

                  {/* Course Metadata Badges */}
                  <div className="mt-3 flex flex-wrap gap-1.5 sm:gap-2 text-xs">
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium text-slate-700">
                      Training: {course.duration}
                    </span>
                    {hasInternship && (
                      <span className="rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1 font-medium text-sky-800">
                        Internship: {parsedInternship} Month{parsedInternship === 1 ? "" : "s"}*
                      </span>
                    )}
                    {course.certificates && course.certificates.length > 0 && (
                      <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600">
                        Certificates: {course.certificates.length}
                      </span>
                    )}
                    {course.card_theme && (
                      <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 capitalize text-slate-600">
                        Theme: {course.card_theme}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions Row with accessible touch targets */}
                <div className="mt-4 sm:mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-3.5 sm:pt-4">
                  <button
                    className="inline-flex min-h-10 flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                    disabled={saving}
                    onClick={() => editCourse(course)}
                    type="button"
                  >
                    <Pencil aria-hidden="true" size={15} /> Edit
                  </button>
                  <button
                    className="inline-flex min-h-10 flex-1 sm:flex-initial items-center justify-center rounded-lg border border-slate-300 px-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                    disabled={saving}
                    onClick={() => void togglePublication(course)}
                    type="button"
                  >
                    {course.is_published ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    className="inline-flex min-h-10 w-full sm:w-auto items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3.5 text-sm font-medium text-red-700 hover:bg-red-50 active:bg-red-100 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
                    disabled={saving}
                    onClick={() => void deleteCourse(course)}
                    type="button"
                  >
                    <Trash2 aria-hidden="true" size={15} /> Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="font-semibold text-slate-900">No course records</h3>
          <p className="mt-1 text-sm text-slate-600">
            {search || categoryFilter || publishedFilter
              ? "No courses match these filters."
              : "Create a course here. It will remain a draft until published."}
          </p>
        </div>
      )}

      {/* Responsive Pagination */}
      <AdminPagination
        itemLabel="courses"
        loading={loading}
        offset={offset}
        onPageChange={(newOffset) => setOffset(newOffset)}
        pageSize={PAGE_SIZE}
        total={total}
      />

      {/* Editor Modal matching Internships Editor Modal */}
      {editorOpen && (
        <div
          aria-labelledby="course-editor-title"
          aria-modal="true"
          className="fixed inset-0 z-[60] flex items-end justify-center overflow-y-auto bg-slate-950/50 p-0 sm:items-center sm:p-5"
          role="dialog"
        >
          <form
            className="my-auto max-h-[100dvh] w-full max-w-4xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:max-h-[calc(100dvh-2.5rem)] sm:rounded-2xl sm:p-7"
            onSubmit={saveCourse}
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                  Course details
                </p>
                <h2
                  className="mt-1 text-xl font-semibold tracking-tight text-slate-950"
                  id="course-editor-title"
                >
                  {editingId ? "Edit Course" : "Add Course"}
                </h2>
              </div>
              <button
                aria-label="Close course editor"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                disabled={saving}
                onClick={resetEditor}
                type="button"
              >
                <X aria-hidden="true" size={19} />
              </button>
            </header>

            {formError && (
              <p
                className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800"
                role="alert"
              >
                {formError}
              </p>
            )}

            <div className="mt-5 grid gap-x-4 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              <div className="sm:col-span-2 lg:col-span-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  Overview
                </h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Set the course title, category, training duration, and optional internship duration.
                </p>
              </div>

              <label className={labelClass}>
                Course title
                <input
                  className={inputClass}
                  maxLength={160}
                  minLength={2}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      title: event.target.value,
                      ...(!editingId ? { slug: slugFromTitle(event.target.value) } : {}),
                    })
                  }
                  required
                  value={draft.title}
                />
              </label>

              <label className={labelClass}>
                Offering type
                <select
                  className={inputClass}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      course_type: event.target.value as CourseType,
                    })
                  }
                  value={draft.course_type}
                >
                  <option value="course">Course</option>
                  {editingId !== null && draft.course_type === "internship" && (
                    <option value="internship">
                      Legacy course catalogue internship
                    </option>
                  )}
                  <option value="programme">Programme</option>
                </select>
              </label>

              <label className={labelClass}>
                Category
                <select
                  className={inputClass}
                  onChange={(event) => {
                    if (event.target.value === "__new__") {
                      setCustomCategory(true);
                      setDraft({ ...draft, category: "" });
                    } else {
                      setCustomCategory(false);
                      setDraft({ ...draft, category: event.target.value });
                    }
                  }}
                  required={!customCategory}
                  value={customCategory ? "__new__" : draft.category}
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.name} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                  {legacyCategory && (
                    <option value={draft.category}>
                      Saved category (legacy): {draft.category}
                    </option>
                  )}
                  <option value="__new__">Add a new category…</option>
                </select>
                {customCategory && (
                  <input
                    aria-label="New category"
                    className={inputClass}
                    maxLength={80}
                    onChange={(event) =>
                      setDraft({ ...draft, category: event.target.value })
                    }
                    placeholder="Enter a category"
                    required
                    value={draft.category}
                  />
                )}
              </label>

              <label className={labelClass}>
                Training duration
                <input
                  className={inputClass}
                  maxLength={80}
                  onChange={(event) =>
                    setDraft({ ...draft, duration: event.target.value })
                  }
                  placeholder="e.g. 4 Months or 12 Weeks"
                  required
                  value={draft.duration}
                />
              </label>

              <label className={labelClass}>
                Internship duration in months (optional)
                <input
                  className={inputClass}
                  max={60}
                  min={1}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      internship_duration_months: event.target.value,
                    })
                  }
                  placeholder="e.g. 2 (leave blank if none)"
                  step={1}
                  type="number"
                  value={draft.internship_duration_months}
                />
              </label>

              <label className={labelClass}>
                Level
                <select
                  className={inputClass}
                  onChange={(event) => {
                    setLevelChanged(true);
                    setDraft({ ...draft, level: event.target.value });
                  }}
                  required={editingId === null || levelChanged}
                  value={draft.level}
                >
                  {editingId !== null && !canonicalLevel(originalLevel) ? (
                    <option value="">
                      Keep existing level ({originalLevel})
                    </option>
                  ) : (
                    <option value="" disabled>
                      Select a level
                    </option>
                  )}
                  {COURSE_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </label>

              <label className={labelClass}>
                Mode
                <select
                  className={inputClass}
                  onChange={(event) =>
                    setDraft({ ...draft, delivery_mode: event.target.value })
                  }
                  required
                  value={draft.delivery_mode}
                >
                  {!DELIVERY_MODES.some((mode) => mode === draft.delivery_mode) &&
                    draft.delivery_mode && (
                      <option value={draft.delivery_mode}>
                        {draft.delivery_mode}
                      </option>
                    )}
                  {DELIVERY_MODES.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
              </label>

              <label className={labelClass}>
                Course fee (₹, optional)
                <input
                  className={inputClass}
                  max="99999999.99"
                  min="0"
                  onChange={(event) =>
                    setDraft({ ...draft, price: event.target.value })
                  }
                  placeholder="e.g. 15000"
                  step="0.01"
                  type="number"
                  value={draft.price}
                />
              </label>

              <label className={labelClass}>
                Card theme
                <select
                  className={inputClass}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      card_theme: event.target.value as CourseTheme | "",
                    })
                  }
                  value={draft.card_theme}
                >
                  <option value="">Automatic rotation</option>
                  <option value="sky">Sky blue</option>
                  <option value="mint">Mint green</option>
                  <option value="amber">Warm amber</option>
                  <option value="violet">Soft violet</option>
                </select>
              </label>

              <label className={`${labelClass} sm:col-span-2 lg:col-span-3`}>
                Cover image URL (optional)
                <input
                  className={inputClass}
                  maxLength={2048}
                  onChange={(event) =>
                    setDraft({ ...draft, image_url: event.target.value })
                  }
                  type="url"
                  value={draft.image_url}
                />
                {draft.image_url.trim() && (
                  <CourseImage
                    alt={`${draft.title || "Course"} preview`}
                    className="mt-2 aspect-video w-full rounded-lg border border-slate-200 object-cover"
                    fallback={
                      <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                        Image preview unavailable. Check the URL.
                      </p>
                    }
                    src={draft.image_url.trim()}
                  />
                )}
              </label>

              <label className={`${labelClass} sm:col-span-2 lg:col-span-3`}>
                Short description
                <textarea
                  aria-describedby="short-description-counter"
                  aria-invalid={shortDescriptionOverLimit && !shortDescriptionLegacy}
                  className={inputClass}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      short_description: Array.from(event.target.value)
                        .slice(0, 100)
                        .join(""),
                    })
                  }
                  required
                  rows={3}
                  value={draft.short_description}
                />
                <span
                  className="mt-1.5 flex flex-wrap items-center justify-between gap-1 text-xs text-slate-500"
                  id="short-description-counter"
                >
                  <span>{shortDescriptionCharacters} / 100 characters</span>
                  {shortDescriptionLegacy && (
                    <span className="text-amber-700">
                      Saved description exceeds 100 characters; edit to update.
                    </span>
                  )}
                </span>
              </label>

              <label className={`${labelClass} sm:col-span-2 lg:col-span-3`}>
                Full description
                <textarea
                  className={inputClass}
                  maxLength={10000}
                  onChange={(event) =>
                    setDraft({ ...draft, full_description: event.target.value })
                  }
                  required
                  rows={4}
                  value={draft.full_description}
                />
              </label>

              <div className="sm:col-span-2 lg:col-span-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  Curriculum and credentials
                </h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Add learning outcomes and completion certificates offered.
                </p>
              </div>

              <details
                className="rounded-xl border border-slate-200 bg-slate-50 sm:col-span-2 lg:col-span-2"
                open={benefitsOverLimit || undefined}
              >
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-slate-800 marker:content-none">
                  Benefits / key outcomes
                  <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-900">
                    {benefitLines} / 5 lines
                  </span>
                </summary>
                <div className="border-t border-slate-200 p-4">
                  <label className={labelClass}>
                    Enter one benefit per line (maximum 5 lines)
                    <textarea
                      aria-describedby="benefits-counter"
                      aria-invalid={benefitsOverLimit && !benefitsLegacy}
                      className={inputClass}
                      maxLength={10000}
                      onChange={(event) =>
                        setDraft({ ...draft, benefits: event.target.value })
                      }
                      placeholder={"Hands-on real-world projects\n1-on-1 industry mentorship\nJob assistance"}
                      rows={4}
                      value={draft.benefits}
                    />
                  </label>
                  {benefitsLegacy && (
                    <p className="mt-2 text-xs text-amber-700">
                      Saved benefits exceed 5 lines; reduce them to update.
                    </p>
                  )}
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
                    <label
                      className="flex items-start gap-2.5 text-sm leading-5 text-slate-700"
                      key={certificate}
                    >
                      <input
                        checked={draft.certificates.includes(certificate)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            certificates: event.target.checked
                              ? [...draft.certificates, certificate]
                              : draft.certificates.filter(
                                  (item) => item !== certificate
                                ),
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
                <h3 className="text-sm font-semibold text-slate-900">
                  Publishing and settings
                </h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Set the display priority and public availability.
                </p>
              </div>

              <label className={labelClass}>
                Display order
                <input
                  className={inputClass}
                  max="100000"
                  min="0"
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      display_order: Number(event.target.value),
                    })
                  }
                  step={1}
                  type="number"
                  value={draft.display_order}
                />
              </label>

              <div className="flex flex-wrap items-center gap-6 sm:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    checked={draft.is_published}
                    className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                    onChange={(event) =>
                      setDraft({ ...draft, is_published: event.target.checked })
                    }
                    type="checkbox"
                  />
                  Published
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    checked={draft.is_featured}
                    className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                    onChange={(event) =>
                      setDraft({ ...draft, is_featured: event.target.checked })
                    }
                    type="checkbox"
                  />
                  Featured
                </label>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-4">
              <button
                className="min-h-10 rounded-full border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                disabled={saving}
                onClick={resetEditor}
                type="button"
              >
                Cancel
              </button>
              <button
                className="min-h-10 rounded-full bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
                disabled={saving}
                type="submit"
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Save changes"
                  : "Create course"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
