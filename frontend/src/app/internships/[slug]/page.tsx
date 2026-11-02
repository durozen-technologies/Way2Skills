import { Suspense } from "react";
import InternshipDetail from "@/components/internship/InternshipDetail";

type InternshipPageProps = {
  params: Promise<{ slug: string }>;
};

async function InternshipPageContent({ params }: InternshipPageProps) {
  const { slug } = await params;
  return <InternshipDetail slug={slug} />;
}

export default function InternshipPage({ params }: InternshipPageProps) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F5FAFD] px-4 pt-24 text-center text-sm text-slate-600">
          Loading internship details…
        </main>
      }
    >
      <InternshipPageContent params={params} />
    </Suspense>
  );
}
