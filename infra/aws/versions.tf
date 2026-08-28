terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Local state to start. Once this is working, move to a remote backend
  # (S3 + DynamoDB lock table) so state isn't just a file on one laptop —
  # ironic given this whole project started from exactly that problem with
  # backend/.env. Uncomment and fill in once you've created the bucket:
  #
  # backend "s3" {
  #   bucket         = "techchamps-terraform-state"
  #   key            = "aws/terraform.tfstate"
  #   region         = "ap-south-1"
  #   dynamodb_table = "techchamps-terraform-locks"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region
}
