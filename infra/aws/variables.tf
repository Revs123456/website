variable "aws_region" {
  description = "ap-south-1 (Mumbai) — matches your current Supabase region and your user base."
  type        = string
  default     = "ap-south-1"
}

variable "project_name" {
  type    = string
  default = "techchamps"
}

variable "environment" {
  type    = string
  default = "production"
}

# ── Database ─────────────────────────────────────────────────────────────────

variable "db_name" {
  type    = string
  default = "postgres"
}

variable "db_username" {
  type    = string
  default = "techchamps_app"
}

variable "db_password" {
  description = "Set via TF_VAR_db_password env var or a gitignored terraform.tfvars — never commit this."
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "db.t4g.micro is enough to start; bump to .small/.medium if CPU/connections become the bottleneck."
  type        = string
  default     = "db.t4g.micro"
}

variable "db_allocated_storage_gb" {
  type    = number
  default = 20
}

variable "db_multi_az" {
  description = "Automatic failover to a standby in another AZ. Real payments flow through this app — recommended true, but roughly doubles RDS cost. Set false to save money while validating the migration, flip to true before calling this production-ready."
  type        = bool
  default     = false
}

# ── Networking ───────────────────────────────────────────────────────────────

variable "vpc_cidr" {
  type    = string
  default = "10.20.0.0/16"
}

# ── App Runner (backend) ────────────────────────────────────────────────────
# Sourced from an ECR image, not a direct GitHub connection — App Runner's
# GitHub-source mode uses buildpacks/apprunner.yaml, which would mean
# re-encoding the build → migrate → start sequence your Dockerfile already
# gets right, in a second place. A GitHub Actions workflow (provided
# alongside this Terraform) builds that same Dockerfile and pushes to ECR;
# App Runner watches the ECR repo and redeploys on new image pushes.

variable "apprunner_cpu" {
  description = "vCPU, in App Runner's unit string. 1 vCPU is plenty to start for this app's traffic."
  type        = string
  default     = "1 vCPU"
}

variable "apprunner_memory" {
  type    = string
  default = "2 GB"
}

# ── Secrets pushed into SSM Parameter Store ─────────────────────────────────
# Everything the backend currently reads from backend/.env. Passed as one map
# so adding a new secret later is a one-line change, not a new resource block.
# Populate real values via TF_VAR_backend_secrets or a gitignored tfvars file
# — never commit this file with real values filled in.
variable "backend_secrets" {
  description = "Map of env var name -> value for everything backend/.env currently holds."
  type        = map(string)
  sensitive   = true
  default     = {}
}

variable "allowed_origins" {
  description = "CORS — your Amplify frontend URL + custom domain once you have one."
  type        = string
  default     = "http://localhost:3000"
}

# ── Frontend (Amplify) ──────────────────────────────────────────────────────

variable "frontend_repo_url" {
  type = string
}

variable "amplify_github_access_token" {
  description = <<-EOT
    Amplify Hosting needs a GitHub personal access token (repo scope) to pull
    your frontend repo and set up build webhooks. Generate one at
    github.com/settings/tokens, pass via TF_VAR_amplify_github_access_token.
    Not stored anywhere in this repo.
  EOT
  type        = string
  sensitive   = true
}

variable "domain_name" {
  description = "Your apex domain, e.g. techchampsbyrev.in. Leave blank to skip Route 53/ACM and use the default *.amplifyapp.com / *.awsapprunner.com URLs for now."
  type        = string
  default     = ""
}
