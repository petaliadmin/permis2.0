# No inbound SSH (port 22) at all — the instance is managed exclusively via
# SSM Session Manager / Send Command, which rides on outbound HTTPS through
# the SSM agent. Nothing to brute-force from the internet.
resource "aws_security_group" "app" {
  name        = "${var.project_name}-app"
  description = "Public web/API access for ${var.project_name}; no SSH ingress (SSM-managed)."
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "HTTP (Caddy - ACME challenge + redirect to HTTPS)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS (Caddy - www.permis2.com / api.permis2.com)"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # TODO once www.permis2.com / api.permis2.com are confirmed working over
  # HTTPS: delete these two and the matching `ports:` lines in
  # docker-compose.aws.yml, so the app is only reachable through Caddy.
  ingress {
    description = "Web (Next.js) - direct IP access, temporary during DNS cutover"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "API (NestJS) - direct IP access, temporary during DNS cutover"
    from_port   = 3001
    to_port     = 3001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-app"
  }
}
