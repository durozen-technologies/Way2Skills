"use client";

import Image from "next/image";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { courseRequest } from "@/lib/coursesApi";

type AdminProfile = {
  id: string;
  email: string;
  is_active: boolean;
};

type AdminAuthValue = {
  admin: AdminProfile | null;
  token: string | null;
  pagePath: string;
  pageTitle: string;
  setPage: (path: string, title: string) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

export function useAdminAuth(): AdminAuthValue {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider.");
  }
  return context;
}

export function useAdminPage(path: string, title: string): void {
  const { setPage } = useAdminAuth();
  useEffect(() => setPage(path, title), [path, setPage, title]);
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [pagePath, setPagePath] = useState("/admin");
  const [pageTitle, setPageTitle] = useState("Dashboard");

  const logout = useCallback(() => {
    setToken(null);
    setAdmin(null);
    setExpiresAt(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await courseRequest<{
      access_token: string;
      expires_in: number;
    }>("/api/auth/login", undefined, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    const profile = await courseRequest<AdminProfile>("/api/auth/me", result.access_token);
    setToken(result.access_token);
    setAdmin(profile);
    setExpiresAt(Date.now() + result.expires_in * 1000);
  }, []);
  const setPage = useCallback((path: string, title: string) => {
    setPagePath(path);
    setPageTitle(title);
  }, []);

  useEffect(() => {
    if (!token || expiresAt === null) return;
    const timer = window.setTimeout(logout, Math.max(0, expiresAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [expiresAt, logout, token]);

  const value = useMemo(
    () => ({ admin, token, pagePath, pageTitle, setPage, login, logout }),
    [admin, login, logout, pagePath, pageTitle, setPage, token]
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}


export function AdminLogin() {
  const { login } = useAdminAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      await login(email, password);
      setPassword("");
      router.replace("/admin");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Sign-in could not be completed."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f4f8fc] px-4 py-10 sm:px-6">
      {/* Decorative background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-sky-200/50 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-36 -right-24 h-96 w-96 rounded-full bg-blue-200/40 blur-3xl"
      />

      <section className="relative w-full max-w-md rounded-3xl border border-white/80 bg-white/90 p-6 shadow-[0_24px_80px_-32px_rgba(15,50,90,0.22)] backdrop-blur-xl sm:p-9">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-md shadow-blue-200">
            <Image
              src="/logo/ASA.jpeg"
              alt="Way2Skills logo"
              width={48}
              height={48}
              priority
              className="h-full w-full object-cover"
            />
          </div>

          <div>
            <p className="text-lg font-bold tracking-tight text-slate-950">
              Way2Skills
            </p>
            <p className="text-xs font-medium tracking-wide text-slate-500">
              ADMINISTRATION PORTAL
            </p>
          </div>
        </div>

        {/* Heading */}
        <div className="mt-9">
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950">
            Welcome back
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Sign in to manage your courses, admissions, and student feedback.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            className="mt-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700"
            role="alert"
          >
            <svg
              aria-hidden="true"
              className="mt-0.5 h-5 w-5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5m0 3h.01" />
            </svg>
            <p>{error}</p>
          </div>
        )}

        {/* Form */}
        <form className="mt-7 space-y-5" onSubmit={submit}>
          <div>
            <label
              className="mb-2 block text-sm font-semibold text-slate-700"
              htmlFor="admin-email"
            >
              Email address
            </label>

            <div className="relative">
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
              >
                <rect x="3" y="5" width="18" height="14" rx="3" />
                <path d="m4 7 8 6 8-6" />
              </svg>

              <input
                autoComplete="username"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-12 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                id="admin-email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@way2skills.in"
                required
                type="email"
                value={email}
              />
            </div>
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-semibold text-slate-700"
              htmlFor="admin-password"
            >
              Password
            </label>

            <div className="relative">
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
              >
                <rect x="4" y="10" width="16" height="11" rx="2.5" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>

              <input
                autoComplete="current-password"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-12 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                id="admin-password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
                type={showPassword ? "text" : "password"}
                value={password}
              />

              <button
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                onClick={() => setShowPassword((current) => !current)}
                type="button"
              >
                {showPassword ? (
                  <svg
                    aria-hidden="true"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  >
                    <path d="M3 3l18 18M10.6 10.7a2 2 0 0 0 2.7 2.7" />
                    <path d="M9.9 5.2A11 11 0 0 1 12 5c5.5 0 9 7 9 7a15 15 0 0 1-3.1 3.9M6.2 6.2C4.1 7.6 3 10 3 12s3.5 7 9 7c1.3 0 2.5-.3 3.5-.7" />
                  </svg>
                ) : (
                  <svg
                    aria-hidden="true"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  >
                    <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0866d9] px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/15 transition hover:bg-[#0757b8] hover:shadow-xl hover:shadow-blue-600/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={busy}
            type="submit"
          >
            {busy ? "Signing in..." : "Sign in to dashboard"}
            {!busy && (
              <svg
                aria-hidden="true"
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            )}
          </button>
        </form>

        <div className="mt-7 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-100" />
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Protected access
          </span>
          <div className="h-px flex-1 bg-slate-100" />
        </div>

        <p className="mt-4 text-center text-xs leading-5 text-slate-500">
          Your administrator session is protected by the Way2Skills API.
        </p>
      </section>

      <p className="absolute bottom-3 left-0 right-0 px-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Way2Skills. All rights reserved.
      </p>
    </main>
  );
}
