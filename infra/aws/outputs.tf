output "public_ip" {
  description = "Elastic IP — the app is reachable at http://<this>:3000, the API at http://<this>:3001."
  value       = aws_eip.app.public_ip
}

output "instance_id" {
  value = aws_instance.app.id
}

output "backups_bucket" {
  value = aws_s3_bucket.backups.bucket
}

output "github_deploy_role_arn" {
  description = "Set this as the AWS_DEPLOY_ROLE_ARN GitHub Actions secret/variable."
  value       = aws_iam_role.github_deploy.arn
}

output "ssm_parameter_prefix" {
  value = local.ssm_prefix
}
