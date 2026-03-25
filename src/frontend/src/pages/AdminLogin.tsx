import { Button } from "@/components/ui/button";
import { useRouter } from "@tanstack/react-router";
import { Loader2, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useClaimFirstAdmin, useIsAdmin } from "../hooks/useQueries";

export default function AdminLogin() {
  const { login, isLoggingIn, identity, isInitializing } =
    useInternetIdentity();
  const {
    data: isAdmin,
    isLoading: adminLoading,
    isFetching: adminFetching,
  } = useIsAdmin();
  const claimFirstAdmin = useClaimFirstAdmin();
  const router = useRouter();

  useEffect(() => {
    if (identity && isAdmin) {
      router.navigate({ to: "/admin" });
    }
  }, [identity, isAdmin, router]);

  const notLoggedIn = !identity;
  const checkingAdmin = !!identity && (adminLoading || adminFetching);
  const loggedInNotAdmin =
    !!identity && !adminLoading && !adminFetching && !isAdmin;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">📸</div>
          <h1 className="font-display text-3xl font-bold text-foreground tracking-tight">
            Saini Digital Studio
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            Photographer Admin Panel
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-card">
          {notLoggedIn && (
            <>
              <p className="text-sm text-muted-foreground text-center mb-5">
                Sign in to manage your galleries and client selections.
              </p>
              <Button
                onClick={login}
                disabled={isLoggingIn || isInitializing}
                className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/80 font-semibold"
                data-ocid="login.submit_button"
              >
                {isLoggingIn || isInitializing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  "Sign In with Internet Identity"
                )}
              </Button>
            </>
          )}

          {checkingAdmin && (
            <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Verifying access...</span>
            </div>
          )}

          {loggedInNotAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-sm text-muted-foreground text-center mb-4">
                Logged in. Now claim photographer access.
              </p>
              <Button
                onClick={async () => {
                  try {
                    await claimFirstAdmin.mutateAsync();
                    toast.success("Photographer access claimed!");
                    router.navigate({ to: "/admin" });
                  } catch {
                    toast.error("Failed to claim access. Try again.");
                  }
                }}
                disabled={claimFirstAdmin.isPending}
                className="w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                data-ocid="login.primary_button"
              >
                {claimFirstAdmin.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Claiming...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Claim Photographer Access
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Client? Use the link your photographer sent you.
        </p>
      </motion.div>

      <footer className="absolute bottom-6 text-xs text-muted-foreground">
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
          className="underline hover:text-foreground"
          target="_blank"
          rel="noopener noreferrer"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
