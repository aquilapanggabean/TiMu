# DESIGN.md - TIMU (Titik Temu) Visual & UI Blueprint

This document is the authoritative visual, layout, and component specification for **TIMU (Titik Temu)**. It locks in the exact warm, friendly, tactile visual identity of the TIMU reference screens (cream canvas, soft sage cards, rich olive headers, harvest gold CTAs, rounded geometry, and clean mobile-first ergonomics) while scaling natively to responsive Tablet, Desktop, and PWA viewports.

## 1. Visual Fidelity Mandate (Keep the Exact TIMU Look)

Do NOT turn TIMU into a generic grey/white or blue/purple enterprise SaaS dashboard. Preserve the exact visual character of the TIMU reference UI across every viewport:

* **Surface Mood:** Warm Cream (`#FFFFF0`) primary background paired with Soft Sage (`#DBE4C9`) cards, Rich Olive headers/accents, and Harvest Gold (`#FEA405`) conversion actions.
* **No Fake Phone Frame on Desktop:** Do NOT render a thick green mobile bezel around the website on desktop. Instead, let the exact same visual language, cards, and components breathe naturally across Desktop (`>= 1024px`), Tablet (`640px - 1023px`), and Mobile (`< 640px` & PWA).
* **Brand Mark:** Use the official **TIMU (Titik Temu)** wordmark logo (bold black `T`, gold `I`, black `M`, black `U` with two gold dots above it, and `Titik Temu` caption beneath). Keep a clean `[LOGO SLOT]` comment if the image asset is not yet mounted.
* **Declared Dials:**
  * **ENERGY: 2 (Balanced & Approachable):** Friendly, tactile, and warm for young talent and SME owners.
  * **RHYTHM: 2 (Structured with focal breaks):** Crisp visual rhythm driven by signature focal components (Curved Olive Talent Header, Overlapping Status Card, Blind Talent Discovery Card, Dashed New Project Card).
  * **MOTION: 2 (Purposeful):** Smooth swipe/dismiss physics on the Blind Talent Card, EXP progress bar transitions, drawer/modal transitions, and restrained Level-Up confirmation. Zero continuous pulsing or bouncing loops. Disable non-essential motion under `prefers-reduced-motion: reduce`.
* **Copy & Icon Discipline:** Use one consistent 1.75px-2px outline vector icon set (matching the reference screens). Do NOT use decorative emojis in UI headers, buttons, or system labels (replace the waving hand emoji in the greeting with clean typography). Never use em dashes in UI copy.

---

## 2. Exact Brand Palette (WCAG AA Verified, Light & Dark Modes)

The colors below preserve the exact look of the TIMU reference screens while tuning olive button/pill fills slightly deeper (`#526512` / `#4F6110`) so white text passes **WCAG AA (`>= 4.5:1`)** cleanly without losing the signature olive tone.

> **Contrast Guardrail:** Never place `#FFFFFF` text on `#8AA624` (contrast is 2.78:1 and fails WCAG AA). Use `--brand-primary` (`#4F6110`, 6.87:1 with white text) or `--brand-olive-deep` (`#586D13`, 5.76:1 with white text) whenever white text sits on olive.

### CSS Custom Properties (`globals.css`)

