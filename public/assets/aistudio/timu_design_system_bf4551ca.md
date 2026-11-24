# DESIGN.md - TIMU (Titik Temu) Design System & UI Specification

This document is the authoritative visual, layout, and component specification for **TIMU**, an international escrow-backed peer-to-peer marketplace connecting SMEs (UMKM) with emerging talent. Feed this file alongside the PRD into your AI app builder or repository root so every screen shares one consistent visual language.

---

## 1. Design Direction & Brand Rationale

### Declared Dials
- **ENERGY: 2 (Balanced):** Warm, grounded, and trustworthy for SME owners and ambitious young talent. Avoid sterile corporate grey and avoid loud agency gimmicks.
- **RHYTHM: 2 (Structured with focal breaks):** Consistent workspace chrome with deliberate composition shifts across Onboarding, Blind Discovery, Opportunity Feed, Escrow Chat, and Public Certificate Verification.
- **MOTION: 2 (Purposeful):** Card swipe/dismiss physics, EXP progress bar transitions, drawer/sheet motion, and a restrained Level-Up confirmation. Zero continuous bouncing, pulsing, or floating loops.

### Brand Visual Rationale
- **Color Identity:** Organic olive greens, warm cream surfaces, and harvest gold differentiate TIMU from generic blue-purple freelance marketplaces and communicate growth, trust, and practical collaboration.
- **Typography Pairing:** `Bricolage Grotesque` (600, 700, 800) gives display headlines editorial character; `Plus Jakarta Sans` (400, 500, 600, 700) with tabular numerals (`font-variant-numeric: tabular-nums`) guarantees clean readability for multilingual copy (EN/ID) and multi-currency escrow breakdowns.
- **Surface Hierarchy:** Flat surfaces separated by crisp 1px borders are the default. Subtle shadows are reserved strictly for interactive elevated layers (active Blind Talent Card, modals, drawers, and sticky mobile navigation).
- **Iconography & Copy Discipline:** Use one unified 1.75px-2px stroke vector icon set (e.g., Lucide Icons). Do not use decorative emojis in UI headings, buttons, status pills, or empty states. Do not use em dashes in UI copy; use commas, periods, or colons.

---

## 2. Verified WCAG AA Color Tokens

Every foreground/background pairing below meets or exceeds **WCAG AA** (`>= 4.5:1` for normal text, `>= 3:1` for large text and interactive control boundaries).

> **Critical Contrast Rule:** Never place `#FFFFFF` text on `#8AA624` (contrast is 2.78:1 and fails WCAG AA). Use `#4F6110` for filled olive buttons with white text (`6.87:1`), and reserve `#8AA624` for progress fills, accents, or badges strictly paired with `#26300C` text (`5.00:1`).

### CSS Custom Properties (`globals.css`)

