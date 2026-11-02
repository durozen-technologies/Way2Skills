import {
  courseRequest,
  type CourseCertificate,
} from "@/lib/coursesApi";

export type Internship = {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  full_description: string;
  duration_months: number;
  eligibility: string | null;
  cover_image_url: string | null;
  skills: string[];
  certificates: CourseCertificate[];
  learning_outcomes: string[];
  internship_type: "onsite" | "remote" | "hybrid" | null;
  stipend_details: string | null;
  start_date: string | null;
  application_deadline: string | null;
  positions: number | null;
  application_instructions: string | null;
  application_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type InternshipPage = {
  items: Internship[];
  total: number;
  limit: number;
  offset: number;
};

export const internshipRequest = courseRequest;