```css
:root,
[data-theme="light"] {
  color-scheme: light;

  /* Exact TIMU Surfaces */
  --bg-canvas: #E9EFE0;        /* Soft sage-tinted outer canvas on desktop */
  --bg-surface: #FFFFF0;       /* Signature TIMU warm cream surface */
  --bg-card-sage: #DBE4C9;     /* Signature TIMU soft sage card */
  --bg-elevated: #FFFFFF;      /* Crisp white inputs, uncompleted quest cards, skip button */

  /* Borders */
  --border-subtle: rgba(79, 97, 16, 0.18);
  --border-default: rgba(79, 97, 16, 0.28);
  --border-strong: #586D13;

  /* Typography */
  --text-primary: #26300C;     /* 13.85:1 on #FFFFF0, 11.4:1 on #DBE4C9 */
  --text-secondary: #4B5926;   /* 7.5:1 on #FFFFF0, 6.2:1 on #DBE4C9 */
  --text-inverse: #FFFFFF;

  /* Brand Olive */
  --brand-primary: #4F6110;         /* 6.87:1 with #FFFFFF */
  --brand-olive-rich: #5C7214;      /* 5.45:1 with #FFFFFF (badges, pills, wallet card) */
  --brand-olive-grad-start: #688018;
  --brand-olive-grad-end: #4A5B0E;
  --brand-mid: #8AA624;             /* Accents & avatar fills (never with small white text) */

  /* Harvest Gold (Signature Primary Conversion CTA & Active Highlights) */
  --accent-gold: #FEA405;           /* 6.97:1 with #26300C */
  --accent-gold-hover: #E69300;
  --accent-gold-grad-end: #FFC24D;  /* Premium Banner warm gold gradient */
  --accent-gold-text: #26300C;
  --accent-gold-soft: #FFEFCF;      /* Token pill, active nav pill, dashed + New Project card */
  --accent-gold-soft-text: #8A5200; /* 5.4:1 on #FFEFCF */

  /* Semantic Status */
  --status-success-bg: #ECFDF3;
  --status-success-text: #1F5E2B;
  --status-error-bg: #FEF3F2;
  --status-error-text: #B42318;
  --status-info-bg: #EEF5FC;
  --status-info-text: #1D4E89;

  /* Focus Ring */
  --focus-ring: #9A5F00;

  /* Elevation */
  --shadow-card: 0 10px 24px -6px rgba(79, 97, 16, 0.16), 0 2px 6px -1px rgba(38, 48, 12, 0.06);
  --shadow-cta: 0 8px 18px -4px rgba(254, 164, 5, 0.35);
  --shadow-modal: 0 20px 48px -12px rgba(38, 48, 12, 0.28);
}

[data-theme="dark"],
.dark {
  color-scheme: dark;

  --bg-canvas: #111608;
  --bg-surface: #1A210D;
  --bg-card-sage: #242E14;
  --bg-elevated: #2A3617;

  --border-subtle: rgba(184, 196, 158, 0.14);
  --border-default: rgba(184, 196, 158, 0.24);
  --border-strong: #8AA624;

  --text-primary: #F4F7EE;
  --text-secondary: #BCC8A3;
  --text-inverse: #111608;

  --brand-primary: #9BB832;         /* 8.2:1 with #111608 */
  --brand-olive-rich: #8AA624;      /* Paired with #111608 in dark mode */
  --brand-olive-grad-start: #3A490D;
  --brand-olive-grad-end: #242E08;
  --brand-mid: #8AA624;

  --accent-gold: #FEA405;
  --accent-gold-hover: #FFB633;
  --accent-gold-grad-end: #E69300;
  --accent-gold-text: #111608;
  --accent-gold-soft: #3B2908;
  --accent-gold-soft-text: #FFD580;

  --status-success-bg: #132E1A;
  --status-success-text: #7CE095;
  --status-error-bg: #3A1512;
  --status-error-text: #FDA29B;
  --status-info-bg: #11263D;
  --status-info-text: #8FC4FF;

  --focus-ring: #FEA405;

  --shadow-card: 0 12px 28px -6px rgba(0, 0, 0, 0.45);
  --shadow-cta: 0 8px 18px -4px rgba(254, 164, 5, 0.25);
  --shadow-modal: 0 24px 56px -12px rgba(0, 0, 0, 0.65);
}
```

---

## 3. Typography & Tactile Geometry

