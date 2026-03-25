import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams, useRouter } from "@tanstack/react-router";
import { Images, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Photo } from "../backend";
import { GalleryStatus } from "../backend";
import {
  useGetGalleryByInviteToken,
  useSubmitSelection,
} from "../hooks/useQueries";

const SKELETON_ITEMS = Array.from({ length: 12 }, (_, i) => i);

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
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.02, duration: 0.25 }}
      className="relative cursor-pointer gallery-image-wrapper"
      style={{ borderRadius: 10, overflow: "hidden" }}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onToggle();
      }}
      tabIndex={0}
      data-ocid={`selection.item.${index + 1}`}
    >
      <img
        src={photo.blobId.getDirectURL()}
        alt={photo.filename}
        className="w-full aspect-square object-cover"
        loading="lazy"
        style={{ display: "block" }}
      />
      {/* Selected overlay */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
            style={{ background: "rgba(220,38,38,0.18)", borderRadius: 10 }}
          />
        )}
      </AnimatePresence>
      {/* Heart button */}
      <button
        type="button"
        className="absolute bottom-1.5 right-1.5 w-8 h-8 flex items-center justify-center rounded-full text-lg"
        style={{
          background: "rgba(0,0,0,0.6)",
          border: "none",
          cursor: "pointer",
        }}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        aria-label={selected ? "Deselect" : "Select"}
        data-ocid={`selection.toggle.${index + 1}`}
      >
        <span
          style={{
            color: selected ? "#ef4444" : "#aaaaaa",
            transition: "color 0.15s",
            fontSize: 18,
            lineHeight: 1,
          }}
        >
          ❤
        </span>
      </button>
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
    if (selectedIds.size === 0) {
      toast.error("Koi photo select nahi ki");
      return;
    }
    try {
      await submitSelection.mutateAsync({
        token,
        selectedPhotoIds: Array.from(selectedIds),
      });
      router.navigate({ to: "/select/$token/success", params: { token } });
    } catch {
      toast.error("Submit nahi hua. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen"
        style={{ background: "#0b0b0b", color: "#fff" }}
      >
        <div className="text-center py-6">
          <div className="text-3xl mb-1">📸</div>
          <p className="text-sm" style={{ color: "#888" }}>
            Loading...
          </p>
        </div>
        <div
          className="px-2.5"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            gap: 10,
          }}
        >
          {SKELETON_ITEMS.map((n) => (
            <Skeleton
              key={n}
              className="aspect-square rounded-lg"
              style={{ background: "#1a1a1a" }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !gallery) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#0b0b0b", color: "#fff" }}
        data-ocid="selection.error_state"
      >
        <div className="text-center">
          <Images
            className="h-12 w-12 mx-auto mb-4"
            style={{ color: "#555" }}
          />
          <h1 className="text-xl font-bold mb-2">Gallery nahi mila</h1>
          <p style={{ color: "#888", fontSize: 14 }}>
            Yeh link invalid ya expire ho sakta hai.
          </p>
        </div>
      </div>
    );
  }

  // Expired gallery
  if (gallery.status === GalleryStatus.closed) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#0b0b0b", color: "#fff" }}
        data-ocid="selection.expired_state"
      >
        <div className="text-center">
          <div className="text-4xl mb-4">⏰</div>
          <h1 className="text-xl font-bold mb-2">Link Expired</h1>
          <p style={{ color: "#888", fontSize: 14 }}>
            Yeh gallery link expire ho gayi hai.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pb-24"
      style={{
        background: "#0b0b0b",
        color: "#fff",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", padding: "16px 10px 8px" }}>
        <div className="text-3xl mb-1">📸</div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
          Saini Digital Studio
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 14, color: "#aaa" }}>
          {gallery.name}
          {gallery.clientName ? ` — ${gallery.clientName}` : ""}
        </p>
      </div>

      {/* Counter */}
      <div
        data-ocid="selection.counter"
        style={{
          textAlign: "center",
          padding: "6px 10px",
          fontSize: 15,
          color: "#ddd",
        }}
      >
        Selected:{" "}
        <strong style={{ color: "#ef4444" }}>{selectedIds.size}</strong> /{" "}
        {photos.length}
      </div>

      {/* Photo grid */}
      <div
        className="px-2.5 py-2"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap: 10,
        }}
      >
        {photos.map((photo, i) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            selected={selectedIds.has(photo.id)}
            onToggle={() => togglePhoto(photo.id)}
            index={i}
          />
        ))}

        {photos.length === 0 && (
          <div
            className="col-span-full text-center py-16"
            style={{ color: "#555" }}
            data-ocid="selection.empty_state"
          >
            <Images className="h-10 w-10 mx-auto mb-2" />
            <p>Koi photo nahi hai</p>
          </div>
        )}
      </div>

      {/* Submit button — fixed bottom */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: "rgba(11,11,11,0.95)",
          borderTop: "1px solid #222",
          padding: "12px 16px",
        }}
      >
        <Button
          onClick={handleSubmit}
          disabled={selectedIds.size === 0 || submitSelection.isPending}
          className="w-full h-12 font-bold text-base"
          style={{ background: "#ef4444", color: "#fff", border: "none" }}
          data-ocid="selection.submit_button"
        >
          {submitSelection.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Submit ho raha hai...
            </>
          ) : (
            `Submit Selection (${selectedIds.size})`
          )}
        </Button>
      </div>
    </div>
  );
}
