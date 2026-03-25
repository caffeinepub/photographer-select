import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Gallery, Photo, PhotoSelection } from "../backend";
import { ExternalBlob } from "../backend";
import { useActor } from "./useActor";

function normalizeGalleryTuple(result: unknown): [Gallery, Photo[]] {
  const tuple = result as [Gallery, unknown];
  const gallery = tuple[0];
  const rawPhotos = tuple[1];
  const photos: Photo[] = Array.isArray(rawPhotos)
    ? rawPhotos
    : rawPhotos
      ? (Object.values(rawPhotos as object) as Photo[])
      : [];
  return [gallery, photos];
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useHasAnyAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["hasAnyAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      // If hasAnyAdmin is available on actor, use it; otherwise fall back to true
      // so we show the access denied state rather than an erroneous claim button.
      const a = actor as any;
      if (typeof a.hasAnyAdmin === "function") {
        return a.hasAnyAdmin();
      }
      return true;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useClaimFirstAdmin() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      const a = actor as any;
      if (typeof a.claimFirstAdmin === "function") {
        return a.claimFirstAdmin();
      }
      throw new Error("claimFirstAdmin is not available");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["isAdmin"] });
      qc.invalidateQueries({ queryKey: ["hasAnyAdmin"] });
    },
  });
}

export function useGetAllGalleries() {
  const { actor, isFetching } = useActor();
  return useQuery<Gallery[]>({
    queryKey: ["galleries"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllGalleries();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetGalleryWithPhotos(galleryId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<[Gallery, Photo[]]>({
    queryKey: ["gallery", galleryId],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      const result = await actor.getGalleryWithPhotos(galleryId);
      return normalizeGalleryTuple(result);
    },
    enabled: !!actor && !isFetching && !!galleryId,
  });
}

export function useGetGallerySelection(galleryId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<PhotoSelection | null>({
    queryKey: ["selection", galleryId],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getGallerySelection(galleryId);
    },
    enabled: !!actor && !isFetching && !!galleryId,
  });
}

export function useGetInviteToken(galleryId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<string | null>({
    queryKey: ["inviteToken", galleryId],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getInviteToken(galleryId);
    },
    enabled: !!actor && !isFetching && !!galleryId,
  });
}

export function useGetGalleryByInviteToken(token: string) {
  const { actor, isFetching } = useActor();
  return useQuery<[Gallery, Photo[]]>({
    queryKey: ["galleryByToken", token],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      const result = await actor.getGalleryByInviteToken(token);
      return normalizeGalleryTuple(result);
    },
    enabled: !!actor && !isFetching && !!token,
    retry: false,
  });
}

export function useCreateGallery() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      clientName,
    }: { name: string; clientName: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.createGallery(name, clientName);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["galleries"] }),
  });
}

export function useDeleteGallery() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (galleryId: string) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteGallery(galleryId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["galleries"] }),
  });
}

export function useAddPhoto(galleryId: string) {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      file,
      onProgress,
    }: {
      file: File;
      onProgress?: (pct: number) => void;
    }) => {
      if (!actor) throw new Error("No actor");
      const bytes = new Uint8Array(await file.arrayBuffer());
      let blob: ExternalBlob = ExternalBlob.fromBytes(bytes);
      if (onProgress) blob = blob.withUploadProgress(onProgress);
      return actor.addPhoto(galleryId, blob, file.name);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gallery", galleryId] }),
  });
}

export function useDeletePhoto(galleryId: string) {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (photoId: string) => {
      if (!actor) throw new Error("No actor");
      return actor.deletePhoto(photoId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gallery", galleryId] }),
  });
}

export function useGetOrCreateInviteToken() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (galleryId: string) => {
      if (!actor) throw new Error("No actor");
      return actor.getOrCreateInviteToken(galleryId);
    },
    onSuccess: (token, galleryId) =>
      qc.setQueryData(["inviteToken", galleryId], token),
  });
}

export function useSubmitSelection() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      token,
      selectedPhotoIds,
    }: {
      token: string;
      selectedPhotoIds: string[];
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.submitSelection(token, selectedPhotoIds);
    },
  });
}
