import { cn } from "@/lib/utils";

export function TypingIndicator({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-1.5 p-2", className)}>
      <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground delay-0"></span>
      <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground delay-150"></span>
      <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground delay-300"></span>
    </div>
  );
}
