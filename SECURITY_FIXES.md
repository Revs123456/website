# Security Vulnerabilities — Fix Before Production

Last audited: 2026-04-01
Status: PENDING

---

## 🔴 CRITICAL (8)

- [x] **1. Hardcoded DB password in source code**
  - File: `backend/src/app.module.ts` lines 49-53
  - Fix: Removed all hardcoded fallback credentials. Throws error on startup if DB env vars missing.
  - ⚠️ ACTION REQUIRED: Rotate Supabase password — old password is in git history.

- [x] **2. `.env` committed to git with real credentials**
  - File: `backend/.env`
  - Fix: `.env` is not tracked (confirmed via git ls-files). Created `backend/.env.example`.
  - ⚠️ ACTION REQUIRED: Run BFG Repo-Cleaner to scrub old commits from git history.

- [x] **3. Weak JWT secret fallback**
  - File: `backend/src/auth/auth.service.ts` line 39
  - Current: `process.env.JWT_SECRET || 'tch-jwt-secret'`
  - Fix: Remove fallback. Throw error on startup if `JWT_SECRET` not set. Use 32+ char random string.

- [x] **4. Payment endpoints have no authentication**
  - Note: Payment endpoints kept public (required for user booking flow). Protected by HMAC signature (#verify) and valid order_id lookup (#create-order). JWT guard added to unbook instead (see #6).

- [x] **5. Payment amount comes from request body — price manipulation**
  - File: `backend/src/payments/payments.service.ts`
  - Fix: Server now hardcodes ₹500 slot price. Client-provided amount is ignored.

- [x] **6. `POST /slots/:id/unbook` is public — anyone can cancel any booking**
  - File: `backend/src/slots/slots.controller.ts`
  - Fix: Added `@UseGuards(JwtAuthGuard)` to unbook endpoint.

- [ ] **7. SSL certificate verification disabled**
  - File: `backend/src/app.module.ts` line 56
  - Note: Left as `rejectUnauthorized: false` — required for Supabase connection pooler. Not fixable without Supabase config changes.

- [x] **8. Slot booking does not verify payment was completed**
  - File: `backend/src/slots/slots.service.ts`
  - Fix: `book()` now requires `order_id` and verifies `payment_status === 'paid'` before confirming booking.

---

## 🟠 HIGH (10)

- [x] **9. No rate limiting on login endpoint — brute force possible**
  - File: `backend/src/auth/auth.controller.ts`
  - Fix: Installed `@nestjs/throttler`. Global limit 30 req/min; login endpoint limited to 5 attempts per 15 min.

- [x] **10. Admin management endpoints have no auth guard**
  - File: `backend/src/auth/auth.controller.ts`
  - Endpoints: `GET /auth/admins`, `POST /auth/create-admin`, `DELETE /auth/admins/:id`
  - Fix: Add `@UseGuards(JwtAuthGuard)` to all three endpoints.

- [x] **11. `GET /orders` and `GET /orders/:id` are publicly accessible**
  - File: `backend/src/orders/orders.controller.ts`
  - Fix: Added `@UseGuards(JwtAuthGuard)` to GET / and GET /:id. Also removed guard from POST (needed for public order creation).

- [x] **12. `GET /subscribers` is publicly accessible — full email list exposed**
  - File: `backend/src/subscribers/subscribers.controller.ts`
  - Fix: Added `@UseGuards(JwtAuthGuard)` to GET /subscribers.

- [ ] **13. JWT token stored in `localStorage` — vulnerable to XSS**
  - File: `frontend/src/app/login/page.tsx` lines 41-42
  - Fix: Switch to HttpOnly + Secure cookies. Set from backend response. Remove localStorage usage.

- [x] **14. No DTO validation — attacker can set `status: confirmed` on orders**
  - File: `backend/src/orders/dto/create-order.dto.ts`
  - Fix: Added `class-validator` decorators. Global `ValidationPipe` with `whitelist: true` in `main.ts`. `status` field removed from DTO entirely.

- [x] **15. No request body size limit — server can be crashed with huge payloads**
  - File: `backend/src/main.ts`
  - Fix: Added `express.json({ limit: '1mb' })` and `urlencoded({ limit: '1mb' })`.

- [ ] **16. No CSRF protection**
  - Note: Deferred — requires switching from localStorage to HttpOnly cookies first (see #13). CORS + HMAC signature provides partial protection for now.

- [x] **17. No security headers (Helmet missing)**
  - File: `backend/src/main.ts`
  - Fix: Installed `helmet` package. `app.use(helmet())` added — sets X-Frame-Options, HSTS, X-Content-Type-Options, etc.

- [x] **18. CORS falls back to localhost if `ALLOWED_ORIGINS` not set**
  - File: `backend/src/main.ts`
  - Fix: Throws startup error if `ALLOWED_ORIGINS` not set in production.

---

## 🟡 MEDIUM (6)

- [x] **19. No HTML sanitization on message/text fields — stored XSS risk**
  - File: `backend/src/orders/dto/create-order.dto.ts`
  - Fix: Added `@Transform` decorator that strips all HTML tags from free-text fields before saving.

- [ ] **20. No audit logging — cannot detect who did what**
  - Fix: Log all admin actions (create/update/delete) with admin email, timestamp, and resource ID.

- [x] **21. No server-side email validation on bookings**
  - File: `backend/src/orders/dto/create-order.dto.ts`
  - Fix: Added `@IsEmail()` to `email` and `customer_email` fields. ValidationPipe enforces this globally.

- [ ] **22. All DB queries return full table — no pagination**
  - Fix: Add `skip`/`take` pagination to `findAll()` in orders, jobs, blogs, courses services.

- [x] **23. Error messages leak internal implementation details**
  - Fix: Added global `HttpExceptionFilter` in `main.ts` — internal errors return generic 500 message, no stack traces.

- [x] **24. No HTTPS redirect enforcement**
  - Fix: Helmet adds HSTS header automatically. Render enforces HTTPS at the platform level.

---

## 🟢 LOW (4)

- [x] **25. Missing security headers (CSP, X-Frame-Options, X-Content-Type-Options)**
  - Fix: Helmet on backend. Frontend CSP added in `next.config.ts` (see #28).

- [ ] **26. No JWT refresh token rotation**
  - Fix: Implement short-lived access tokens (15 min) + long-lived refresh tokens (7 days) with rotation. Deferred — complex feature.

- [ ] **27. No API versioning**
  - Fix: Add `/v1/` prefix to all routes. Deferred — breaking change requiring frontend updates.

- [x] **28. No Content Security Policy on frontend**
  - File: `frontend/next.config.ts`
  - Fix: Added CSP + X-Frame-Options + X-Content-Type-Options + Referrer-Policy headers via `headers()` function.

---

## ⚙️ FUNCTIONALITY ISSUES (19) — Fix Before Launch

### Critical
- [x] **F1. `synchronize: true` in TypeORM — can destroy DB data in production**
  - File: `backend/src/app.module.ts` line 55
  - Fix: Change to `synchronize: process.env.NODE_ENV !== 'production'`

- [x] **F2. Missing `@UseGuards(JwtAuthGuard)` on create-admin / delete-admin**
  - File: `backend/src/auth/auth.controller.ts`
  - Fix: Add guard to `POST /auth/create-admin` and `DELETE /auth/admins/:id`

- [x] **F3. Placeholder Razorpay keys (`rzp_test_PLACEHOLDER`) — payments will fail**
  - File: `backend/src/payments/payments.service.ts`
  - Fix: Set real `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in Render environment variables

### High
- [x] **F4. Weak JWT secret fallback `'tch-jwt-secret'`**
  - File: `backend/src/auth/auth.service.ts`
  - Fix: Remove fallback. Set strong `JWT_SECRET` in Render env vars (32+ random chars)

- [ ] **F5. CORS falls back to localhost in production**
  - File: `backend/src/main.ts` line 8
  - Fix: Ensure `ALLOWED_ORIGINS=https://www.techchampsbyrev.in` is set on Render

- [ ] **F6. `NEXT_PUBLIC_API_URL` not set in Vercel**
  - File: `frontend/.env.local`
  - Fix: Add `NEXT_PUBLIC_API_URL=https://tech-career-hub-api.onrender.com` in Vercel env vars

- [ ] **F7. `RESEND_API_KEY` is still placeholder — emails not sending**
  - File: `backend/.env`
  - Fix: Sign up at resend.com, get API key, set `RESEND_API_KEY` in Render env vars

- [ ] **F8. Google Analytics ID is placeholder `G-XXXXXXXXXX`**
  - File: `frontend/.env.local`
  - Fix: Create GA4 property, get real measurement ID, set in Vercel env vars

### Medium — Replace `alert()` with inline error UI in admin pages
- [x] **F9.** `frontend/src/app/admin/jobs/page.tsx`
- [x] **F10.** `frontend/src/app/admin/templates/page.tsx`
- [x] **F11.** `frontend/src/app/admin/community/page.tsx`
- [x] **F12.** `frontend/src/app/admin/courses/page.tsx`
- [x] **F13.** `frontend/src/app/admin/daily-tips/page.tsx`
- [x] **F14.** `frontend/src/app/admin/orders/page.tsx`
- [x] **F15.** `frontend/src/app/admin/subscribers/page.tsx`
- [x] **F16.** `frontend/src/app/admin/interview-questions/page.tsx`
- [x] **F17.** `frontend/src/app/admin/success-stories/page.tsx`
- [x] **F18.** `frontend/src/app/admin/salary-insights/page.tsx`
  - Fix for F9–F18: Replace `alert('...')` with `setError(...)` state shown as inline red banner. Auto-dismiss after 5 seconds.

### Low
- [x] **F19. Newsletter fetch has no error handling — silently fails**
  - File: `frontend/src/components/NewsletterSection.tsx`
  - Fix: Check `res.ok`, show error message if subscription fails

- [x] **F20. `console.error` left in admin pages**
  - Files: bookings, interview-questions, subscribers, daily-tips, salary-insights, templates, success-stories, community pages
  - Fix: Remove `console.error(e)` from all catch blocks in admin pages

---

## Notes

- Priority order: fix CRITICAL → HIGH → MEDIUM → LOW
- Security items 1, 2, 3, 9, 10 are the most exploitable right now
- Security items 4, 5, 8 protect payment integrity — fix before accepting real money
- Functionality items F1–F8 are blockers for a stable production launch
- Rotate Supabase DB password NOW — it is visible in git history
