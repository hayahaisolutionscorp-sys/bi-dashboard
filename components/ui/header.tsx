import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  children?: React.ReactNode;
}

export function Header({ title, subtitle, className, children }: HeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white">{title}</h1>
        {subtitle && (
          <p className="text-[13px] text-slate-500 dark:text-slate-400 font-normal">{subtitle}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}
