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
docker compose -f docker-compose.aws.yml pull < /dev/null

echo "→ Starting containers"
docker compose -f docker-compose.aws.yml up -d --remove-orphans < /dev/null

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
# --accept-data-loss is required non-interactively: db push refuses to run
# unattended (no TTY under `exec -T`) if the diff would drop/alter columns or
# tables, which is expected here whenever a boutique/schema-shape change
# ships (e.g. the 2026-09 purchases/entitlements -> subscriptions rework).
# ALWAYS back up any table the pending schema diff would drop or alter
# (`docker compose exec -T postgres pg_dump ...`, see DEPLOY.md/runbook)
# before this line runs on a deploy that changes schema.prisma.
#
# `< /dev/null` here (and on every other docker/compose call in this script
# that doesn't deliberately feed its own heredoc) matters because this whole
# script is invoked as `aws s3 cp .../deploy-remote.sh - | bash` — the
# script's own source is bash's stdin. Any child process left attached to
# that same fd (prisma's CLI probes stdin for an interactive
# update/telemetry prompt even with --accept-data-loss) can silently
# swallow the *rest of this script* straight off the pipe before bash gets
# to read it: bash then hits real EOF, exits 0, and everything after that
# child call — including the seed insert below — never runs, with no error
# anywhere. This is exactly what happened on the 2026-09-25 deploy: db push
# printed "Done in 260ms" and the script ended there, clean exit code, and
# the subscription_plans seed silently never executed.
docker compose -f docker-compose.aws.yml exec -T api npx prisma db push --skip-generate --accept-data-loss < /dev/null

# Guards against the class of bug that bit the 2026-07-15 deploy: the
# standard subscription plan catalog (SubscriptionPlan) is only ever created
# by prisma:seed, which doesn't run automatically (by design — see DEPLOY.md
# step 7). A schema/code change can ship without anyone re-running the seed,
# silently leaving the catalog with no plan row at all (STUDENT plans in
# particular gate renewal logic — see SubscriptionService.checkAndRenew).
# Fixed ids + ON CONFLICT DO NOTHING mean this seeds itself once and never
# touches a later manual price/active edit made from the admin UI
# (admin.permis2.com/tarifs-abonnements).
echo "→ Ensuring the standard subscription plan catalog exists"
docker compose -f docker-compose.aws.yml exec -T postgres psql -U "$DB_USER" "$DB_NAME" -v ON_ERROR_STOP=1 <<'SQL'
INSERT INTO subscription_plans (id, type, title, description, "priceXof", "durationDays", active, ordre, "createdAt", "updatedAt")
VALUES
  (
    'seed-student-annuel',
    'STUDENT',
    'Abonnement Annuel',
    'Accès illimité à toutes les séries, examens blancs et cours de conduite pendant 1 an.',
    2900,
    365,
    true,
    1,
    now(),
    now()
  ),
  (
    'seed-school-annuel',
    'SCHOOL',
    'Abonnement École — Annuel',
    'Accès à l''espace de gestion auto-école pendant 1 an.',
    12000,
    365,
    true,
    10,
    now(),
    now()
  ),
  (
    'seed-school-featured-semaine',
    'SCHOOL_FEATURED',
    'Forfait Top 20 — 1 semaine',
    'Mise en avant de l''auto-école dans le Top 20 de la page d''accueil pendant 1 semaine.',
    5000,
    7,
    true,
    11,
    now(),
    now()
  )
ON CONFLICT (id) DO NOTHING;
SQL

echo "→ Pruning old images"
docker image prune -f < /dev/null

echo "✓ Deploy complete"
