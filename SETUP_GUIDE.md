# CodeForge Setup Guide

Complete guide for setting up Supabase database, Google OAuth, and Vercel deployment.

## Table of Contents
1. [Supabase Database Setup](#supabase-database-setup)
2. [Google OAuth Configuration](#google-oauth-configuration)
3. [Vercel Deployment](#vercel-deployment)
4. [Environment Variables](#environment-variables)

---

## Supabase Database Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in project details:
   - **Name**: Your project name (e.g., "codeforge")
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
4. Click "Create new project"

### 2. Database Schema

**Important**: The complete database migration SQL script is available in `DATABASE_MIGRATION.sql`. You can run this in the Supabase SQL Editor to set up all tables, indexes, functions, triggers, and RLS policies.

The main tables are:

- **profiles**: User profile information
- **problems**: Coding problems/challenges
- **problem_lists**: Collections of problems
- **submissions**: User code submissions
- **comments**: Problem discussions
- **notes**: User personal notes for problems
- **bookmarks**: Saved problems/lists
- **user_roles**: User permission roles

### 3. Row Level Security (RLS)

All tables have RLS enabled with the following policies:

- Users can only read/write their own data (submissions, notes, bookmarks)
- Public data (problems, comments, leaderboard) is readable by everyone
- Only authenticated users can create content

### 4. Database Functions

The following functions are created:

```sql
-- Handle new user registration (creates profile + role)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::text, 8)));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

### 5. Auth Settings

In Supabase Dashboard > Authentication > Settings:

1. **Site URL**: Set to your production URL (e.g., `https://yourdomain.com`)
2. **Redirect URLs**: Add your URLs:
   - `http://localhost:5173` (development)
   - `https://yourdomain.com` (production)
   - `https://your-app.vercel.app` (Vercel preview)

3. **Email Templates** (optional): Customize confirmation emails

---

## Google OAuth Configuration

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a project" → "New Project"
3. Enter project name and click "Create"

### 2. Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" user type → "Create"
3. Fill in required fields:
   - **App name**: Your app name
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Add scopes:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
5. Add test users if in testing mode
6. Click "Save and Continue"

### 3. Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Select "Web application"
4. Fill in:
   - **Name**: "CodeForge Web Client"
   - **Authorized JavaScript origins**:
     ```
     http://localhost:5173
     https://yourdomain.com
     https://your-app.vercel.app
     ```
   - **Authorized redirect URIs**:
     ```
     https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
     ```
     (Replace `[YOUR-PROJECT-REF]` with your Supabase project reference)
5. Click "Create"
6. **Save the Client ID and Client Secret**

### 4. Configure Supabase Auth

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable "Google"
3. Enter:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
4. Click "Save"

---

## Vercel Deployment

### 1. Connect Repository

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your Git repository
4. Vercel auto-detects Vite configuration

### 2. Configure Build Settings

Vercel usually auto-detects these, but verify:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3. Environment Variables

Add these in Vercel Project Settings → Environment Variables:

```
VITE_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[your-anon-key]
```

### 4. Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Access your site at the provided URL

### 5. Update Redirect URLs

After deployment, update:

1. **Supabase Auth Settings**:
   - Add Vercel URL to "Redirect URLs"
   - Update "Site URL" to production domain

2. **Google OAuth Console**:
   - Add Vercel URL to "Authorized JavaScript origins"
   - Add Supabase callback URL to "Authorized redirect URIs"

---

## Environment Variables

### Development (.env.local)

Create a `.env.local` file in your project root:

```env
VITE_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[your-anon-key]
```

### Production (Vercel)

Add these environment variables in Vercel dashboard:

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://[YOUR-PROJECT-REF].supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase anon key |

### Finding Your Supabase Keys

1. Go to Supabase Dashboard → Settings → API
2. **Project URL**: This is your `VITE_SUPABASE_URL`
3. **Project API keys** → `anon public`: This is your `VITE_SUPABASE_PUBLISHABLE_KEY`

⚠️ **Never expose your `service_role` key in the frontend!**

---

## Troubleshooting

### Common Issues

#### "Invalid login credentials" error
- Check if email confirmation is required (disable for testing)
- Verify user exists in Supabase Auth dashboard

#### Google OAuth redirect errors
- Verify redirect URLs match exactly (including trailing slashes)
- Check authorized domains in Google Console
- Ensure Supabase callback URL is correct

#### "Row Level Security" errors
- Ensure user is authenticated before CRUD operations
- Check RLS policies allow the intended action
- Verify `user_id` is being set correctly

#### Build failures on Vercel
- Check environment variables are set
- Verify `VITE_` prefix is present (required for client-side access)
- Clear build cache and redeploy

### Useful Commands

```bash
# Local development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Check TypeScript errors
npm run typecheck
```

---

## Security Checklist

- [ ] RLS enabled on all tables
- [ ] Environment variables set (not hardcoded)
- [ ] Service role key never exposed to client
- [ ] HTTPS enabled in production
- [ ] OAuth redirect URLs properly configured
- [ ] Rate limiting implemented for submissions
- [ ] Input validation on all forms

---

## Support

For issues:
1. Check browser console for errors
2. Check Supabase logs (Dashboard → Logs)
3. Verify environment variables are loaded
4. Test with a fresh browser/incognito window
