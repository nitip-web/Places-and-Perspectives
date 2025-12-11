# Supabase Setup Instructions

## Project Details
- **Project Name**: places&perspectives
- **Project ID**: iekxxyneoluqzrsrzouu
- **Project URL**: https://iekxxyneoluqzrsrzouu.supabase.co
- **Region**: ap-south-1

## Environment Variables

Create a `.env.local` file in the project root with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://iekxxyneoluqzrsrzouu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlla3h4eW5lb2x1cXpyc3J6b3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMDA2NTgsImV4cCI6MjA4MDg3NjY1OH0.FaQKbR4NtWgNRamMmFd2LcJ8q78IoLMvZHu4MtFmO-A
```

## Database Setup

✅ **Table Created**: `perspectives`
- Stores user-submitted places and experiences
- Fields: place_name, place_lat, place_lng, writeup, time_of_day, weather, images, created_at, updated_at
- RLS enabled with public read/insert access

## Storage Setup

You need to create a storage bucket manually:

1. Go to https://app.supabase.com/project/iekxxyneoluqzrsrzouu/storage/buckets
2. Click "New bucket"
3. Name: `perspectives`
4. Make it **Public**
5. Click "Create bucket"

Then set up storage policies:
- Allow public uploads
- Allow public reads

## Locations Data

✅ **Created**: `data/all-locations.json`
- Contains 100+ locations with lat/lng coordinates
- Used in the form dropdown for place selection

## Next Steps

1. Create `.env.local` with the credentials above
2. Create the storage bucket as described
3. Test the form submission
4. View saved perspectives in Supabase dashboard

