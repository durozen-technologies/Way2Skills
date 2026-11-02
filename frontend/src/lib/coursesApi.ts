import axios from "axios";

export type CourseType = "course" | "internship" | "programme";
export type CourseTheme = "sky" | "mint" | "amber" | "violet";
export type CourseCertificate =
  | "Course completion — Way2Skills"
  | "Internship completion — Durozen Technologies"
  | "Project completion — Durozen Technologies";

export const COURSE_CERTIFICATES: CourseCertificate[] = [
  "Course completion — Way2Skills",
  "Internship completion — Durozen Technologies",
  "Project completion — Durozen Technologies",
];

export type Course = {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  full_description: string;
  category: string;
  course_type: CourseType;
  duration: string;
  internship_duration_months?: number | null;
  internship_period?: number | null;
  level: string;
  delivery_mode: string;
  image_url: string | null;
  price: string | null;
  curriculum: string | null;
  benefits: string | null;
  certificates: CourseCertificate[];
  syllabus: string[];
  card_theme: CourseTheme | null;
  is_published: boolean;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type CoursePage = {
  items: Course[];
  total: number;
  limit: number;
  offset: number;
};

export type CourseCategory = {
  name: string;
  course_count: number;
};

const API_URL =
  process.env.NEXT_PUBLIC_WAY2SKILLS_API_URL?.trim().replace(/\/+$/, "") ?? "";

export async function courseRequest<T>(
  path: string,
  token?: string,
  init: RequestInit = {}
): Promise<T> {
  if (!API_URL) {
    throw new Error(
      "Set NEXT_PUBLIC_WAY2SKILLS_API_URL to connect to the Way2Skills API."
    );
  }

  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  try {
    const response = await axios.request<unknown>({
      url: `${API_URL}${path}`,
      method: init.method ?? "GET",
      data: init.body,
      headers: Object.fromEntries(headers.entries()),
      signal: init.signal ?? undefined,
      responseType: "json",
      transitional: { silentJSONParsing: false },
    });

    if (response.status === 204) return undefined as T;
    return response.data as T;
  } catch (error) {
    if (!axios.isAxiosError(error)) throw error;

    if (error.code === "ERR_BAD_RESPONSE") {
      throw new Error("The API returned an invalid response.");
    }

    if (error.response) {
      const { data, status } = error.response;
      const detail =
        data &&
        typeof data === "object" &&
        "detail" in data &&
        typeof data.detail === "string"
          ? data.detail
          : `The API request failed (${status}).`;
      throw new Error(detail);
    }

    throw error;
  }
}

export function courseThemeFor(
  course: Pick<Course, "card_theme">,
  index: number
): CourseTheme {
  if (course.card_theme) return course.card_theme;
  const themes: CourseTheme[] = ["sky", "mint", "amber", "violet"];
  return themes[index % themes.length] ?? "sky";
}
