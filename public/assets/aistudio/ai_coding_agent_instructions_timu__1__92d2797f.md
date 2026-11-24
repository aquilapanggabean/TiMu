# Agent.md - Engineering & Design Operating Rules for TIMU (Titik Temu)

Read this file before modifying or generating any code in this repository. These instructions apply to every feature, refactor, database migration, and UI change for **TIMU (Titik Temu)**.

---

## 1. Project Context & Source-of-Truth Hierarchy

**TIMU (Titik Temu)** is an escrow-backed peer-to-peer marketplace (Responsive Web App + installable PWA) built for international scale, connecting small-to-medium enterprises (SMEs / UMKM) with emerging talent (students, recent graduates, bootcamp alumni, and early-career freelancers).

When making decisions, follow this strict precedence order:
1. **`Agent.md`** (this file): Security invariants, engineering discipline, and verification gates.
2. **`DESIGN.md`**: Single source of truth for visual tokens (Light & Dark WCAG AA), typography, tactile geometry, 3-state responsive layouts, and component anatomy.
3. **`PROMPT_AI_BUILDER.md`**: Product requirements, user flows, monetization math, and database schema.

Do NOT override visual rules in `DESIGN.md` with generic SaaS component defaults.

---

## 2. Hard Visual Fidelity & Anti-Slop Rules

* **Preserve the Exact TIMU Look:** Use the warm cream (`#FFFFF0`), soft sage (`#DBE4C9`), rich olive (`#4F6110` / `#5C7214`), and harvest gold (`#FEA405`) visual language defined in `DESIGN.md`. Never replace it with generic slate-grey or blue-purple SaaS palettes.
* **Never Render a Fake Phone Frame on Desktop:** The mobile reference layout (`< 640px`) uses a 4-tab bottom nav with soft-gold active icon pills. On Tablet (`640px - 1023px`) and Desktop (`>= 1024px`), reflow natively into the collapsible Left Sidebar (`248px` / `72px`) and multi-column task layouts specified in `DESIGN.md`.
* **WCAG AA Contrast Guardrail:** NEVER place `#FFFFFF` text on `#8AA624` (2.78:1 fails AA). Any olive surface holding white text MUST use `--brand-primary` (`#4F6110`, 6.87:1) or `--brand-olive-rich` (`#5C7214`, 5.45:1). Maintain full parity in both Light Mode (default) and Dark Mode.
* **Copy Hygiene:**
  * Zero decorative emojis in headings, buttons, badges, or system copy.
  * Zero em dashes anywhere in UI text, labels, or docs. Use commas, periods, or colons.
  * Zero AI marketing buzzwords ("AI-Powered", "Revolutionary", "Seamless", "Cutting-Edge", "Next-Generation", "Elevate", "Empower").
  * Specific action CTAs only (e.g., `Start First Quest`, `Open Chat & Hire (1 Token)`, `Fund Escrow`, `Approve & Release Funds`).
* **Data Honesty:** Never fabricate user counts, traction numbers, fake testimonials, or "Trusted By" logo bars. Any seeded local sample records MUST display a clear, dismissible `Demo Workspace` badge.
* **Brand Asset:** Render the provided TIMU logo asset or keep an explicit `[LOGO SLOT]` comment with a clean typographic wordmark so the production SVG/PNG can be dropped in cleanly.

---

## 3. Non-Negotiable Business & Security Invariants

Never violate these rules in frontend or backend code:

1. **Adaptive Dual-Mode Single Account:**
   * A single authenticated user can switch cleanly between **Talent Mode** (`/talent/*`) and **Employer Mode** (`/employer/*`) via the Dual-Mode Switcher without creating a second account.
   * Keep `talent_profiles` and `employer_profiles` strictly separated with dedicated permissions and balances.
2. **Server-Enforced Blind Talent Discovery (Privacy First):**
   * NEVER expose `full_name`, `avatar_url`, or `phone_private` in API/JSON discovery responses until a matching `talent_unlocks` row exists for the authenticated `employer_id`.
   * Enforce masking at the database level via a secure view or RPC (`get_blind_talents`), never merely by hiding fields with CSS on the client.
   * Off-platform phone/WhatsApp sharing inside Chat MUST remain strictly opt-in via an explicit Talent consent button.
3. **Atomic Token Accounting:**
   * Employers receive `3` starter Tokens on profile creation.
   * Base Token rate: `Rp10.000 / Token` (Intl equivalent: `$1.00 / Token`; packs such as 5 Tokens = `Rp50.000` / `$5.00`).
   * Spending `1 Token` to reveal a Talent (`unlock_talent_with_token`) or publish an opportunity (`publish_opportunity_with_token`) MUST run inside a single PostgreSQL transaction that checks `token_balance >= 1`, deducts `1`, inserts a `token_ledger` entry, and creates the unlock/chat or opportunity atomically.
4. **Compliant Third-Party Escrow & Exact 10% Admin Fee Math:**
   * NEVER display or hardcode a static manual admin bank account (such as a dummy BCA account).
   * Route all Escrow deposits, holds, and payouts through an abstract `PaymentProvider` interface (`Stripe Connect Express` globally + pluggable regional licensed PSP adapter for IDR) with an explicitly labeled **Sandbox Simulator Mode** when live keys are absent in `.env`.
   * Escrow breakdown MUST always compute in integer minor units: Employer funds `100%` (`gross_amount_minor`), Platform Admin Fee is `10%` (`platform_fee_minor`), and Talent receives `90%` (`net_talent_minor`).
