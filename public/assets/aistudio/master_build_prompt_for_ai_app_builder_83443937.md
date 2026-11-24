# FULLSTACK BUILD PROMPT & PRD: TIMU (Titik Temu)
# Companion Prompt to: DESIGN.md + TIMU Reference UI Screenshots

## 0. MANDATORY VISUAL FIDELITY INSTRUCTION (READ `DESIGN.md` FIRST)
I have attached **`DESIGN.md`** and the **TIMU Reference UI Screenshots**.
You MUST build the application to look and feel directly like the attached TIMU screenshots and **`DESIGN.md`** (the exact warm cream `#FFFFF0` background, soft sage `#DBE4C9` cards, rich olive headers and wallet card, harvest gold `#FEA405` primary CTAs, soft gold `#FFEFCF` active nav pill and dashed `+ Create New Project` card, curved-bottom olive Talent header with overlapping status card, Blind Talent Discovery card with olive top half + blurred avatar + masked dots, and the exact TIMU logo styling).

**Critical Responsive Upgrade Rule:**
- On **Mobile (`< 640px`) and PWA**, preserve the exact layout, 4-tab bottom navigation bar (with soft-gold active icon pill and lock badge on Employer Chat when locked), top Token balance pill, and card layouts shown in the screenshots.
- On **Tablet (`640px - 1023px`) and Desktop (`>= 1024px`)**, do **NOT** wrap the app inside a fake phone frame or green mobile bezel! Reflow the exact same visual language natively using the collapsible Left Sidebar + multi-column layouts specified in `DESIGN.md` Section 4.
- Fix small-text contrast cleanly using the WCAG AA verified tokens in `DESIGN.md` (strictly never place `#FFFFFF` text on `#8AA624`; use `#4F6110` or `#5C7214` for olive surfaces holding white text).
- Support both **Light Mode** (the exact screenshot look, set as default) and a working **Dark Mode** toggle defined in `DESIGN.md`.
- Do NOT use decorative emojis in UI copy, do NOT use em dashes, and do NOT invent fake traction stats or fake testimonials.

---

## 1. ROLE & PRODUCT SCOPE
Act as a Principal Fullstack Web & App Developer. Build **TIMU (Titik Temu)** as a real, production-ready, database-backed web application and installable Progressive Web App (PWA) built for international scale.

**Product Purpose:** TIMU is an escrow-backed peer-to-peer marketplace connecting SMEs (UMKM) with emerging talent (students, recent graduates, bootcamp alumni, and early-career freelancers). It resolves two-sided distrust through third-party Escrow payment protection (SDG 8), affordable SME access to digital talent (SDG 9), and practical career credentials via Quests, Skill Badges, and Verifiable Certificates (SDG 4).

### Core Mechanics to Implement
1. **Adaptive Dual-Mode UI (Single Account, Two Workspaces):**
   - Users can sign up from the Gateway screen as Talent or Business (SME) and switch smoothly between **Talent Mode** and **Employer Mode** anytime from the Profile screen or Desktop Sidebar while maintaining separate profiles, balances, and permissions.
2. **Dual Opportunity Engine (Escrow Gigs + Part-Time / Full-Time Jobs):**
   - **Escrow Gigs:** Scoped project work protected by third-party Escrow with an automatic **10% platform admin fee** deducted upon payout release.
   - **Jobs:** Part-time, internship, and full-time openings without mandatory escrow billing.
3. **Blind, Skill-First Talent Discovery + Token Economy:**
   - Employers browse Talent cards where real names are masked (`••••• ••••••` + lock icon) and avatars are blurred until unlocked.
   - Spending **1 Token** acts as an anti-spam filter and either:
     1. Reveals the talent's identity, opens a persistent real-time Chat room, enables **Hire & Escrow**, and allows opt-in direct contact/WhatsApp sharing; OR
     2. Publishes a new Gig or Job listing.
4. **Gamified First Quest, Continuous EXP & Verifiable Certificates:**
   - **First Quest Onboarding:** 6-step quest granting 100 EXP to promote new Talent from Level 0 to **Rookie Level 1** (solving the empty-CV problem).
   - **Post-Transaction EXP & Credentials:** Every approved Escrow payout automatically awards EXP toward higher tiers (`Lv 2`, `Lv 3+`), grants a domain **Skill Badge**, and mints a downloadable **Verifiable Completion Certificate** with a public URL (`/verify/[code]`).
