#!/usr/bin/env bash
# Cloud-init: one-time host setup. Runs once at first boot as root.
# Application deployment itself happens later, via SSM Send Command
# (see scripts/aws/deploy-remote.sh), not here.
set -euxo pipefail

apt-get update -y
apt-get install -y --no-install-recommends ca-certificates curl unzip gnupg

# Docker CE + compose plugin (official convenience script — Ubuntu's own
# "docker.io" package doesn't ship the compose v2 plugin used below).
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker

# AWS CLI v2 (Ubuntu's apt package is the outdated v1).
curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip
unzip -q /tmp/awscliv2.zip -d /tmp
/tmp/aws/install
rm -rf /tmp/awscliv2.zip /tmp/aws

# SSM agent ships pre-installed as a snap on Canonical's Ubuntu AMIs; make
# sure it's actually running so this instance shows up in Session Manager.
snap start amazon-ssm-agent || true
snap enable amazon-ssm-agent || true

mkdir -p /opt/${project_name}

# ── Daily Postgres backup → S3 ──────────────────────────────────────────────
cat > /opt/${project_name}/backup-db.sh <<'SCRIPT'
#!/usr/bin/env bash
set -euo pipefail
cd /opt/${project_name}

DB_USER=$(aws ssm get-parameter --name "${ssm_prefix}/db_user" --with-decryption --query Parameter.Value --output text --region ${aws_region})
DB_NAME=$(aws ssm get-parameter --name "${ssm_prefix}/db_name" --with-decryption --query Parameter.Value --output text --region ${aws_region})

STAMP=$(date -u +%Y%m%dT%H%M%SZ)
FILE="/tmp/$${DB_NAME}-$${STAMP}.sql.gz"

docker compose -f docker-compose.aws.yml exec -T postgres pg_dump -U "$${DB_USER}" "$${DB_NAME}" | gzip > "$${FILE}"
aws s3 cp "$${FILE}" "s3://${backups_bucket}/backups/$(basename "$${FILE}")" --region ${aws_region}
rm -f "$${FILE}"
SCRIPT
chmod +x /opt/${project_name}/backup-db.sh

cat > /etc/cron.d/${project_name}-backup <<'CRON'
0 3 * * * root /opt/${project_name}/backup-db.sh >> /var/log/${project_name}-backup.log 2>&1
CRON
chmod 644 /etc/cron.d/${project_name}-backup
