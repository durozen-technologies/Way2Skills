"use client";

import CourseManagement from "@/components/admin/CourseManagement";
import { useAdminAuth, useAdminPage } from "@/components/admin/AdminAuth";

export default function AdminCoursesPage() {
  const { token } = useAdminAuth();
  useAdminPage("/admin/courses", "Courses");
  return token ? <CourseManagement token={token} /> : null;
}
