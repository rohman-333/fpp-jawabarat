# LAUNCH RISKS AND MITIGATIONS
## WIBAWA NUSANTARA — Mobile & Web App Operations

This operational document outlines the 10 core launch risks for the WIBAWA NUSANTARA social-commerce app, detailing preemptive mitigations to ensure a smooth, premium rollout.

---

## 1. Low-End Mobile Performance (HP Rendah)
*   **Risk**: Low-spec smartphones experience lag, high CPU load, or crashes due to large feeds, bloated bundles, and heavy media assets.
*   **Mitigation**:
    *   **Lazy Loading**: Loaded heavy secondary rails (Emoji Picker, Suggested rails) using Next.js Dynamic Imports (`ssr: false`) so they only download when triggered.
    *   **Strict Pagination**: Implemented dynamic cursor ranges via Supabase `.range(pageNum * PAGE_SIZE, ...)` to limit feed lists to 10 items per fetch page.
    *   **Offline/Cache Control**: Enforced light static asset caching to minimize repeated file reads.

## 2. Slow or Failed Media Uploads
*   **Risk**: Files taken from high-res phone cameras (5MB - 12MB+) fail to upload, timeout on slower connections, or consume server storage excessively.
*   **Mitigation**:
    *   **Client-Side Compression**: Integrated `compressImage` utility inside `CreatePostComposer` to resize and compress photos (max width 1600px, 75% quality) locally before upload.
    *   **Strict Video Limits**: Restricted social video uploads to 60 seconds duration and 30MB file size, validated instantly on metadata load.
    *   **Submitting States**: Dispatched non-clickable loader overlays during uploads to block duplicate submits.

## 3. Persistent Service Worker Caching (Old UI Lag)
*   **Risk**: Users run cached, buggy HTML shells long after bugfixes have been pushed, causing broken APIs and mismatching interfaces.
*   **Mitigation**:
    *   **Cache Versioning**: Tagged the Cache Name with a unique release identifier (`wibawa-cache-v3`).
    *   **Active Activation Purge**: Programmed the Service Worker `activate` listener to instantly loop and delete all mismatching cache collections, running `self.clients.claim()` to refresh clients.
    *   **Network-First Intercepts**: Service Worker fetch handler uses Network-First for main paths (`/`, `/feed`, `/dashboard`), bypassing cache checks unless the user is completely offline.

## 4. Trusted Web Activity (TWA) Layout Rendering Limitations
*   **Risk**: TWAs render the exact web output. A minor CSS overflow or clipping bug is carried over to the APK, ruining the "native app" feel.
*   **Mitigation**:
    *   **Global Viewport Constraints**: Enforced `width: 100%; max-width: 100%; overflow-x: hidden;` on body/html tags globally in `app/globals.css`.
    *   **Compact Pill Composer**: Swapped the desktop card layout for a compact "Apa kabar hari ini?" mobile pill composer that expands into a fullscreen sheet.
    *   **Safe Area Padding**: Mappednotch and status bar offsets in sticky headers and bottom navbars using `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`.

## 5. Web Push Notification Dismissals
*   **Risk**: User blocks browser push prompt on initial open, preventing any subsequent notification subscriptions.
*   **Mitigation**:
    *   **Internal Feed System**: Built a robust notifications view (`/notifications`) so notification items are readable inside the app regardless of system-level push prompt status.
    *   **Dismissal Memory**: Delayed the PWA install banner on iOS/Android, and stored user dismissals (`pwa-prompt-dismissed`) for 7 days in `localStorage` to avoid annoying prompts.

## 6. Realtime WebSocket Channel Leaks
*   **Risk**: Users navigating in/out of multiple chat rooms leave active Supabase Channels open, leading to memory leaks and browser slow-downs.
*   **Mitigation**:
    *   **Strict Cleanup Hooks**: Integrated channel unsubscription listeners inside `ChatClient` unmount hook (`channel.unsubscribe()`) to guarantee complete memory collection when changing views.
    *   **Read Indicator Sync**: Synchronized message status (`is_read: true`) only when the chat client tab is fully in-focus and matches the current active user ID.

## 7. Database RLS Integrity (Data Leaks)
*   **Risk**: Flawed Row Level Security (RLS) policies permit bad actors to read conversations or update listings of other users.
*   **Mitigation**:
    *   **Strict UID Checks**: Enforced `auth.uid() = buyer_id OR auth.uid() = seller_id` checks for all conversation SELECT/INSERT/UPDATE calls.
    *   **Controlled Admin Access**: Added strict administrative profile validation queries inside migrations allowing SELECT reads only for validated `admin`, `superadmin`, or `team` roles.
    *   **No Profile Email leaks**: Used safe profiles UUID links rather than plain email lists.

## 8. Marketplace Trust and Disputes
*   **Risk**: Platform allows manual transactions without instant Payment Gateways, raising the potential for buyer-seller disputes.
*   **Mitigation**:
    *   **Clear Transaction Logs**: Standardized order logs via `order_status_logs` database tracks for all state transitions (pending, paid, processing, shipped, delivered, cancelled).
    *   **Dedicated Moderation Page**: Created `/admin/orders` to display all transaction invoice amounts, complete with direct links to active seller-buyer chat rooms for arbitration.

## 9. Content Moderation & Abuse (Feed Spam)
*   **Risk**: Users post spam, illegal materials, or offensive text, which can damage the platform and lead to Play Store suspension.
*   **Mitigation**:
    *   **Report Post Flow**: Placed a "Laporkan Postingan" button on every feed card, linking directly to a reporting dialog.
    *   **Hide/Delete Controls**: Enabled admins, superadmins, and team divisions to instantly hide posts (`status = 'hidden'`) or delete them permanently from feeds with one click.

## 10. Play Store Access Review Failures
*   **Risk**: Play Store reviewers reject the app because registration requires local phone numbers or pesantren credentials that they don't have.
*   **Mitigation**:
    *   **Demo Account Provisioning**: Created pre-registered testing credentials (`reviewer@wibawanusantara.com`) inside the release guidelines.
    *   **Pre-populated Listings**: Populated database stores with standard marketplace products and pesantren profiles beforehand so reviewers see a lively, realistic platform state.
