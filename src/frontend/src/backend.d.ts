import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Photo {
    id: string;
    filename: string;
    blobId: ExternalBlob;
    galleryId: string;
    uploadedAt: Time;
}
export interface InviteCode {
    created: Time;
    code: string;
    used: boolean;
}
export type Time = bigint;
export interface Gallery {
    id: string;
    status: GalleryStatus;
    clientName: string;
    name: string;
    createdAt: Time;
}
export interface PhotoSelection {
    selectedPhotoIds: Array<string>;
    submittedAt: Time;
    galleryId: string;
}
export interface UserProfile {
    name: string;
}
export interface RSVP {
    name: string;
    inviteCode: string;
    timestamp: Time;
    attending: boolean;
}
export enum GalleryStatus {
    closed = "closed",
    open = "open"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addPhoto(galleryId: string, blob: ExternalBlob, filename: string): Promise<Photo>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / Claim photographer access -- any authenticated user can become a photographer
     */
    claimFirstAdmin(): Promise<void>;
    /**
     * / Create a new gallery
     */
    createGallery(name: string, clientName: string): Promise<Gallery>;
    deleteGallery(galleryId: string): Promise<void>;
    /**
     * / Admin: Delete a photo from a gallery
     */
    deletePhoto(photoId: string): Promise<void>;
    /**
     * / Functions related to Invite Links
     */
    generateInviteCode(): Promise<string>;
    /**
     * / Admin: List all galleries
     */
    getAllGalleries(): Promise<Array<Gallery>>;
    getAllRSVPs(): Promise<Array<RSVP>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    /**
     * / Access gallery by invite token (public - no authentication required)
     */
    getGalleryByInviteToken(token: string): Promise<[Gallery, Array<Photo>]>;
    /**
     * / ADMIN: Get selection for a gallery
     */
    getGallerySelection(galleryId: string): Promise<PhotoSelection | null>;
    /**
     * / Admin: Get a single gallery with its photos
     */
    getGalleryWithPhotos(galleryId: string): Promise<[Gallery, Array<Photo>]>;
    getInviteCodes(): Promise<Array<InviteCode>>;
    /**
     * / Get invite token for a gallery
     */
    getInviteToken(galleryId: string): Promise<string | null>;
    /**
     * / Generate/get invite token for a gallery
     */
    getOrCreateInviteToken(galleryId: string): Promise<string>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    /**
     * / Check if any admin exists
     */
    hasAnyAdmin(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    submitRSVP(name: string, attending: boolean, inviteCode: string): Promise<void>;
    /**
     * / Submit final selection (can only submit once) - public, no authentication required
     */
    submitSelection(token: string, selectedPhotoIds: Array<string>): Promise<void>;
}
