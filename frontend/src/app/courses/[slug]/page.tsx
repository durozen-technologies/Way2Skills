import { Suspense } from "react";
import CourseDetails from "@/components/courses/CourseDetails";

type CoursePageProps = {
  params: Promise<{ slug: string }>;
};

async function CoursePageContent({ params }: CoursePageProps) {
  const { slug } = await params;
  return <CourseDetails slug={slug} />;
}

export default function CoursePage({ params }: CoursePageProps) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F5FAFD] px-4 pt-24 text-center text-sm text-slate-600">
          Loading course details…
        </main>
      }
    >
      <CoursePageContent params={params} />
    </Suspense>
  );
}
