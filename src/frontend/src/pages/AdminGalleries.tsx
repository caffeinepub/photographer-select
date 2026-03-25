import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import {
  CheckCircle2,
  Copy,
  FolderOpen,
  Loader2,
  LogOut,
  Plus,
  Share2,
  Trash2,
  Upload,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Gallery } from "../backend";
import { ExternalBlob } from "../backend";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCreateGallery,
  useDeleteGallery,
  useGetAllGalleries,
  useGetGallerySelection,
  useIsAdmin,
} from "../hooks/useQueries";

function GalleryCard({ gallery }: { gallery: Gallery; index: number }) {
  const navigate = useNavigate();
  const deleteGallery = useDeleteGallery();
  const { data: selection } = useGetGallerySelection(gallery.id);
  const { actor } = useActor();
  const [copyLoading, setCopyLoading] = useState(false);

  const handleCopyLink = async () => {
    setCopyLoading(true);
    try {
      const token = await actor!.getOrCreateInviteToken(gallery.id);
      const url = `${window.location.origin}${window.location.pathname}#/select/${token}`;
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    } catch {
      toast.error("Failed to copy link");
    } finally {
      setCopyLoading(false);
    }
  };

  const handleWhatsApp = async () => {
    try {
      const token = await actor!.getOrCreateInviteToken(gallery.id);
      const url = `${window.location.origin}${window.location.pathname}#/select/${token}`;
      const msg = encodeURIComponent(
        `Hi! Please select your favorite photos here: ${url}`,
      );
      window.open(`https://wa.me/?text=${msg}`, "_blank");
    } catch {
      toast.error("Failed to generate share link");
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-foreground truncate">
            {gallery.name}
          </p>
          <p className="text-sm text-muted-foreground truncate">
            {gallery.clientName}
          </p>
        </div>
        <Badge
          variant={gallery.status === "open" ? "default" : "secondary"}
          className={
            gallery.status === "open"
              ? "bg-green-700 text-white shrink-0"
              : "shrink-0"
          }
        >
          {gallery.status}
        </Badge>
      </div>

      {selection && (
        <p className="text-xs text-accent font-medium">
          <CheckCircle2 className="inline h-3 w-3 mr-1" />
          {selection.selectedPhotoIds.length} photos selected
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            navigate({ to: "/admin/gallery/$id", params: { id: gallery.id } })
          }
          className="flex-1 border-border text-foreground hover:bg-secondary"
        >
          <FolderOpen className="h-3 w-3 mr-1" />
          View
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCopyLink}
          disabled={copyLoading}
          className="flex-1 border-border text-foreground hover:bg-secondary"
          data-ocid="gallery.link.button"
        >
          {copyLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Copy className="h-3 w-3 mr-1" />
          )}
          Copy Link
        </Button>
        <Button
          size="sm"
          onClick={handleWhatsApp}
          className="flex-1 bg-green-700 hover:bg-green-600 text-white"
          data-ocid="gallery.whatsapp.button"
        >
          <Share2 className="h-3 w-3 mr-1" />
          WhatsApp
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={async () => {
            if (!confirm("Delete this gallery?")) return;
            try {
              await deleteGallery.mutateAsync(gallery.id);
              toast.success("Gallery deleted");
            } catch {
              toast.error("Failed to delete");
            }
          }}
          disabled={deleteGallery.isPending}
          className="shrink-0"
          data-ocid="gallery.delete_button"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export default function AdminGalleries() {
  const navigate = useNavigate();
  const { identity, clear } = useInternetIdentity();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: galleries, isLoading: galleriesLoading } = useGetAllGalleries();
  const createGallery = useCreateGallery();
  const { actor } = useActor();

  const [clientName, setClientName] = useState("");
  const [galleryName, setGalleryName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [createdLink, setCreatedLink] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!identity) {
    navigate({ to: "/admin/login" });
    return null;
  }

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    navigate({ to: "/admin/login" });
    return null;
  }

  const handleCreate = async () => {
    if (!galleryName.trim() || !clientName.trim()) {
      toast.error("Please fill gallery name and client name");
      return;
    }
    if (!actor) {
      toast.error("Not connected");
      return;
    }

    setIsCreating(true);
    setUploadProgress([]);
    setCreatedLink("");

    try {
      const gallery = await createGallery.mutateAsync({
        name: galleryName,
        clientName,
      });

      if (files.length > 0) {
        const progress = new Array(files.length).fill(0);
        setUploadProgress([...progress]);

        await Promise.all(
          files.map(async (file, i) => {
            const bytes = new Uint8Array(await file.arrayBuffer());
            const blob = ExternalBlob.fromBytes(bytes).withUploadProgress(
              (pct) => {
                progress[i] = pct;
                setUploadProgress([...progress]);
              },
            );
            await actor.addPhoto(gallery.id, blob, file.name);
          }),
        );
      }

      const token = await actor.getOrCreateInviteToken(gallery.id);
      const link = `${window.location.origin}${window.location.pathname}#/select/${token}`;
      setCreatedLink(link);
      toast.success("Gallery created successfully!");
      setGalleryName("");
      setClientName("");
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e: any) {
      toast.error(`Failed: ${e?.message ?? "Unknown error"}`);
    } finally {
      setIsCreating(false);
    }
  };

  const overallProgress =
    uploadProgress.length > 0
      ? Math.round(
          uploadProgress.reduce((a, b) => a + b, 0) / uploadProgress.length,
        )
      : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📸</span>
            <div>
              <h1 className="font-display font-bold text-foreground text-lg leading-tight">
                Saini Digital Studio
              </h1>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              clear();
              navigate({ to: "/admin/login" });
            }}
            className="text-muted-foreground hover:text-foreground"
            data-ocid="admin.logout.button"
          >
            <LogOut className="h-4 w-4 mr-1" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* Create Gallery Form */}
        <section>
          <h2 className="font-display font-semibold text-foreground text-lg mb-4">
            <Plus className="inline h-4 w-4 mr-1 mb-0.5" />
            Create New Gallery
          </h2>
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="clientName"
                  className="text-sm text-muted-foreground mb-1 block"
                >
                  Client Name
                </Label>
                <Input
                  id="clientName"
                  placeholder="e.g. Rahul Sharma"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="bg-background border-border"
                  data-ocid="gallery.client_name.input"
                />
              </div>
              <div>
                <Label
                  htmlFor="galleryName"
                  className="text-sm text-muted-foreground mb-1 block"
                >
                  Gallery Name
                </Label>
                <Input
                  id="galleryName"
                  placeholder="e.g. Wedding 2026"
                  value={galleryName}
                  onChange={(e) => setGalleryName(e.target.value)}
                  className="bg-background border-border"
                  data-ocid="gallery.gallery_name.input"
                />
              </div>
            </div>

            <div>
              <Label
                htmlFor="photoFiles"
                className="text-sm text-muted-foreground mb-1 block"
              >
                Photos (optional — can also upload from gallery detail)
              </Label>
              <button
                type="button"
                className="w-full border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-accent/50 transition-colors bg-transparent"
                onClick={() => fileInputRef.current?.click()}
                data-ocid="gallery.dropzone"
              >
                <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {files.length > 0
                    ? `${files.length} file(s) selected`
                    : "Click to select photos"}
                </p>
              </button>
              <input
                ref={fileInputRef}
                id="photoFiles"
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                data-ocid="gallery.upload_button"
              />
            </div>

            {isCreating && uploadProgress.length > 0 && (
              <div data-ocid="gallery.upload.loading_state">
                <p className="text-xs text-muted-foreground mb-2">
                  Uploading {uploadProgress.length} photos... {overallProgress}%
                </p>
                <Progress value={overallProgress} className="h-2" />
              </div>
            )}

            {createdLink && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-background border border-green-700/40 rounded-lg p-4 space-y-2"
                data-ocid="gallery.link.success_state"
              >
                <p className="text-sm text-green-400 font-medium">
                  ✅ Gallery created!
                </p>
                <p className="text-xs text-muted-foreground break-all">
                  {createdLink}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-border text-foreground hover:bg-secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(createdLink);
                      toast.success("Copied!");
                    }}
                    data-ocid="gallery.copy_link.button"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    className="bg-green-700 hover:bg-green-600 text-white"
                    onClick={() => {
                      const msg = encodeURIComponent(
                        `Please select your photos: ${createdLink}`,
                      );
                      window.open(`https://wa.me/?text=${msg}`, "_blank");
                    }}
                    data-ocid="gallery.whatsapp_share.button"
                  >
                    <Share2 className="h-3 w-3 mr-1" />
                    WhatsApp
                  </Button>
                </div>
              </motion.div>
            )}

            <Button
              onClick={handleCreate}
              disabled={isCreating || !galleryName.trim() || !clientName.trim()}
              className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
              data-ocid="gallery.create.submit_button"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Create Gallery & Upload Photos"
              )}
            </Button>
          </div>
        </section>

        {/* Galleries List */}
        <section>
          <h2 className="font-display font-semibold text-foreground text-lg mb-4">
            Your Galleries
          </h2>
          {galleriesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3].map((n) => (
                <Skeleton key={n} className="h-44 rounded-xl bg-card" />
              ))}
            </div>
          ) : !galleries || galleries.length === 0 ? (
            <div
              className="text-center py-16 text-muted-foreground"
              data-ocid="galleries.empty_state"
            >
              <FolderOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No galleries yet. Create your first one above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {galleries.map((gallery, i) => (
                <motion.div
                  key={gallery.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  data-ocid={`galleries.item.${i + 1}`}
                >
                  <GalleryCard gallery={gallery} index={i} />
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="text-center py-8 text-xs text-muted-foreground">
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
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