```css
:root,
[data-theme="light"] {
  color-scheme: light;

  /* Surfaces */
  --bg-canvas: #F4F7EE;
  --bg-surface: #FFFFF0;
  --bg-subtle: #E6EDD9;
  --bg-elevated: #FFFFFF;

  /* Borders */
  --border-subtle: #D5DFC3;
  --border-default: #C8D4B4;
  --border-strong: #78875B; /* >= 3.8:1 against #FFFFF0 for input borders */

  /* Typography */
  --text-primary: #26300C;   /* 13.85:1 on #FFFFF0 */
  --text-secondary: #495724; /* 7.86:1 on #FFFFF0, 6.6:1 on #E6EDD9 */
  --text-inverse: #FFFFFF;

  /* Brand Olive */
  --brand-primary: #4F6110;       /* 6.87:1 with #FFFFFF */
  --brand-primary-hover: #3E4D0C;
  --brand-primary-text: #FFFFFF;
  --brand-mid: #8AA624;           /* 5.00:1 with #26300C only */
  --brand-soft: #E6EDD9;

  /* Conversion Accent Gold (Reserved for primary conversion CTAs) */
  --accent-gold: #FEA405;         /* 6.97:1 with #26300C */
  --accent-gold-hover: #E59200;
  --accent-gold-text: #26300C;
  --accent-gold-soft: #FFEFCF;
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
  --shadow-card: 0 8px 24px -6px rgba(38, 48, 12, 0.12), 0 2px 6px -1px rgba(38, 48, 12, 0.06);
  --shadow-modal: 0 20px 48px -12px rgba(38, 48, 12, 0.24);
  --shadow-nav: 0 -2px 12px rgba(38, 48, 12, 0.06);
}

[data-theme="dark"],
.dark {
  color-scheme: dark;

  /* Surfaces */
  --bg-canvas: #111608;
  --bg-surface: #1B220E;
  --bg-subtle: #252E15;
  --bg-elevated: #222B12;

  /* Borders */
  --border-subtle: #2F3B1A;
  --border-default: #3A4722;
  --border-strong: #6C8043; /* >= 3.7:1 against #1B220E for input borders */

  /* Typography */
  --text-primary: #F4F7EE;   /* 14.9:1 on #1B220E */
  --text-secondary: #B8C49E; /* 8.77:1 on #1B220E */
  --text-inverse: #111608;

  /* Brand Olive */
  --brand-primary: #9BB832;       /* 8.2:1 with #111608 */
  --brand-primary-hover: #ACC942;
  --brand-primary-text: #111608;
  --brand-mid: #8AA624;
  --brand-soft: #252E15;

  /* Conversion Accent Gold */
  --accent-gold: #FEA405;         /* 9.2:1 with #111608 */
  --accent-gold-hover: #FFB633;
  --accent-gold-text: #111608;
  --accent-gold-soft: #3A2806;
  --accent-gold-soft-text: #FFD580;

  /* Semantic Status */
  --status-success-bg: #132E1A;
  --status-success-text: #7CE095;
  --status-error-bg: #3A1512;
  --status-error-text: #FDA29B;
  --status-info-bg: #11263D;
  --status-info-text: #8FC4FF;

  /* Focus Ring */
  --focus-ring: #FEA405;

  /* Elevation */
  --shadow-card: 0 10px 28px -6px rgba(0, 0, 0, 0.45);
  --shadow-modal: 0 24px 56px -12px rgba(0, 0, 0, 0.65);
  --shadow-nav: 0 -2px 16px rgba(0, 0, 0, 0.35);
}
```

### Tailwind Theme Mapping (`tailwind.config.ts`)

```ts
export default {
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        canvas: "var(--bg-canvas)",
        surface: "var(--bg-surface)",
        subtle: "var(--bg-subtle)",
        elevated: "var(--bg-elevated)",
        ink: "var(--text-primary)",
        muted: "var(--text-secondary)",
        brand: {
          DEFAULT: "var(--brand-primary)",
          hover: "var(--brand-primary-hover)",
          fg: "var(--brand-primary-text)",
          mid: "var(--brand-mid)",
          soft: "var(--brand-soft)",
        },
        gold: {
          DEFAULT: "var(--accent-gold)",
          hover: "var(--accent-gold-hover)",
          fg: "var(--accent-gold-text)",
          soft: "var(--accent-gold-soft)",
          "soft-fg": "var(--accent-gold-soft-text)",
        },
        line: {
          subtle: "var(--border-subtle)",
          DEFAULT: "var(--border-default)",
          strong: "var(--border-strong)",
        },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
    },
  },
};
```

---

## 3. Typography, Spacing & Radius System

### Fluid Type Scale
Apply `font-display` to Display/H1/H2 and `font-sans` to H3/Body/UI. Always apply `tabular-nums` (`font-variant-numeric: tabular-nums`) to Token counts, Escrow budgets, 10% admin fee calculations, EXP counters, and distances.

| Token | Font & Weight | Size (`clamp`) | Line Height | Usage |
|---|---|---|---|---|
| `display` | Bricolage Grotesque 800 | `clamp(2rem, 1.4rem + 2.4vw, 3.25rem)` | `1.1` | Public Gateway Hero H1 |
| `h1` | Bricolage Grotesque 800 | `clamp(1.5rem, 1.25rem + 1vw, 2rem)` | `1.2` | Workspace Page Title (one `<h1>` per page) |
| `h2` | Bricolage Grotesque 700 | `clamp(1.125rem, 1.05rem + 0.4vw, 1.375rem)` | `1.3` | Section Titles, Card Primary Names, Contract Headers |
| `h3` | Plus Jakarta Sans 700 | `1rem` (16px) | `1.4` | Card Subtitles, Drawer Headers, Step Titles |
| `body` | Plus Jakarta Sans 400/500 | `0.9375rem` (15px) | `1.55` | Descriptions, Chat Messages, Policy Copy |
| `body-sm` | Plus Jakarta Sans 500 | `0.875rem` (14px) | `1.45` | Form Labels, Metadata, Button Labels |
| `caption` | Plus Jakarta Sans 600 | `0.75rem` (12px) | `1.35` | Badges, Timestamps, Field Helpers |

