resource "random_password" "db_password" {
  length           = 16
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?" # Supabaseで使える安全な特殊文字
}

# Create a project resource
resource "supabase_project" "development" {
  organization_id   = var.org_id
  name              = var.project_name
  database_password = random_password.db_password.result
  region            = "ap-northeast-1"

  lifecycle {
    ignore_changes = [database_password]
  }
}


# Configure api settings for the linked project
resource "supabase_settings" "development" {
  project_ref = supabase_project.development.id

  api = jsonencode({
    db_schema            = "public,storage,graphql_public"
    db_extra_search_path = "public,extensions"
    max_rows             = 1000
    allowed_origins      = ["http://localhost:3000"]
  })
}

output "supabase_project_ref" {
  value = supabase_project.development.id
}

output "supabase_api_settings_url" {
  value = "https://supabase.com/dashboard/project/${supabase_project.development.id}/settings/api"
}
