import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create client only if env vars are present, otherwise use placeholder
let supabase

if (supabaseUrl && supabaseAnonKey && supabaseUrl !== '' && supabaseAnonKey !== '') {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
} else {
  // Use placeholder values that won't cause errors during build
  // The app will show warnings when trying to use Supabase
  supabase = createClient('https://placeholder.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0')
  
  if (typeof window !== 'undefined') {
    console.warn('⚠️ Supabase not configured. Create .env.local with:')
    console.warn('   NEXT_PUBLIC_SUPABASE_URL=https://iekxxyneoluqzrsrzouu.supabase.co')
    console.warn('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key')
  }
}

export { supabase }

