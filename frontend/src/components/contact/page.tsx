import Link from "next/link";
import Navbar from "../layout/Navbar";
import Footer from "../layout/Footer";
import ContactForm from "./ContactForm";

export default function ContactPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#EAF7FC] text-slate-900">
      <Navbar />

      {/* Compact hero */}
      <section className="bg-[#BDE8F7] px-4 pb-6 pt-20 sm:px-8 sm:pb-10 sm:pt-28">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-600 sm:text-xs">
            Contact Way2Skills
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:mt-3 sm:text-4xl">
            Let's talk about your goals.
          </h1>

          <p className="mx-auto mt-2 max-w-xl text-xs leading-6 text-slate-600 sm:mt-3 sm:text-base">
            Have questions about our Full Stack Development programme,
            admissions, or internship opportunities? We’re here to help.
          </p>
        </div>
      </section>

      {/* Contact details and enquiry form */}
      <section
        id="contact"
        className="px-4 py-6 sm:px-8 sm:py-10"
      >
        <div className="mx-auto grid max-w-5xl items-start gap-4 sm:gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          {/* Left information card */}
          <div className="rounded-xl border border-sky-100 bg-white p-4 text-slate-900 shadow-[0_4px_12px_rgba(15,50,80,0.07)] sm:rounded-2xl sm:p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-700">
              We’re Here to Help
            </p>

            <h2 className="mt-1.5 text-lg font-bold sm:mt-2 sm:text-2xl">
              How can we help?
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-600 sm:mt-2 sm:text-sm sm:leading-6">
              Send us your questions and let us help you find the
              right learning path.
            </p>

            <div className="mt-4 space-y-2.5 sm:mt-6 sm:space-y-3">
              <div className="rounded-xl border border-slate-200 bg-sky-50/70 p-3 sm:p-4 transition-colors hover:border-sky-300 hover:bg-sky-50">
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-base text-sky-700 sm:h-9 sm:w-9 sm:rounded-xl sm:text-lg">
                    ◈
                  </span>

                  <div>
                    <h3 className="text-xs font-semibold sm:text-sm">
                      Programme Information
                    </h3>
                    <p className="mt-0.5 text-[11px] leading-5 text-slate-500 sm:mt-1 sm:text-xs">
                      Learn about courses, curriculum and programme fees.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-sky-50/70 p-3 sm:p-4 transition-colors hover:border-sky-300 hover:bg-sky-50">
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-base text-red-600 sm:h-9 sm:w-9 sm:rounded-xl sm:text-lg">
                    ↗
                  </span>

                  <div>
                    <h3 className="text-xs font-semibold sm:text-sm">
                      Admissions
                    </h3>
                    <p className="mt-0.5 text-[11px] leading-5 text-slate-500 sm:mt-1 sm:text-xs">
                      Ask about eligibility and the application process.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-sky-50/70 p-3 sm:p-4 transition-colors hover:border-sky-300 hover:bg-sky-50">
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-base text-sky-700 sm:h-9 sm:w-9 sm:rounded-xl sm:text-lg">
                    ✓
                  </span>

                  <div>
                    <h3 className="text-xs font-semibold sm:text-sm">
                      Internship Opportunities
                    </h3>
                    <p className="mt-0.5 text-[11px] leading-5 text-slate-500 sm:mt-1 sm:text-xs">
                      Explore internship details and eligibility.
                    </p>

                    <Link
                      href="/internship"
                      className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 transition-colors hover:text-sky-900 sm:mt-2 sm:text-xs"
                    >
                      Explore Internship <span>↗</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-slate-200 pt-3 sm:mt-5 sm:pt-4">
              <p className="text-[11px] leading-5 text-slate-500 sm:text-xs">
                Complete the enquiry form and tell us what you would
                like to know.
              </p>
            </div>
          </div>

          {/* Enquiry form */}
          <ContactForm />
        </div>
      </section>
      
      {/* Office location and Google Map */}
      <section className="px-4 py-8 sm:px-8 sm:py-14">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 sm:mb-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-700 sm:text-xs">
              Find Us
            </p>

            <h2 className="mt-1.5 text-xl font-bold tracking-tight sm:mt-2 sm:text-3xl">
              Visit Way2Skills
            </h2>

            <p className="mt-1 max-w-xl text-xs leading-5 text-slate-600 sm:mt-2 sm:text-sm sm:leading-6">
              Find our office on the map. We look forward to connecting
              with you about your learning journey.
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-sky-100 bg-white shadow-[0_4px_12px_rgba(15,50,80,0.07)] sm:rounded-2xl">
            <iframe
              title="Way2Skills office location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d8201.072446568542!2d78.21207533139739!3d11.149251379165204!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3babcbd8fe6408d7%3A0x70d17da5da2fc025!2sDurozen%20Technologies%20Private%20Limited!5e0!3m2!1sen!2sin!4v1792563686586!5m2!1sen!2sin"
              width="100%"
              height="260"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              className="block w-full sm:h-[380px]"
            />
          </div>

          <p className="mt-2.5 text-[11px] leading-5 text-slate-500 sm:mt-3 sm:text-xs">
            Use the map to view our office location and plan your visit.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}