### Border Radius Hierarchy (Anti-Slop Rule)
Do not make every container and button pill-shaped. Enforce clear geometric hierarchy:
- **Cards, Modals, Panels:** `16px` (`rounded-2xl`)
- **Primary Buttons, Inputs, Select Fields, Nav Items:** `12px` (`rounded-xl`)
- **Nested Wells, Escrow Breakdown Boxes, Skill Metric Tiles:** `10px` (`rounded-lg`)
- **Semantic Pills Only (Filter Chips, Status Tags, Dual-Mode Toggle, Avatars):** `9999px` (`rounded-full`)

### Spacing & Touch Targets
- **Base scale:** `4px` increments (`4, 8, 12, 16, 20, 24, 32, 48, 64`).
- **Minimum interactive target:** `44px x 44px` on mobile and touch viewports, with at least `8px` gap between adjacent buttons.
- **Safe-area padding:** Respect `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` on sticky headers, bottom navigation, and bottom sheets.

---

## 4. Responsive Three-State Layout Shell

Do NOT mount the app inside a fake phone frame. Implement three intentional viewport layouts with zero horizontal overflow (`320px` to `1920px+`):

| Breakpoint | Navigation Chrome | Workspace Grid | Primary Interaction Pattern |
|---|---|---|---|
| **Desktop (`>= 1024px`)** | Collapsible Left Sidebar (`248px` expanded / `72px` icon-only via real `<button aria-expanded>`). Houses Logo, Dual-Mode Switcher, Nav Links, Token/EXP pill, Language (`EN`/`ID`), Theme Toggle. | `max-width: 1280px` centered container inside `<main>`. Multi-column task layouts (e.g., 280px Filter Sidebar + Main Stage; Split-Pane Inbox; 2-Column First Quest + Live Card Preview). | Hover states, keyboard shortcuts (`ArrowLeft`/`ArrowRight` in Discovery, `Escape` for modals), slide-over detail drawers. |
| **Tablet (`640px - 1023px`)** | Compact Top Bar (`56px`) + Slide-out Navigation Drawer (`<button aria-label="Open menu">`). | 2-column Opportunity grids; horizontal scrollable filter bar above main content. | Touch + pointer parity, sheet modals. |
| **Mobile (`< 640px` & PWA)** | Compact Top Bar (`56px`: Brand Mark + Dual-Mode pill + Token/Level badge) + Fixed Bottom Nav (`4` primary tabs per mode, `64px + safe-area`). Reserve `padding-bottom: 84px` on `<main>`. | Single-column stack with `16px` horizontal gutters. Full-bleed chat thread view when a conversation is opened. | Touch swipe gestures ALWAYS paired with visible tap buttons; bottom sheets for modals; inputs scroll smoothly above on-screen keyboard. |

---

## 5. Core Component Specifications

### 5.1 Dual-Mode Workspace Switcher
- **Purpose:** Lets one account switch seamlessly between **Talent Mode** and **Employer Mode** as defined in the TIMU product architecture.
- **Anatomy:** Segmented control (`role="radiogroup"`) with two explicit `<button role="radio" aria-checked>` segments: `Talent` and `Business (SME)`.
- **Visual State:** Active segment uses `--brand-primary` fill with `--brand-primary-text`; inactive segment uses transparent background with `--text-secondary`. Switching modes updates the navigation links, active route, and top metric (Level/EXP vs. Token Balance) immediately.