* **Display & Headings (`font-display`):** `Bricolage Grotesque` (weights 600, 700, 800). Used for page titles (`Proyek Saya`, `Cari Proyek`, `Riwayat Chat`, `Profil`), card primary headings, currency figures (`Rp 250.000`, `Rp 350.000`), and Role Gateway cards.
* **UI & Body (`font-sans`):** `Plus Jakarta Sans` (weights 400, 500, 600, 700). Always apply `font-variant-numeric: tabular-nums` on Token counts, Escrow budgets, EXP counters, and distances.
* **Signature Tactile Geometry (Matching Reference Screens):**
  * **Gateway Role Cards & Blind Talent Discovery Card:** `24px` (`rounded-3xl`)
  * **Standard Sage Cards (Projects, Chat Rows, Quest Items, Wallet Card, Premium Banner, Primary Rectangular CTAs):** `16px` (`rounded-2xl`)
  * **Form Inputs & Small Inner Boxes:** `12px` (`rounded-xl`)
  * **Semantic Pills Only (Token Balance Pill, Location Segmented Control, Filter Pills, Skill/Category Tags, Search Bar, Active Bottom Nav Pill, `Lamar` Pill Button, Avatars):** `9999px` (`rounded-full`)

---

## 4. Exact Screen-by-Screen Anatomy (Mobile Reference -> Desktop Reflow)

Every screen below preserves the exact visual structure from the TIMU reference screenshots on mobile (`< 640px`), and reflows cleanly onto Tablet (`640px - 1023px`) and Desktop (`>= 1024px`) without stretching cards awkwardly or trapping the app inside a fake phone frame.

### 4.1 Gateway Screen (Entry / Role Selection)
* **Mobile Look (Exact Reference):**
  * Full `--bg-surface` (`#FFFFF0`) canvas with generous vertical breathing room.
  * Centered **TIMU Titik Temu** logo + 1-line tagline (`Where emerging talent & SMEs meet.`).
  * **Card 1 (Talent):** Full-width `--accent-gold` (`#FEA405`) card (`rounded-3xl`, `p-4`, `--shadow-cta`) with translucent light rounded-2xl icon container (`user` icon) on the left, bold display title (`Enter as Job Seeker / Talent`), and subtitle.
  * **Card 2 (Employer / SME):** Full-width `--bg-card-sage` (`#DBE4C9`) card (`rounded-3xl`, `border-2 border-[var(--brand-olive-rich)]`, `p-4`) with solid olive rounded-2xl icon container (`briefcase` icon in white) on the left, bold display title (`Enter as Employer / SME`), and subtitle.
  * Clean helper text underneath (`New here? Create an account automatically after choosing a role.`) + top-corner Language (`EN`/`ID`) and Theme toggles + compact footer with real legal links.
* **Desktop Reflow (`>= 1024px`):**
  * Centered balanced 2-column hero inside `max-w-5xl` (Left: TIMU Logo, clear mission headline, and the exact two tactile Gold & Sage role cards; Right: live interactive preview of the Blind Talent Card + Escrow Protection summary).

### 4.2 Navigation Chrome (Shared AppShell)
* **Mobile (`< 640px` & PWA) - Exact Reference:**
  * **Employer Top Header (`56px`, `--bg-surface`, bottom border):** TIMU logo on the left; interactive `--accent-gold-soft` pill on the right featuring a circular gold `T` Coin badge + `Balance: 3 Tokens` (`Saldo: 3 Token`).
  * **Talent Top Header:** Merges smoothly into the curved olive hero on Home; compact cream top bar with logo + Level pill on secondary tabs.
  * **Fixed Bottom Navigation Bar (4 primary tabs, `env(safe-area-inset-bottom)` respected):**
    * Employer tabs: `Home` (`Beranda`), `My Projects` (`Proyek Saya`), `Chat` (shows a small dark circular lock badge at top-right of the icon when 0 chats are unlocked), `Profile` (`Profil`).
    * Talent tabs: `Home` (`Beranda`), `Find Projects` (`Cari Proyek`), `Chat`, `Profile` (`Profil`).
    * **Active Tab Treatment (Exact Reference):** Active tab icon sits inside a soft-gold pill (`bg-[#FFEFCF]` in light mode, `bg-[#3B2908]` in dark mode) with olive-dark icon and bold label underneath.
