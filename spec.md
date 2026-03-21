# Photographer Select

## Current State
A photo selection app with admin panel and customer selection page. Backend uses MixinAuthorization with `_initializeAccessControlWithSecret`. Frontend `useActor.ts` calls `_initializeAccessControlWithSecret(adminToken || "")` on EVERY actor initialization -- even when no token exists -- passing empty string and resetting backend admin state. This is the root cause of all gallery creation failures.

## Requested Changes (Diff)

### Add
- Nothing new

### Modify
- `useActor.ts`: Only call `_initializeAccessControlWithSecret(token)` when `adminToken` is truthy and non-empty. If no token, skip the call entirely.
- `AdminLogin.tsx`: After `claimFirstAdmin` succeeds, invalidate actor query cache so actor is recreated fresh (without calling `_initializeAccessControlWithSecret`).

### Remove
- Nothing

## Implementation Plan
1. Fix `useActor.ts` -- add `if (adminToken)` guard before calling `_initializeAccessControlWithSecret`
2. In `AdminLogin.tsx`, after successful claim, invalidate queryClient actor cache to force fresh actor creation
3. Rebuild and deploy