### 5.2 Blind Talent Discovery Card (Signature Identity Motif)
- **Purpose:** Communicates TIMU's privacy-first, anti-bias hiring model immediately.
- **Locked State (Before 1 Token):**
  - Header banner (`--brand-primary` subtle tint or `--bg-subtle` header band) with circular blurred avatar (`filter: blur(8px)`, explicit `80x80px` size) and lock badge (`Identity hidden until unlocked`).
  - Masked name bar rendered cleanly with lock icon (`Candidate #ID` or masked bars, never leaking real name in DOM or API JSON).
  - Visible high-signal data: Education/Status pill, Distance (`1.2 km`) or Timezone (`UTC+7 · Remote`), Account Tier (`Rookie Lv 1` / `Lv 2`), Verification Badge (if subscribed), **Top 3 Skills** chips (`--bg-subtle` fill + `--text-primary` text + border), Completed Gigs/Quests metric tiles, Bootcamp/Certification summary, and anonymized portfolio links.
  - Action Bar: Secondary outline button `Skip` (`ArrowLeft`) + Primary `--accent-gold` button `Unlock Chat & Reveal (1 Token)` (`ArrowRight`).
- **Unlocked State (After 1 Token):**
  - Blur lifts smoothly (`220ms ease-out`, instant under `prefers-reduced-motion`). Real name, crisp avatar, and `Open Chat` CTA appear.
  - Explicit privacy notice banner: "Direct contact/WhatsApp is only shared if the talent opts in inside chat."

### 5.3 Escrow Contract Bar & Breakdown Drawer
- **Purpose:** Anchors trust inside Employer/Talent Chat and Project Contracts.
- **Pinned Contract Bar (Top of Chat Thread):**
  - Displays Gig Title, Escrow Status badge (`Pending Funding`, `Funded in Escrow`, `Deliverable Submitted`, `Released`), and primary contextual action (`Hire & Fund Escrow`, `Submit Deliverable`, or `Approve & Release Funds`).
- **Financial Breakdown Box (Inside Contract Drawer):**
  - Strictly `tabular-nums`, right-aligned amounts:
    - `Gig Budget (100%)`: e.g., `Rp 250.000` / `$25.00`
    - `Platform Admin Fee (10%)`: e.g., `- Rp 25.000` / `-$2.50`
    - `Net Talent Payout (90%)`: e.g., `Rp 225.000` / `$22.50`
  - **Compliance Note:** Explicitly states funds are held by a licensed third-party Payment Service Provider (or Sandbox Simulator in test mode), never in a manual personal bank account.

### 5.4 First Quest Stepper + Live Blind Card Preview
- **Layout:** On desktop (`>= 1024px`), 2-column split: Left column (`55%`) holds the 6-step interactive accordion with sticky EXP progress header (`0 / 100 EXP -> Rookie Lv 1`); Right column (`45%`, sticky) renders the **Live Blind Talent Card Preview** updating in real time as the user types. On mobile/tablet, single-column stepper with a "Preview My Card" modal button.
- **Progress Bar:** Track uses `--bg-subtle` (or translucent track on dark brand header); fill uses `--accent-gold` with `width` transition (`300ms ease-out`).
- **Skill Selector (`Top 3 Skills`):** Enforces exact `3/3` count. Once 3 skills are selected, unselected chips clearly dim (`opacity: 0.5`, `aria-disabled="true"`) until one is deselected.

### 5.5 Opportunity Card (Dual Engine: Gigs + Jobs)
- **Type Distinction:** Every card carries a clear top tag distinguishing `Escrow Gig` (`--status-success-bg` / `--status-success-text`) from `Full-Time` or `Part-Time Job` (`--status-info-bg` / `--status-info-text`).
- **Priority Placement:** Employer Premium listings show a subtle bordered `Priority` caption tag (no pulsing or glowing animations).
- **Metadata Row:** Business Name (+ Verification Badge icon if verified), Work Mode (`Remote · UTC+7` or `On-site · 1.5 km`), Career Field, Budget/Salary (`tabular-nums`), and single concrete CTA (`Apply with Pitch` or `Applied` disabled state).

### 5.6 Verifiable Certificate Card & Public Verification Page (`/verify/[code]`)
- **Design:** Editorial document-style card (`--bg-surface` with refined double-line olive border `--border-strong`, TIMU logo slot, crisp typographic hierarchy, zero cheesy gold gradient clipart).
- **Fields:** Recipient Full Name, Completed Project Title, Issuing SME Business Name, Validated Skill Badges, Issue Date, Unique Verification ID (`TIMU-YYYY-XXXXXX`), and Copy Link / Download PDF buttons.

