import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import Time "mo:core/Time";

import Map "mo:core/Map";
import Random "mo:core/Random";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Int "mo:core/Int";
import InviteLinksModule "invite-links/invite-links-module";

actor {
  include MixinStorage();

  // Authorization state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Invite links state
  let inviteLinksState = InviteLinksModule.initState();

  /// Functions related to Invite Links

  public shared ({ caller }) func generateInviteCode() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can generate invite codes");
    };
    let blob = await Random.blob();
    let code = InviteLinksModule.generateUUID(blob);
    InviteLinksModule.generateInviteCode(inviteLinksState, code);
    code;
  };

  public shared func submitRSVP(name : Text, attending : Bool, inviteCode : Text) : async () {
    InviteLinksModule.submitRSVP(inviteLinksState, name, attending, inviteCode);
  };

  public query ({ caller }) func getAllRSVPs() : async [InviteLinksModule.RSVP] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view RSVPs");
    };
    InviteLinksModule.getAllRSVPs(inviteLinksState);
  };

  public query ({ caller }) func getInviteCodes() : async [InviteLinksModule.InviteCode] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view invite codes");
    };
    InviteLinksModule.getInviteCodes(inviteLinksState);
  };

  // User Profile Type
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Types
  type GalleryStatus = { #open; #closed };

  type Gallery = {
    id : Text;
    name : Text;
    clientName : Text;
    createdAt : Time.Time;
    status : GalleryStatus;
  };

  module Gallery {
    public func compareByCreatedAt(g1 : Gallery, g2 : Gallery) : Order.Order {
      Int.compare(g2.createdAt, g1.createdAt);
    };
  };

  type Photo = {
    id : Text;
    galleryId : Text;
    blobId : Storage.ExternalBlob;
    filename : Text;
    uploadedAt : Time.Time;
  };

  module Photo {
    public func compare(photo1 : Photo, photo2 : Photo) : Order.Order {
      Int.compare(photo1.uploadedAt, photo2.uploadedAt);
    };
  };

  type PhotoSelection = {
    galleryId : Text;
    selectedPhotoIds : [Text];
    submittedAt : Time.Time;
  };

  // Storage
  let galleries = Map.empty<Text, Gallery>();
  let photos = Map.empty<Text, Photo>();
  let selections = Map.empty<Text, PhotoSelection>();
  let galleryInviteCodes = Map.empty<Text, Text>(); // galleryId -> token
  let tokenToGalleryId = Map.empty<Text, Text>(); // token -> galleryId (reverse lookup)

  // Helper function to generate UUIDs
  func generateUUID() : async Text {
    let randomBlob = await Random.blob();
    InviteLinksModule.generateUUID(randomBlob);
  };

  /// Check if any admin exists
  public query func hasAnyAdmin() : async Bool {
    accessControlState.adminAssigned;
  };

  /// Claim photographer access -- any authenticated user can become a photographer
  public shared ({ caller }) func claimFirstAdmin() : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Must be logged in to claim photographer access");
    };
    if (accessControlState.adminAssigned) {
      Runtime.trap("Admin has already been claimed");
    };
    accessControlState.userRoles.add(caller, #admin);
    accessControlState.adminAssigned := true;
  };

  // Admin Functions

  /// Create a new gallery
  public shared ({ caller }) func createGallery(name : Text, clientName : Text) : async Gallery {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create galleries");
    };
    let id = await generateUUID();
    let gallery : Gallery = {
      id;
      name;
      clientName;
      createdAt = Time.now();
      status = #open;
    };
    galleries.add(id, gallery);
    gallery;
  };

  public shared ({ caller }) func deleteGallery(galleryId : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete galleries");
    };
    if (not galleries.containsKey(galleryId)) {
      Runtime.trap("Gallery not found");
    };
    // Remove photos
    let photoIds = photos.values().toArray().filter(
      func(p) {
        p.galleryId == galleryId;
      }
    ).map(func(p) { p.id });
    for (photoId in photoIds.values()) {
      photos.remove(photoId);
    };
    // Remove gallery, selection and invite codes
    galleries.remove(galleryId);
    selections.remove(galleryId);
    
    // Remove from both token maps
    switch (galleryInviteCodes.get(galleryId)) {
      case (?token) {
        tokenToGalleryId.remove(token);
      };
      case (null) {};
    };
    galleryInviteCodes.remove(galleryId);
  };

  // Admin: Upload Photo
  public shared ({ caller }) func addPhoto(galleryId : Text, blob : Storage.ExternalBlob, filename : Text) : async Photo {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can add photos");
    };
    if (not galleries.containsKey(galleryId)) {
      Runtime.trap("Gallery not found");
    };
    let id = await generateUUID();
    let photo : Photo = {
      id;
      galleryId;
      blobId = blob;
      filename;
      uploadedAt = Time.now();
    };
    photos.add(id, photo);
    photo;
  };

  /// Admin: Delete a photo from a gallery
  public shared ({ caller }) func deletePhoto(photoId : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete photos");
    };
    if (not photos.containsKey(photoId)) {
      Runtime.trap("Photo not found");
    };
    photos.remove(photoId);
  };

  /// Admin: List all galleries
  public query ({ caller }) func getAllGalleries() : async [Gallery] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can list all galleries");
    };
    galleries.values().toArray().sort(Gallery.compareByCreatedAt);
  };

  /// Admin: Get a single gallery with its photos
  public query ({ caller }) func getGalleryWithPhotos(galleryId : Text) : async (Gallery, [Photo]) {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view gallery details");
    };
    switch (galleries.get(galleryId)) {
      case (null) { Runtime.trap("Gallery not found") };
      case (?gallery) {
        let galleryPhotos = photos.values().toArray().filter(
          func(p) {
            p.galleryId == galleryId;
          }
        );
        (gallery, galleryPhotos.sort());
      };
    };
  };

  /// ADMIN: Get selection for a gallery
  public query ({ caller }) func getGallerySelection(galleryId : Text) : async ?PhotoSelection {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view selections");
    };
    selections.get(galleryId);
  };

  /// Generate/get invite token for a gallery
  public shared ({ caller }) func getOrCreateInviteToken(galleryId : Text) : async Text {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create invite tokens");
    };
    switch (galleryInviteCodes.get(galleryId)) {
      case (?existingToken) { existingToken };
      case (null) {
        let token = await generateUUID();
        galleryInviteCodes.add(galleryId, token);
        tokenToGalleryId.add(token, galleryId);
        token;
      };
    };
  };

  /// Get invite token for a gallery
  public query ({ caller }) func getInviteToken(galleryId : Text) : async ?Text {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view invite tokens");
    };
    galleryInviteCodes.get(galleryId);
  };

  // Customer (Public) Functions

  /// Access gallery by invite token (public - no authentication required)
  public query func getGalleryByInviteToken(token : Text) : async (Gallery, [Photo]) {
    switch (tokenToGalleryId.get(token)) {
      case (null) { Runtime.trap("Invalid invite token") };
      case (?galleryId) {
        switch (galleries.get(galleryId)) {
          case (null) { Runtime.trap("Gallery not found") };
          case (?gallery) {
            let galleryPhotos = photos.values().toArray().filter(
              func(p) {
                p.galleryId == galleryId;
              }
            );
            (gallery, galleryPhotos.sort());
          };
        };
      };
    };
  };

  /// Submit final selection (can only submit once) - public, no authentication required
  public shared func submitSelection(token : Text, selectedPhotoIds : [Text]) : async () {
    switch (tokenToGalleryId.get(token)) {
      case (null) { Runtime.trap("Invalid invite token") };
      case (?galleryId) {
        switch (galleries.get(galleryId)) {
          case (null) { Runtime.trap("Gallery not found") };
          case (?gallery) {
            switch (selections.get(galleryId)) {
              case (null) {
                let selection = {
                  galleryId;
                  selectedPhotoIds;
                  submittedAt = Time.now();
                };
                selections.add(galleryId, selection);
                let closed : Gallery = { gallery with status = #closed };
                galleries.add(galleryId, closed);
              };
              case (_) { Runtime.trap("Selection already submitted for this gallery") };
            };
          };
        };
      };
    };
  };
};
