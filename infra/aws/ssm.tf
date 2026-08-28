# SSM Parameter Store (SecureString) instead of Secrets Manager — functionally
# equivalent encryption-at-rest for this use case, but the Standard tier is
# free (Secrets Manager bills ~$0.40/secret/month). No automatic rotation
# here, which is fine — nothing in this app currently needs it, and you can
# always migrate a specific parameter to Secrets Manager later if that changes.
#
# One resource per secret (not a single JSON blob) so App Runner's runtime
# env-var mapping stays simple and each value shows its own name in the
# console instead of everything hiding inside one opaque JSON string.

locals {
  # Matches every key backend/.env currently holds. Add a new line here (and
  # to backend_secrets in your tfvars) the same day you add a new var to .env
  # — keeps this list from silently drifting out of sync with the app.
  secret_keys = [
    "DATABASE_URL",
    "DIRECT_URL",
    "JWT_SECRET",
    "ADMIN_EMAIL",
    "MAIL_FROM",
    "RESEND_API_KEY",
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "ANTHROPIC_API_KEY",
    "VAPID_PUBLIC_KEY",
    "VAPID_PRIVATE_KEY",
    "PUBLIC_SITE_URL",
  ]
}

resource "aws_ssm_parameter" "backend_secret" {
  for_each = toset(local.secret_keys)

  name  = "/${var.project_name}/${var.environment}/${each.value}"
  type  = "SecureString"
  value = lookup(var.backend_secrets, each.value, "CHANGEME-set-in-backend_secrets-tfvar")

  lifecycle {
    # Don't let a `terraform plan` diff on rotated secret values force a
    # redeploy every time — bump these deliberately via `terraform apply`
    # when you actually rotate something (e.g. next time a key leaks and
    # gets rotated, like the Resend key did this session).
    ignore_changes = [value]
  }

  tags = { Name = "${var.project_name}-${var.environment}-${each.value}" }
}

# IAM policy granting App Runner's instance role read access to exactly
# these parameters — least privilege, not a blanket SSM:* grant.
data "aws_iam_policy_document" "apprunner_ssm_read" {
  statement {
    effect    = "Allow"
    actions   = ["ssm:GetParameters", "ssm:GetParameter"]
    resources = [for k in local.secret_keys : "arn:aws:ssm:${var.aws_region}:*:parameter/${var.project_name}/${var.environment}/${k}"]
  }
  statement {
    effect    = "Allow"
    actions   = ["kms:Decrypt"]
    resources = ["*"] # SSM SecureString uses the account's default aws/ssm KMS key
  }
}
