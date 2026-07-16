# Parameter *names* are managed by Terraform so `terraform destroy` cleans
# them up, but real secret values are NEVER set here (that would put secrets
# in the .tf source and in the plaintext plan/state diff shown in CI logs).
# Terraform writes "CHANGEME" once; from then on `ignore_changes` means it
# never touches the value again. Set real values with:
#   ../../scripts/aws/set-secrets.sh
# (reads a local, git-ignored .env.aws.prod file and pushes each key).

locals {
  ssm_prefix = "/${var.project_name}/prod"

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
    "termii_api_key",
    "termii_sender_id",
    "vapid_public_key",
    "vapid_private_key",
    "vapid_email",
    "payment_live",
    "bictorys_api_url",
    "bictorys_api_key",
    "bictorys_secret_key",
    "payment_country",
    "next_public_api_url",
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
