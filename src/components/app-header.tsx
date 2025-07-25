import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserNav } from "@/components/user-nav";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between gap-4 border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden" />
        <h1 className="text-lg font-semibold">SaamaRegulation</h1>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <UserNav />
      </div>
    </header>
  );
}
