import React from "react";

interface NoDataPlaceholderProps {
  height?: string;
  icon?: string;
  message?: string;
}

export function NoDataPlaceholder({
  height = "300px",
  icon = "bar_chart",
  message = "No data available",
}: NoDataPlaceholderProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-600"
      style={{ height }}
    >
      <span className="material-icons-outlined text-4xl">{icon}</span>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
