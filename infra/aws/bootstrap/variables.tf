variable "aws_region" {
  description = "AWS region for the state bucket/lock table (should match the main stack's region)."
  type        = string
  default     = "eu-west-3"
}

variable "project_name" {
  description = "Short project slug used to name resources."
  type        = string
  default     = "permis2-0"
}
