"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import CurrentYear from "./CurrentYear";
import {
  FaInstagram,
  FaFacebookF,
  FaLinkedinIn,
  FaYoutube,
} from "react-icons/fa";

const footerLinks = {
  Explore: [
    { label: "Home", href: "/" },
    { label: "Courses", href: "/#course" },
    { label: "Why Way2Skills", href: "/#about" },
    { label: "Student Reviews", href: "/#student-stories" },
  ],
  Programme: [
    { label: "Learning Journey", href: "/#learning-journey" },
    { label: "Admissions", href: "/#admission" },
    { label: "FAQs", href: "/#faq" },
  ],
  Information: [
    { label: "Contact", href: "/contact" },
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms & Conditions", href: "/terms-and-conditions" },
  ],
};

const socialLinks = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/YOUR_USERNAME/",
    Icon: FaInstagram,
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/YOUR_PAGE/",
    Icon: FaFacebookF,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/YOUR_PAGE/",
    Icon: FaLinkedinIn,
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@YOUR_CHANNEL",
    Icon: FaYoutube,
  },
];

export default function Footer() {
  // Mobile accordion state — collapsed by default to keep mobile footer sleek
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (heading: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [heading]: !prev[heading],
    }));
  };

  return (
    <footer className="w2s-footer relative overflow-hidden bg-[#0B1520] text-white">
      {/* Top gradient accent */}
      <div
        aria-hidden="true"
        className="h-[3px] w-full bg-gradient-to-r from-sky-600 via-cyan-300 to-red-500"
      />

      {/* Background decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-10 h-80 w-80 rounded-full bg-sky-500/[0.07] blur-[100px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 bottom-0 h-80 w-80 rounded-full bg-blue-500/[0.07] blur-[100px]"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-6 pt-10 sm:px-8 sm:pt-16 lg:pt-20">
        {/* Main footer content */}
        <div className="grid gap-8 lg:grid-cols-[1.35fr_2fr] lg:gap-16">
          {/* Brand column */}
          <div className="max-w-sm">
            <Link
              href="/"
              aria-label="Way2Skills home"
              className="inline-flex items-center gap-3 rounded-xl"
            >
              <Image
                src="/logo/ASA.jpeg"
                alt="Way2Skills logo"
                width={64}
                height={64}
                className="h-12 w-12 rounded-full border border-white/15 object-cover shadow-lg shadow-black/20 sm:h-16 sm:w-16"
              />

              <span>
                <span className="block text-lg font-bold tracking-tight text-white sm:text-xl">
                  Way2Skills
                </span>
                <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-300">
                  Learn. Build. Grow.
                </span>
              </span>
            </Link>

            <p className="mt-3.5 max-w-xs text-xs leading-6 text-slate-400 sm:mt-5 sm:text-sm sm:leading-7">
              Develop practical technical skills, build projects, and
              take your next step towards a career in technology.
            </p>

            {/* Social links */}
            <div className="mt-5 sm:mt-7">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
                Connect with us
              </p>

              <div className="mt-3 flex flex-wrap gap-2.5 sm:mt-4 sm:gap-3">
                {socialLinks.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Way2Skills on ${label}`}
                    title={label}
                    className="w2s-footer-social flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition-all duration-300 hover:-translate-y-1 hover:border-sky-300/50 hover:bg-sky-400/10 hover:text-sky-300"
                  >
                    <Icon size={16} aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation columns: Expandable accordion on mobile, multi-column grid on desktop */}
          <div className="flex flex-col divide-y divide-white/10 sm:grid sm:grid-cols-3 sm:gap-x-8 sm:divide-y-0">
            {Object.entries(footerLinks).map(([heading, links]) => {
              const isOpen = !!openSections[heading];
              const sectionId = `footer-section-${heading.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;

              return (
                <nav
                  key={heading}
                  aria-label={heading}
                  className="py-3 first:pt-0 sm:py-0"
                >
                  {/* Heading Button on Mobile / Static Heading on Desktop */}
                  <button
                    type="button"
                    onClick={() => toggleSection(heading)}
                    aria-expanded={isOpen}
                    aria-controls={sectionId}
                    className="flex w-full items-center justify-between py-1.5 text-left text-sm font-bold text-white transition-colors hover:text-sky-300 sm:pointer-events-none sm:py-0 sm:hover:text-white"
                  >
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-[3px] rounded-full bg-sky-400" />
                      {heading}
                    </span>

                    {/* Chevron icon visible only on mobile */}
                    <span
                      aria-hidden="true"
                      className={`flex h-6 w-6 items-center justify-center text-slate-400 transition-transform duration-300 sm:hidden ${
                        isOpen ? "rotate-180 text-sky-400" : ""
                      }`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </span>
                  </button>

                  {/* Accordion panel on mobile, always visible on desktop */}
                  <div
                    id={sectionId}
                    className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                      isOpen
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    } sm:grid-rows-[1fr] sm:opacity-100`}
                  >
                    <div className="overflow-hidden">
                      <ul className="mt-3 space-y-2.5 pb-2 sm:mt-5 sm:space-y-4 sm:pb-0">
                        {links.map((link) => (
                          <li key={link.label}>
                            <Link
                              href={link.href}
                              className="group inline-flex min-h-[38px] items-center gap-2 text-xs leading-5 text-slate-400 transition-colors duration-200 hover:text-sky-300 sm:min-h-0 sm:text-sm"
                            >
                              <span>{link.label}</span>
                              <span
                                aria-hidden="true"
                                className="text-[11px] text-sky-400 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
                              >
                                ↗
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </nav>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="my-7 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent sm:my-12" />

        {/* Bottom footer bar */}
        <div className="flex flex-col gap-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <p>© <CurrentYear /> Way2Skills. All rights reserved.</p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-x-5">
            <Link
              href="/privacy-policy"
              className="py-1 transition-colors hover:text-sky-300"
            >
              Privacy
            </Link>

            <Link
              href="/terms-and-conditions"
              className="py-1 transition-colors hover:text-sky-300"
            >
              Terms
            </Link>

            <span className="font-medium text-slate-400">
              Built for your next step.
              <span className="ml-1 text-red-400">♥</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}