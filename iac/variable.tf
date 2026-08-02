variable "org_id" {
  type = string
}

variable "project_name" {
  type = string
}

variable "supabase_access_token" {
  type      = string
  sensitive = true
}
