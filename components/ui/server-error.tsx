import { AlertCircle, RefreshCcw } from "lucide-react";

interface ServerErrorProps {
  message?: string;
  onRetry?: () => void;
}

export function ServerError({ message = "Something went wrong on our end.", onRetry }: ServerErrorProps) {
  return (
    <div className="flex min-h-[400px] w-full flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-500">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h2 className="mb-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">500 Server Error</h2>
      <p className="mb-6 max-w-[400px] text-sm text-slate-500 dark:text-slate-400">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-blue-700"
        >
          <RefreshCcw className="h-4 w-4" />
          Try Again
        </button>
      )}
    </div>
  );
}
