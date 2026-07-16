variable "aws_region" {
  description = "AWS region to deploy into. eu-west-3 (Paris) is the default — closer options for Senegal traffic include af-south-1 (Cape Town), which costs more and has fewer services."
  type        = string
  default     = "eu-west-3"
}

variable "project_name" {
  description = "Short project slug used to name/tag resources."
  type        = string
  default     = "permis2-0"
}

variable "instance_type" {
  description = "EC2 instance size running docker-compose (postgres + api + web)."
  type        = string
  default     = "t3.small"
}

variable "root_volume_gb" {
  description = "Root EBS volume size in GB (holds the Postgres data volume too)."
  type        = number
  default     = 30
}

variable "github_repo" {
  description = "GitHub \"org/repo\" allowed to assume the deploy role via OIDC."
  type        = string
  default     = "petaliadmin/permis2.0"
}

variable "allowed_deploy_refs" {
  description = "Git ref patterns (branches) allowed to deploy via GitHub Actions OIDC."
  type        = list(string)
  default     = ["ref:refs/heads/main", "ref:refs/heads/refonte/*"]
}

variable "backup_retention_days" {
  description = "How long DB backups are kept in S3 before automatic deletion."
  type        = number
  default     = 30
}
