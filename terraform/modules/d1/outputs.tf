output "database_id" {
  description = "The ID of the created D1 database"
  value       = cloudflare_d1_database.mine_imposer_db.id
}

output "database_name" {
  description = "The name of the created D1 database"
  value       = cloudflare_d1_database.mine_imposer_db.name
}
