# «لَمّة» (Lamma) — UI/UX Design System Specification

This document defines the strict, non-negotiable UI/UX Design System for **«لَمّة» (Lamma)** across both platforms:
- **Web App (`src/`):** Next.js 15, Tailwind CSS, React 19.
- **Mobile App (`android-app/`):** Kotlin, Jetpack Compose, Material 3.

All future contributors and automated agents must adhere strictly to these tokens and rules. **Do not introduce generic, uncurated colors, heavy blur shadows, or inconsistent spacing.**

---

## 1. Strict Color Token Hierarchy

Neither platform may use pure `#000000`, pure `#FFFFFF`, or high-saturation neon colors. All UI surfaces, text, borders, and states must derive strictly from these two curated palettes:

### Theme A: Sakura Dusk (ثيم الساكورا المسائي - الافتراضي)

| Token | Semantic Role | Hex Value | RGBA Equivalent / Compose Spec |
| :--- | :--- | :--- | :--- |
| `bg-canvas` | Main viewport & screen background | `#1B0C1A` | `Color(0xFF1B0C1A)` |
| `bg-surface` | Sidebars, message containers, input bars, cards | `#2D222F` | `Color(0xFF2D222F)` |
| `bg-elevated` | Incoming message bubbles, modal sheets, hover states | `#4B2138` | `Color(0xFF4B2138)` |
| `accent-primary` | Outgoing message bubbles, primary action buttons, active badges | `#6D3C52` | `Color(0xFF6D3C52)` |
| `text-primary` / `accent-soft` | High-contrast body text, primary icons, headers | `#FADCD5` | `Color(0xFFFADCD5)` |
| `text-muted` | Secondary labels, status text, timestamps, placeholder text | `#FADCD5` (65%) | `rgba(250, 220, 213, 0.65)` / `Color(0xFFFADCD5).copy(alpha = 0.65f)` |
| `border-subtle` | 1px hairline division borders, input field outlines, card borders | `#FADCD5` (12%) | `rgba(250, 220, 213, 0.12)` / `Color(0xFFFADCD5).copy(alpha = 0.12f)` |

---

### Theme B: Velvet Ink (ثيم حبر المخمل)

| Token | Semantic Role | Hex Value | RGBA Equivalent / Compose Spec |
| :--- | :--- | :--- | :--- |
| `bg-canvas` | Main viewport & screen background | `#0B1421` | `Color(0xFF0B1421)` |
| `bg-surface` | Sidebars, message containers, input bars, cards | `#283041` | `Color(0xFF283041)` |
| `bg-elevated` | Incoming message bubbles, modal sheets, hover states | `#34394A` | `Color(0xFF34394A)` |
| `accent-primary` | Outgoing message bubbles, primary action buttons | `#34394A` (with 1px `#B5B9BC` 30%) or `#435066` | `Color(0xFF435066)` / `Color(0xFF34394A)` |
| `text-primary` | High-contrast body text, primary icons, headers | `#B5B9BC` | `Color(0xFFB5B9BC)` |
| `text-muted` | Secondary labels, status text, timestamps, placeholder text | `#B5B9BC` (60%) | `rgba(181, 185, 188, 0.60)` / `Color(0xFFB5B9BC).copy(alpha = 0.60f)` |
| `border-subtle` | 1px hairline division borders, input field outlines, card borders | `#B5B9BC` (12%) | `rgba(181, 185, 188, 0.12)` / `Color(0xFFB5B9BC).copy(alpha = 0.12f)` |

---

## 2. Anti-AI-Slop Visual Rules

### A. Tonal Elevation Over Muddy Drop Shadows
- **No Heavy Drop Shadows:** Prohibit large blur radii, multi-layered black box shadows, or diffuse muddy glows (`box-shadow: 0 20px 25px rgba(0,0,0,0.5)`).
- **Surface Elevation Hierarchy:** Depth is created exclusively through tonal contrast:
  $$\text{Canvas } (\text{deepest}) \longrightarrow \text{Surface } (\text{midground}) \longrightarrow \text{Elevated } (\text{foreground})$$
- Pair surfaces with a crisp **1px hairline border** (`border-subtle`) for separation.

### B. Strict Corner Radii System
Do not mix arbitrary corner radiuses. Use strictly these four values:
1. **Chat Bubbles:** `16px` (`RoundedCornerShape(16.dp)` / `rounded-2xl`).
   - Outgoing bubble tail: Bottom-end corner pinched to `4px` (`RoundedCornerShape(16.dp, 16.dp, 4.dp, 16.dp)` in RTL).
   - Incoming bubble tail: Bottom-start corner pinched to `4px` (`RoundedCornerShape(16.dp, 16.dp, 16.dp, 4.dp)` in RTL).
