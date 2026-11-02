"use client";

import Link from "next/link";
import { useState, type MouseEvent } from "react";

export default function LearningJourney() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !window.matchMedia("(hover: hover)").matches
    ) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    setTilt({
      x: (0.5 - y) * 2.5,
      y: (x - 0.5) * 2.5,
    });
  };

  const resetTilt = () => setTilt({ x: 0, y: 0 });

  return (
    <section
      id="learning-journey"
      className="w2s-journey-clean-section px-4 py-10 sm:px-8 sm:py-16"
    >
      <div id="admission" className="mx-auto max-w-6xl">
        {/* Learning Journey section heading */}
        <div className="relative z-10 mx-auto mb-6 max-w-3xl text-center sm:mb-10">
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#101820] sm:mt-5 sm:text-4xl lg:text-5xl">
            Your next step starts
            <span className="block text-sky-700">right here.</span>
          </h2>

          <p className="mx-auto mt-2 max-w-xl text-xs leading-6 text-slate-600 sm:mt-4 sm:text-base sm:leading-7">
            Discover practical learning, build technical skills, and prepare
            for new opportunities with Way2Skills.
          </p>
        </div>

        {/* Compact learning card */}
        <div
          onMouseMove={handleMouseMove}
          onMouseLeave={resetTilt}
          className="w2s-journey-clean-card rounded-2xl sm:rounded-3xl"
          style={{
            transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          }}
        >
          {/* Content */}
          <div className="flex flex-col justify-center p-5 sm:p-8 lg:p-10">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-300 sm:text-[11px]">
              Your Next Step
            </span>

            <h2 className="mt-2.5 max-w-md text-xl font-bold leading-tight tracking-tight text-white sm:mt-4 sm:text-3xl lg:text-4xl">
              Ready to start your learning journey?
            </h2>

            <p className="mt-2.5 max-w-md text-xs leading-5 text-slate-300 sm:mt-4 sm:text-sm sm:leading-7">
              Develop practical technical skills, build projects, and
              prepare for your next opportunity with Way2Skills.
            </p>

            <div className="mt-4 flex flex-wrap gap-2.5 sm:mt-6 sm:gap-3">
              <Link
                href="/internship"
                className="w2s-journey-clean-button inline-flex min-h-[40px] items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white sm:min-h-[44px] sm:px-5 sm:py-3 sm:text-sm"
              >
                Explore Courses
                <span aria-hidden="true">↗</span>
              </Link>

              <Link
                href="/contact"
                className="inline-flex min-h-[40px] items-center justify-center rounded-full border border-white/20 px-4 py-2.5 text-xs font-medium text-white/80 transition-colors hover:border-sky-300 hover:text-sky-300 sm:min-h-[44px] sm:px-5 sm:py-3 sm:text-sm"
              >
                Contact Us
              </Link>
            </div>
          </div>

          {/* Floating 3D Laptop */}
          <div className="relative flex min-h-[220px] items-center justify-center overflow-hidden sm:min-h-[320px] lg:min-h-[350px]">
            <div
              aria-hidden="true"
              className="w2s-course-orb absolute -right-12 top-16 z-0 h-48 w-48 rounded-full"
            />
            <div
              aria-hidden="true"
              className="w2s-course-ring absolute -right-5 top-24 z-0 h-40 w-40 rounded-full border"
            />
            <div
              aria-hidden="true"
              className="w2s-course-ring absolute right-4 top-32 z-0 h-28 w-28 rounded-full border"
            />

            {/* Laptop assembly */}
            <div
              className="relative z-10 h-[215px] w-[min(88%,300px)] sm:h-[270px] sm:w-[min(88%,360px)]"
              style={{
                perspective: "1000px",
                animation: "w2s-laptop-float 5s ease-in-out infinite",
              }}
              aria-label="Floating 3D laptop with code on its screen"
              role="img"
            >
              {/* Laptop screen frame */}
              <div
                className="absolute left-[10%] top-2 z-10 h-[135px] w-[80%] rounded-t-[14px] rounded-b-[5px] border border-slate-400/70 bg-gradient-to-br from-slate-400 via-slate-700 to-slate-900 p-[5px] shadow-[0_15px_35px_rgba(0,0,0,0.45)] sm:h-[175px] sm:p-[6px]"
                style={{
                  transform: "perspective(700px) rotateY(-12deg) rotateX(3deg) rotateZ(-4deg)",
                  transformOrigin: "bottom center",
                }}
              >
                {/* Display */}
                <div className="h-full overflow-hidden rounded-[7px] border border-white/10 bg-[#091426]">
                  {/* Browser toolbar */}
                  <div className="flex h-6 items-center justify-between border-b border-white/10 bg-white/[0.04] px-2.5 sm:h-7 sm:px-3">
                    <div className="flex gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400 sm:h-2 sm:w-2" />
                      <span className="h-1.5 w-1.5 rounded-full bg-yellow-300 sm:h-2 sm:w-2" />
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 sm:h-2 sm:w-2" />
                    </div>
                    <span className="text-[7px] text-sky-200/60 sm:text-[8px]">
                      way2skills.tsx
                    </span>
                    <span className="text-[8px] text-white/40 sm:text-[9px]">•••</span>
                  </div>

                  {/* Code editor */}
                  <div className="grid grid-cols-[20px_1fr] sm:grid-cols-[24px_1fr]">
                    <div className="space-y-1.5 border-r border-white/[0.06] py-2 text-center font-mono text-[7px] text-sky-300/40 sm:space-y-2 sm:py-3 sm:text-[8px]">
                      {Array.from({ length: 7 }, (_, i) => (
                        <div key={i}>{i + 1}</div>
                      ))}
                    </div>

                    <div className="space-y-1.5 overflow-hidden p-2 font-mono text-[7px] sm:space-y-2 sm:p-3 sm:text-[9px]">
                      <p className="text-violet-300">
                        const <span className="text-sky-300">learning</span> = {"{"}
                      </p>
                      <p className="pl-2 text-white/70 sm:pl-3">
                        skills: <span className="text-emerald-300">"develop"</span>,
                      </p>
                      <p className="pl-2 text-white/70 sm:pl-3">
                        projects: <span className="text-emerald-300">"build"</span>,
                      </p>
                      <p className="pl-2 text-white/70 sm:pl-3">
                        future: <span className="text-emerald-300">"grow"</span>,
                      </p>
                      <p className="text-violet-300">{"};"}</p>
                      <p className="pt-0.5 text-sky-300 sm:pt-1">
                        export default <span className="text-white">LearningJourney;</span>
                      </p>
                      <div className="mt-1.5 h-1 w-[72%] rounded-full bg-sky-400/80 sm:mt-2" />
                      <div className="h-1 w-[90%] rounded-full bg-violet-400/60" />
                      <div className="h-1 w-[55%] rounded-full bg-emerald-400/60" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Laptop keyboard base */}
              <div
                className="absolute left-0 top-[124px] h-[82px] w-full border border-slate-400/60 bg-gradient-to-br from-slate-200 via-slate-400 to-slate-500 shadow-[0_22px_35px_rgba(0,0,0,0.4)] sm:top-[160px] sm:h-[95px]"
                style={{
                  clipPath: "polygon(10% 0, 90% 0, 100% 75%, 96% 88%, 4% 88%, 0 75%)",
                  transform: "perspective(500px) rotateX(48deg) rotateZ(-4deg)",
                  transformOrigin: "top center",
                }}
              >
                {/* Keyboard keys */}
                <div className="absolute left-[18%] top-2 w-[64%] space-y-1 sm:space-y-1.5">
                  {Array.from({ length: 3 }, (_, row) => (
                    <div
                      key={row}
                      className="flex justify-center gap-1"
                    >
                      {Array.from({ length: row === 1 ? 11 : 10 }, (_, key) => (
                        <span
                          key={key}
                          className="h-[6px] flex-1 rounded-[2px] border border-slate-500/40 bg-gradient-to-b from-slate-700 to-slate-900 shadow-sm sm:h-[7px]"
                        />
                      ))}
                    </div>
                  ))}
                  <div className="mx-auto h-[5px] w-[42%] rounded-sm bg-slate-700 sm:h-[6px]" />
                </div>

                {/* Trackpad */}
                <div className="absolute bottom-[14px] left-[38%] h-[11px] w-[24%] rounded border border-slate-500/50 bg-slate-300/70 sm:bottom-[16px] sm:h-[13px]" />
              </div>

              {/* Laptop base front edge */}
              <div
                aria-hidden="true"
                className="absolute bottom-[5px] left-[5%] h-2 w-[90%] rounded-full bg-gradient-to-r from-slate-500 via-slate-200 to-slate-500 shadow-lg"
              />
            </div>

            {/* Floating technology badges */}
            <div className="absolute left-[3%] top-[18%] rounded-lg border border-white/10 bg-[#14243b]/95 px-2 py-1 text-[9px] font-semibold text-sky-300 shadow-xl backdrop-blur-md sm:rounded-xl sm:px-3 sm:py-2 sm:text-[11px]">
              ⚛ React
            </div>

            <div className="absolute right-[4%] top-[20%] rounded-lg border border-white/10 bg-[#14243b]/95 px-2 py-1 text-[9px] font-bold text-yellow-300 shadow-xl sm:rounded-xl sm:px-3 sm:py-2 sm:text-[11px]">
              JS
            </div>

            <div className="absolute bottom-[23%] right-[2%] rounded-lg border border-white/10 bg-[#14243b]/95 px-2 py-1 text-[8px] font-semibold text-emerald-300 shadow-xl sm:rounded-xl sm:px-3 sm:py-2 sm:text-[10px]">
              Node.js
            </div>

            <div className="absolute bottom-[24%] left-[3%] rounded-lg border border-white/10 bg-[#14243b]/95 px-2 py-1 text-[8px] font-semibold text-violet-300 shadow-xl sm:rounded-xl sm:px-3 sm:py-2 sm:text-[10px]">
              Database
            </div>
          </div>

          {/* Subtle bottom accent */}
          <div
            aria-hidden="true"
            className="w2s-journey-clean-accent absolute bottom-0 left-0 h-[3px] w-full"
          />
        </div>
      </div>
    </section>
  );
}