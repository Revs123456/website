resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment}-db-subnets"
  subnet_ids = aws_subnet.private[*].id
  tags       = { Name = "${var.project_name}-${var.environment}-db-subnets" }
}

resource "aws_db_instance" "main" {
  identifier     = "${var.project_name}-${var.environment}-db"
  engine         = "postgres"
  engine_version = "16"

  instance_class    = var.db_instance_class
  allocated_storage = var.db_allocated_storage_gb
  storage_type      = "gp3"
  storage_encrypted = true

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  multi_az = var.db_multi_az

  # Automated backups + PITR are on by default here — unlike Supabase, this
  # doesn't gate behind a paid tier, it's just a retention window setting.
  backup_retention_period = 7
  backup_window           = "17:00-18:00" # UTC — 22:30-23:30 IST, low-traffic window
  maintenance_window      = "sun:18:00-sun:19:00"

  # Cheap safety net: a final snapshot on deletion instead of silently losing
  # everything if someone runs terraform destroy against the wrong workspace.
  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.project_name}-${var.environment}-final-snapshot"
  deletion_protection       = true

  # RDS's own default max_connections scales with instance size and is far
  # above Supabase's 15-connection session-mode cap that caused the Render
  # incident — no RDS Proxy needed for a single always-on App Runner instance
  # keeping one Prisma pool open. Revisit only if you later move to a
  # many-short-lived-connections workload (e.g. Lambda).

  tags = { Name = "${var.project_name}-${var.environment}-db" }
}

# ── Alternative: skip the VPC/NAT entirely ──────────────────────────────────
# If the ~$35/mo NAT Gateway cost isn't worth it yet, you can make RDS
# reachable directly over the internet instead — same security model
# (password + enforced SSL, no private networking) as your current Supabase
# setup, not a downgrade from what you have today:
#
#   publicly_accessible = true
#   vpc_security_group_ids = [aws_security_group.rds_public.id]  # ingress 0.0.0.0/0:5432, rely on password+SSL
#
# ...and drop apprunner.tf's vpc_connector block + vpc.tf's NAT/private-subnet
# resources. Ask if you want this variant instead — it's a smaller Terraform
# diff than it sounds.