* **Desktop (`>= 1024px`) & Tablet (`640px - 1023px`):**
  * Replace bottom nav with a collapsible **Left Sidebar (`248px` expanded / `72px` collapsed via `<button aria-expanded>`)** styled in `--bg-surface` (`#FFFFF0`) with subtle olive border:
    * Top: TIMU logo + **Dual-Mode Switcher** (`Talent` / `Business SME` segmented pill).
    * Middle: The exact 4 primary nav links using the same soft-gold pill highlight for the active route + lock badge on Employer Chat when locked.
    * Bottom: Token Balance pill (Employer) or Level/EXP summary (Talent), Language toggle (`EN`/`ID`), Theme toggle.

### 4.3 Employer Home - Blind Talent Discovery
* **Mobile Look (Exact Reference):**
  * **Premium Banner:** Rounded-2xl warm gold gradient (`#FEA405` to `#FFC24D`) with translucent icon box (`crown`), bold headline (`Go SME Premium · Rp 100.000/month` or `$6.99/mo`), and 1-line benefit (`Pin your projects to the top`).
  * **Location / Work Mode Toggle:** Full-width sage pill (`rounded-full p-1 bg-[#DBE4C9]`) containing active olive pill (`Prioritize Nearby` / `Utamakan Lokasi Terdekat`) vs. `All Locations / Remote`.
  * **Blind Talent Card (`rounded-3xl`, `--bg-card-sage`, `--shadow-card`):**
    * **Top Olive Half:** Smooth olive gradient (`--brand-olive-grad-start` to `--brand-olive-grad-end`), centered blurred avatar/silhouette, gold category pill top-left (`Student` / `Mahasiswa`), crisp white location pill top-right (`pin` icon + `1.2 km` or `Remote · UTC+7`), subtle `Photo hidden` (`Foto disamarkan`) caption bottom-left.
    * **Bottom Sage Half:** Masked name dots (`••••• ••••••`) + lock icon (transitions smoothly to real full name after unlock), education/institution line, uppercase `TOP 3 SKILLS` label + olive checkmark pills (`--brand-olive-rich` + white text), 2-column cream metric cards (`Completed Quests/Gigs` & `Bootcamp / Badges`), and cream link pills (`LinkedIn`, `Portfolio`).
  * **Sticky Action Bar:** Circular white `X` Skip button (`56x56px`, subtle border + shadow) on the left + full-width `--accent-gold` CTA (`rounded-2xl`, `h-14`, `--shadow-cta`) reading `Open Chat & Hire` / `Pay 1 Token`.
* **Desktop Reflow (`>= 1024px`):**
  * 2-column workspace inside `max-w-6xl`:
    * Left column (`320px`): Premium Banner, Location/Remote Toggle, Career Field & Skill Filters, and Verification Badge filter.
    * Main stage: Centered **Blind Talent Card** (constrained to `max-w-[440px]` so its exact proportions stay sharp and never stretch!) paired with the Skip / Unlock 1 Token bar below it, plus keyboard hints (`ArrowLeft` Skip, `ArrowRight` Unlock).

### 4.4 Employer "My Projects" (`Proyek Saya`)
* **Mobile Look (Exact Reference):**
  * Page title `My Projects` (`Proyek Saya`).
  * Signature dashed-border CTA card: full-width `rounded-2xl border-2 border-dashed border-[var(--brand-olive-rich)] bg-[var(--accent-gold-soft)] py-4 font-display font-extrabold` reading `+ Create New Project` (`+ Buat Proyek Baru`, supporting Escrow Gigs & Part-Time/Full-Time Jobs).
  * `Active Projects` (`Proyek Berjalan`) section header with right-aligned count (`1 project`), followed by `--bg-card-sage` rounded-2xl cards showing project title, applicant count, type/status olive pill (`In Progress` / `Escrow Gig`), and right-aligned bold olive price (`Rp 250.000` / `$25.00`).
  * `My Talents & Contracts` section listing revealed talents and Escrow approval status (`Chat Open`, `Funded in Escrow`, `Approve & Release`).
