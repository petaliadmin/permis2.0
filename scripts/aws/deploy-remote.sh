#!/usr/bin/env bash
# Runs ON the EC2 instance, invoked by GitHub Actions via SSM Send Command.
# Not meant to be run by hand except for debugging (see infra/aws/README.md).
#
# Expects these env vars to already be exported by the caller:
#   IMAGE_NAMESPACE  Docker Hub username/org the images were pushed under
#   IMAGE_TAG        git SHA (or "latest")
#   AWS_REGION       e.g. eu-west-3
#   BACKUPS_BUCKET   S3 bucket holding deploy/docker-compose.aws.yml
#   PROJECT_NAME     e.g. permis2-0
#   SSM_PREFIX       e.g. /permis2-0/prod
#
# Docker Hub credentials (DOCKERHUB_USERNAME/DOCKERHUB_TOKEN) come from SSM
# Parameter Store, same as the rest of the app's secrets.
set -euo pipefail

APP_DIR="/opt/${PROJECT_NAME}"
mkdir -p "$APP_DIR"
cd "$APP_DIR"

echo "→ Fetching docker-compose.aws.yml and Caddyfile"
aws s3 cp "s3://${BACKUPS_BUCKET}/deploy/docker-compose.aws.yml" ./docker-compose.aws.yml --region "$AWS_REGION"
aws s3 cp "s3://${BACKUPS_BUCKET}/deploy/Caddyfile" ./Caddyfile --region "$AWS_REGION"

echo "→ Building .env from SSM Parameter Store ($SSM_PREFIX)"
: > .env
aws ssm get-parameters-by-path \
  --path "$SSM_PREFIX" --with-decryption --region "$AWS_REGION" \
  --query "Parameters[*].[Name,Value]" --output text |
  while IFS=$'\t' read -r name value; do
    key=$(basename "$name" | tr '[:lower:]' '[:upper:]')
    # SSM can't store an empty string — scripts/aws/set-secrets.sh stores a
    # single space as a stand-in; turn it back into "" here.
    [ "$value" = " " ] && value=""
    # Escape backslashes/double-quotes so values with special chars survive
    # round-tripping through the .env file into docker compose.
    printf '%s="%s"\n' "$key" "${value//\"/\\\"}" >> .env
  done
{
  echo "IMAGE_NAMESPACE=${IMAGE_NAMESPACE}"
  echo "IMAGE_TAG=${IMAGE_TAG}"
} >> .env

# shellcheck disable=SC1091
source .env

echo "→ Logging in to Docker Hub"
echo "$DOCKERHUB_TOKEN" | docker login --username "$DOCKERHUB_USERNAME" --password-stdin

echo "→ Pulling images"
docker compose -f docker-compose.aws.yml pull

echo "→ Starting containers"
docker compose -f docker-compose.aws.yml up -d --remove-orphans

echo "→ Waiting for the API to become healthy"
for i in $(seq 1 30); do
  status=$(docker inspect --format '{{.State.Health.Status}}' permis2-0-api-prod 2>/dev/null || echo "starting")
  [ "$status" = "healthy" ] && break
  sleep 2
done
if [ "$status" != "healthy" ]; then
  echo "✗ API did not become healthy in time — check: docker compose -f docker-compose.aws.yml logs api" >&2
  exit 1
fi

echo "→ Applying Prisma schema (db push — this project has no migrations dir)"
docker compose -f docker-compose.aws.yml exec -T api npx prisma db push --skip-generate

# Guards against the class of bug that bit the 2026-07-15 deploy: the
# "abo_annuel" subscription product is only ever created by prisma:seed,
# which doesn't run automatically (by design — see DEPLOY.md step 7). A
# schema/code change can ship without anyone re-running the seed, silently
# leaving the boutique with no product row at all. ON CONFLICT DO NOTHING
# means it seeds itself once and never touches a later manual price/active
# edit made from the admin UI.
echo "→ Ensuring the subscription product exists"
docker compose -f docker-compose.aws.yml exec -T postgres psql -U "$DB_USER" "$DB_NAME" -v ON_ERROR_STOP=1 <<'SQL'
INSERT INTO products (id, sku, title, description, kind, "priceXof", active, ordre, grants, "validityDays", "createdAt", "updatedAt")
VALUES (
  'seed-abo-annuel',
  'abo_annuel',
  'Abonnement Annuel',
  'Accès illimité à toutes les séries, examens blancs et cours de conduite pendant 1 an.',
  'subscription',
  2900,
  true,
  1,
  ARRAY['premium_all'],
  365,
  now(),
  now()
)
ON CONFLICT (sku) DO NOTHING;
SQL

echo "→ Pruning old images"
docker image prune -f

echo "✓ Deploy complete"
