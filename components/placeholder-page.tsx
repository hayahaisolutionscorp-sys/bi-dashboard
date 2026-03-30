import { LucideIcon } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function PlaceholderPage({ title, description, icon: Icon }: PlaceholderPageProps) {
  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1700px] mx-auto w-full">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="p-6 bg-primary/10 rounded-full">
          <Icon className="size-16 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tight">{title}</h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            {description}
          </p>
        </div>
        <div className="mt-8 p-6 bg-muted rounded-lg">
          <p className="text-sm font-semibold text-muted-foreground">
            🚧 Coming Soon
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            This feature is currently under development
          </p>
        </div>
      </div>
    </div>
  );
}
