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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "@tanstack/react-router";
import { ChevronRight, Images, Loader2, Plus, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Gallery, GalleryStatus } from "../backend";
import AppLayout from "../components/AppLayout";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCreateGallery,
  useDeleteGallery,
  useGetAllGalleries,
  useIsAdmin,
} from "../hooks/useQueries";

function formatDate(time: bigint) {
  return new Date(Number(time / BigInt(1_000_000))).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  );
}

function GalleryCard({
  gallery,
  index,
  onDelete,
}: {
  gallery: Gallery;
  index: number;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();
  const isOpen = gallery.status === ("open" as unknown as GalleryStatus);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      className="bg-card border border-border rounded-lg p-6 flex items-center justify-between gap-4 hover:border-primary/40 transition-colors group"
      data-ocid={`galleries.item.${index + 1}`}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
          <Images className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <h3 className="font-serif text-lg text-foreground truncate">
            {gallery.name}
          </h3>
          <p className="text-sm text-muted-foreground truncate">
            {gallery.clientName}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDate(gallery.createdAt)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <Badge
          variant={isOpen ? "default" : "secondary"}
          className={`text-xs tracking-widest uppercase ${
            isOpen
              ? "bg-primary/20 text-primary border border-primary/30"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {isOpen ? "Open" : "Closed"}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            router.navigate({
              to: "/admin/gallery/$id",
              params: { id: gallery.id },
            })
          }
          className="text-muted-foreground hover:text-foreground"
          data-ocid={`galleries.edit_button.${index + 1}`}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              data-ocid={`galleries.delete_button.${index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">
                Delete Gallery?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                This will permanently delete &ldquo;{gallery.name}&rdquo; and
                all its photos. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                className="border-border text-foreground"
                data-ocid={`galleries.delete.cancel_button.${index + 1}`}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(gallery.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-ocid={`galleries.delete.confirm_button.${index + 1}`}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </motion.div>
  );
}

export default function AdminGalleries() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: galleries, isLoading: galleriesLoading } = useGetAllGalleries();
  const createGallery = useCreateGallery();
  const deleteGallery = useDeleteGallery();
  const router = useRouter();

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");

  useEffect(() => {
    if (!isInitializing && !identity) {
      router.navigate({ to: "/admin/login" });
    }
  }, [identity, isInitializing, router]);

  useEffect(() => {
    if (!adminLoading && isAdmin === false && identity) {
      router.navigate({ to: "/admin/login" });
    }
  }, [isAdmin, adminLoading, identity, router]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !clientName.trim()) return;
    try {
      await createGallery.mutateAsync({
        name: name.trim(),
        clientName: clientName.trim(),
      });
      toast.success("Gallery created successfully");
      setName("");
      setClientName("");
      setCreateOpen(false);
    } catch {
      toast.error("Failed to create gallery");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteGallery.mutateAsync(id);
      toast.success("Gallery deleted");
    } catch {
      toast.error("Failed to delete gallery");
    }
  };

  const isLoading = isInitializing || adminLoading || galleriesLoading;

  return (
    <AppLayout activeTab="galleries">
      <div className="space-y-8">
        {/* Page header */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs tracking-widest uppercase text-muted-foreground mb-1">
              Admin
            </p>
            <h1 className="font-serif text-3xl text-foreground">
              Client Galleries
            </h1>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 tracking-widest uppercase text-sm"
                data-ocid="galleries.open_modal_button"
              >
                <Plus className="h-4 w-4" />
                New Gallery
              </Button>
            </DialogTrigger>
            <DialogContent
              className="bg-card border-border"
              data-ocid="galleries.dialog"
            >
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl text-foreground">
                  Create New Gallery
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="gallery-name"
                    className="text-xs tracking-widest uppercase text-muted-foreground"
                  >
                    Gallery Name
                  </Label>
                  <Input
                    id="gallery-name"
                    placeholder="e.g. Jane &amp; Alex Wedding"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                    required
                    data-ocid="galleries.name.input"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="client-name"
                    className="text-xs tracking-widest uppercase text-muted-foreground"
                  >
                    Client Name
                  </Label>
                  <Input
                    id="client-name"
                    placeholder="e.g. Jane & Alex"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                    required
                    data-ocid="galleries.client_name.input"
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setCreateOpen(false)}
                    className="text-muted-foreground"
                    data-ocid="galleries.create.cancel_button"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createGallery.isPending}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    data-ocid="galleries.create.submit_button"
                  >
                    {createGallery.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Creating...
                      </>
                    ) : (
                      "Create Gallery"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Gallery list */}
        {isLoading ? (
          <div className="space-y-3" data-ocid="galleries.loading_state">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg bg-card" />
            ))}
          </div>
        ) : galleries && galleries.length > 0 ? (
          <div className="space-y-3">
            {galleries.map((g, i) => (
              <GalleryCard
                key={g.id}
                gallery={g}
                index={i}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div
            className="text-center py-24 border border-dashed border-border rounded-lg"
            data-ocid="galleries.empty_state"
          >
            <Images className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <h3 className="font-serif text-xl text-foreground mb-2">
              No Galleries Yet
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              Create your first gallery to get started.
            </p>
            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              data-ocid="galleries.empty.primary_button"
            >
              <Plus className="h-4 w-4" />
              Create First Gallery
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
