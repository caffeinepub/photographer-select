import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams, useRouter } from "@tanstack/react-router";
import { Check, Images, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Photo } from "../backend";
import {
  useGetGalleryByInviteToken,
  useSubmitSelection,
} from "../hooks/useQueries";

const SKELETON_ITEMS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

function PhotoCard({
  photo,
  selected,
  onToggle,
  index,
}: {
  photo: Photo;
  selected: boolean;
  onToggle: () => void;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.02, duration: 0.3 }}
      className={`relative cursor-pointer rounded overflow-hidden border-2 transition-all duration-200 ${
        selected
          ? "border-primary shadow-gold"
          : "border-border hover:border-border/60"
      }`}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onToggle();
      }}
      tabIndex={0}
      data-ocid={`selection.item.${index + 1}`}
    >
      <div className="aspect-square relative">
        <img
          src={photo.blobId.getDirectURL()}
          alt={photo.filename}
          className={`w-full h-full object-cover transition-all duration-200 ${
            selected ? "brightness-110" : "hover:brightness-105"
          }`}
          loading="lazy"
        />
        {/* Selection overlay */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              className="absolute top-2 right-2 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-lg"
            >
              <Check
                className="h-4 w-4 text-primary-foreground"
                strokeWidth={3}
              />
            </motion.div>
          )}
        </AnimatePresence>
        {!selected && (
          <div className="absolute inset-0 bg-background/0 hover:bg-background/10 transition-colors" />
        )}
      </div>
      <div className={`px-2 py-1.5 ${selected ? "bg-primary/10" : "bg-card"}`}>
        <p className="text-xs text-muted-foreground truncate">
          {photo.filename}
        </p>
      </div>
    </motion.div>
  );
}

export default function CustomerSelection() {
  const { token } = useParams({ from: "/select/$token" });
  const router = useRouter();
  const {
    data: galleryData,
    isLoading,
    isError,
  } = useGetGalleryByInviteToken(token);
  const submitSelection = useSubmitSelection();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const gallery = galleryData?.[0];
  const photos: Photo[] = galleryData?.[1] ?? [];

  const togglePhoto = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) return;
    try {
      await submitSelection.mutateAsync({
        token,
        selectedPhotoIds: Array.from(selectedIds),
      });
      router.navigate({ to: "/select/$token/success", params: { token } });
    } catch {
      toast.error("Failed to submit selection. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-[40vh] bg-card animate-pulse" />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {SKELETON_ITEMS.map((n) => (
              <Skeleton key={n} className="aspect-square bg-card rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError || !gallery) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center" data-ocid="selection.error_state">
          <Images className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
          <h1 className="font-serif text-2xl text-foreground mb-2">
            Gallery Not Found
          </h1>
          <p className="text-muted-foreground text-sm">
            This gallery link may be invalid or expired.
          </p>
        </div>
      </div>
    );
  }

  const heroPhoto = photos[0];

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Hero */}
      <div className="relative h-[40vh] overflow-hidden">
        {heroPhoto ? (
          <img
            src={heroPhoto.blobId.getDirectURL()}
            alt="Gallery hero"
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.22 0.018 221) 0%, oklch(0.15 0.015 221) 100%)",
            }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(15,20,24,0.4) 0%, rgba(15,20,24,0.85) 100%)",
          }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-10 px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-serif text-3xl sm:text-5xl tracking-[0.1em] uppercase text-foreground mb-3"
          >
            {gallery.name}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-muted-foreground text-sm sm:text-base tracking-wide"
          >
            Select your favorite moments.
          </motion.p>
        </div>
      </div>

      {/* Gallery grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs tracking-widest uppercase text-muted-foreground">
            {photos.length} Photos
          </p>
          <p className="text-sm text-primary font-medium">
            {selectedIds.size} Selected
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((photo, i) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              selected={selectedIds.has(photo.id)}
              onToggle={() => togglePhoto(photo.id)}
              index={i}
            />
          ))}
        </div>
      </div>

      {/* Sticky action bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-secondary/95 backdrop-blur-sm z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs tracking-widest uppercase text-muted-foreground">
              Selection Progress
            </p>
            <p className="text-foreground font-medium">
              <span className="text-primary font-semibold">
                {selectedIds.size}
              </span>{" "}
              photos selected
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={selectedIds.size === 0 || submitSelection.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium tracking-widest uppercase text-sm px-8 h-11 disabled:opacity-40"
            data-ocid="selection.submit_button"
          >
            {submitSelection.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              "Submit Favorites"
            )}
          </Button>

          <div className="text-right hidden sm:block">
            <p className="text-xs tracking-widest uppercase text-muted-foreground">
              Total
            </p>
            <p className="text-foreground font-medium">
              {selectedIds.size}{" "}
              <span className="text-muted-foreground">
                / {photos.length} Photos
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
