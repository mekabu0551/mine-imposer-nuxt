module "d1" {
  source        = "./modules/d1"
  account_id    = var.cloudflare_account_id
  database_name = "mine-imposer-db-${var.environment}"
}
