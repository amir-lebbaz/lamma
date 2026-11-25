# «لَمّة» (Lamma) Architectural Rules & Guardrails

These rules are strictly enforced for all current and future agents working on the «لَمّة» (Lamma) repository (`amir-lebbaz/lamma`).

---

## 1. Zero WebView Guarantee (Pure Native Android)
- The mobile application in `android-app/` must remain **100% pure native Android** written strictly in **Kotlin + Jetpack Compose** with Material 3.
- **Strict Prohibition:** DO NOT add, import, configure, or wrap any WebView (`android.webkit.WebView`), Trusted Web Activity (TWA), Capacitor, Cordova, Ionic, or browser iframe shells.
- All Android components, animations, lists, dialogues, and interactions must be native Jetpack Compose composables compiled into standard Dalvik/ART bytecode.

---

## 2. Local-Only Zero-Cloud Media Architecture
- **No Cloud Storage for Media:** Do NOT upload Base64 images, binary blobs, or media files to Supabase Storage buckets, PostgreSQL bytea columns, or cloud S3/GCS buckets.
- **Device-Local Storage:** All captured or picked photos must be processed, compressed, and stored strictly in the application's internal sandboxed directory (`Context.filesDir / "photos"` or `Context.cacheDir`).
- **Web Media Cache:** In the desktop web application, media is stored exclusively in client-side browser IndexedDB (`lamma-media-db`).
- **Ephemeral Broadcast Purge:** Any real-time broadcast payload carrying ephemeral image data must be immediately evicted from database tables within 10 seconds.

---

## 3. Strict Theme Palette Consistency
Only two bespoke themes are permitted across both platforms (`web/` and `android-app/`):
1. **Sakura Dusk (ثيم الساكورا المسائي - الافتراضي):**
   - Background Main: `#1B0C1A`
   - Background Surface / Cards: `#2D222F`
   - Primary Accent / Deep Rose: `#6D3C52`
   - Secondary Accent / Wine: `#4B2138`
   - Highlight Text / Soft Petal: `#FADCD5`
2. **Velvet Ink (ثيم حبر المخمل):**
   - Background Main: `#0B1421`
   - Background Surface / Cards: `#283041`
   - Secondary Accent / Deep Slate: `#34394A`
   - Highlight Text / Soft Silver: `#B5B9BC`

*Do not introduce ad-hoc colors, generic high-saturation blues, or unbranded gradients outside these palettes.*

---

## 4. Inviolable Core Domain Features
1. **Zino the Silent Siamese Cat («زينو»):**
   - User ID: `00000000-0000-0000-0000-000000000001` (Avatar index `3`, custom Siamese cat SVG avatar with chocolate point ears and sapphire eyes).
   - Zino never talks or sends text; he responds only with affectionate non-verbal actions (purrs, tail twitches, paw taps, head nudges) and reactive status updates.
2. **Anti-Lag Notification Coalescing (Single Notification ID 1001):**
   - All notifications in `android-app/` MUST target `LAMMA_ALERT_ID = 1001` using `NotificationCompat.InboxStyle`.
   - Maintain a mandatory **5-second sound/vibration cooldown throttle** to prevent older low-end devices (1GB - 2GB RAM) from freezing when message floods occur.
3. **Urgent Family Buzz («نداء عاجل 🔔»):**
   - High-priority alert triggered via `AudioAttributes.USAGE_ALARM` + distinct double-pulse vibration pattern `[0, 500, 200, 500]` that bypasses silent mode for emergencies, paired with a DND policy access helper.
4. **Ultra-Lite Mode («وضع الهاتف الخفيف / وضع الوالد»):**
   - Automatically enabled when `ActivityManager.isLowRamDevice` is true (or toggled manually).
   - Disables Compose blur/shadow/elevation effects, caps image memory caches, scales text and touch targets by 1.3x, and throttles heavy real-time events.
5. **Zero-Credit Free USSD Dialing Shortcut:**
   - Free fallback for offline family members without internet using `Intent.ACTION_DIAL` directed to `tel:*100%23`.
   - **STRICT PROHIBITION:** Never request `android.permission.SEND_SMS` or send paid cellular SMS.
