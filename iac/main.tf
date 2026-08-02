module "supabase" {
  source = "./module" # あなたが今開いているディレクトリへのパス

  org_id                = var.org_id
  supabase_access_token = var.supabase_access_token
}

output "supabase_project_ref" {
  value = module.supabase.supabase_project_ref
}

output "supabase_api_settings_url" {
  value = module.supabase.supabase_api_settings_url
}
