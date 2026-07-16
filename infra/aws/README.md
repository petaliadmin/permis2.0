# Déploiement AWS — permis2.0

Architecture : une seule instance **EC2** (Ubuntu 22.04) fait tourner exactement
`docker-compose.aws.yml` (postgres + api + web, comme en local), gérée
**sans SSH** via **SSM Session Manager / Send Command**. Les images sont
construites par **GitHub Actions** et poussées sur **Docker Hub**, puis le
déploiement est déclenché à distance via SSM. HTTPS via **Caddy**
(reverse-proxy + certificats Let's Encrypt automatiques) sur
`www.permis2.com` (web) et `api.permis2.com` (API) — voir `../../DEPLOY.md`
section 9 pour la configuration DNS.

Coût approximatif : EC2 t3.small (~15 $/mois) + EBS 30 Go (~3 $/mois) + IP
élastique (gratuite si attachée) + S3 (quelques centimes) + Docker Hub (gratuit
en repos publics, ~5 $/mois pour un repo privé). ~20 $/mois.

Prérequis supplémentaire : un compte [Docker Hub](https://hub.docker.com/) et
un [access token](https://hub.docker.com/settings/security) (pas ton mot de
passe) — *Account Settings → Security → New Access Token*.

## Prérequis (une seule fois, sur ta machine)

- [Terraform](https://developer.hashicorp.com/terraform/install) ≥ 1.6
- [AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- Un compte AWS avec facturation active, et des credentials configurés :
  ```bash
  aws configure   # ou aws sso login si tu utilises IAM Identity Center
  aws sts get-caller-identity   # doit répondre sans erreur
  ```

## 1. Bootstrap — bucket d'état Terraform

```bash
cd infra/aws/bootstrap
terraform init
terraform apply
terraform output
# note state_bucket et lock_table
```

## 2. Déployer l'infrastructure principale

```bash
cd ../    # infra/aws/
terraform init \
  -backend-config="bucket=<state_bucket ci-dessus>" \
  -backend-config="dynamodb_table=<lock_table ci-dessus>"

terraform plan    # relire avant d'appliquer — ça crée des ressources facturées
terraform apply
terraform output
```

Note les valeurs de sortie : `public_ip`, `instance_id`, `backups_bucket`,
`github_deploy_role_arn`, `ssm_parameter_prefix`. Elles servent dans les deux
étapes suivantes.

Si `github_repo` (par défaut `petaliadmin/permis2.0`) ou les branches
autorisées à déployer ne correspondent pas à ton dépôt, ajuste avant
d'appliquer :
```bash
terraform apply -var="github_repo=ton-org/ton-repo" -var='allowed_deploy_refs=["ref:refs/heads/main"]'
```

## 3. Renseigner les secrets (Parameter Store)

```bash
cd ../../   # racine du repo
cp scripts/aws/.env.aws.prod.example .env.aws.prod
# édite .env.aws.prod : mets de vrais secrets (y compris DOCKERHUB_USERNAME /
# DOCKERHUB_TOKEN — l'instance en a besoin pour pull si le repo est privé),
# et remplace CHANGEME par l'IP élastique obtenue à l'étape 2
# (terraform output public_ip) dans FRONTEND_URL / WEB_URL / NEXT_PUBLIC_API_URL
./scripts/aws/set-secrets.sh
```

Ce script pousse chaque valeur dans SSM Parameter Store (`SecureString`) sous
`/permis2-0/prod/...`. `.env.aws.prod` n'est jamais commité (`.gitignore`).

## 4. Configurer GitHub Actions

Dans le dépôt GitHub → **Settings → Secrets and variables → Actions → Variables**,
ajoute (valeurs = sorties Terraform de l'étape 2) :

| Variable               | Valeur                                            |
|------------------------|----------------------------------------------------|
| `AWS_REGION`           | `eu-west-3` (ou ta région)                         |
| `PROJECT_NAME`         | `permis2-0`                                        |
| `AWS_DEPLOY_ROLE_ARN`  | sortie `github_deploy_role_arn`                    |
| `AWS_INSTANCE_ID`      | sortie `instance_id`                               |
| `AWS_BACKUPS_BUCKET`   | sortie `backups_bucket`                            |
| `AWS_SSM_PREFIX`       | sortie `ssm_parameter_prefix` (`/permis2-0/prod`)  |
| `PUBLIC_APP_URL`       | `https://www.permis2.com`                          |
| `API_PUBLIC_URL`       | `https://api.permis2.com`                          |

Ce sont des *variables*, pas des *secrets* (aucune n'est sensible — le rôle
IAM n'est assumable que depuis ce repo via OIDC, et les vrais secrets vivent
dans Parameter Store, jamais dans GitHub).

Puis dans le même écran, onglet **Secrets**, ajoute (ceux-là sont sensibles) :

| Secret               | Valeur                                    |
|----------------------|--------------------------------------------|
| `DOCKERHUB_USERNAME` | ton nom d'utilisateur Docker Hub           |
| `DOCKERHUB_TOKEN`    | l'access token créé plus haut              |

## 5. Déployer

```bash
git push origin main
```

ou depuis l'onglet **Actions** → *Deploy to AWS* → **Run workflow**.

Le workflow : build les images `Dockerfile.api`/`Dockerfile.web` → push sur
Docker Hub → dépose `docker-compose.aws.yml` + le script de déploiement sur S3
→ déclenche leur exécution sur l'instance via `ssm send-command` → attend le
résultat (jusqu'à 5 min) et affiche les logs.

Par défaut les repos Docker Hub créés au premier push sont **publics**. Pour
les rendre privés, crée-les manuellement dans Docker Hub avant le premier
déploiement (`<DOCKERHUB_USERNAME>/permis2-0-api` et `-web`) en cochant
*Private* — l'instance EC2 pull alors avec les identifiants stockés dans
Parameter Store (voir `scripts/aws/deploy-remote.sh`).

## 6. Première initialisation des données

Le schéma Prisma est appliqué automatiquement à chaque déploiement
(`prisma db push` — ce projet n'a pas de dossier `migrations`, voir
`apps/api/prisma/`). Mais les **données** (catégories, leçons, séries,
panneaux, quiz, diapos) ne sont pas seedées automatiquement en prod par
sécurité (`seed.ts` refuse de tourner si `NODE_ENV=production`). À faire une
seule fois après le tout premier déploiement, via Session Manager :

```bash
aws ssm start-session --target <instance_id> --region <region>
# une fois connecté sur l'instance :
cd /opt/permis2-0
docker compose -f docker-compose.aws.yml exec -T -e NODE_ENV=development api \
  sh -c "pnpm add -D ts-node tsconfig-paths typescript --silent && pnpm run prisma:seed"
docker compose -f docker-compose.aws.yml exec -T api \
  sh -c "pnpm add -D ts-node tsconfig-paths typescript --silent && pnpm run sync:content"
```

(`sync:content` est idempotent — tu peux le relancer après chaque mise à jour
des JSON de contenu comme `apps/web/public/data/diapos.json`.)

## Opérations courantes

**Se connecter à l'instance** (pas de SSH — tout passe par SSM) :
```bash
aws ssm start-session --target <instance_id> --region <region>
```

**Voir les logs applicatifs** :
```bash
cd /opt/permis2-0 && docker compose -f docker-compose.aws.yml logs -f api web
```

**Restaurer un backup** (`backups/*.sql.gz` dans le bucket S3, un par jour à 3h UTC) :
```bash
aws s3 cp s3://<backups_bucket>/backups/<fichier>.sql.gz .
gunzip <fichier>.sql.gz
docker compose -f docker-compose.aws.yml exec -T postgres psql -U <db_user> <db_name> < <fichier>.sql
```

## Faire évoluer plus tard

- **RDS managée** : si la base grossit, migrer `postgres` du compose vers une
  instance RDS séparée retire un point de défaillance unique et automatise les
  sauvegardes — mais ajoute un coût et de la complexité réseau (VPC/subnets).
- **Migrations Prisma** : introduire un dossier `prisma/migrations` et passer
  de `db push` à `migrate deploy` avant que le schéma ne devienne trop
  volumineux à gérer sans historique.

## Tout supprimer

```bash
cd infra/aws
terraform destroy
cd bootstrap
terraform destroy   # seulement si tu abandonnes le projet pour de bon
```
