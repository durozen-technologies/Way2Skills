"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/#about" },
  { label: "Courses", href: "/courses" },
  { label: "Internship", href: "/internship" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // Close menu on Escape key press or click outside
  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <header
      ref={headerRef}
      className="fixed left-1/2 top-3 z-50 w-[calc(100%-1.25rem)] max-w-7xl -translate-x-1/2 sm:w-[calc(100%-1.5rem)]"
    >
      <nav
        aria-label="Main navigation"
        className="flex items-center justify-between rounded-full border border-white/40 bg-white/80 px-4 py-2 shadow-sm backdrop-blur-xl transition-all duration-300 sm:px-7 sm:py-2.5 lg:px-9"
      >
        <Link
          href="/"
          aria-label="Way2Skills home"
          className="flex shrink-0 pt-3 items-center py-0.5"
        >
          <Image
            src="/logo/textlogo.png"
            alt="Way2Skills logo"
            width={140}
            height={48}
            priority
            className="h-7 w-auto object-contain sm:h-9"
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-6 md:flex lg:gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="nav-link-underline relative py-2 text-sm font-medium text-black/75 transition-colors hover:text-black"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex md:items-center md:gap-3">
          {/* <Link
            href="/login"
            className="inline-flex min-h-[44px] items-center px-3.5 py-2 text-sm font-medium text-black/80 transition-colors hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Login
          </Link> */}
          <Link
            href="/admissions"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#18181b] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Apply Now <span aria-hidden="true">↗</span>
          </Link>
        </div>

        {/* Mobile Hamburger Button with 44px Touch Target */}
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          aria-haspopup="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white/70 text-slate-800 transition-colors hover:border-red-500 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 md:hidden"
        >
          <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
          <div className="relative flex h-4 w-5 flex-col justify-between" aria-hidden="true">
            <span
              className={`block h-0.5 w-full rounded-full bg-current transition-transform duration-300 ease-in-out ${
                menuOpen ? "translate-y-[7px] rotate-45" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-full rounded-full bg-current transition-opacity duration-300 ease-in-out ${
                menuOpen ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`block h-0.5 w-full rounded-full bg-current transition-transform duration-300 ease-in-out ${
                menuOpen ? "-translate-y-[7px] -rotate-45" : ""
              }`}
            />
          </div>
        </button>
      </nav>

      {/* Mobile Navigation Dropdown */}
      {menuOpen && (
        <div
          id="mobile-navigation"
          role="region"
          aria-label="Mobile navigation links"
          className="animate-in fade-in slide-in-from-top-2 absolute right-0 top-[calc(100%+0.5rem)] max-h-[calc(100vh-5.5rem)] w-full overflow-y-auto rounded-3xl border border-black/10 bg-white/95 p-3 shadow-xl backdrop-blur-2xl md:hidden"
        >
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="flex min-h-[44px] items-center rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 transition-colors hover:bg-sky-50 hover:text-red-600 focus-visible:bg-sky-50 focus-visible:outline-none"
              >
                {link.label}
              </Link>
            ))}

            <div className="mt-2 flex flex-col gap-2 border-t border-slate-100 pt-2">
              {/* <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="flex min-h-[44px] w-full items-center justify-center rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-800 transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Login
              </Link> */}
              <Link
                href="/admissions"
                onClick={() => setMenuOpen(false)}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl bg-[#18181b] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Apply Now <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}