* **Desktop Reflow (`>= 1024px`):**
  * Header bar with `+ Create New Project` button; 2-column grid of sage project cards; clicking a card opens a slide-over drawer to review applicants, inspect deliverables, and trigger `Approve & Release Escrow`.

### 4.5 Employer & Talent Chat (`Riwayat Chat` & Locked State)
* **Employer Locked Empty State (Exact Reference):**
  * Vertically centered circular sage badge (`64x64px`) with olive lock icon, bold `Chat Locked` (`Chat terkunci`) heading, 2-line explanation (`Pay 1 Token on a talent profile to unlock Chat and Hiring.`), plus one direct CTA button (`Browse Talent`).
* **Conversation List (`Riwayat Chat` - Exact Reference):**
  * Heading + active count subtitle.
  * Stacked `--bg-card-sage` rounded-2xl rows: circular olive avatar (`48x48px`), bold name, right-aligned timestamp, truncated preview text, and harvest-gold unread indicator dot (`10x10px`).
* **Active Thread:**
  * Header with back button (mobile), avatar, name, subtitle, and contextual Escrow button (`Hire & Fund Escrow` / `Submit Deliverable` / `Approve & Release`).
  * Soft-gold privacy banner reminding both parties that WhatsApp/phone contact is opt-in only.
  * Message bubbles: incoming in `--bg-card-sage`, outgoing in `--accent-gold` with `--text-primary` text. Quick-reply sage chips above the rounded-full message input + circular gold send button.
* **Desktop Reflow (`>= 1024px`):**
  * Classic split-pane inbox (`340px` conversation list left + active thread right with pinned Escrow Contract Bar).

### 4.6 Talent Home (`Beranda`)
* **Mobile Look (Exact Reference):**
  * **Curved-Bottom Olive Gradient Hero (`rounded-b-[28px]`, `pb-14`):**
    * Bold white greeting (`Hello, Aldi` / `Halo, Aldi` without emoji), subtitle (`Job Seeker · Bandung` / `Remote`), gold `Level 0` or `Rookie Lv 1` pill left, `29 / 100 EXP` right, and gold progress bar on a translucent white track.
  * **Overlapping Sage "Current Status" Card (`-mt-9`, `rounded-2xl`, `--bg-card-sage`, `--shadow-card`):**
    * `Current Status` (`Status Saat Ini`), bold active project title (`Cafe Menu Design`), subtitle (`Active project · Kopi Senja`), bottom row with cream stat pill (`Hired by SMEs: 2x total`) on the left and gold pill CTA (`Chat with SME`) on the right (plus quick `Submit Deliverable` link).
  * **Solid Olive "Escrow Wallet" Card (`rounded-2xl`, `bg-[var(--brand-olive-rich)] text-white`):**
    * Left: wallet icon + `Escrow Wallet` (`Dompet Dana`) + bold white balance (`Rp 350.000`).
    * Right: crisp gold rounded-xl CTA (`Withdraw` / `Tarik Dana`).
  * **First Quest / Active Quests Section:**
    * Header `First Quest` with right-aligned progress (`2 / 6 completed`).
    * Checklist rows: uncompleted items use crisp white `rounded-2xl` cards with a soft-gold rounded-xl icon square on the left; completed items switch to `--bg-card-sage` with an olive checkmark square and strikethrough text.
    * Once Level 1 is reached, this area evolves smoothly into **Tier Progress, Skill Badges & Certificates**.
  * **Explore Projects (`Jelajahi Proyek`) Section:**
    * Filter row (`Filter` icon + olive active pill `My Field (Design)` + sage inactive pills `All Projects`, `Escrow Gigs`, `Full-Time`).
    * Sage opportunity cards (`rounded-2xl`): Title + Business name & pin distance/remote on left, bold olive budget right, bottom row with olive category pill left and gold rounded-full `Apply` (`Lamar`) button right.
