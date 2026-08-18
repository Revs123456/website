# Pending Items — Fix Later

Last updated: 2026-04-16

---

## ✅ Completed Before Launch

- Razorpay live keys set in Render ✓
- Resend API key + domain verified ✓
- MAIL_FROM set in Render ✓
- Admin account exists in DB ✓
- WhatsApp number updated to +917671008062 ✓
- Google Analytics ID set (G-TWWHBWH45K) ✓
- API URL set in Vercel ✓
- Payment price validated from DB (not from client) ✓
- Slot booking requires payment verification ✓
- Unbook endpoint protected with JWT ✓
- Rate limiting on login (20 attempts / 15 min) ✓
- Security headers (Helmet, CSP) ✓
- Admin login working ✓
- All alert() replaced with inline error banners ✓
- SEO: sitemap, robots.txt, metadata, JSON-LD ✓
- Social media links updated ✓
- Email updated to connectwithrev@gmail.com ✓
- Google Search Console verified + sitemap submitted ✓
- TypeORM synchronize: false in production, Prisma migrations wired ✓
- LoginDto class-validator decorators fixed ✓
- ValidationPipe whitelist: true re-enabled ✓
- JWT stored in HttpOnly cookie (S3) ✓
- CSRF token protection on write endpoints (S4) ✓
- Supabase DB password rotated (S1) ✓
- JWT refresh token rotation — 15 min access + 30 day refresh (S5) ✓
- Pagination on jobs, blogs, courses, orders, subscribers (F1) ✓
- Loading skeletons on all admin pages (U1) ✓
- Audit logging: all authenticated write actions logged to DB (U3) ✓
- Admin Manage pages (testimonials, admins) fixed for cookie-based auth ✓
- API versioning — all routes now under /v1/ prefix (U4) ✓
- Admin audit log viewer page with pagination (U3b) ✓
- Slot "already taken" returns user to slot picker with refreshed slots (U2) ✓
- Admin logout now calls /auth/logout to clear cookies + invalidate refresh token ✓
- All hardcoded values moved to DB settings (social links, JWT TTLs, hero text, feature flags) ✓
- Announcement banner, maintenance mode, feature flags — all DB-driven ✓

---

## 🔴 Security — Fix Soon

- [ ] **S2. Scrub git history**
  - Old .env with credentials is in git history
  - Fix: Run BFG Repo-Cleaner (see instructions below)
  - Priority: before making repo public / sharing repo link

---

## 🟡 Low Priority — Fix Later

- [ ] **P1. Pagination settings unused at runtime**
  - `pagination_default_limit` / `pagination_max_limit` are seeded to DB but controllers still use hardcoded `take: 10`
  - Fix: read from settings in each paginated controller

---

## S2 — How to scrub git history (BFG Repo-Cleaner)

```bash
# 1. Download BFG: https://rtyley.github.io/bfg-repo-cleaner/
# 2. Run from project root:
java -jar bfg.jar --delete-files .env
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force
# 3. Tell collaborators to re-clone
```

---

## Notes

- S2 (git history scrub) should be done before the repo becomes more widely shared
- P1 (pagination from DB) is cosmetic — hardcoded limit of 10 works fine for now
