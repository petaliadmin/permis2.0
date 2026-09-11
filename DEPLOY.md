# Guide de déploiement — permis2.0 sur AWS

Ce document liste **toutes** les actions manuelles à faire, dans l'ordre, pour
publier l'application. Tout le code (Terraform, Dockerfiles, workflow GitHub
Actions) est déjà prêt dans le repo — ce guide ne fait qu'exécuter/configurer.

Compte à rebours : ~45-60 min la première fois (dont ~5-10 min d'attente sur
`terraform apply`). Les déploiements suivants sont automatiques (`git push`).

## Vue d'ensemble de l'architecture

```
GitHub Actions (push sur main)
  │
  ├─► build + push images Docker  ──────────►  Docker Hub
  │                                                 │
  └─► déclenche un déploiement via AWS SSM ─────►  EC2 (Ubuntu, sans SSH)
                                                     │  docker compose :
                                                     │   - caddy (:80/:443, HTTPS auto)
                                                     │   - postgres (data sur EBS)
                                                     │   - api   (:3001)
                                                     │   - web   (:3000)
                                                     │
                                                     └─► backup quotidien → S3
```

- **HTTPS** : `www.permis2.com` / `api.permis2.com`, via Caddy (reverse-proxy +
  certificats Let's Encrypt automatiques) — voir section 9.
- **Pas de SSH** : toute administration de l'instance passe par AWS Systems
  Manager (Session Manager / Send Command) — rien à ouvrir sur le port 22.
- **Secrets** : jamais dans le repo ni dans GitHub Actions — stockés chiffrés
  dans SSM Parameter Store, poussés une fois via un script.

Détails techniques (pourquoi ces choix, comment ça marche en interne) :
[`infra/aws/README.md`](infra/aws/README.md). Ce fichier-ci est le parcours
pas-à-pas ; l'autre est la référence.

---

## Checklist

- [ ] 0. Outils et comptes
- [ ] 1. Bootstrap Terraform (état distant)
- [ ] 2. Déployer l'infrastructure AWS
- [ ] 3. Créer un token Docker Hub
- [ ] 4. Renseigner les secrets applicatifs
- [ ] 5. Configurer GitHub Actions
- [ ] 6. Premier déploiement
- [ ] 7. Charger les données initiales
- [ ] 8. Vérifier que tout fonctionne
- [ ] 9. Nom de domaine / HTTPS

---

## 0. Outils et comptes

À installer/créer une seule fois :

| Outil / compte | Pourquoi | Lien |
|---|---|---|
| Terraform ≥ 1.6 | crée les ressources AWS | https://developer.hashicorp.com/terraform/install |
| AWS CLI v2 | pilote Terraform + scripts | https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html |
| Compte AWS actif (facturation OK) | héberge tout | — |
| Compte Docker Hub | héberge les images construites | https://hub.docker.com/signup |
| `jq` (déjà présent sur les runners GitHub, utile aussi en local) | parsing JSON dans les scripts | `apt install jq` / `brew install jq` |

Vérifie que les credentials AWS fonctionnent :
```bash
aws configure          # ou `aws sso login` si tu utilises IAM Identity Center
aws sts get-caller-identity
```

---

## 1. Bootstrap Terraform (état distant)

Crée le bucket S3 + table DynamoDB qui stockeront l'état Terraform (pour ne
jamais le perdre et éviter les écritures concurrentes) :

```bash
cd infra/aws/bootstrap
terraform init
terraform apply
terraform output
```
→ note les valeurs `state_bucket` et `lock_table`.

---

## 2. Déployer l'infrastructure AWS

```bash
cd ..    # infra/aws/
terraform init \
  -backend-config="bucket=<state_bucket de l'étape 1>" \
  -backend-config="dynamodb_table=<lock_table de l'étape 1>"

terraform plan     # relis la liste des ressources avant de payer quoi que ce soit
terraform apply
terraform output
```

Ceci crée : l'instance EC2 + IP élastique, le security group (ports 3000/3001
ouverts, rien d'autre), les rôles IAM (instance + rôle OIDC pour GitHub
Actions), le bucket S3 de backups, et les 19 paramètres SSM (vides, à remplir
à l'étape 4).

Si ton repo GitHub n'est pas `petaliadmin/permis2.0`, adapte avant d'appliquer :
```bash
terraform apply -var="github_repo=ton-org/ton-repo"
```

Note les sorties : `public_ip`, `instance_id`, `backups_bucket`,
`github_deploy_role_arn`, `ssm_parameter_prefix`. Tu en as besoin pour la
suite — garde ce terminal ouvert ou refais `terraform output` plus tard.

---

## 3. Créer un token Docker Hub

Sur https://hub.docker.com/settings/security → **New Access Token** (pas ton
mot de passe de compte). Donne-lui un nom (`permis2.0-ci`) et le scope
**Read & Write**. Copie le token immédiatement (il ne sera plus affiché).

