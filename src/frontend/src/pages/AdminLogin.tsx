import { Button } from "@/components/ui/button";
import { useRouter } from "@tanstack/react-router";
import { Camera, Loader2, ShieldCheck } from "lucide-react";
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
    refetch: refetchIsAdmin,
  } = useIsAdmin();
  const claimFirstAdmin = useClaimFirstAdmin();
  const router = useRouter();

  useEffect(() => {
    if (identity && isAdmin) {
      router.navigate({ to: "/admin" });
    }
  }, [identity, isAdmin, router]);

  const loggedInNotAdmin = !!identity && !adminLoading && isAdmin === false;
  const checkingAdmin = !!identity && adminLoading;

  return (
    <div
      className="min-h-screen bg-background flex items-center justify-center px-4"
      style={{
        background:
          "radial-gradient(ellipse at 50% 0%, oklch(0.22 0.018 221) 0%, oklch(0.12 0.012 221) 60%)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-card border border-border mb-6">
            <Camera className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-serif text-4xl tracking-[0.2em] uppercase text-foreground mb-2">
            Luma
          </h1>
          <p className="text-muted-foreground text-sm tracking-widest uppercase">
            Photographer Studio
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-lg p-8">
          <h2 className="font-serif text-2xl text-foreground mb-2 text-center">
            Photographer Access
          </h2>
          <p className="text-muted-foreground text-sm text-center mb-8">
            Sign in to manage your galleries and client selections.
          </p>

          {/* Checking admin status after login */}
          {checkingAdmin && (
            <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Verifying access...</span>
            </div>
          )}

          {/* Logged in but not admin: show claim button */}
          {loggedInNotAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Button
                onClick={async () => {
                  try {
                    await claimFirstAdmin.mutateAsync();
                    await refetchIsAdmin();
                    toast.success(
                      "Photographer access claimed! Welcome to your studio.",
                    );
                    router.navigate({ to: "/admin" });
                  } catch {
                    toast.error(
                      "Failed to claim photographer access. Please try again.",
                    );
                  }
                }}
                disabled={claimFirstAdmin.isPending}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium tracking-widest uppercase text-sm h-12"
                data-ocid="login.primary_button"
              >
                {claimFirstAdmin.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Claiming Access...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Claim Photographer Access
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-3">
                Click to activate your photographer account
              </p>
            </motion.div>
          )}

          {/* Not logged in: always show sign in button */}
          {!identity && (
            <Button
              onClick={login}
              disabled={isLoggingIn || isInitializing}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium tracking-widest uppercase text-sm h-12"
              data-ocid="login.submit_button"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Signing In...
                </>
              ) : isInitializing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading...
                </>
              ) : (
                "Sign In with Internet Identity"
              )}
            </Button>
          )}

          <p className="text-xs text-muted-foreground text-center mt-6">
            Secure authentication via Internet Identity.
          </p>
        </div>

        <div className="text-center mt-8">
          <p className="text-xs text-muted-foreground">
            Client? Use the link provided by your photographer.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
