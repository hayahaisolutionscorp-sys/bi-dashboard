import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="flex flex-col items-center max-w-md w-full text-center space-y-6">
        <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-900">
          <FileQuestion className="w-12 h-12 text-slate-400 dark:text-slate-500" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Error: Page Not Found
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="w-full">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/">
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
