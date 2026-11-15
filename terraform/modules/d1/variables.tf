variable "account_id" {
  description = "Cloudflare Account ID"
  type        = string
}

variable "database_name" {
  description = "Name of the D1 database"
  type        = string
  default     = "mine-imposer-db"
}
