terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }

  # Bucket/table are intentionally not hardcoded here — they don't exist until
  # bootstrap/ has been applied, and hardcoding an account-specific bucket
  # name would make this file wrong for anyone else who clones the repo.
  # Provide them at init time instead:
  #   terraform init \
  #     -backend-config="bucket=<state_bucket from bootstrap output>" \
  #     -backend-config="dynamodb_table=<lock_table from bootstrap output>"
  backend "s3" {
    key     = "permis2.0/prod/terraform.tfstate"
    region  = "eu-west-3"
    encrypt = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project   = var.project_name
      ManagedBy = "terraform"
      Env       = "prod"
    }
  }
}
