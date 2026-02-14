
const SUPABASE_URL = "https://apoxjfidygtkulxqtqon.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwb3hqZmlkeWd0a3VseHF0cW9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMzkzNzYsImV4cCI6MjA4NjYxNTM3Nn0.PFrNY5KH40P7dHjUGbrUBW7g9rOMs3mZNiq5nG0d-hE";

// Use the global 'supabase' object provided by the CDN script
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
