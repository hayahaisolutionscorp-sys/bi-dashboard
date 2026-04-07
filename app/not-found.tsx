import Link from "next/link";
import { AlertTriangle, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex max-w-[420px] flex-col items-center text-center">
        <div className="mb-6 flex h-20 w-20 flex-col items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
          <AlertTriangle className="h-10 w-10" />
        </div>
        
        <h1 className="mb-2 text-4xl font-bold tracking-tight">404</h1>
        <h2 className="mb-6 text-xl font-medium text-slate-600 dark:text-slate-400">Page Not Found</h2>
        
        <p className="mb-8 text-sm text-slate-500 dark:text-slate-500">
          Oops! The page you are looking for doesn't exist, has been moved, or is temporarily unavailable.
        </p>
        
        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 sm:w-1/2"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 sm:w-1/2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
