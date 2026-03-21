import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { Images, LogOut } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab?: "galleries" | "account";
}

export default function AppLayout({ children, activeTab }: AppLayoutProps) {
  const { clear, identity } = useInternetIdentity();
  const qc = useQueryClient();
  const router = useRouter();

  const handleLogout = async () => {
    await clear();
    qc.clear();
    router.navigate({ to: "/admin/login" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-secondary border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/admin">
            <span className="font-serif text-2xl tracking-[0.15em] uppercase text-foreground hover:text-primary transition-colors">
              Luma
            </span>
          </Link>
          <nav className="flex items-center gap-1" data-ocid="nav.panel">
            <Link
              to="/admin"
              className={`px-4 py-2 text-sm tracking-widest uppercase font-medium transition-colors relative ${
                activeTab === "galleries"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-ocid="nav.galleries.link"
            >
              Galleries
              {activeTab === "galleries" && (
                <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
            {identity && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground gap-2 tracking-widest uppercase text-sm"
                data-ocid="nav.logout.button"
              >
                <LogOut className="h-4 w-4" />
                Log Out
              </Button>
            )}
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-secondary border-t border-border mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Images className="h-3 w-3" />
            <span className="font-serif tracking-widest uppercase">Luma</span>
            <span>— Professional Photo Selections</span>
          </div>
          <p>
            &copy; {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
