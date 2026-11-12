import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Way2Skills",
  description:
    "Sign in to your Way2Skills account to access course modules, live sessions, assignments, and mentorship updates.",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#EAF7FC] text-slate-900">
      <Navbar />

      {/* Header section */}
      <section className="bg-[#BDE8F7] px-4 pb-6 pt-24 sm:px-8 sm:pb-8 sm:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-600 sm:text-xs">
            Student & Mentor Portal
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:mt-3 sm:text-4xl">
            Welcome to Way2Skills
          </h1>

          <p className="mx-auto mt-2 max-w-lg text-xs leading-5 text-slate-600 sm:mt-3 sm:text-base sm:leading-6">
            Log in to access your dashboard, learning materials, and live
            sessions.
          </p>
        </div>
      </section>

      {/* Login Card Section */}
      <section className="px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-md">
          <LoginForm />

          {/* Need help footer */}
          <div className="mt-6 text-center text-xs text-slate-500">
            Need assistance with your account?{" "}
            <Link
              href="/contact"
              className="font-semibold text-sky-700 underline underline-offset-2 transition-colors hover:text-blue-900"
            >
              Contact Way2Skills Support
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
