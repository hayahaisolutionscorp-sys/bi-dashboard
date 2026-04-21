import React from "react";

interface NoDataPlaceholderProps {
  height?: string;
  icon?: string;
  /** Short label shown as heading (takes precedence over `message`). */
  title?: string;
  /** Optional secondary description below the title. */
  description?: string;
  /** Legacy single-line message (used when `title` is not provided). */
  message?: string;
}

export function NoDataPlaceholder({
  height = "300px",
  icon = "bar_chart",
  title,
  description,
  message = "No data available",
}: NoDataPlaceholderProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-600"
      style={{ height }}
    >
      <span className="material-icons-outlined text-4xl">{icon}</span>
      <p className="text-sm font-medium">{title ?? message}</p>
      {description && (
        <p className="text-xs text-slate-400 dark:text-slate-600 max-w-xs text-center leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
