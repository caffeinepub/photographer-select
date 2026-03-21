import { useParams } from "@tanstack/react-router";
import { CheckCircle2, Images } from "lucide-react";
import { motion } from "motion/react";
import { useGetGalleryByInviteToken } from "../hooks/useQueries";

export default function SelectionSuccess() {
  const { token } = useParams({ from: "/select/$token/success" });
  const { data: galleryData } = useGetGalleryByInviteToken(token);
  const gallery = galleryData?.[0];

  return (
    <div
      className="min-h-screen bg-background flex flex-col items-center justify-center px-4"
      style={{
        background:
          "radial-gradient(ellipse at 50% 30%, oklch(0.22 0.018 221) 0%, oklch(0.12 0.012 221) 70%)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="text-center max-w-md"
        data-ocid="success.panel"
      >
        {/* Checkmark icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            delay: 0.2,
            type: "spring",
            stiffness: 200,
            damping: 15,
          }}
          className="w-20 h-20 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center mx-auto mb-8"
        >
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="font-serif text-4xl tracking-wide text-foreground mb-3"
        >
          Selection Submitted
        </motion.h1>

        {gallery && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="font-serif text-lg text-primary mb-4 tracking-wide"
          >
            {gallery.name}
          </motion.p>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-muted-foreground text-sm leading-relaxed"
        >
          Your favorites have been saved. Your photographer will review your
          selection and be in touch soon.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-10 pt-8 border-t border-border"
        >
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Images className="h-3 w-3" />
            <span className="font-serif tracking-widest uppercase">Luma</span>
            <span>— Professional Photo Selections</span>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
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
        </motion.div>
      </motion.div>
    </div>
  );
}
