resource "cloudflare_d1_database" "mine_imposer_db" {
  account_id = var.account_id
  name       = var.database_name
}
