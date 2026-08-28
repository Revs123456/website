# Production Architecture (Target)

Last updated: 2026-08-28
Status: **Decided, not yet built.** No code/infra for this exists yet — everything below is the agreed plan. Current live setup is still Vercel (frontend) + Render (backend) + Supabase (database).

Budget constraint: **₹2,500/month max**, driven the whole design. This is why it's a single EC2 box with containers rather than the "proper" managed-AWS design (Amplify + App Runner + RDS) that was scoped first — see [Superseded design](#superseded-design-infraaws) below.

---

## Summary — what replaces what

| Layer | Today | Target |
|---|---|---|
| Frontend hosting | Vercel | Docker container on EC2 (Next.js), behind Nginx |
| Backend hosting | Render | Docker container on EC2 (NestJS), behind Nginx |
| Database | Supabase (managed Postgres) | Postgres container on the same EC2, EBS-backed |
| File/document storage | *(none yet)* | AWS S3 |
| Secrets | `.env` files per platform | AWS SSM Parameter Store (Standard tier — free) |
| Container registry | *(none)* | Docker Hub (not ECR — avoids needing a paid AWS registry) |
| Reverse proxy / TLS | Handled by Vercel/Render | Nginx + Certbot, on the same EC2 |
| CI/CD | Platform auto-deploy on push | GitHub Actions → build & push to Docker Hub → SSH deploy to EC2 |

Single EC2 instance runs everything via Docker Compose. No managed DB, no NAT Gateway, no load balancer — all were priced out for exceeding the ₹2,500 budget.

---

## Architecture diagram

```
                              ┌─────────────────────────────┐
                              │        GitHub (monorepo)     │
                              │   push to master              │
                              └───────────────┬───────────────┘
                                              │ GitHub Actions
                                              ▼
                              ┌─────────────────────────────┐
                              │         Docker Hub            │
                              │  1 private repo, 2 tags:      │
                              │  backend-latest / frontend-  │
                              │  latest  (free-tier limit)    │
                              └───────────────┬───────────────┘
                                              │ SSH deploy step
                                              │ (docker compose pull && up -d)
                                              ▼
┌───────────────────────────────────────────────────────────────────────────┐
│  EC2 instance (t4g.medium, 4GB RAM, ap-south-1)                            │
│                                                                             │
│   ┌────────────┐   ┌──────────────┐   ┌───────────────┐   ┌────────────┐  │
│   │   Nginx    │──▶│   frontend    │   │    backend     │──▶│  postgres  │  │
│   │ + Certbot  │   │  (Next.js,    │   │   (NestJS,     │   │ (container,│  │
│   │ :80 / :443 │   │   :3000)      │   │    :4001)      │   │  EBS vol)  │  │
│   └────────────┘   └──────────────┘   └───────┬───────┘   └────────────┘  │
│                                                 │                          │
└─────────────────────────────────────────────────┼──────────────────────────┘
                                                  │
                          ┌───────────────────────┼───────────────────────┐
                          ▼                        ▼                       ▼
                  ┌───────────────┐      ┌─────────────────┐    ┌──────────────────┐
                  │   AWS S3       │      │  AWS SSM         │    │  Resend / Razorpay │
                  │  (documents,   │      │  Parameter Store  │    │  (external APIs)   │
                  │  backups)      │      │  (env secrets)     │    │                     │
                  └───────────────┘      └─────────────────┘    └──────────────────┘
```

---

## Components

### EC2 instance
- **Type**: `t4g.medium` (ARM/Graviton — cheaper than x86 equivalent, 2 vCPU / 4GB RAM)
- **Region**: ap-south-1 (Mumbai) — lowest latency to Indian users, matches current Supabase region
- Runs Docker + Docker Compose. All four services below run as containers on this one box.
- No NAT Gateway, no ALB, no VPC Connector — the instance has a public IP directly (same security posture as the current publicly-reachable Supabase pooler: password + TLS, no private networking).