5. **Compliant Third-Party Escrow Architecture:**
   - Remove all hardcoded manual bank details (never show a static personal/admin BCA account).
   - Abstract all payments behind a `PaymentProvider` interface supporting **Stripe Connect Express** (global escrow/payouts) + pluggable regional licensed PSP adapter (Midtrans/Xendit/partner bank escrow for IDR).
   - Include a clearly labeled **Sandbox Simulator Mode** when live PSP keys are absent so every flow works end-to-end immediately.
6. **International Scale Readiness:**
   - **Localization (`i18n`):** Complete English (`en`) and Indonesian (`id`) dictionaries with a working language switcher (`EN` / `ID`). Make Indonesian or English selectable right from the Gateway and Settings.
   - **Multi-Currency:** Store monetary values in integer minor units (ISO 4217: `IDR`, `USD`, `EUR`, `GBP`, `SGD`) and format dynamically with `Intl.NumberFormat` and `tabular-nums`.
   - **Local + Global Matching:** Support both hyper-local discovery (`Prioritize Nearby` radius in `km`/`mi`) and `All Locations / Remote` (timezone overlap matching).

---

## 2. MONETIZATION & EXACT BUSINESS RULES
Implement all four business revenue streams cleanly in the database, ledger, and billing UI:

| Stream | User Side | Base Rate (IDR) | Intl Equivalent (USD) | Functional Rule |
|---|---|---|---|---|
| **Token Packs** | Employer (SME) | Rp10.000 / Token (5 Tokens = Rp50.000; 15 Tokens = Rp140.000) | $1.00 / Token (5 Tokens = $5.00; 15 Tokens = $14.00) | 1 Token unlocks Talent Chat/Reveal OR publishes 1 Gig/Job. New Employers receive 3 starter Tokens on signup. |
| **Escrow Admin Fee** | Completed Gigs | 10% of gross Gig value | 10% of gross Gig value | Employer funds 100% into Escrow; on work approval, 90% releases to Talent Wallet and 10% logs as Platform Admin Fee. |
| **Premium Plan** | Both Sides | Rp100.000 / month | $6.99 / month | Employer: pins posted projects to the top, advanced filters, monthly bonus Tokens. Talent: priority applications, unlimited portfolio links, profile insights. |
| **Verification Badge** | Both Sides | Rp50.000 / month | $3.49 / month | Displays a verified identity/student/business trust badge on profiles, discovery cards, and applications. |

---

## 3. RECOMMENDED FULLSTACK ARCHITECTURE
- **Frontend:** Next.js 15+ (App Router) OR React 18+ with Vite + TypeScript (strict mode).
- **Styling:** Tailwind CSS bound directly to the CSS custom properties in `DESIGN.md`.
- **Backend & Database:** Supabase (PostgreSQL + Auth + Realtime + Storage + RLS) OR Next.js Route Handlers + Prisma + PostgreSQL.
- **Validation & Data:** Zod, React Hook Form, TanStack Query.
- **PWA:** Valid `manifest.webmanifest`, service worker offline shell, `viewport-fit=cover`, Capacitor-compatible build.

---

## 4. COMPLETE SCREENS & INTERACTIVE FLOWS

### A. Public Gateway, Auth & Certificate Verification
- **Gateway (`/`):** Matches the Gateway screenshot (TIMU logo, tagline, Gold Talent entry card, Sage SME entry card, subtle `EN`/`ID` + theme switchers, real footer links to `/legal/terms`, `/legal/privacy`, `/legal/escrow-policy`). Desktop shows a balanced 2-column layout with a live Blind Talent Card preview beside the role cards.
- **Auth (`/login`, `/signup`):** Email/Password + Google OAuth. Captures selected role (`talent` or `employer`) and routes new Talent to `/talent/first-quest` and new Employer to `/employer/discover`.
- **Public Certificate Verification (`/verify/[code]`):** Public read-only verification page showing recipient name, completed project title, issuing SME name, validated Skill Badges, completion date, and unique certificate ID (`TIMU-YYYY-XXXXXX`), with PDF download.

