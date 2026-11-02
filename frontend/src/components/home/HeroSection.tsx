
"use client";

import Link from "next/link";
import Hero3DLoader from "./hero3d/Hero3DLoader";

export default function HeroSection() {
  return (
    <section
      id="home"
      className="way2-hero relative isolate flex flex-col justify-start overflow-hidden px-5 pb-6 pt-24 text-[#101820] sm:px-8 sm:pb-8 sm:pt-26 lg:px-12 lg:pb-8 lg:pt-24 xl:pt-28"
    >
      {/* background image */}
      <div aria-hidden="true" className="way2-hero-background"/>
      {/* Background effects */}
      <div aria-hidden="true" className="way2-hero-glow" />
      <div aria-hidden="true" className="way2-hero-grid" />

      {/* Hero content and 3D animation */}
      <div className="way2-hero-layout relative z-10 mx-auto w-full max-w-7xl">
        {/* Heading, description and buttons */}
        <div className="way2-hero-content relative z-10">
          <h1 className="max-w-2xl text-left text-3xl font-bold leading-[1.1] tracking-[-0.035em] sm:text-5xl sm:leading-[1.08] md:text-5xl lg:text-[clamp(2.75rem,3.8vw,4.25rem)]">
            <span className="block">Learn to Build.</span>

            <span className="mt-2.5 sm:mt-3 block">
              Bring Your Ideas to
            </span>

            <span className="hero-word-window mt-1.5 sm:mt-2 text-red-600">
              <span className="hero-word-track">
                <span >Reality.</span>
                <span className="text-black">Action.</span>
                <span className="text-blue">Tomorrow.</span>
                <span className="text-black">Next Level.</span>
                <span >Reality.</span>
              </span>
            </span>
          </h1>

          <p className="mt-5 max-w-lg text-left text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
            Develop your technical foundation through structured training,
            hands-on practice, and practical development projects with
            Way2Skills.
          </p>

          <div className="mt-6 sm:mt-7 flex flex-col items-stretch justify-start gap-3 sm:flex-row sm:items-center sm:flex-wrap">
            <Link
              href="#course"
              className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(29,78,216,0.18)] transition-all duration-300 hover:-translate-y-1 hover:bg-blue-800 hover:shadow-[0_14px_30px_rgba(29,78,216,0.25)] sm:w-auto"
            >
              Explore Programme
              <span aria-hidden="true">↗</span>
            </Link>

            <Link
              href="#learning-journey"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white/70 px-6 py-3 text-sm font-semibold text-slate-800 transition-all duration-300 hover:-translate-y-1 hover:border-sky-400 hover:bg-white sm:w-auto"
            >
              View Learning Journey
            </Link>
          </div>

          <p className="mt-4 text-left text-xs text-slate-500">
            Learn at your pace. Build with purpose.
          </p>
        </div>

        {/* 3D animation */}
        <div className="way2-hero-globe relative z-0">
          <Hero3DLoader />
        </div>
      </div>

      {/* Soft edge shading */}
      <div aria-hidden="true" className="way2-hero-vignette" />

      {/* Running text at the bottom */}
      <div className="way2-hero-marquee overflow-hidden relative z-10 mx-auto w-full max-w-7xl shrink-0">
        <p className="sr-only">
          Learn, build projects, develop skills, Full Stack Development,
          internship opportunities, and grow your career.
        </p>

        <div className="way2-hero-marquee-track" aria-hidden="true">
          {[1, 2].map((group) => (
            <div className="way2-hero-marquee-group" key={group}>
              <span>LEARN</span>
              <span className="way2-marquee-dot">✦</span>
              <span>BUILD PROJECTS</span>
              <span className="way2-marquee-dot">✦</span>
              <span>DEVELOP SKILLS</span>
              <span className="way2-marquee-dot">✦</span>
              <span>FULL STACK DEVELOPMENT</span>
              <span className="way2-marquee-dot">✦</span>
              <span>INTERNSHIP OPPORTUNITIES</span>
              <span className="way2-marquee-dot">✦</span>
              <span>GROW YOUR CAREER</span>
              <span className="way2-marquee-dot">✦</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