### Docker Compose services
1. **postgres** — official `postgres:16` image, data on an EBS-backed volume mounted into the container. Replaces Supabase entirely; `DATABASE_URL`/`DIRECT_URL` become `postgresql://user:pass@postgres:5432/dbname` (no pgbouncer, no session-mode cap — the exact class of bug that caused the `EMAXCONNSESSION` Render incident goes away because there's no external pooler in the loop).
2. **backend** — existing `backend/Dockerfile` (already fixed this session: multi-stage build, `bash` installed, `prisma` moved to runtime deps, `EXPOSE 4001`). Runs `start-prod.sh` → `prisma migrate deploy` → `node dist/main.js`.
3. **frontend** — new Dockerfile needed (not written yet). Next.js 14 App Router, standalone output mode recommended to keep the image small.
4. **nginx** — reverse proxy, already stubbed at [nginx/nginx.conf](nginx/nginx.conf): routes `/api/*` → backend:4001, everything else → frontend:3000. Still needs: TLS termination (Certbot/Let's Encrypt), and the `docker-compose.yml` that wires these four services together (removed earlier this session, needs to be re-added in this new form).

### S3
Chosen over MinIO — no extra service to run/patch/back up on the same box that's already carrying Postgres + two app containers, and S3's free tier / pay-per-GB cost is negligible at this scale. Two buckets (or two prefixes in one bucket):
- Document/file storage for the app itself (once that feature exists).
- Nightly `pg_dump` backups (see [Backup strategy](#backup-strategy)).

### SSM Parameter Store
Chosen over Secrets Manager purely on cost: Secrets Manager is $0.40/secret/month, which would eat a meaningful slice of a ₹2,500 budget across ~10+ secrets (DB password, JWT secret, Resend key, Razorpay keys, etc.); SSM Standard-tier parameters are free. Trade-off is a slightly less polished rotation UI — acceptable here.

### Docker Hub
Free tier caps out at 1 private repository, which was hit mid-session. Plan: **one private repo, two tags** (`<repo>:backend-latest`, `<repo>:frontend-latest`) rather than paying for a second private repo. Alternative discussed: make the frontend repo public (no secrets in a Next.js client bundle image anyway) and keep backend private — not yet decided between the two.

### GitHub Actions
Existing `.github/workflows/deploy-backend.yml` currently targets ECR — **needs rewriting** for: build → push to Docker Hub (`docker/login-action` + `docker/build-push-action`) → SSH into EC2 (`appleboy/ssh-action` or similar) → `docker compose pull && docker compose up -d`.

### Repos needed
- **GitHub**: 1 (existing monorepo — no split needed)
- **Docker Hub**: 1 private repo, two tags (`backend-latest`, `frontend-latest`) — see above

---

## Backup strategy

No managed-DB automated backups here (that was RDS's job in the superseded design), so this has to be built:
- Cron container or a host cron job runs `pg_dump` against the local Postgres container on a schedule (nightly recommended).
- Dump uploaded to S3 (cheap, versioned/lifecycle-ruled to expire old backups after N days to control cost).
- Not yet implemented — script + cron entry still to be written.

---

## Estimated cost (within the ₹2,500 budget)

| Item | Approx. monthly cost |
|---|---|
| EC2 `t4g.medium` (on-demand, ap-south-1) | ~₹2,150 |
| EBS volume (gp3, ~20-30GB) | ~₹150-200 |
| S3 (documents + backups, low volume) | ~₹20-50 |
| SSM Parameter Store (Standard tier) | Free |
| Data transfer out (low volume) | ~₹20-50 |
| **Total** | **~₹2,350-2,450/month** |

Leaves little headroom — a Reserved Instance or Savings Plan on the EC2 line is the main lever if this needs to come down further later.

---

## What's actually implemented today vs. still to do

**Already done** (earlier this session, still valid for this design):
- `backend/Dockerfile` — multi-stage, `bash` installed, `prisma` in runtime deps, correct `EXPOSE 4001`
- `backend/.dockerignore`
- `backend/prisma/schema.prisma` — `directUrl` split (irrelevant once Postgres is a local container with no pgbouncer in front of it, but harmless to leave)
- `nginx/nginx.conf` — routing stub (no TLS yet)

**Not yet done:**
- `frontend/Dockerfile`
- `docker-compose.yml` (postgres + backend + frontend + nginx) — was removed from the repo earlier this session as a separate cleanup task, needs to be reintroduced in this new form
- Certbot/TLS wiring for Nginx
- EC2 provisioning (Terraform or manual) — instance, security group, EBS volume, IAM instance role scoped to S3 + SSM read
- S3 bucket(s) + lifecycle rules
- SSM parameters for all current `.env` secrets
- `pg_dump` → S3 backup script + cron
- Rewritten `.github/workflows/deploy-backend.yml` for Docker Hub + SSH deploy (and a new frontend workflow)
- One-time Supabase → local-Postgres data migration (`pg_dump` from Supabase, restore into the new container) — same care as any prod data migration: verify row counts on `site_users`, `orders`, `subscriptions` before cutover
- Decision: Docker Hub single-private-repo-two-tags vs. public-frontend-repo

## Superseded design: `infra/aws/`

[infra/aws/](infra/aws/) holds a fuller, "proper" AWS Terraform build (Amplify + App Runner + RDS + ECR + VPC/NAT + SSM + GitHub OIDC) done earlier in the same session, priced at ~$50-120/month (~₹4,300-10,300) — **too expensive for the ₹2,500 budget**, which is why this EC2+Docker Compose design replaced it. That directory has not been deleted or updated to reflect the pivot; it's stale and should either be removed or clearly marked historical before anyone applies it by mistake.