2. **Cards, Modals & Drawers:** `14px` (`RoundedCornerShape(14.dp)` / `rounded-xl`).
3. **Buttons, Pills & Input Fields:** `10px` (`RoundedCornerShape(10.dp)` / `rounded-lg`).
4. **Badges & Avatars:** Fully rounded (`CircleShape` / `rounded-full`).

### C. 8pt Grid & Spacing Multiples
All padding, margin, layout gap, and component sizing must align to an 8pt/4pt rhythm:
- `4px` (`0.25rem` / `4.dp`): Micro gap between icons and badge counts.
- `8px` (`0.5rem` / `8.dp`): Standard gap between message bubbles and headers.
- `12px` (`0.75rem` / `12.dp`): Compact card padding, modal internal gap.
- `16px` (`1.0rem` / `16.dp`): Default container padding, message feed lateral margins.
- `24px` (`1.5rem` / `24.dp`): Section margins, dialog padding, empty state padding.

---

## 3. Chat Ergonomics (Arabic RTL & English LTR)

### A. Dynamic Text Direction (`dir="auto"`)
- Every message bubble body text MUST declare `dir="auto"` (Web) or `TextDirection.Content` (Compose).
- This guarantees Arabic sentences, English phrases, numbers, and punctuation align naturally without punctuation jumping to the wrong side of the line.

### B. Optimal Reading Line-Length
- **Desktop Viewport (`>= 768px`):** Max message bubble width is strictly `72%` of the message feed.
- **Mobile Screen (`< 768px`):** Max message bubble width is strictly `82%` of screen width.
- This prevents awkward full-width single-line bubbles and ensures comfortable reading flow.

### C. Bottom-Corner Timestamps
- Timestamps must be small (`11px` / `10.5.sp`), styled with `text-muted`, and positioned inline or docked at the bottom trailing edge of the bubble without causing layout jumps.

---

## 4. Typography Pairing & Weights

- **Arabic Font Family:** `IBM Plex Sans Arabic` or `Cairo` (fallback `system-ui, -apple-system, sans-serif`).
- **Latin Font Family:** `Inter` or `IBM Plex Sans`.
- **Weight Hierarchy:**
  - `400` (Regular): Message body, timestamp text, modal descriptions.
  - `500` (Medium): UI labels, button text, member names, checklist items.
  - `600` (Semi-Bold): App titles, section headers, pinned notice highlights.
  - *Never use heavy bold (700+) or ultra-thin (100-300) styles for Arabic text, which degrades legibility.*

---

## 5. Implementation Reference Examples

### Web Tailwind Example (Message Bubble)
```tsx
<div
  className={`max-w-[72%] md:max-w-[65%] px-3.5 py-2.5 text-sm transition-all ${
    isOutgoing
      ? 'bg-[#6D3C52] text-[#FADCD5] rounded-2xl rounded-br-sm border border-[#FADCD5]/10 self-end'
      : 'bg-[#4B2138] text-[#FADCD5] rounded-2xl rounded-bl-sm border border-[#FADCD5]/10 self-start'
  }`}
>
  <p dir="auto" className="leading-relaxed font-normal select-text">
    {message.text}
  </p>
  <span className="block text-right text-[11px] text-[#FADCD5]/65 mt-1 font-mono">
    {formatTime(message.timestamp)}
  </span>
</div>
```

### Android Jetpack Compose Example (Message Bubble)
```kotlin
Surface(
    color = if (isOutgoing) colors.accentPrimary else colors.bgElevated,
    shape = if (isOutgoing) {
        RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp, bottomStart = 16.dp, bottomEnd = 4.dp)
    } else {
        RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp, bottomStart = 4.dp, bottomEnd = 16.dp)
    },
    border = BorderStroke(1.dp, colors.borderSubtle),
    modifier = Modifier.widthIn(max = if (isLowRam) 300.dp else 320.dp)
) {
    Column(modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp)) {
        Text(
            text = message.text,
            color = colors.textPrimary,
            fontSize = 14.sp,
            style = LocalTextStyle.current.copy(textDirection = TextDirection.Content)
        )
        Text(
            text = formatTime(message.createdAt),
            color = colors.textMuted,
            fontSize = 11.sp,
            modifier = Modifier.align(Alignment.End).padding(top = 4.dp)
        )
    }
}
```