5. **Atomic Escrow Release + Gamification & Certificate Minting:**
   * Calling `release_escrow_contract` (authorized strictly for the contract's `employer_id`) MUST execute atomically: update `escrow_status = 'released'`, credit `net_talent_minor` to `wallet_transactions`, log the 10% platform fee, award Talent EXP (promoting tier `Lv 1 -> Lv 2+` if threshold crossed), award a `skill_badges` record, and mint a `certificates` row with a unique `verification_code` accessible publicly at `/verify/[code]`.
6. **All Four Revenue Streams Supported:**
   * Token Packs (`Rp10.000` / `$1.00` per Token)
   * Escrow Admin Fee (`10%` of completed Gig value)
   * Premium Subscription for Talent & Employer (`Rp100.000/mo` / `$6.99/mo`)
   * Verification Badge (`Rp50.000/mo` / `$3.49/mo`)
7. **Internationalization & Multi-Currency Standards:**
   * No hardcoded untranslated UI strings. Store every label in structured `en` (default) and `id` locale dictionaries with a working switcher.
   * Store all money as `bigint` minor units + ISO 4217 `currency` code (`IDR`, `USD`, `EUR`, `GBP`, `SGD`). Never store currency as floating-point numbers. Format via `Intl.NumberFormat` and render with `tabular-nums`.

---

## 4. Coding & Architecture Standards

* **Strict TypeScript:** No `any`, no suppressed `@ts-ignore` comments, no implicit untyped API payloads.
* **Shared Validation:** Define Zod schemas for all forms, API inputs, and RPC payloads; validate on both client and server.
* **Three UI States on Every Data Screen:** Every list, discovery stage, chat view, wallet, and billing screen MUST explicitly implement:
  1. **Loading:** Layout-matched sage skeleton placeholders (`aria-busy="true"`).
  2. **Empty:** Clear reason why it is empty + ONE direct next-step button.
  3. **Error:** Plain-language error message + working `Try Again` button.
* **Accessibility & Input Parity:**
  * Every swipe gesture (Blind Talent Card Skip / Unlock) MUST also have visible tap buttons and keyboard shortcuts (`ArrowLeft` / `ArrowRight`).
  * Enforce `>= 44x44px` touch targets with `>= 8px` gaps on touch viewports.
  * Ensure full keyboard operability (`Tab`, `Enter`/`Space`, `Escape` closes modals/drawers and restores focus), visible `:focus-visible` outlines (`>= 3:1`), `cursor: pointer` on enabled controls, `cursor: not-allowed` on disabled controls, visible `<label for>` on all inputs, `aria-label` on icon-only buttons, and `aria-hidden="true"` on decorative SVGs.
  * Respect `prefers-reduced-motion: reduce`. Never disable pinch-zoom (`user-scalable=no` is forbidden).
* **PWA & Performance:** Maintain valid `manifest.webmanifest`, `viewport-fit=cover`, safe-area inset padding, explicit image `width`/`height` or `aspect-ratio`, and `fetchpriority="high"` on the hero visual.

---

## 5. Phased Development Protocol

When building from scratch or implementing large features, work sequentially and do not skip ahead with broken stubs:

1. **Phase 1 (Shell & Tokens):** Configure `DESIGN.md` CSS variables, Tailwind tokens, Light/Dark toggle, `en`/`id` i18n, currency formatter, Gateway screen, 3-state responsive AppShell, and PWA manifest.
2. **Phase 2 (Database & Security):** Apply PostgreSQL schema migrations, RLS policies, `get_blind_talents`, `unlock_talent_with_token`, `publish_opportunity_with_token`, `release_escrow_contract`, and Auth flows.
3. **Phase 3 (Talent Workspace):** Build First Quest onboarding (with desktop live Blind Card preview), Talent Home (curved olive header + overlapping status + solid olive wallet), Opportunities marketplace (Escrow Gigs + Jobs), Applications, Wallet, and `/verify/[code]`.
4. **Phase 4 (Employer Workspace & Billing):** Build Blind Talent Discovery, Token Packs / Premium / Verification Badge billing, My Projects (`+ Create New Project`), Applicant review, and Third-Party Escrow Contract + Sandbox Simulator.
5. **Phase 5 (Real-Time Chat & End-to-End QA):** Build Locked Chat state, `Riwayat Chat`, Split-Pane real-time thread, pinned Escrow Contract Bar, and opt-in contact sharing.

---

## 6. Pre-Completion Verification Gate (Mandatory Before Reporting Done)

Before declaring any task or phase complete, you MUST execute and confirm:

1. **Static Checks:** Run TypeScript check (`tsc --noEmit`), linter, and production build (`npm run build`) with zero errors.
2. **Privacy Audit:** Inspect the discovery endpoint/RPC response to verify `full_name`, `avatar_url`, and `phone_private` are absent for non-unlocked talent records.
3. **Financial Math Audit:** Verify Token deductions cannot go negative and Escrow release always calculates `platform_fee_minor = Math.round(gross * 0.10)` and `net_talent_minor = gross - platform_fee_minor`.
4. **Responsive & Theme QA:** Verify zero horizontal overflow and clean layout reflow across `375px` (Mobile), `768px` (Tablet), and `1440px` (Desktop) in both **Light Mode** and **Dark Mode**, plus `EN` and `ID` language switching.
5. **Honest Reporting:** Never claim a test, check, or browser verification passed unless you actually ran it. Explicitly state what was verified and note any unconfigured external keys running in Sandbox Mode.