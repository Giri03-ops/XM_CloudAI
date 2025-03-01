import { createClient } from "@supabase/supabase-js"

// Replace with your own project URL & anon key
const supabaseUrl = "https://gxrzvatilecofgljafxu.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cnp2YXRpbGVjb2ZnbGphZnh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4MDQyNTEsImV4cCI6MjA1NjM4MDI1MX0.jf1zGNc-4Yck-te8gK2yyemU9FBndnWzkriAskrSZ58"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
