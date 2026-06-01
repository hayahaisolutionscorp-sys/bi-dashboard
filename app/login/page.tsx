"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    AlertCircle,
    Anchor,
    ArrowRight,
    CheckCircle2,
    Eye,
    EyeOff,
    LockKeyhole,
    Mail,
    Route,
    Ship,
    ShieldCheck,
    Waves,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { authService } from "@/services/auth.service";

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            await authService.login({ email, password });
            // Get tenants from localStorage and parse JSON
            const tenantsStr = localStorage.getItem("tenants");
            const tenants = tenantsStr ? JSON.parse(tenantsStr) : [];
            const firstTenant = tenants[0];
            if (!firstTenant?.name) {
                setError("Login succeeded but no shipping lines are assigned to your account. Contact your administrator.");
                return;
            }
            const slug = firstTenant.name
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-');
            router.push(`/${slug}/dashboard`);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Invalid credentials. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_18%_12%,var(--accent),transparent_26%),linear-gradient(135deg,var(--background),var(--muted))] text-foreground">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-chart-4 to-chart-2" />
            <div className="absolute right-6 top-6 z-20">
                <ThemeToggle />
            </div>

            <div className="mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 items-center gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.95fr_400px] lg:px-8 lg:py-8">
                <section className="relative hidden min-h-[500px] overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-sky-400 via-primary to-blue-700 p-7 shadow-xl shadow-primary/15 dark:border-white/10 dark:from-slate-900 dark:via-sky-950 dark:to-blue-950 lg:block">
                    <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.18)_44%,transparent_45%)]" />
                    <div className="relative z-10 flex h-full flex-col justify-between">
                        <div className="flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <div className="grid size-11 place-items-center rounded-2xl bg-white/16 ring-1 ring-white/25 backdrop-blur">
                                    <Ship className="size-6" aria-hidden="true" />
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase">Hayahai BI</p>
                                    <p className="text-xs font-semibold text-white/80">Maritime intelligence</p>
                                </div>
                            </div>
                            <div className="rounded-full border border-white/25 bg-white/12 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white/90 backdrop-blur">
                                Fleet ready
                            </div>
                        </div>

                        <div className="relative mx-auto h-[245px] w-full max-w-[500px]">
                            <div className="absolute left-4 top-6 flex items-center gap-3 rounded-2xl bg-white/95 px-3.5 py-2.5 text-slate-950 shadow-lg shadow-blue-950/10 dark:bg-slate-950/90 dark:text-white">
                                <ShieldCheck className="size-4 text-emerald-500" aria-hidden="true" />
                                <div>
                                    <p className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-300">Secure Access</p>
                                    <p className="text-xs font-black">Role-based dashboards</p>
                                </div>
                            </div>

                            <div className="absolute right-0 top-14 rounded-2xl bg-white/95 p-3 shadow-xl shadow-blue-950/15 dark:bg-slate-950/90">
                                <div className="mb-3 flex items-center gap-2 text-slate-900 dark:text-white">
                                    <Route className="size-3.5 text-primary" aria-hidden="true" />
                                    <span className="text-[11px] font-black uppercase">Route Pulse</span>
                                </div>
                                <div className="flex h-20 w-32 items-end gap-1.5">
                                    {[46, 70, 54, 88, 62, 96].map((height) => (
                                        <span
                                            key={height}
                                            className="w-full rounded-t-lg bg-gradient-to-t from-primary to-cyan-300"
                                            style={{ height: `${height}%` }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="absolute bottom-2 left-1/2 h-28 w-[420px] -translate-x-1/2 rounded-t-[52%] bg-sky-200/25 blur-sm dark:bg-cyan-500/10" />
                            <svg
                                className="absolute bottom-2 left-1/2 h-44 w-[410px] -translate-x-1/2 text-white drop-shadow-xl"
                                viewBox="0 0 560 270"
                                role="img"
                                aria-label="Passenger and cargo vessel illustration"
                            >
                                <path d="M42 164h415l-35 58H92z" fill="currentColor" opacity=".96" />
                                <path d="M102 119h128v45H82z" fill="currentColor" opacity=".78" />
                                <path d="M244 86h106v78H226z" fill="currentColor" opacity=".9" />
                                <path d="M365 126h86v38h-86z" fill="currentColor" opacity=".82" />
                                <path d="M260 104h18v18h-18zm34 0h18v18h-18zm34 0h18v18h-18zm-132 31h20v14h-20zm-36 0h20v14h-20zm-36 0h20v14h-20z" fill="var(--primary)" />
                                <path d="M310 86V45m0 0 112 81M310 45l-86 119" stroke="currentColor" strokeWidth="10" strokeLinecap="round" opacity=".74" />
                                <path d="M32 230c44 18 88-18 132 0s88-18 132 0 88-18 132 0 68-8 100-2" fill="none" stroke="currentColor" strokeWidth="12" strokeLinecap="round" opacity=".55" />
                            </svg>

                            <div className="absolute bottom-5 left-2 flex items-center gap-2 rounded-2xl bg-white/88 px-3.5 py-2.5 text-slate-800 shadow-lg shadow-blue-950/10 ring-1 ring-white/60 backdrop-blur dark:bg-slate-950/82 dark:text-white dark:ring-white/15">
                                <Anchor className="size-4 text-primary dark:text-cyan-300" aria-hidden="true" />
                                <span className="text-xs font-black">Cruise, RoRo, LCT, and cargo insights</span>
                            </div>
                        </div>

                        <div className="max-w-xl text-white">
                            <div className="mb-3 flex flex-wrap gap-2">
                                {["Passenger load", "Cargo revenue", "Voyage status"].map((item) => (
                                    <span key={item} className="rounded-full bg-white/18 px-2.5 py-1 text-[11px] font-bold text-white ring-1 ring-white/25 backdrop-blur">
                                        {item}
                                    </span>
                                ))}
                            </div>
                            <h1 className="max-w-lg text-3xl font-black leading-tight tracking-tight">
                                Business intelligence for shipping lines that move people and cargo.
                            </h1>
                            <p className="mt-3 max-w-md text-sm font-medium leading-6 text-white/85">
                                Monitor routes, vessels, bookings, and operating signals from one secure command deck.
                            </p>
                        </div>
                    </div>
                </section>

                <section
                    className="mx-auto flex min-w-0 max-w-full flex-col sm:max-w-[400px]"
                    style={{ width: "min(100%, calc(100vw - 2rem))" }}
                >
                    <div className="mb-5 flex items-center gap-3 lg:hidden">
                        <div className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                            <Ship className="size-6" aria-hidden="true" />
                        </div>
                        <div>
                            <p className="text-base font-black uppercase text-foreground">Hayahai BI Dashboard</p>
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Maritime intelligence</p>
                        </div>
                    </div>

                    <div
                        className="min-w-0 rounded-3xl border border-border bg-card/90 p-5 shadow-xl shadow-black/10 backdrop-blur-xl sm:p-6 dark:shadow-black/25"
                        style={{ width: "min(100%, calc(100vw - 2rem))" }}
                    >
                        <div className="mb-5">
                            <div className="mb-5 hidden items-center gap-3 lg:flex">
                                <div className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                                    <Ship className="size-5" aria-hidden="true" />
                                </div>
                                <div>
                                    <p className="text-base font-black uppercase tracking-tight text-foreground">Hayahai BI Dashboard</p>
                                    <p className="text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300">Shipping command center</p>
                                </div>
                            </div>
                            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-[11px] font-black uppercase text-accent-foreground">
                                <Waves className="size-3.5" aria-hidden="true" />
                                Welcome aboard
                            </p>
                            <h2 className="break-words text-2xl font-black leading-tight tracking-tight text-foreground sm:text-[28px]">Sign in to your dashboard</h2>
                            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                                Access vessel performance, route intelligence, sales reports, and operational status.
                            </p>
                        </div>

                        {error && (
                            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-600 animate-in fade-in slide-in-from-top-2 dark:text-red-300">
                                <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                                <span>{error}</span>
                            </div>
                        )}

                        <form className="space-y-4" onSubmit={handleLogin}>
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-bold text-foreground">
                                    Email address
                                </label>
                                <div className="relative">
                                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-600 dark:text-slate-300" aria-hidden="true" />
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="operations@hayahai.com"
                                        autoComplete="email"
                                        className="h-11 w-full rounded-xl border border-border bg-input px-10 text-sm font-semibold text-foreground placeholder:text-slate-500 shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60 dark:placeholder:text-slate-400"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={isLoading}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="password" className="text-sm font-bold text-foreground">
                                    Password
                                </label>
                                <div className="relative">
                                    <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-600 dark:text-slate-300" aria-hidden="true" />
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter password"
                                        autoComplete="current-password"
                                        className="h-11 w-full rounded-xl border border-border bg-input px-10 pr-12 text-sm font-semibold text-foreground placeholder:text-slate-500 shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60 dark:placeholder:text-slate-400"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={isLoading}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-slate-600 hover:bg-muted hover:text-foreground dark:text-slate-300"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    <input
                                        type="checkbox"
                                        className="size-4 rounded border-border bg-input accent-primary focus:ring-2 focus:ring-primary"
                                    />
                                    Remember this device
                                </label>
                                <a href="#" className="text-sm font-black text-primary hover:text-primary-hover hover:underline underline-offset-4">
                                    Forgot password?
                                </a>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-black text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                <span>{isLoading ? "Signing in..." : "Sign in"}</span>
                                <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                            </button>
                        </form>

                        <div className="mt-5 grid gap-2.5 rounded-2xl border border-border bg-muted/45 p-3 text-xs text-slate-700 dark:text-slate-300">
                            {[
                                "Encrypted session for tenant dashboards",
                                "Built for passenger, RoRo, LCT, and cargo operations",
                            ].map((item) => (
                                <div key={item} className="flex items-center gap-3">
                                    <CheckCircle2 className="size-4 shrink-0 text-emerald-500" aria-hidden="true" />
                                    <span className="min-w-0 font-medium">{item}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-5 border-t border-border pt-4 text-center">
                            <p className="text-xs text-slate-700 dark:text-slate-300">
                                Don&apos;t have an account?
                                <a href="#" className="ml-1 font-black text-foreground hover:text-primary">
                                    Request access
                                </a>
                            </p>
                            <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                                <a href="#" className="hover:text-primary">Help Center</a>
                                <a href="#" className="hover:text-primary">Terms</a>
                                <a href="#" className="hover:text-primary">Privacy</a>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
