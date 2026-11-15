variable "cloudflare_api_token" {
  description = "Cloudflare API Token with permissions for D1, Workers, and Pages"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare Account ID"
  type        = string
}

variable "environment" {
  description = "Deployment environment (e.g., staging, production)"
  type        = string
  default     = "production"
}
