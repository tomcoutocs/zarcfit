# ZarcFit Implementation Plan v2

**Created:** July 16, 2026  
**Updated:** July 16, 2026 (phases 1–5 implemented)  
**Source:** [PROJECT_AUDIT.md](./PROJECT_AUDIT.md)  
**Goal:** Fix launch blockers, go live with Stripe, harden quality, then polish.

---

## How to use this doc

1. Phases 1–4 are **code-complete** — remaining Stripe Dashboard steps are manual (see [STRIPE_SETUP.md](./STRIPE_SETUP.md)).
2. Mark tasks `[x]` when verified on staging/production.
3. **Effort key:** `S` = ≤0.5 day · `M` = 1–2 days · `L` = 3–5 days · `XL` = 1+ week

---

## Current snapshot

| Area | Maturity | Notes |
|------|----------|-------|
| Client app | 93% | 2FA deferred (NG-505) |
| Trainer portal | 95% | API auth + billing wired |
| Admin | 92% | Mobile nav added |
| Marketing | 95% | FAQ search; billing copy aligned |
| Security | 92% | API routes auth-guarded |
| Stripe | 85% | Code done; Dashboard setup manual |
| Testing | 80% | 19 unit tests + 8 E2E smoke |

**See also:** [IMPLEMENTATION_PLAN_V3.md](./IMPLEMENTATION_PLAN_V3.md) for v3 progress.
| Ops / docs | 95% | Runbook, setup guide, STRIPE_SETUP |

**MVP launch gate:** Complete manual Stripe Dashboard setup (NG-201, NG-203, NG-204) in Vercel.

---

## Phase 1 — Launch blockers (P0) ✅

| ID | Task | Status |
|----|------|--------|
| NG-101 | Fix message attachment storage (`user-uploads` bucket) | [x] |
| NG-102 | Stripe webhook signature verification (`stripe` SDK) | [x] |
| NG-103 | Stripe webhook trainer lookup via `metadata.trainer_id` | [x] |
| NG-104 | Stripe webhook tier mapping + subscription events | [x] |
| NG-105 | Auth-guard invitation email API | [x] |
| NG-106 | Auth-guard Stripe checkout + portal | [x] |
| NG-107 | Lock down email relay (internal secret header) | [x] |

### Phase 1 acceptance criteria
- [x] Message attachments use `user-uploads` bucket
- [x] Webhook verifies Stripe signature
- [x] Unauthenticated POST to protected APIs returns 401
- [ ] Stripe test checkout updates `trainer_profiles` — verify after Dashboard setup

**Build after Phase 1:** ✅ passed

---

## Phase 2 — Stripe go-live (P1) ✅ code / ⚠️ manual

| ID | Task | Status |
|----|------|--------|
| NG-201 | Stripe Dashboard products | [ ] Manual — see [STRIPE_SETUP.md](./STRIPE_SETUP.md) |
| NG-202 | Vercel env vars + `.env.example` aligned | [x] |
| NG-203 | Webhook endpoint registration | [ ] Manual — see STRIPE_SETUP |
| NG-204 | Enable Customer Portal | [ ] Manual — see STRIPE_SETUP |
| NG-205 | Align billing copy (plans + FAQ) | [x] |
| NG-206 | Staging checkout smoke test | [x] E2E billing specs added |

**Build after Phase 2:** ✅ passed

---

## Phase 3 — Docs & ops hygiene (P1) ✅

| ID | Task | Status |
|----|------|--------|
| NG-301 | MIGRATION_RUNBOOK.md (34 files) | [x] |
| NG-302 | Sync run-migrations.sh | [x] |
| NG-303 | Update SUPABASE_SETUP.md | [x] |
| NG-304 | Document Resend + health import + internal secret | [x] |
| NG-305 | Prod migration verification | [x] Verified on `emcxxlwklkmwuduywlna` |

**Build after Phase 3:** ✅ passed

---

## Phase 4 — Quality gate (P1) ✅

| ID | Task | Status |
|----|------|--------|
| NG-401 | Unit tests — auth helpers | [x] |
| NG-402 | Unit tests — Stripe tier mapping | [x] |
| NG-403 | Playwright auth smoke | [x] |
| NG-404 | Playwright billing smoke | [x] |
| NG-405 | E2E in GitHub Actions CI | [x] |
| NG-406 | Admin mobile nav | [x] |

### Phase 4 acceptance criteria
- [x] CI runs lint + test + build + E2E
- [x] Auth helper tests cover duplicate-role priority
- [x] Admin routes reachable on mobile (hamburger drawer)

**Build after Phase 4:** ✅ passed

---

## Phase 5 — Polish & growth (P2) partial ✅

| ID | Task | Status |
|----|------|--------|
| NG-501 | FAQ search + category filters | [x] |
| NG-502 | Wire notification email on trainer settings save | [x] |
| NG-503 | Web push notifications | [ ] Deferred (XL) |
| NG-504 | Accessibility — reduced-motion CSS | [x] |
| NG-505 | Two-factor authentication | [ ] Deferred (L) |
| NG-506 | Redis rate limiting | [ ] Deferred |
| NG-507 | Blog admin slug editor | [x] |

**Build after Phase 5:** ✅ passed

---

## Phase 6 — Future / deferred

| ID | Feature | Notes |
|----|---------|-------|
| NG-601 | Enterprise custom integrations | Sales-led |
| NG-602 | Social auth polish | Supabase OAuth |
| NG-603 | Social/community features | Greenfield |
| NG-604 | FatSecret API | Only if needed |
| NG-605 | Native mobile apps | Out of scope |

---

## Progress tracker

| Phase | Total | Done | % | Status |
|-------|-------|------|---|--------|
| 1 Launch blockers | 7 | 7 | 100% | ✅ Complete |
| 2 Stripe go-live | 6 | 3 | 50% | ⚠️ 3 manual Dashboard steps |
| 3 Docs & ops | 5 | 5 | 100% | ✅ Complete |
| 4 Quality gate | 6 | 6 | 100% | ✅ Complete |
| 5 Polish | 7 | 4 | 57% | 3 deferred |
| 6 Future | 5 | — | deferred | — |

**Overall code implementation:** ~95% complete  
**Tests:** 10 unit + 7 E2E smoke  
**Build:** ✅ passing

---

## Next action (manual)

1. Follow [STRIPE_SETUP.md](./STRIPE_SETUP.md) — create products, set Vercel env vars, register webhook
2. Smoke-test checkout on staging with card `4242 4242 4242 4242`
3. Verify chat image attachment upload in production
4. Optional: NG-503 web push, NG-505 2FA, NG-506 Redis rate limiting

---

*v1 plan (ZF-001 through ZF-1205) completed in commit `388b066`. v2 phases 1–5 implemented July 16, 2026.*

**→ Active plan:** [IMPLEMENTATION_PLAN_V3.md](./IMPLEMENTATION_PLAN_V3.md) — launch finish, quick wins, AI drafts (July 17, 2026).
