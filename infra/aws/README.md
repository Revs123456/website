# AWS production infrastructure

Replaces Vercel (frontend) + Render (backend) + Supabase (database) with:

| Layer | Service | Why this one |
|---|---|---|
| Frontend | AWS Amplify Hosting | Native Next.js SSR support — your homepage uses `force-dynamic` and several pages are auth-gated, so a static S3+CloudFront export won't work. Closest AWS equivalent to Vercel's DX. |
| Backend | AWS App Runner | Closest AWS equivalent to Render's DX — point at a container image, get HTTPS + health checks + autoscaling config, way less to wire up than raw ECS+ALB. |
| Database | Amazon RDS for PostgreSQL | No Supabase-style tiny session-mode connection cap, no auto-pause-after-inactivity. Automated backups + PITR on by default, not gated behind a paid tier. |

Verified before you ever run this: `terraform validate` passes cleanly, `npm run build` still succeeds after the `prisma` dependency fix below. **Not verified**: the actual `docker build` — this sandbox couldn't reach the Docker daemon. Run `docker build -t test .` in `backend/` yourself before trusting the CI pipeline's first real deploy.

## What else changed in the repo to make this work

- **`backend/Dockerfile`** — rewritten as a multi-stage build (smaller final image), with two real bugs fixed along the way:
  1. Alpine doesn't ship `bash` by default, but `start:prod` runs `bash start-prod.sh` — added `apk add bash`.
  2. The leaner production stage runs `npm ci --omit=dev`, which would have silently stripped out the `prisma` CLI (`npx prisma migrate deploy` needs it) since it was listed as a `devDependency` despite being required at runtime. Moved to `dependencies` in `package.json` — this is arguably where it belonged regardless of this migration.
- **`backend/.dockerignore`** *(new)* — excludes `node_modules`, `.git`, and explicitly `.env*` as a belt-and-suspenders measure against ever baking a secret into an image layer.
- **`.github/workflows/deploy-backend.yml`** *(new)* — builds that Dockerfile and pushes to ECR on push to `master`. This is what actually triggers App Runner's `auto_deployments_enabled` — App Runner watches the ECR repo, not GitHub directly.
- **`.gitignore`** — added Terraform state/vars patterns. **This matters**: `sensitive = true` on a Terraform variable only hides it from CLI output, *not* from the state file, which stores every resource's full attributes in plaintext by default. Never commit `*.tfstate` or `terraform.tfvars`.

## One-time manual steps (things Terraform genuinely can't automate)

1. **GitHub PAT for Amplify** — generate a classic token with `repo` scope at github.com/settings/tokens, pass it as `amplify_github_access_token`. Amplify's GitHub integration needs this to set up the repo webhook; there's no way to fully automate the OAuth handshake from Terraform.
2. **AWS account + credentials** configured locally for `terraform apply` (`aws configure` or equivalent, with sufficient IAM permissions to create everything in this directory — VPC, RDS, App Runner, Amplify, IAM, ECR, SSM).
3. **GitHub repo secret** — after the first `apply`, copy the `github_actions_deploy_role_arn` output into your GitHub repo's Settings → Secrets → Actions as `AWS_DEPLOY_ROLE_ARN`. The deploy workflow won't run without it.

## Apply order

```bash
cd infra/aws
cp terraform.tfvars.example terraform.tfvars   # fill in real values, this file is gitignored
terraform init
terraform plan     # READ THIS — especially db_password, db_multi_az, and the secret values
terraform apply
```

Then:
1. Copy the `github_actions_deploy_role_arn` output → GitHub repo secret `AWS_DEPLOY_ROLE_ARN`.
2. Push to `master` (or manually trigger the workflow) — this builds and pushes the first backend image to ECR, which App Runner then deploys.
3. Run `npx prisma migrate deploy` once against the new RDS instance if it's a fresh database with no schema yet — `start-prod.sh` does this automatically on every container start, but the very first deploy needs the schema to exist for the health check to pass at all.
4. Point `NEXT_PUBLIC_API_URL` (Amplify env var, already wired to the App Runner output) and test end-to-end before cutting over DNS.

## The Supabase → RDS data migration itself

**Not covered by this Terraform** — moving live customer + payment data is a separate, careful operation, not a `terraform apply`:

1. `pg_dump` the current Supabase database (verify the dump completes and its size looks sane).
2. Restore into the new RDS instance (`pg_restore` or `psql < dump.sql`), against a *test* apply first if possible.
3. Verify row counts and spot-check critical tables (`site_users`, `orders`, `subscriptions`) match between old and new.
4. Only then: update `DATABASE_URL`/`DIRECT_URL` in `backend_secrets`, `terraform apply`, and cut over.

Ask if you want a step-by-step script for this part specifically — it deserves its own careful pass, not a rushed add-on here.

## Single-instance constraint — do not raise past 1 without reading this

`apprunner.tf` explicitly pins `max_size = 1`. Two things in the actual application code assume exactly one running instance:

- `CacheService` (`backend/src/cache/cache.service.ts`) is in-memory — its own doc comment says so. Multiple instances would each have their own inconsistent cache.
- 11 `@Cron(...)` jobs (streak reminders, subscription renewal sweep, daily challenge rollover, etc.) have no distributed locking. Two instances would each fire every cron independently — duplicate reminder emails, potentially duplicate subscription charges.

Don't raise `max_size` above 1 until both are addressed (Redis for the cache, a lock — e.g. a Postgres advisory lock or a Redis-based one — for the crons).

## Cost estimate

Roughly **$50-120/month** depending on `db_multi_az` and App Runner sizing — the NAT Gateway (~$32-35/mo base) is the single line item that surprises people, since it's not "pay for what you use" the way App Runner/RDS mostly are. See the alternative noted in `rds.tf` if you'd rather trade some network isolation for that savings — it wouldn't leave you less secure than the publicly-reachable Supabase pooler you're on today.

## What you get for free that you didn't have before

CloudWatch Logs/Alarms come bundled with every service here (App Runner, RDS, Amplify) — infra-level monitoring with zero extra signup, unlike the current setup where the only way to learn something broke is reading raw platform logs by hand (like this session's Render deploy debugging). Consider adding Sentry on top for application-level error tracking with real stack traces — that's a separate, smaller piece of work.
