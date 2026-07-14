#!/usr/bin/env bash
# Pushes production secrets from a local, git-ignored env file into SSM
# Parameter Store, under the prefix Terraform created (infra/aws/ssm_parameters.tf).
#
# Usage:
#   cp scripts/aws/.env.aws.prod.example .env.aws.prod   # then fill in real values
#   ./scripts/aws/set-secrets.sh
#
# Re-run any time a secret changes — it's idempotent (--overwrite).
set -euo pipefail

ENV_FILE="${1:-.env.aws.prod}"
PROJECT_NAME="${PROJECT_NAME:-permis2-0}"
AWS_REGION="${AWS_REGION:-eu-west-3}"
PREFIX="/${PROJECT_NAME}/prod"

if [ ! -f "$ENV_FILE" ]; then
  echo "✗ $ENV_FILE not found. Copy scripts/aws/.env.aws.prod.example first." >&2
  exit 1
fi

while IFS='=' read -r key value; do
  # Skip blank lines and comments.
  [ -z "$key" ] && continue
  case "$key" in \#*) continue ;; esac

  param_name=$(echo "$key" | tr '[:upper:]' '[:lower:]')
  echo "→ ${PREFIX}/${param_name}"
  # SSM rejects empty string values outright — store a single space instead;
  # deploy-remote.sh turns a lone space back into "" when building .env.
  [ -z "$value" ] && value=" "
  # --cli-input-json (not --value) — the AWS CLI treats a --value starting
  # with http(s):// or file:// as "fetch this URI for the real value" rather
  # than a literal string, which breaks on secrets/URLs shaped like that.
  payload=$(python -c "import json,sys; print(json.dumps({'Name': sys.argv[1], 'Value': sys.argv[2], 'Type': 'SecureString', 'Overwrite': True}))" "${PREFIX}/${param_name}" "$value")
  aws ssm put-parameter --cli-input-json "$payload" --region "$AWS_REGION" >/dev/null
done < <(grep -v '^\s*$' "$ENV_FILE")

echo "✓ Secrets pushed to Parameter Store under ${PREFIX}"
