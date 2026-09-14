# Parameter *names* are managed by Terraform so `terraform destroy` cleans
# them up, but real secret values are NEVER set here (that would put secrets
# in the .tf source and in the plaintext plan/state diff shown in CI logs).
# Terraform writes "CHANGEME" once; from then on `ignore_changes` means it
# never touches the value again. Set real values with:
#   ../../scripts/aws/set-secrets.sh
# (reads a local, git-ignored .env.aws.prod file and pushes each key).

locals {
  ssm_prefix = "/${var.project_name}/prod"

  # Keep this list in sync with .env.aws.prod / docker-compose.aws.yml — it only
  # governs which CHANGEME placeholders Terraform creates (and cleans up on
  # destroy). Real values are pushed by scripts/aws/set-secrets.sh, and
  # deploy-remote.sh reads the whole /permis2-0/prod path regardless.
  ssm_parameter_names = [
    "dockerhub_username",
    "dockerhub_token",
    "db_user",
    "db_password",
    "db_name",
    "jwt_secret",
    "jwt_expiration",
    "frontend_url",
    "web_url",
    "next_public_api_url",
    "dexchange_api_key",
    "dexchange_sms_sender",
    "smtp_host",
    "smtp_port",
    "smtp_secure",
    "smtp_user",
    "smtp_password",
    "smtp_from_email",
    "smtp_from_name",
    "vapid_public_key",
    "vapid_private_key",
    "vapid_email",
    "payment_live",
    "bictorys_api_url",
    "bictorys_api_key",
    "bictorys_secret_key",
    "payment_country",
  ]
}

resource "aws_ssm_parameter" "app" {
  for_each = toset(local.ssm_parameter_names)

  name        = "${local.ssm_prefix}/${each.value}"
  description = "permis2.0 prod — ${each.value} (set via scripts/aws/set-secrets.sh, not Terraform)"
  type        = "SecureString"
  value       = "CHANGEME"

  lifecycle {
    ignore_changes = [value]
  }
}
