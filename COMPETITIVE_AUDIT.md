# ZarcFit competitive audit

**Date:** August 3, 2026  
**Compared to:** TrueCoach, Trainerize, Everfit, Hevy Coach  
**Related:** [PROJECT_AUDIT.md](./PROJECT_AUDIT.md) · [TODO.md](./TODO.md)

---

## Verdict

ZarcFit is already a credible **solo-coach** platform: invite-only roster, deep client tracking, two-pane builder, bundled nutrition, messaging, schedule, and AI drafts.

It is **not yet competitive** on native apps, exercise library size, automation, or polished client billing.

**Winning wedge:** TrueCoach-level simplicity with nutrition + adaptive AI **included** — not a Trainerize studio clone.

---

## Feature maturity (internal)

| Area | Status | Evidence |
|------|--------|----------|
| Invite-only coaching loop | Strong | Trainer invite → client accept → roster |
| Program builder | Strong | Two-pane drag/drop + form videos |
| Client workout logging | Strong | Sets/reps/weight + difficulty ratings |
| Nutrition (plans + diary) | Strong | Full + flexible dieting; USDA/OFF search |
| Messaging | Strong | Realtime chat + attachments |
| Schedule / sessions | Strong | Month grid, blocks, paste meeting links |
| AI drafts (workout/meal) | Strong | LLM + rules fallback; vegan checks |
| Progress / sleep / goals | Strong | Charts, photos, sleep graphs |
| Marketing / brand landing | Strong | Hallmark coral landing + blog CMS |
| Platform billing (trainer→ZarcFit) | Partial | Code ready; Stripe Dashboard setup open |
| Client invoicing (Connect) | Partial | Send invoice MVP; no paid/overdue sync |
| SEO | Weak | No sitemap/robots; thin per-page OG |
| Native / PWA apps | Missing | Responsive web only |
| Calendar / Zoom OAuth | Missing | Paste-link only by design for now |
| White-label branded apps | Missing | Competitors charge premium for this |
| Automation / Autoflow | Missing | Everfit/Trainerize differentiator |
| 2FA / web push | Missing | Deferred infra |
| Multi-trainer orgs | Missing | Solo-coach positioning (intentional) |

**Counts:** 9 Strong · 2 Partial · 1 Weak · 6 Missing

---

## Competitor snapshot

Prices/features from public 2026 comparison writeups — approximate; verify before marketing claims.

| Feature | ZarcFit | TrueCoach | Trainerize | Everfit | Hevy Coach |
|---------|---------|-----------|------------|---------|------------|
| Best for | Solo coaches (1:1) | Solo / small teams | Studios + scale | Online / hybrid | Programming-first |
| Entry price (approx) | $29 / 5 clients | ~$19–20 / 5 | Free (1) then ~$9+ | Free (5) then ~$16+ | ~$25+ |
| Workout builder | Yes (dnd + AI) | Yes (clean) | Yes (deep) | Yes + AI | Yes (Hevy library) |
| Native nutrition | Yes (bundled) | Basic / limited | Add-on / MFP | Meals often add-on | No |
| In-app messaging | Yes | Yes | Yes | Yes | Yes |
| Client payments | Connect invoices (MVP) | Integrated (regions) | Yes (add-on) | Stripe add-on | No |
| Branded client app | No | No | Yes (premium) | Logo / colors | Hevy consumer app |
| Automation | No | Limited | Zapier / habits | Autoflow (paid) | No |
| AI program assist | Yes (w/ dietary rules) | No / limited | Limited | Yes | No |
| Exercise library size | ~72 + videos | 1,000+ | 1,000+ | 1,500+ / custom | 1,000+ (Hevy) |
| Native iOS/Android | Web responsive | Yes | Yes | Yes | Yes (Hevy) |

---

## Where you already win

1. **Nutrition bundled, not nickel-and-dimed** — Everfit/Trainerize often charge $30–45/mo add-ons for meal planning. ZarcFit includes full + flexible dieting + food diary.
2. **AI that respects coach judgment** — Draft → preview → critique + regenerate from difficulty ratings + vegan keyword gate.
3. **Invite-only client model** — Matches real PT businesses; no orphan self-signups.
4. **Solo-coach focus** — TrueCoach-like simplicity with deeper nutrition/AI; avoid Trainerize studio sprawl.
5. **0% platform fee on Connect invoices** — Rare trust signal if you keep it (“you keep what you earn”).

---

## Gaps that matter

| Priority | Gap | Vs peers | Move |
|----------|-----|----------|------|
| P0 | Exercise library depth | Peers ship 750–1,500 demos; ZarcFit ~72 | Expand to 300+ with form videos; custom exercises soon |
| P0 | Native client apps / PWA | App Store presence + push | Ship PWA + web push first; native after paid traction |
| P1 | Habit / check-in automation | Everfit Autoflow, Trainerize habits | Weekly check-in forms + streak nudges |
| P1 | Client payment maturity | Recurring packages, overdue status | Finish Connect: subscriptions, paid/overdue on roster |
| P1 | Brand identity clarity | Landing = SaaS; About = Marco personal coaching | Unify: ZarcFit = platform; Marco as founder story |
| P2 | SEO / discovery | Peers rank for “personal trainer software” | sitemap, robots, OG, comparison pages |

---

## How to be unique

Do **not** out-feature Trainerize. Own bets peers under-serve:

1. **Difficulty-aware program adaptation** — You already collect ratings and regenerate weeks. Productize as “Adaptive programming.”
2. **Flexible dieting legality mode** — Macros-only vs full meal plan is a real PT/legal concern. Own that narrative.
3. **Coach workbench, not gym OS** — Refuse multi-location / white-label until forced.
4. **Transparent pricing (no nutrition tax)** — Publish a “real cost” calculator vs Everfit/Trainerize with add-ons.
5. **Session-linked form video teaching** — Every exercise has YouTube form video in-client; double down with coach cues + video in one row.

---

## Recommended focus order

Tracked as `CA-*` in [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md):

1. **CA-001–007** — Finish Stripe launch gate + Connect  
2. **CA-101–104** — Grow exercise library to 300+ with videos  
3. **CA-201–204** — PWA + push notifications  
4. **CA-301–305** — Weekly client check-ins + adherence nudges  
5. **CA-401–405** — Connect payment maturity  
6. **CA-501–506** — Unify brand copy + SEO comparison pages  
7. **CA-601–604** — Productize adaptive programming from difficulty ratings  

---

## Positioning caution

Landing sells ZarcFit as solo-coach software; About still reads like personal coaching for Marco. Pick one primary story — dual messaging confuses paid acquisition and SEO.

---

*Competitor data from public sources · not legal/compliance advice*
