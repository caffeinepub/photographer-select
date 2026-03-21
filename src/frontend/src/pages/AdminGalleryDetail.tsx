import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams, useRouter } from "@tanstack/react-router";
import {
  CheckCircle2,
  ChevronLeft,
  Clock,
  Copy,
  Images,
  Link2,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Photo } from "../backend";
import AppLayout from "../components/AppLayout";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddPhoto,
  useDeletePhoto,
  useGetGallerySelection,
  useGetGalleryWithPhotos,
  useGetInviteToken,
  useGetOrCreateInviteToken,
} from "../hooks/useQueries";

function formatDate(time: bigint) {
  return new Date(Number(time / BigInt(1_000_000))).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

interface UploadProgress {
  id: string;
  filename: string;
  progress: number;
}

function PhotoGrid({
  photos,
  onDelete,
  highlighted,
  label,
  index,
}: {
  photos: Photo[];
  onDelete?: (id: string) => void;
  highlighted?: boolean;
  label?: string;
  index: number;
}) {
  if (photos.length === 0) return null;

  return (
    <div>
      {label && (
        <h3 className="text-xs tracking-widest uppercase text-muted-foreground mb-3">
          {label}
        </h3>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {photos.map((photo, pi) => (
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: pi * 0.03 }}
            className={`relative group rounded overflow-hidden border-2 transition-all ${
              highlighted
                ? "border-primary shadow-gold"
                : "border-border hover:border-border/60"
            }`}
            data-ocid={`photos.item.${index + pi + 1}`}
          >
            <div className="aspect-square">
              <img
                src={photo.blobId.getDirectURL()}
                alt={photo.filename}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            {highlighted && (
              <div className="absolute top-2 right-2 bg-primary rounded-full p-0.5">
                <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
            {onDelete && (
              <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-1 text-xs"
                      data-ocid={`photos.delete_button.${index + pi + 1}`}
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-foreground">
                        Delete Photo?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-muted-foreground">
                        Delete &ldquo;{photo.filename}&rdquo;? This cannot be
                        undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel
                        className="border-border"
                        data-ocid={`photos.delete.cancel_button.${index + pi + 1}`}
                      >
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(photo.id)}
                        className="bg-destructive"
                        data-ocid={`photos.delete.confirm_button.${index + pi + 1}`}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
            <p className="text-xs text-muted-foreground p-2 truncate bg-card">
              {photo.filename}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function AdminGalleryDetail() {
  const { id } = useParams({ from: "/admin/gallery/$id" });
  const router = useRouter();
  const { identity, isInitializing } = useInternetIdentity();
  const { data: galleryData, isLoading: galleryLoading } =
    useGetGalleryWithPhotos(id);
  const { data: selection } = useGetGallerySelection(id);
  const { data: existingToken } = useGetInviteToken(id);
  const getOrCreateToken = useGetOrCreateInviteToken();
  const addPhoto = useAddPhoto(id);
  const deletePhoto = useDeletePhoto(id);

  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  useEffect(() => {
    if (existingToken) setInviteToken(existingToken);
  }, [existingToken]);

  useEffect(() => {
    if (!isInitializing && !identity) {
      router.navigate({ to: "/admin/login" });
    }
  }, [identity, isInitializing, router]);

  const gallery = galleryData?.[0];
  const photos = galleryData?.[1] ?? [];

  const selectedIds = new Set(selection?.selectedPhotoIds ?? []);
  const selectedPhotos = photos.filter((p) => selectedIds.has(p.id));
  const unselectedPhotos = photos.filter((p) => !selectedIds.has(p.id));

  const handleUpload = useCallback(
    async (files: FileList | File[]) => {
      const fileArr = Array.from(files);
      const newProgress: UploadProgress[] = fileArr.map((f, i) => ({
        id: `${f.name}-${Date.now()}-${i}`,
        filename: f.name,
        progress: 0,
      }));
      setUploadProgress((prev) => [...prev, ...newProgress]);

      await Promise.all(
        fileArr.map(async (file, i) => {
          const progressId = newProgress[i].id;
          try {
            await addPhoto.mutateAsync({
              file,
              onProgress: (pct) => {
                setUploadProgress((prev) =>
                  prev.map((p) =>
                    p.id === progressId ? { ...p, progress: pct } : p,
                  ),
                );
              },
            });
          } catch {
            toast.error(`Failed to upload ${file.name}`);
          }
        }),
      );

      setUploadProgress([]);
      toast.success(`${fileArr.length} photo(s) uploaded`);
    },
    [addPhoto],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleUpload(e.dataTransfer.files);
      }
    },
    [handleUpload],
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files);
      e.target.value = "";
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      await deletePhoto.mutateAsync(photoId);
      toast.success("Photo deleted");
    } catch {
      toast.error("Failed to delete photo");
    }
  };

  const handleGetInviteLink = async () => {
    try {
      const token = await getOrCreateToken.mutateAsync(id);
      setInviteToken(token);
      toast.success("Invite link ready");
    } catch {
      toast.error("Failed to generate invite link");
    }
  };

  const inviteUrl = inviteToken
    ? `${window.location.origin}/select/${inviteToken}`
    : null;

  const copyInviteLink = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl);
      toast.success("Link copied to clipboard");
    }
  };

  if (galleryLoading) {
    return (
      <AppLayout>
        <div className="space-y-6" data-ocid="gallery.loading_state">
          <Skeleton className="h-8 w-64 bg-card" />
          <Skeleton className="h-40 w-full bg-card" />
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <Skeleton key={n} className="aspect-square bg-card rounded" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!gallery) {
    return (
      <AppLayout>
        <div className="text-center py-24" data-ocid="gallery.error_state">
          <p className="text-muted-foreground">Gallery not found.</p>
          <Button
            variant="ghost"
            onClick={() => router.navigate({ to: "/admin" })}
            className="mt-4 text-primary"
          >
            Back to Galleries
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-10">
        {/* Breadcrumb + header */}
        <div>
          <button
            type="button"
            onClick={() => router.navigate({ to: "/admin" })}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
            data-ocid="gallery.back.button"
          >
            <ChevronLeft className="h-4 w-4" />
            All Galleries
          </button>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs tracking-widest uppercase text-muted-foreground mb-1">
                {gallery.clientName}
              </p>
              <h1 className="font-serif text-3xl text-foreground">
                {gallery.name}
              </h1>
            </div>
            <Badge
              className={`text-xs tracking-widest uppercase ${
                gallery.status === ("open" as any)
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {String(gallery.status)}
            </Badge>
          </div>
        </div>

        {/* Upload zone */}
        <section>
          <h2 className="text-xs tracking-widest uppercase text-muted-foreground mb-3">
            Upload Photos
          </h2>
          <div
            className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById("photo-upload")?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                document.getElementById("photo-upload")?.click();
              }
            }}
            data-ocid="gallery.dropzone"
          >
            <input
              id="photo-upload"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileInput}
            />
            <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-medium mb-1">
              Drag &amp; drop photos here
            </p>
            <p className="text-sm text-muted-foreground">
              or click to browse files
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 border-border text-muted-foreground"
              onClick={(e) => {
                e.stopPropagation();
                document.getElementById("photo-upload")?.click();
              }}
              data-ocid="gallery.upload_button"
            >
              Choose Files
            </Button>
          </div>

          {/* Upload progress */}
          <AnimatePresence>
            {uploadProgress.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 space-y-2"
                data-ocid="gallery.upload.loading_state"
              >
                {uploadProgress.map((up) => (
                  <div
                    key={up.id}
                    className="bg-card border border-border rounded p-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-foreground truncate">
                        {up.filename}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {up.progress}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${up.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Photo grid */}
        {photos.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs tracking-widest uppercase text-muted-foreground">
                Gallery Photos
              </h2>
              <span className="text-sm text-muted-foreground">
                {photos.length} photos
              </span>
            </div>
            <PhotoGrid photos={photos} onDelete={handleDeletePhoto} index={0} />
          </section>
        )}

        {photos.length === 0 && (
          <div
            className="text-center py-16 border border-dashed border-border rounded-lg"
            data-ocid="gallery.photos.empty_state"
          >
            <Images className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground text-sm">
              No photos yet. Upload some above.
            </p>
          </div>
        )}

        {/* Invite link */}
        <section className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Link2 className="h-4 w-4 text-primary" />
            <h2 className="text-xs tracking-widest uppercase text-muted-foreground">
              Client Invite Link
            </h2>
          </div>
          {inviteUrl ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={inviteUrl}
                  className="flex-1 bg-muted border border-border rounded px-3 py-2 text-sm text-muted-foreground font-mono"
                  data-ocid="gallery.invite.input"
                />
                <Button
                  onClick={copyInviteLink}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shrink-0"
                  data-ocid="gallery.invite.copy_button"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this link with your client. No login required.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground flex-1">
                Generate a unique link to share with your client.
              </p>
              <Button
                onClick={handleGetInviteLink}
                disabled={getOrCreateToken.isPending || photos.length === 0}
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shrink-0"
                data-ocid="gallery.invite.generate_button"
              >
                {getOrCreateToken.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
                Generate Link
              </Button>
            </div>
          )}
        </section>

        {/* Selection results */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <h2 className="text-xs tracking-widest uppercase text-muted-foreground">
              Selection Results
            </h2>
            {selection && (
              <span className="text-xs text-muted-foreground ml-auto">
                Submitted {formatDate(selection.submittedAt)}
              </span>
            )}
          </div>

          {selection ? (
            <div className="space-y-8">
              {/* Summary */}
              <div className="bg-card border border-border rounded-lg p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-serif text-2xl text-foreground">
                      {selectedPhotos.length}{" "}
                      <span className="text-muted-foreground text-lg">
                        / {photos.length}
                      </span>
                    </p>
                    <p className="text-xs tracking-widest uppercase text-muted-foreground mt-1">
                      Photos Selected
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </div>

              {/* Selected photos */}
              {selectedPhotos.length > 0 && (
                <PhotoGrid
                  photos={selectedPhotos}
                  highlighted
                  label={`Selected (${selectedPhotos.length})`}
                  index={0}
                />
              )}

              {/* Unselected photos */}
              {unselectedPhotos.length > 0 && (
                <div className="opacity-50">
                  <PhotoGrid
                    photos={unselectedPhotos}
                    label={`Not Selected (${unselectedPhotos.length})`}
                    index={selectedPhotos.length}
                  />
                </div>
              )}
            </div>
          ) : (
            <div
              className="text-center py-16 border border-dashed border-border rounded-lg"
              data-ocid="gallery.selection.empty_state"
            >
              <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-foreground font-medium mb-1">
                Awaiting Client Selection
              </p>
              <p className="text-sm text-muted-foreground">
                The client hasn&apos;t submitted their selection yet.
              </p>
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
