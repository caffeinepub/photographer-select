import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Copy,
  Images,
  Loader2,
  Share2,
  Trash2,
  Upload,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import { useActor } from "../hooks/useActor";
import {
  useDeletePhoto,
  useGetGallerySelection,
  useGetGalleryWithPhotos,
} from "../hooks/useQueries";

const SKELETON_KEYS = Array.from({ length: 12 }, (_, i) => `sk-${i}`);

export default function AdminGalleryDetail() {
  const { id } = useParams({ from: "/admin/gallery/$id" });
  const navigate = useNavigate();
  const { data: galleryData, isLoading } = useGetGalleryWithPhotos(id);
  const { data: selection } = useGetGallerySelection(id);
  const deletePhoto = useDeletePhoto(id);
  const { actor } = useActor();

  const [uploadProgress, setUploadProgress] = useState<number[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const gallery = galleryData?.[0];
  const photos = galleryData?.[1] ?? [];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !actor) return;

    setIsUploading(true);
    const progress = new Array(files.length).fill(0);
    setUploadProgress([...progress]);

    try {
      await Promise.all(
        files.map(async (file, i) => {
          const bytes = new Uint8Array(await file.arrayBuffer());
          const blob = ExternalBlob.fromBytes(bytes).withUploadProgress(
            (pct) => {
              progress[i] = pct;
              setUploadProgress([...progress]);
            },
          );
          await actor.addPhoto(id, blob, file.name);
        }),
      );
      toast.success(`${files.length} photo(s) uploaded!`);
    } catch (e: any) {
      toast.error(`Upload failed: ${e?.message ?? "Unknown error"}`);
    } finally {
      setIsUploading(false);
      setUploadProgress([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const overallProgress =
    uploadProgress.length > 0
      ? Math.round(
          uploadProgress.reduce((a, b) => a + b, 0) / uploadProgress.length,
        )
      : 0;

  const handleCopyLink = async () => {
    if (!actor) return;
    try {
      const token = await actor.getOrCreateInviteToken(id);
      const url = `${window.location.origin}${window.location.pathname}#/select/${token}`;
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleWhatsApp = async () => {
    if (!actor) return;
    try {
      const token = await actor.getOrCreateInviteToken(id);
      const url = `${window.location.origin}${window.location.pathname}#/select/${token}`;
      const msg = encodeURIComponent(`Please select your photos: ${url}`);
      window.open(`https://wa.me/?text=${msg}`, "_blank");
    } catch {
      toast.error("Failed");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Skeleton className="h-8 w-40 bg-card mb-6" />
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {SKELETON_KEYS.map((k) => (
            <Skeleton key={k} className="aspect-square rounded-lg bg-card" />
          ))}
        </div>
      </div>
    );
  }

  if (!gallery) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Gallery not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/admin" })}
            className="text-muted-foreground hover:text-foreground"
            data-ocid="gallery_detail.back.button"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-foreground truncate">
              {gallery.name}
            </h1>
            <p className="text-xs text-muted-foreground">
              {gallery.clientName}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyLink}
              className="border-border text-foreground hover:bg-secondary"
              data-ocid="gallery_detail.copy_link.button"
            >
              <Copy className="h-3 w-3 mr-1" />
              Link
            </Button>
            <Button
              size="sm"
              onClick={handleWhatsApp}
              className="bg-green-700 hover:bg-green-600 text-white"
              data-ocid="gallery_detail.whatsapp.button"
            >
              <Share2 className="h-3 w-3 mr-1" />
              WhatsApp
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Stats & Upload */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">
                {photos.length}
              </p>
              <p className="text-xs text-muted-foreground">Photos</p>
            </div>
            {selection && (
              <div className="text-center">
                <p className="text-2xl font-bold text-accent">
                  {selection.selectedPhotoIds.length}
                </p>
                <p className="text-xs text-muted-foreground">Selected</p>
              </div>
            )}
          </div>
          <div>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              data-ocid="gallery_detail.upload_button"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Uploading {overallProgress}%
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photos
                </>
              )}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
          </div>
        </div>

        {isUploading && (
          <div className="mb-4" data-ocid="gallery_detail.upload.loading_state">
            <p className="text-xs text-muted-foreground mb-1">
              Uploading... {overallProgress}%
            </p>
            <Progress value={overallProgress} className="h-2" />
          </div>
        )}

        {/* Selection summary */}
        {selection && selection.selectedPhotoIds.length > 0 && (
          <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-accent">
              Client selected {selection.selectedPhotoIds.length} of{" "}
              {photos.length} photos
            </p>
          </div>
        )}

        {/* Photos grid */}
        {photos.length === 0 ? (
          <div
            className="text-center py-20"
            data-ocid="gallery_detail.photos.empty_state"
          >
            <Images className="h-12 w-12 mx-auto text-muted-foreground opacity-30 mb-3" />
            <p className="text-muted-foreground">
              No photos yet. Upload to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {photos.map((photo, i) => {
              const isSelected = selection?.selectedPhotoIds.includes(photo.id);
              return (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.015 }}
                  className="relative group gallery-image-wrapper"
                  data-ocid={`gallery_detail.photos.item.${i + 1}`}
                >
                  <div
                    className={`aspect-square rounded-lg overflow-hidden border-2 ${
                      isSelected ? "border-accent" : "border-transparent"
                    }`}
                  >
                    <img
                      src={photo.blobId.getDirectURL()}
                      alt={photo.filename}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {isSelected && (
                      <div className="absolute top-1 right-1 bg-accent text-accent-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        ✓
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 bg-black/70 text-white rounded-full p-1 transition-opacity"
                    onClick={async () => {
                      if (!confirm("Delete this photo?")) return;
                      try {
                        await deletePhoto.mutateAsync(photo.id);
                        toast.success("Deleted");
                      } catch {
                        toast.error("Failed to delete");
                      }
                    }}
                    data-ocid={`gallery_detail.photos.delete_button.${i + 1}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
