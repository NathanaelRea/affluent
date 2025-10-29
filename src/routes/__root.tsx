import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { NavMenu } from "@/components/Nav";
import { ModeToggle } from "@/components/mode-toggle";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

const queryClient = new QueryClient();

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <div className="flex flex-col h-full min-h-screen">
          <nav className="sticky top-0 z-50 border-b backdrop-blur supports-[backdrop-filter]:bg-background/60 bg-background/80">
            <div className="mx-auto flex items-center justify-between gap-3 px-4 py-3 w-full max-w-5xl">
              <Link to="/">
                <span className="font-semibold text-lg tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">
                  Affluent
                </span>
              </Link>
              <div className="flex items-center gap-2">
                <NavMenu />
                <ModeToggle />
              </div>
            </div>
          </nav>
          <div className="flex-grow">
            <div className="flex flex-col justify-center items-center p-6 h-full">
              <main className="flex flex-col gap-6 w-full max-w-5xl">
                <Outlet />
              </main>
            </div>
          </div>
          <footer className="border-t">
            <div className="mx-auto flex items-center justify-center gap-2 px-4 py-4 max-w-5xl">
              <a
                className="inline-flex h-5 w-5 items-center justify-center"
                href="https://github.com/nathanaelrea/affluent"
                aria-label="GitHub repository"
              >
                <GithubIcon />
              </a>
              <span className="text-xs text-muted-foreground">
                For informational purposes only. Data is not transmitted, just
                stored locally in your browser.
              </span>
            </div>
          </footer>
        </div>
        <Toaster />
      </QueryClientProvider>
      <TanStackRouterDevtools />
    </ThemeProvider>
  ),
});

function GithubIcon() {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className="fill-white"
    >
      <title>GitHub</title>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}
