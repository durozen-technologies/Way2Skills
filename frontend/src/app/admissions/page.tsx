import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AdmissionForm from "@/components/admission/AdmissionForm";

export default function AdmissionsPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#EAF7FC] text-slate-900">
      <Navbar />

      {/* Compact hero */}
      <section className="bg-[#BDE8F7] px-4 pb-6 pt-20 sm:px-8 sm:pb-10 sm:pt-28">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-600 sm:text-xs">
            Way2Skills Admissions
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:mt-3 sm:text-4xl">
            Start Your Learning Journey
          </h1>

          <p className="mx-auto mt-2 max-w-xl text-xs leading-6 text-slate-600 sm:mt-3 sm:text-base">
            Interested in Full Stack Development? Send an enquiry to
            learn about the programme, fees, eligibility, and admission process.
          </p>

          <Link
            href="#admission-form"
            className="mt-4 inline-flex min-h-[42px] items-center justify-center gap-2 rounded-full bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-800 sm:min-h-[44px] sm:px-5 sm:py-2.5 sm:text-sm"
          >
            Enquire About Admission
            <span aria-hidden="true">↘</span>
          </Link>
        </div>
      </section>

      {/* Admission information and form */}
      <section className="px-4 py-6 sm:px-8 sm:py-10">
        <div className="mx-auto grid max-w-5xl items-start gap-4 sm:gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          {/* Programme information */}
          <aside className="space-y-3.5 sm:space-y-4">            
            {/* What Happens Next */}
            <div className="rounded-xl border border-sky-100 bg-white p-4 sm:rounded-2xl sm:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-700">
                The Next Step
              </p>

              <h2 className="mt-1.5 text-lg font-bold tracking-tight text-slate-900 sm:mt-2 sm:text-xl">
                What happens next?
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-600 sm:mt-2 sm:text-sm sm:leading-6">
                Here's what you can expect when you enquire about our programme.
              </p>

              <div className="mt-4 space-y-3.5 sm:mt-5 sm:space-y-5">
                <div className="flex gap-2.5 sm:gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700 sm:h-8 sm:w-8 sm:text-sm">
                    1
                  </div>

                  <div className="pt-0.5">
                    <h3 className="text-xs font-semibold text-slate-900 sm:text-sm">
                      Send your enquiry
                    </h3>
                    <p className="mt-0.5 text-xs leading-5 text-slate-500 sm:mt-1 sm:text-sm">
                      Fill in your details and select the programme you're interested in.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2.5 sm:gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700 sm:h-8 sm:w-8 sm:text-sm">
                    2
                  </div>

                  <div className="pt-0.5">
                    <h3 className="text-xs font-semibold text-slate-900 sm:text-sm">
                      Get programme information
                    </h3>
                    <p className="mt-0.5 text-xs leading-5 text-slate-500 sm:mt-1 sm:text-sm">
                      Learn about the syllabus, fees and eligibility requirements.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2.5 sm:gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700 sm:h-8 sm:w-8 sm:text-sm">
                    3
                  </div>

                  <div className="pt-0.5">
                    <h3 className="text-xs font-semibold text-slate-900 sm:text-sm">
                      Understand the admission process
                    </h3>
                    <p className="mt-0.5 text-xs leading-5 text-slate-500 sm:mt-1 sm:text-sm">
                      Review the next steps before deciding whether to enrol.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-3 sm:mt-5 sm:pt-4">
                <p className="text-[11px] leading-5 text-slate-500 sm:text-xs">
                  Enquiries are for programme information. Admission and internship
                  opportunities are subject to eligibility and applicable terms.
                </p>
              </div>
            </div>

           <div className="rounded-xl border border-sky-100 bg-white p-4 text-slate-900 shadow-[0_4px_12px_rgba(15,50,80,0.05)] sm:rounded-2xl sm:p-5">
  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-700">
    Explore Learning
  </p>

  <div className="mt-3 grid grid-cols-1 gap-2">
    {/* Courses */}
    <Link
      href="/courses"
      className="group flex items-center justify-between rounded-lg border border-sky-200 bg-sky-50 px-3 py-3 transition-all hover:border-sky-400 hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
    >
      <div>
        <h3 className="text-sm font-bold text-slate-900">Courses</h3>
        <p className="mt-0.5 text-xs text-slate-600">
          Explore our courses.
        </p>
      </div>

      <span
        className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-sky-200 bg-white text-sky-700 transition-transform group-hover:translate-x-1"
        aria-hidden="true"
      >
        ↗
      </span>
    </Link>

    {/* Internships */}
    <Link
      href="/internship"
      className="group flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-3 transition-all hover:border-red-300 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
    >
      <div>
        <h3 className="text-sm font-bold text-slate-900">Internships</h3>
        <p className="mt-0.5 text-xs text-slate-600">
          Gain practical experience.
        </p>
      </div>

      <span
        className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-red-200 bg-white text-red-600 transition-transform group-hover:translate-x-1"
        aria-hidden="true"
      >
        ↗
      </span>
    </Link>
  </div>
</div>
          </aside>

          {/* Admission form */}
          <div id="admission-form" className="scroll-mt-24">
            <AdmissionForm />
          </div>
        </div>
      </section>

      {/* Bottom enquiry section */}
      <section className="border-t border-sky-200 bg-[#BDE8F7] px-4 py-6 text-center sm:px-8 sm:py-7">
        <h2 className="text-lg font-bold sm:text-xl md:text-2xl">
          Need More Information?
        </h2>

        <p className="mx-auto mt-1.5 max-w-lg text-xs leading-5 text-slate-600 sm:mt-2 sm:text-sm sm:leading-6">
          Our team can help clarify programme details, fees,
          eligibility, and the admission process.
        </p>

        <Link
          href="/contact"
          className="mt-3.5 inline-flex min-h-[42px] items-center justify-center gap-2 rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700 sm:min-h-[44px] sm:px-5 sm:py-2.5 sm:text-sm"
        >
          Contact Way2Skills ↗
        </Link>
      </section>

      <Footer />
    </main>
  );
}