### B. Employer (SME) Workspace (`/employer/*`)
1. **Home - Blind Discovery (`/employer/discover`):** Matches the UMKM Beranda screenshot (Gold Premium Banner, `Prioritize Nearby` vs. `All Locations / Remote` toggle + Career Field/Skill filters, Blind Talent Card with olive top half + blurred avatar + masked dots + Top 3 Skills + Quests/Bootcamp tiles, and Skip `X` / Gold `Open Chat & Hire · Pay 1 Token` action bar with keyboard `ArrowLeft`/`ArrowRight` parity). Opening the Unlock Modal explains 1 Token reveals identity + Chat/Hire and discloses third-party PSP Escrow + 10% admin fee.
2. **My Projects (`/employer/projects`):** Matches the `Proyek Saya` screenshot (dashed soft-gold `+ Create New Project` card supporting Escrow Gig or Full-Time/Part-Time Job, `Active Projects` sage cards, plus tabs/sections for incoming Applicants, Revealed Talents, and Escrow Contracts with `Approve Work & Release Escrow`).
3. **Chat (`/employer/chat`):** Matches the locked state screenshot (`Chat terkunci`) when empty, and transitions into real-time messaging (`Riwayat Chat` list -> Thread on mobile; Split-Pane on desktop) with a pinned **Escrow Contract Bar** (`Hire & Fund Escrow` drawer showing 100% Budget / 10% Admin Fee / 90% Net Talent Payout, and `Review Deliverable / Release Funds`).
4. **Profile & Billing (`/employer/profile`):** Matches the UMKM `Profil` screenshot (olive avatar with gold ring, business name, `UMKM` badge, sage Token Balance card with `+ Top Up 5 Tokens`, Token Ledger, Premium & Verification Badge billing cards, Dual-Mode Switcher, Language/Theme toggles, and bordered `Sign Out` button).

### C. Talent Workspace (`/talent/*`)
1. **First Quest Onboarding (`/talent/first-quest`):** 6-step interactive stepper (`+17/+16 EXP` = 100 EXP -> **Rookie Level 1**): (1) Identity, private WhatsApp/phone & City/Timezone/Work Mode, (2) Education/Status, (3) Experience (includes `No formal experience yet` chip), (4) Interests & Strengths, (5) Career Field, (6) Exactly Top 3 Skills (`3/3` enforced). On desktop, show a live Blind Talent Card preview on the right updating as the user fills the form.
2. **Home (`/talent/dashboard`):** Matches the Talent `Beranda` screenshot: curved-bottom olive EXP header (`Level` pill + EXP bar), overlapping sage `Current Status` card (`Chat with SME` + `Submit Deliverable`), solid olive `Escrow Wallet` card (`Withdraw Funds` modal with bank/e-wallet/Stripe Connect options + 10% fee ledger), `First Quest` checklist (evolving into Tier/Skill Badges/Certificates after Level 1), and `Explore Projects` feed.
3. **Find Projects (`/talent/projects`):** Matches the `Cari Proyek` screenshot (white pill search bar, `My Field` / `All Projects` / `Escrow Gigs` / `Jobs` / `Remote` filter pills, sage opportunity cards with `Apply` pill opening an `Apply with Pitch` modal).
4. **Chat (`/talent/chat`):** Matches the `Riwayat Chat` screenshot (sage conversation cards with olive avatar, timestamp, preview, gold unread dot; split-pane on desktop). Inside threads, include quick-reply chips and an explicit opt-in **"Share Contact / WhatsApp"** consent button.
5. **Profile & Credentials (`/talent/profile`):** Matches the Talent `Profil` screenshot (olive avatar with gold ring, name, `Talent` badge + Verification Badge, downloadable Certificates & Skill Badges gallery, Verification Badge & Talent Premium subscriptions, Dual-Mode Switcher, Language/Theme toggles, and bordered `Sign Out` button).

---