### 5.7 Button Hierarchy
- **Primary Conversion CTA (`--accent-gold` / `--accent-gold-text`):** Maximum ONE per viewport/card focal area (`Start First Quest`, `Unlock Chat & Reveal (1 Token)`, `Fund Escrow`, `Approve & Release Funds`).
- **Primary Brand Action (`--brand-primary` / `--brand-primary-text`):** Structural actions (`Save Profile`, `Post Gig (1 Token)`, `Submit Deliverable`, `Apply with Pitch`).
- **Secondary Action:** Transparent/surface fill with `1.5px solid var(--border-strong)` and `--text-primary` text (`Skip`, `Cancel`, `View Portfolio`, `Reset Filters`).
- **Destructive Action:** `--status-error-bg` fill with `--status-error-text` (`Cancel Contract`, `Report Dispute`).

---

## 6. Mandatory UI States (Loading, Empty, Error)

Every data-fetching view (Discovery, Opportunities, Applications, Chat, Wallet, Token Ledger, Certificates) MUST implement all three states:

1. **Loading State:**
   - Render layout-matched skeleton blocks using `--bg-subtle` with a subtle opacity pulse (`prefers-reduced-motion: reduce` disables pulse and renders static fill).
   - Container includes `aria-busy="true"` and an `sr-only` status message (e.g., `"Loading matching opportunities..."`).
2. **Empty State:**
   - Centered container (`max-width: 380px`), one neutral line icon inside a `56x56px` `--bg-subtle` circle, concise headline explaining **why** the view is empty (distinguish First Run vs. Strict Filter vs. Locked Chat), one sentence of guidance, and **one direct CTA button**.
3. **Error State:**
   - Bordered `--status-error-bg` banner or centered panel with clear explanation of what failed (never raw stack traces) and a working `Try Again` button that retries the query.

---

## 7. Motion, Accessibility & Base CSS Rules

Include these mandatory base rules in `globals.css`:

```css
/* Pointer affordance on all interactive controls */
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

/* High-contrast keyboard focus ring across Light and Dark modes */
:focus-visible {
  outline: 2.5px solid var(--focus-ring);
  outline-offset: 2px;
}

/* Reduced motion compliance */
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

### Accessibility & Performance Checklist
- **Landmarks & Headings:** Every route uses `<header>`, `<nav>`, `<main>`, and `<footer>` (where applicable), with exactly one `<h1>` per page and logical heading nesting.
- **Labels & Icon Buttons:** Every `<input>`, `<textarea>`, and `<select>` has a visible `<label for>`. Every icon-only button has an `aria-label` and `aria-hidden="true"` on the SVG.
- **Modals & Drawers:** Trap focus while open, close on `Escape` and backdrop click, and restore focus to the triggering element on close.
- **Viewport & Media:** `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` (never disable zoom). Declare explicit `width`/`height` or `aspect-ratio` on all avatars, logos, and portfolio thumbnails. Mark the landing hero visual with `fetchpriority="high"` and never lazy-load above-the-fold assets.

---

## 8. Copywriting & Localization Rules (`EN` / `ID`)

- **Default Locale:** English (`en`) for international reach, with complete Indonesian (`id`) dictionary ready out of the box.
- **Terminology Consistency:**
  - `EN`: Talent / Business (SME) / First Quest / Escrow Gig / Token / Verification Badge / Platform Admin Fee (10%)
  - `ID`: Talenta / UMKM / First Quest / Proyek Escrow / Token / Badge Verifikasi / Biaya Admin Platform (10%)
- **Banned Copy Patterns:**
  - Never use em dashes.
  - Never use hype buzzwords ("AI-Powered", "Revolutionary", "Seamless", "Cutting-Edge", "Next-Generation", "Elevate", "Empower").
  - Never invent fake traction numbers ("10,000+ UMKM joined"), fake testimonials, or unverified compliance seals. If demo data is seeded for testing, show a clear, dismissible `Demo Workspace` banner.