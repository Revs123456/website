resource "aws_amplify_app" "frontend" {
  name         = "${var.project_name}-${var.environment}-frontend"
  repository   = var.frontend_repo_url
  access_token = var.amplify_github_access_token
  platform     = "WEB_COMPUTE" # Next.js SSR — NOT static "WEB", which would break force-dynamic pages

  build_spec = <<-YAML
    version: 1
    applications:
      - appRoot: frontend
        frontend:
          phases:
            preBuild:
              commands:
                - npm ci
            build:
              commands:
                - npm run build
          artifacts:
            baseDirectory: .next
            files:
              - '**/*'
          cache:
            paths:
              - node_modules/**/*
              - .next/cache/**/*
  YAML

  environment_variables = {
    NEXT_PUBLIC_API_URL = local.backend_api_url
  }

  auto_branch_creation_config {
    enable_auto_build = true
  }

  tags = { Name = "${var.project_name}-${var.environment}-frontend" }
}

resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.frontend.id
  branch_name = "master"

  framework = "Next.js - SSR"
  stage     = "PRODUCTION"

  enable_auto_build = true
}

locals {
  # https:// endpoint once App Runner assigns one — used as the frontend's
  # API base URL. Swap for your custom api.<domain> once DNS is wired up.
  backend_api_url = "https://${aws_apprunner_service.backend.service_url}"
}
