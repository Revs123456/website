output "backend_url" {
  description = "App Runner's default HTTPS endpoint for the backend"
  value       = "https://${aws_apprunner_service.backend.service_url}"
}

output "frontend_default_domain" {
  description = "Amplify's default domain before you attach a custom one"
  value       = aws_amplify_app.frontend.default_domain
}

output "ecr_repository_url" {
  description = "Push backend images here — see .github/workflows/deploy-backend.yml"
  value       = aws_ecr_repository.backend.repository_url
}

output "rds_endpoint" {
  description = "Not internet-reachable — only resolves from inside the VPC (i.e. from App Runner via the connector, or a bastion/VPN if you set one up)"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "database_url_for_ssm" {
  description = "Paste this shape into backend_secrets[\"DATABASE_URL\"] (pooled equivalent doesn't apply here the way it did for Supabase — RDS's own connection limits are generous enough for a single instance, see rds.tf)"
  value       = "postgresql://${var.db_username}:<password>@${aws_db_instance.main.endpoint}/${var.db_name}?sslmode=require"
  sensitive   = true
}