Par défaut, les deux repos (`<user>/permis2-0-api`, `<user>/permis2-0-web`)
seront créés **publics** au premier push. Pour les rendre privés à la place,
crée-les manuellement dans Docker Hub avant l'étape 6, en cochant *Private*.

---

## 4. Renseigner les secrets applicatifs

```bash
cd ../..    # racine du repo
cp scripts/aws/.env.aws.prod.example .env.aws.prod
```

Édite `.env.aws.prod` (jamais commité — voir `.gitignore`) :

- `DOCKERHUB_USERNAME` / `DOCKERHUB_TOKEN` → le token de l'étape 3.
- `DB_PASSWORD`, `JWT_SECRET` → génère des valeurs longues et aléatoires, ex. :
  ```bash
  openssl rand -base64 32
  ```
- `FRONTEND_URL`, `WEB_URL`, `NEXT_PUBLIC_API_URL` → remplace `CHANGEME` par
  l'IP élastique de l'étape 2 (`terraform output public_ip`), par exemple
  `http://51.44.12.9:3000` / `:3001`.
- `BREVO_API_KEY`, `BICTORYS_API_KEY`, `BICTORYS_SECRET_KEY`, `VAPID_*` →
  tes clés réelles si tu utilises ces services en prod ; laisse vide sinon
  (OTP seulement loggé côté serveur / paiement en mode sandbox). WhatsApp
  nécessite en plus `BREVO_WHATSAPP_TEMPLATE_ID` (template pré-approuvé sur
  Brevo) — sans ça, "whatsapp" part en SMS classique.

Puis pousse tout vers SSM Parameter Store :
```bash
./scripts/aws/set-secrets.sh
```

Relance ce script à chaque fois qu'un secret change — il est idempotent.

---

## 5. Configurer GitHub Actions

Dans GitHub → ton repo → **Settings → Secrets and variables → Actions**.

Onglet **Variables** → **New repository variable**, un par un :

