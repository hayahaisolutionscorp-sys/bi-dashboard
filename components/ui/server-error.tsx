import { AlertCircle, RefreshCcw } from "lucide-react";

interface ServerErrorProps {
  message?: string;
  onRetry?: () => void;
}

export function ServerError({ message = "Something went wrong on our end.", onRetry }: ServerErrorProps) {
  return (
    <div className="flex min-h-[400px] w-full flex-col items-center justify-center rounded-xl border border-rose-100 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h2 className="mb-1.5 text-base font-semibold text-slate-900 dark:text-slate-100">Unable to load data</h2>
      <p className="mb-5 max-w-[360px] text-sm text-slate-500 dark:text-slate-400">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex h-8 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          Try Again
        </button>
      )}
    </div>
  );
}
