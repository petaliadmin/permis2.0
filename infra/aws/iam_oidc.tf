# Lets GitHub Actions assume an AWS role via short-lived OIDC tokens — no
# long-lived AWS access keys stored as GitHub secrets.
data "tls_certificate" "github" {
  url = "https://token.actions.githubusercontent.com/.well-known/openid-configuration"
}

resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.github.certificates[0].sha1_fingerprint]
}

data "aws_iam_policy_document" "github_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = [for r in var.allowed_deploy_refs : "repo:${var.github_repo}:${r}"]
    }
  }
}

resource "aws_iam_role" "github_deploy" {
  name               = "${var.project_name}-github-deploy"
  assume_role_policy = data.aws_iam_policy_document.github_trust.json
}

# Images are pushed to Docker Hub (not ECR) — see .github/workflows/deploy.yml,
# which logs in with DOCKERHUB_USERNAME/DOCKERHUB_TOKEN GitHub secrets. This
# role therefore only needs SSM (to trigger the remote deploy) and S3 (to hand
# off the compose file + deploy script to the instance).

data "aws_iam_policy_document" "github_deploy_ssm" {
  statement {
    sid    = "SendCommand"
    effect = "Allow"
    actions = [
      "ssm:SendCommand",
    ]
    resources = [
      aws_instance.app.arn,
      "arn:aws:ssm:${var.aws_region}::document/AWS-RunShellScript",
    ]
  }
  statement {
    sid    = "ReadCommandResult"
    effect = "Allow"
    actions = [
      "ssm:GetCommandInvocation",
      "ssm:ListCommandInvocations",
    ]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "github_deploy_ssm" {
  name   = "ssm-deploy"
  role   = aws_iam_role.github_deploy.id
  policy = data.aws_iam_policy_document.github_deploy_ssm.json
}

# So the deploy step can upload docker-compose.aws.yml + the deploy script
# for the instance to fetch (see s3_backups.tf's deploy/ prefix note).
data "aws_iam_policy_document" "github_deploy_s3" {
  statement {
    effect  = "Allow"
    actions = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.backups.arn}/deploy/*"]
  }
}

resource "aws_iam_role_policy" "github_deploy_s3" {
  name   = "s3-deploy-artifacts"
  role   = aws_iam_role.github_deploy.id
  policy = data.aws_iam_policy_document.github_deploy_s3.json
}