| Nom                   | Valeur                                                        |
|------------------------|----------------------------------------------------------------|
| `AWS_REGION`           | `eu-west-3` (ou la région choisie à l'étape 2)                 |
| `PROJECT_NAME`         | `permis2-0`                                                     |
| `AWS_DEPLOY_ROLE_ARN`  | sortie `github_deploy_role_arn` (étape 2)                       |
| `AWS_INSTANCE_ID`      | sortie `instance_id` (étape 2)                                  |
| `AWS_BACKUPS_BUCKET`   | sortie `backups_bucket` (étape 2)                               |
| `AWS_SSM_PREFIX`       | sortie `ssm_parameter_prefix`, ex. `/permis2-0/prod`            |
| `PUBLIC_APP_URL`       | `https://www.tondomaine.com` (ou `http://<public_ip>` sans domaine) |
| `API_PUBLIC_URL`       | `https://api.tondomaine.com` (ou `http://<public_ip>:3001` sans domaine) |

Onglet **Secrets** → **New repository secret** :

| Nom                   | Valeur                              |
|------------------------|---------------------------------------|
| `DOCKERHUB_USERNAME`  | ton nom d'utilisateur Docker Hub      |
| `DOCKERHUB_TOKEN`     | le token créé à l'étape 3             |

Aucune clé AWS n'est stockée dans GitHub : l'authentification passe par OIDC
(`AWS_DEPLOY_ROLE_ARN` n'est qu'un identifiant de rôle, pas un secret).

---

## 6. Premier déploiement

```bash
git push origin main
```
(ou onglet **Actions** → *Deploy to AWS* → **Run workflow**, si tu veux
déployer une autre branche en test — `refonte/playful-premium` est déjà
autorisée par `allowed_deploy_refs` dans `infra/aws/variables.tf`).

Suis la progression dans l'onglet **Actions** du repo. Le job :
1. build + push les 2 images sur Docker Hub,
2. dépose `docker-compose.aws.yml` + le script de déploiement sur S3,
3. déclenche leur exécution sur l'instance EC2 via `ssm send-command`,
4. attend jusqu'à 5 min et affiche les logs du déploiement distant.

S'il échoue, le message d'erreur du script distant (`scripts/aws/deploy-remote.sh`)
est affiché directement dans les logs du step "Deploy via SSM".

---

## 7. Charger les données initiales

Le schéma de base (tables) est créé automatiquement à chaque déploiement.
Les **données** (catégories, leçons, séries de questions, panneaux, quiz,
diapos) doivent être chargées une fois, manuellement, par sécurité (le script
de seed refuse de tourner si `NODE_ENV=production`) :

```bash
aws ssm start-session --target <instance_id> --region <region>
```

Une fois connecté sur l'instance (invite `sh-4.2$` ou similaire) :
```bash
cd /opt/permis2-0
docker compose -f docker-compose.aws.yml exec -T -u root api \
  sh -c "npx --yes -p ts-node@10.9.2 -p typescript@5.4.2 ts-node prisma/seed.ts"
docker compose -f docker-compose.aws.yml exec -T -u root api \
  sh -c "npx --yes -p ts-node@10.9.2 -p typescript@5.4.2 ts-node prisma/sync-content.ts"
exit
```

Deux pièges rencontrés au premier déploiement greenfield (2026-09-11), d'où la
forme ci-dessus plutôt que `pnpm add -D ... && pnpm run prisma:seed` :
- **`pnpm add -D` échoue dans le conteneur runtime** : `ERR_PNPM_UNEXPECTED_STORE`
  en tant qu'utilisateur `node` (le store a été lié par `root` au build), puis
  `ERR_PNPM_INCLUDED_DEPS_CONFLICT` même en `-u root` (l'image ne contient que
  les deps de prod ; pnpm refuse d'y ajouter des devDependencies). `npx` évite
  le problème — il installe dans son propre cache, jamais dans `node_modules`.
- **`-r tsconfig-paths/register` inutile ici** : `seed.ts` et `sync-content.ts`
  n'utilisent aucun alias `@/...`, seulement `@prisma/client` + imports
  relatifs — l'omettre évite un `MODULE_NOT_FOUND` (npx installe chaque `-p`
  dans un répertoire temporaire que la résolution `-r` ne voit pas depuis
  `/app`). Si un futur script de seed a besoin des alias, résous le chemin
  absolu du module avant de le passer à `-r` :
  `npx --yes -p ts-node@10.9.2 -p typescript@5.4.2 -p tsconfig-paths@4.2.0 node -e "console.log(require.resolve('tsconfig-paths/register'))"`.
- Ne pas figer `ts-node`/`typescript` sur `latest` : un ts-node récent contre
  un TypeScript incompatible plante avec `Cannot read properties of undefined
  (reading 'fileExists')`. Les versions ci-dessus correspondent à celles
  d'`apps/api/package.json` — les mettre à jour ensemble si ce fichier change.

`sync:content` est idempotent — relance-le après chaque mise à jour des JSON
de contenu (ex. `apps/web/public/data/diapos.json`) pour les propager en prod,
sans attendre un nouveau déploiement d'image.

---

## 8. Vérifier que tout fonctionne

```bash
curl -i http://<public_ip>:3001/health      # doit répondre 200
curl -i http://<public_ip>:3000              # doit répondre 200
```

Puis ouvre `http://<public_ip>:3000` dans un navigateur et teste un parcours
(inscription, une série de quiz, un examen diapo).

Si quelque chose ne répond pas :
```bash
aws ssm start-session --target <instance_id> --region <region>
cd /opt/permis2-0 && docker compose -f docker-compose.aws.yml ps
docker compose -f docker-compose.aws.yml logs --tail=100 api
docker compose -f docker-compose.aws.yml logs --tail=100 web
```

---

## 9. Nom de domaine / HTTPS

En place pour `permis2.com` (Caddy en reverse-proxy, HTTPS automatique via
Let's Encrypt) :

- `www.permis2.com` → `web:3000` — site vitrine + annuaire auto-écoles
- `learn.permis2.com` → `web:3000` — espace élève (apprentissage du code)
- `school.permis2.com` → `web:3000` — espace auto-école (gestion)
- `api.permis2.com` → `api:3001`
- `permis2.com` (apex) → redirige vers `https://www.permis2.com`

Les trois hosts front pointent sur **la même** app Next.js : elle lit le header
`Host` dans son middleware pour choisir l'espace (voir
`apps/web/src/lib/space.ts`). La session est partagée : le cookie d'auth est
scopé `.permis2.com` (voir `apps/api/src/auth/auth.controller.ts`), et le CORS
de l'API autorise les trois origines `*.permis2.com` (`apps/api/src/main.ts`).
Aucun changement d'env prod : `NEXT_PUBLIC_API_URL` / `FRONTEND_URL` restent
inchangés.

**DNS requis chez le registrar** (5 enregistrements A, tous vers l'IP
élastique — `terraform output public_ip`) :

| Sous-domaine | Cible |
|---|---|
| *(vide / `@`)* | IP élastique |
| `www` | IP élastique |
| `learn` | IP élastique |
| `school` | IP élastique |
| `api` | IP élastique |

Après ajout des enregistrements `learn` / `school` : redéploie (pousse le
`Caddyfile` mis à jour) puis, une fois le DNS propagé, Caddy émet les
certificats au redémarrage — `docker compose -f docker-compose.aws.yml restart caddy`
si besoin de forcer.

Config Terraform/déploiement : `Caddyfile` (racine du repo) définit les
routes ; `docker-compose.aws.yml` lance le service `caddy` (ports 80/443,
volumes `caddy_data`/`caddy_config` pour persister les certificats entre
redéploiements) ; `.github/workflows/deploy.yml` pousse `Caddyfile` vers S3
comme `docker-compose.aws.yml`.

Pendant la transition DNS, les ports 3000/3001 restent ouverts en direct sur
l'IP (voir le commentaire `TODO` dans `infra/aws/security_group.tf`) pour ne
rien casser si le DNS n'a pas encore propagé. Une fois `https://www.permis2.com`
confirmé fonctionnel :
1. Supprime les deux blocs `ingress` 3000/3001 dans `infra/aws/security_group.tf`
   (et applique).
2. Supprime les lignes `ports: ["3000:3000"]` / `["3001:3001"]` des services
   `web`/`api` dans `docker-compose.aws.yml` (Caddy les joint via le réseau
   Docker interne, pas besoin de les publier).
3. Redéploie.

Pour ajouter un autre domaine plus tard : ajoute un bloc dans `Caddyfile`,
commit, redéploie — Caddy obtient le certificat automatiquement au démarrage.

---

## Opérations courantes (post-déploiement)

**Se connecter à l'instance** (jamais de SSH) :
```bash
aws ssm start-session --target <instance_id> --region <region>
```

**Voir les logs** :
```bash
cd /opt/permis2-0 && docker compose -f docker-compose.aws.yml logs -f api web
```

**Redéployer manuellement sans changement de code** : relancer le workflow
*Deploy to AWS* depuis l'onglet Actions (bouton **Run workflow**).

**Restaurer un backup** (un `.sql.gz` par jour à 3h UTC dans le bucket S3) :
```bash
aws s3 ls s3://<backups_bucket>/backups/
aws s3 cp s3://<backups_bucket>/backups/<fichier>.sql.gz .
gunzip <fichier>.sql.gz
docker compose -f docker-compose.aws.yml exec -T postgres psql -U <db_user> <db_name> < <fichier>.sql
```

**Changer un secret** (clé API, mot de passe...) : édite `.env.aws.prod`,
relance `./scripts/aws/set-secrets.sh`, puis redéploie (le script de
déploiement relit toujours Parameter Store à chaque exécution).

**Tout supprimer** :
```bash
cd infra/aws && terraform destroy
cd bootstrap && terraform destroy   # seulement si tu abandonnes le projet
```

## Limites connues de cette configuration (v1)

- Une seule instance EC2 : pas de haute disponibilité, une panne matérielle
  = downtime le temps de recréer l'instance (`terraform apply` la
  reconstruit, les données survivent sur l'EBS... sauf si l'instance
  elle-même est détruite — d'où les backups S3 quotidiens).
- Postgres tourne en conteneur sur la même machine que l'appli, pas sur une
  RDS managée : plus simple/moins cher, mais pas de failover automatique.
- Pas de migrations Prisma (`db push` uniquement) — un changement de schéma
  destructif nécessite une intervention manuelle plutôt qu'un rollback propre.

Ces choix sont documentés et assumés pour un premier lancement ; la section
"Faire évoluer plus tard" de
[`infra/aws/README.md`](infra/aws/README.md#faire-évoluer-plus-tard) explique
comment les faire évoluer quand le trafic/l'équipe grandira.
