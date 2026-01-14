import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://tskcxblanrtvzlctpcyd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRza2N4YmxhbnJ0dnpsY3RwY3lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNjI0MjAsImV4cCI6MjA4MjYzODQyMH0.6epAPJdzgxe-pmG-rVtosdbg-dwF5lND6Xd18VgUeU0' // Ganti dengan anon key
);