* **Desktop Reflow (`>= 1024px`):**
  * Curved olive hero banner sits cleanly at the top of `<main>` (`rounded-3xl`).
  * Below it, a 2-column grid (`grid-cols-1 lg:grid-cols-12 gap-6`):
    * Left (`5 cols`): Current Status card, Solid Olive Escrow Wallet card, and First Quest / Credentials checklist.
    * Right (`7 cols`): Explore Projects feed with filter pills and 2-column opportunity cards.

### 4.7 Talent "Find Projects" (`Cari Proyek`)
* **Mobile Look (Exact Reference):**
  * Heading `Find Projects` (`Cari Proyek`), crisp white `rounded-full` search input with magnifier icon, horizontal filter pills (`My Field`, `All Projects`, `Escrow Gigs`, `Jobs`, `Remote`), and stacked sage opportunity cards.
* **Desktop Reflow (`>= 1024px`):**
  * Full search + filter bar across the top, followed by a responsive 2-column grid of sage opportunity cards.

### 4.8 Profile Screen (`Profil` - Both Modes)
* **Exact Reference + Business Features:**
  * Olive circular avatar (`64x64px`) framed by a crisp `2px` gold ring (`ring-2 ring-[#FEA405]`), bold display name, olive role pill (`SME` / `Talent`) + optional Verification Badge pill.
  * **Employer Cards:** Sage Token Balance card (`[T] 3 Tokens` + gold pill `+ Top Up 5 Tokens`), Subscription status (Premium / Verification Badge), Token Ledger preview.
  * **Talent Cards:** Earned Skill Badges & Verifiable Certificates gallery (with `/verify/[code]` copy/download actions), Verification Badge & Premium subscription card.
  * **Shared Controls:** Clean Dual-Mode Switcher card (`Switch to Talent Mode` / `Switch to Business Mode`), Language (`EN` / `ID`) & Theme (Light / Dark) selectors, and full-width bordered `Sign Out` (`Keluar`) button.

---

## 5. Mandatory States, Accessibility & Base CSS

Every data-driven screen MUST provide:
1. **Loading State:** Layout-matched skeletons in `--bg-card-sage` (`opacity: 0.65`, `aria-busy="true"`).
2. **Empty State:** Centered circular sage icon (`64x64px`), clear reason why it is empty, and ONE direct action CTA.
3. **Error State:** `--status-error-bg` alert panel with plain-language message and working `Try Again` button.

### Base CSS Rules (`globals.css`)

```css
/* Interactive affordances */
button:not(:disabled),
a[href],
select:not(:disabled),
label[for],
[role="button"]:not([aria-disabled="true"]),
[role="tab"],
[role="radio"] {
  cursor: pointer;
}

button:disabled,
[aria-disabled="true"] {
  cursor: not-allowed;
  opacity: 0.48;
}

/* High-contrast keyboard focus indicator */
:focus-visible {
  outline: 2.5px solid var(--focus-ring);
  outline-offset: 2px;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Accessibility & Performance Guarantees
* Minimum `44x44px` touch targets with `>= 8px` gap on mobile/touch viewports.
* Full keyboard navigation (`Tab`, `Enter`/`Space`, `Escape` closes modals/drawers and restores focus).
* Visible `<label for>` on all form controls; `aria-label` on icon-only buttons; `aria-hidden="true"` on decorative SVGs.
* One `<h1>` per page, semantic `<header>`, `<nav>`, `<main>`, `<footer>` landmarks, and never disable pinch-zoom (`user-scalable=no` is forbidden).
* Explicit `width`/`height` or `aspect-ratio` on all images/avatars to prevent CLS; hero logo/visual uses `fetchpriority="high"`.