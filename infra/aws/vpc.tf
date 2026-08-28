# RDS sits in private subnets with no public IP — App Runner reaches it via a
# VPC Connector, which requires a NAT Gateway for the connector's own
# internet-bound traffic (Resend/Razorpay/Anthropic calls) once attached,
# since ALL egress from a VPC-connected App Runner service routes through
# the VPC, not just VPC-internal traffic.
#
# Cost note: this NAT Gateway is ~$32-35/mo base + data processing — it's the
# one piece of this setup that isn't "pay for what you use" at near-zero idle
# cost. If you want to trim it: make RDS publicly_accessible instead (see the
# commented alternative in rds.tf) and drop the VPC connector entirely — that
# matches the security posture you already have today with Supabase's
# publicly-reachable pooler (password + SSL, no private networking), just on
# RDS instead. Defaulting to the more locked-down pattern here since you
# asked for production architecture and real payments flow through this.

data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = "${var.project_name}-${var.environment}-vpc" }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.project_name}-${var.environment}-igw" }
}

# Two public subnets across two AZs — needed for the NAT Gateway and (later)
# an ALB if you ever move the backend off App Runner onto ECS/Fargate.
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = { Name = "${var.project_name}-${var.environment}-public-${count.index}" }
}

# Two private subnets across two AZs — RDS lives here. Two AZs are required
# for the DB subnet group regardless of whether Multi-AZ is actually enabled.
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = { Name = "${var.project_name}-${var.environment}-private-${count.index}" }
}

resource "aws_eip" "nat" {
  domain = "vpc"
  tags   = { Name = "${var.project_name}-${var.environment}-nat-eip" }
}

# Single NAT Gateway (not one per AZ) — the standard cost-saving simplification
# for a project this size. Trade-off: if this NAT's AZ has an outage, private
# subnet egress goes down until it recovers. Acceptable at this scale.
resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id
  tags          = { Name = "${var.project_name}-${var.environment}-nat" }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = { Name = "${var.project_name}-${var.environment}-public-rt" }
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = { Name = "${var.project_name}-${var.environment}-private-rt" }
}

resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# ── Security groups ──────────────────────────────────────────────────────────

resource "aws_security_group" "apprunner_connector" {
  name_prefix = "${var.project_name}-apprunner-"
  description = "Attached to the App Runner VPC Connector"
  vpc_id      = aws_vpc.main.id

  egress {
    description = "All outbound - internet access via NAT (Resend/Razorpay/Anthropic) plus RDS access inside the VPC"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-${var.environment}-apprunner-sg" }
}

resource "aws_security_group" "rds" {
  name_prefix = "${var.project_name}-rds-"
  description = "Postgres - only reachable from the App Runner connector"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Postgres from App Runner only"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.apprunner_connector.id]
  }

  tags = { Name = "${var.project_name}-${var.environment}-rds-sg" }
}