## 5. DATABASE SCHEMA, RLS & ATOMIC TRANSACTIONS (POSTGRESQL / SUPABASE)
Implement normalized migrations with strict Row Level Security:
- `profiles` (`id`, `full_name`, `avatar_url`, `active_mode`, `has_talent_profile`, `has_employer_profile`, `country_code`, `city`, `lat`, `lng`, `timezone`, `preferred_currency`, `preferred_locale`, `theme_preference`, `created_at`)
- `talent_profiles` (`user_id`, `category`, `education_detail`, `experience_summary`, `career_field`, `interests[]`, `top_skills[]` check length=3, `work_modes[]`, `bootcamp_history`, `portfolio_url`, `linkedin_url`, `phone_private`, `exp_points`, `tier_level`, `first_quest_completed`, `is_verified`, `is_premium`, `completed_gigs_count`)
- `employer_profiles` (`user_id`, `business_name`, `industry`, `token_balance` default 3, `is_verified`, `is_premium`, `premium_expires_at`)
- `opportunities` (`id`, `employer_id`, `opportunity_type`, `title`, `description`, `career_field`, `work_mode`, `city`, `lat`, `lng`, `timezone`, `budget_minor`, `currency`, `deadline`, `is_priority`, `status`, `created_at`)
- `applications` (`id`, `opportunity_id`, `talent_id`, `pitch`, `portfolio_link`, `status`, `created_at`, unique `(opportunity_id, talent_id)`)
- `talent_unlocks` (`id`, `employer_id`, `talent_id`, `tokens_spent`, `created_at`, unique `(employer_id, talent_id)`)
- `token_ledger` (`id`, `employer_id`, `delta`, `reason`, `reference_id`, `created_at`)
- `subscriptions` (`id`, `user_id`, `plan_type`, `status`, `amount_minor`, `currency`, `current_period_end`, `provider_subscription_id`)
- `contracts` (`id`, `opportunity_id`, `employer_id`, `talent_id`, `scope_summary`, `gross_amount_minor`, `platform_fee_minor`, `net_talent_minor`, `currency`, `escrow_provider`, `escrow_status`, `provider_payment_intent_id`, `deliverable_url`, `deliverable_note`, `created_at`, `updated_at`)
- `certificates` (`id`, `verification_code` unique, `contract_id` unique, `talent_id`, `employer_id`, `project_title`, `skills_validated[]`, `issued_at`)
- `skill_badges` (`id`, `talent_id`, `badge_name`, `career_field`, `earned_from_contract_id`, `awarded_at`)
- `conversations` & `messages` (`conversations(id, employer_id, talent_id, contract_id, last_message_at)`, `messages(id, conversation_id, sender_id, body, attachment_url, shared_contact_payload, read_at, created_at)`)
- `wallet_transactions` (`id`, `talent_id`, `contract_id`, `type`, `amount_minor`, `currency`, `status`, `payout_destination`, `created_at`)

### Non-Negotiable Server Security Rules
1. **Server-Enforced Blind Discovery (`get_blind_talents` RPC/View):** Never return `full_name`, `avatar_url`, or `phone_private` in client JSON unless a matching `talent_unlocks` row exists for `auth.uid()`.
2. **Atomic Token Operations (`unlock_talent_with_token`, `publish_opportunity_with_token`):** Verify `token_balance >= 1`, deduct 1 Token, write to `token_ledger`, and create the unlock/chat or opportunity inside one PostgreSQL transaction.
3. **Atomic Escrow Release (`release_escrow_contract`):** On Employer approval, set `escrow_status = 'released'`, credit 90% (`net_talent_minor`) to `wallet_transactions`, record 10% (`platform_fee_minor`), award EXP + tier promotion, grant a `skill_badge`, and mint a verifiable `certificates` record atomically.

---

## 6. MANDATORY QUALITY & PHASED DELIVERY PLAN
- Implement explicit **Loading** (layout-matched sage skeletons), **Empty** (reason + 1 CTA), and **Error** (human message + Retry button) states on every data-driven screen.
- If seeding demo users/projects for initial testing, show a clear, dismissible `Demo Workspace` badge.
- Execute sequentially:
  - **Phase 1:** Bind `DESIGN.md` tokens (Light & Dark WCAG AA), `en`/`id` i18n, currency formatter, Gateway screen, and responsive 3-state AppShell (exact 4-tab mobile nav + collapsible desktop sidebar) + PWA manifest.
  - **Phase 2:** PostgreSQL schema, RLS policies, atomic RPCs (`get_blind_talents`, `unlock_talent_with_token`, `publish_opportunity_with_token`, `release_escrow_contract`), and Auth.
  - **Phase 3:** Talent First Quest, Talent Dashboard (curved olive header + overlapping status + olive wallet), Find Projects, Applications, Wallet, and Public Certificate Verification (`/verify/[code]`).
  - **Phase 4:** Employer Blind Discovery, Token Packs / Premium / Verification Badge billing, My Projects (`+ Create New Project`), and Escrow Contract Funding + Release (Sandbox + PSP adapter).
  - **Phase 5:** Real-time Chat (Locked state + `Riwayat Chat` + split-pane thread + pinned Escrow Bar + opt-in contact sharing), `npm run build` verification, zero TS/console errors, and full click-through QA at `375px`, `768px`, and `1440px` in Light and Dark modes.