import { createClient } from "@supabase/supabase-js"

// Replace with your own project URL & anon key
const supabaseUrl = process.env.supabaseUrl || ''
const supabaseAnonKey = process.env.supabaseAnonKey || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
