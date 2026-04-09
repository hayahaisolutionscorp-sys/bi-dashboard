"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard Error:", error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="flex flex-col items-center max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            System Error
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            We encountered an issue while loading your dashboard data. Please try refreshing the page.
          </p>
        </div>

        {error.message && (
          <div className="w-full p-3 rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 text-xs font-mono text-slate-500 overflow-auto max-h-32 text-left">
            {error.message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button 
            onClick={() => reset()}
            className="flex-1 gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </Button>
          <Button 
            asChild 
            variant="outline" 
            className="flex-1"
          >
            <Link href="/">
              Go Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
