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
                                                     │   - postgres (data sur EBS)
                                                     │   - api   (:3001)
                                                     │   - web   (:3000)
                                                     │
                                                     └─► backup quotidien → S3
```

- **Pas de domaine pour l'instant** : l'app est accessible via l'IP publique
  (Elastique) de l'instance, ex. `http://51.x.x.x:3000`.
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
- [ ] 9. (Optionnel) Nom de domaine / HTTPS

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
- `TERMII_API_KEY`, `BICTORYS_API_KEY`, `BICTORYS_SECRET_KEY`, `VAPID_*` →
  tes clés réelles si tu utilises ces services en prod ; laisse vide sinon
  (OTP renvoyé en clair / paiement en mode sandbox).

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
| `PUBLIC_APP_URL`       | `http://<public_ip>` — **sans** le port                        |

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
docker compose -f docker-compose.aws.yml exec -T -e NODE_ENV=development api \
  sh -c "pnpm add -D ts-node tsconfig-paths typescript --silent && pnpm run prisma:seed"
docker compose -f docker-compose.aws.yml exec -T api \
  sh -c "pnpm add -D ts-node tsconfig-paths typescript --silent && pnpm run sync:content"
exit
```

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

## 9. (Optionnel) Nom de domaine / HTTPS

Non fait par défaut (choix initial : IP suffisante). Quand tu es prêt :
1. Achète/possède un nom de domaine, crée un enregistrement A vers l'IP
   élastique (`terraform output public_ip`).
2. Ajoute un reverse-proxy (Caddy est le plus simple : HTTPS automatique via
   Let's Encrypt) devant `web:3000` et `api:3001`, exposé sur 80/443.
3. Mets à jour `NEXT_PUBLIC_API_URL` (secret SSM + variable GitHub
   `PUBLIC_APP_URL`) pour pointer vers `https://tondomaine.com/api` (ou un
   sous-domaine `api.tondomaine.com`), puis redéploie.
4. Ouvre les ports 80/443 dans `infra/aws/security_group.tf` (et ferme 3000/3001
   au public si le reverse-proxy est le seul point d'entrée désiré).

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
