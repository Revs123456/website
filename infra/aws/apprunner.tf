# ── IAM: two distinct roles App Runner needs ─────────────────────────────────
# 1. "Access role" — lets App Runner's build/deploy machinery pull the image
#    FROM your private ECR repo. Not used by your running app code at all.
# 2. "Instance role" — assumed by the app itself while running; this is what
#    needs the SSM read permissions so it can fetch secrets at startup.

data "aws_iam_policy_document" "apprunner_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["build.apprunner.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "apprunner_tasks_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["tasks.apprunner.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "apprunner_access" {
  name               = "${var.project_name}-${var.environment}-apprunner-access"
  assume_role_policy = data.aws_iam_policy_document.apprunner_assume.json
}

resource "aws_iam_role_policy_attachment" "apprunner_access_ecr" {
  role       = aws_iam_role.apprunner_access.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess"
}

resource "aws_iam_role" "apprunner_instance" {
  name               = "${var.project_name}-${var.environment}-apprunner-instance"
  assume_role_policy = data.aws_iam_policy_document.apprunner_tasks_assume.json
}

resource "aws_iam_role_policy" "apprunner_instance_ssm" {
  name   = "${var.project_name}-${var.environment}-apprunner-ssm-read"
  role   = aws_iam_role.apprunner_instance.id
  policy = data.aws_iam_policy_document.apprunner_ssm_read.json
}

# ── VPC Connector — lets App Runner reach RDS in the private subnets ────────

resource "aws_apprunner_vpc_connector" "main" {
  vpc_connector_name = "${var.project_name}-${var.environment}-connector"
  subnets            = aws_subnet.private[*].id
  security_groups    = [aws_security_group.apprunner_connector.id]
}

# App Runner's own default auto-scaling config allows well more than 1
# instance under load (default max is 25). Left unset, that WOULD eventually
# spin up a second instance under traffic — silently breaking the
# single-instance assumption (duplicate cron firings, split in-memory cache)
# that everything else in this file is built around. This pins it to exactly
# 1 until Redis + distributed locking are in place.
resource "aws_apprunner_auto_scaling_configuration_version" "single_instance" {
  auto_scaling_configuration_name = "${var.project_name}-${var.environment}-single"
  min_size                        = 1
  max_size                        = 1
  max_concurrency                 = 100
}

# ── The service itself ───────────────────────────────────────────────────────

resource "aws_apprunner_service" "backend" {
  service_name = "${var.project_name}-${var.environment}-backend"

  auto_scaling_configuration_arn = aws_apprunner_auto_scaling_configuration_version.single_instance.arn

  source_configuration {
    authentication_configuration {
      access_role_arn = aws_iam_role.apprunner_access.arn
    }
    # Auto-redeploy whenever CI pushes a new image tag to ECR (see
    # .github/workflows/deploy-backend.yml).
    auto_deployments_enabled = true

    image_repository {
      image_identifier      = "${aws_ecr_repository.backend.repository_url}:latest"
      image_repository_type = "ECR"

      image_configuration {
        port = "4001"

        runtime_environment_variables = {
          NODE_ENV        = "production"
          PORT            = "4001"
          ALLOWED_ORIGINS = var.allowed_origins
        }

        # Each maps an env var name the app reads (process.env.X) to the SSM
        # parameter holding its value — App Runner resolves these at
        # container start, nothing sensitive ever sits in this Terraform
        # config or state in plaintext.
        runtime_environment_secrets = {
          for k in local.secret_keys :
          k => aws_ssm_parameter.backend_secret[k].arn
        }
      }
    }
  }

  instance_configuration {
    cpu               = var.apprunner_cpu
    memory            = var.apprunner_memory
    instance_role_arn = aws_iam_role.apprunner_instance.arn
  }

  network_configuration {
    egress_configuration {
      egress_type       = "VPC"
      vpc_connector_arn = aws_apprunner_vpc_connector.main.arn
    }
  }

  health_check_configuration {
    protocol            = "HTTP"
    path                = "/v1/health"
    interval            = 10
    timeout             = 5
    healthy_threshold   = 1
    unhealthy_threshold = 5
  }

  tags = { Name = "${var.project_name}-${var.environment}-backend" }
}
