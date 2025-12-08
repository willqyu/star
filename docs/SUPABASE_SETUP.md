# Supabase Setup Guide

This guide will help you set up Supabase for your Personal CRM application.

## Table of Contents

1. [Creating a Supabase Project](#creating-a-supabase-project)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [Authentication Configuration](#authentication-configuration)
5. [Storage Configuration](#storage-configuration)
6. [Verification](#verification)

---

## Creating a Supabase Project

### Step 1: Sign Up / Log In

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"** or log in if you already have an account
3. You'll need a GitHub account or email to sign up

### Step 2: Create a New Project

1. Click **"New Project"** or the **+** icon
2. Enter a **Project Name** (e.g., "personal-crm")
3. Enter a **Database Password** (save this securely)
4. Select a **Region** closest to you or your users
5. Click **"Create new project"**

The project will take a few minutes to initialize. You'll see a loading screen.

### Step 3: Get Your Credentials

Once the project is ready:

1. Go to **Settings** → **API** on the left sidebar
2. You'll find:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **Anon Key** (starts with `eyJ...`)
   - **Service Role Key** (also starts with `eyJ...`)

Copy these securely.

---

## Environment Configuration

### Create `.env.local` File

In the root of your project, create a `.env.local` file with the following:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxxxxx...
```

Replace the values with your actual credentials from Step 3 above.

**Important:** Never commit `.env.local` to git (it's already in `.gitignore`)

---

## Database Setup

### Step 1: Navigate to SQL Editor

1. In Supabase dashboard, click **SQL Editor** on the left sidebar
2. Click **New Query**

### Step 2: Run the Migration

1. Open the file: `/supabase/migrations/001_init.sql`
2. Copy the entire SQL content
3. Paste it into the Supabase SQL Editor
4. Click **Run** (or press `Cmd+Enter` / `Ctrl+Enter`)

This will:
- Create all 5 tables (contacts, interactions, tasks, cadences, attachments)
- Add indexes for performance
- Enable Row Level Security (RLS)
- Create triggers for `updated_at` timestamps
- Set up RLS policies for user data isolation

### Step 3: Verify Tables

After running the migration:

1. Click **Table Editor** on the left sidebar
2. You should see these tables:
   - `contacts`
   - `interactions`
   - `tasks`
   - `cadences`
   - `attachments`
   - `user_settings`

---

## Authentication Configuration

### Step 1: Enable Email Authentication

1. Go to **Authentication** → **Providers** on the left sidebar
2. Ensure **Email** provider is **Enabled**
3. Click **Email** to expand settings

### Step 2: Configure Email Settings

In the Email provider settings:

- **Autoconfirm users**: OFF (users should confirm their email)
- **Double confirm changes**: ON (for security)
- **Enable signup**: ON

### Step 3: Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Add your redirect URLs:

**For Local Development:**
```
http://localhost:3000/auth/callback
http://localhost:3000/dashboard
```

**For Production (Vercel):**
```
https://yourdomain.com/auth/callback
https://yourdomain.com/dashboard
```

### Step 4: Test Authentication

Create a test user:

1. Go to **Authentication** → **Users**
2. Click **Invite user** or **Add user**
3. Enter an email and temporary password
4. User will appear in the list

---

## Storage Configuration

### Step 1: Create Buckets

1. Go to **Storage** on the left sidebar
2. Click **Create bucket**
3. Name it: `attachments`
4. **Public or Private**: Set to `Private` for security
5. Click **Create**

### Step 2: Configure RLS for Storage

1. Click the **attachments** bucket
2. Click the **...** menu → **Policies**
3. Click **New Policy**
4. Select **For full customization** → **Create policy**

Add this policy (allow users to upload to their own files):

```sql
(bucket_id = 'attachments'::text) AND (auth.uid() IS NOT NULL)
```

This ensures only authenticated users can upload files.

---

## Verification

### Step 1: Test the Database Connection

Run this command from the project root:

```bash
npm install
npm run dev
```

### Step 2: Visit the Application

1. Open [http://localhost:3000](http://localhost:3000)
2. Click **Create Account** or **Get Started**
3. Sign up with an email and password
4. You should be redirected to the dashboard

### Step 3: Verify Features

Try these actions:

- ✅ Create a contact (Dashboard → New Contact)
- ✅ Add an interaction to the contact
- ✅ Create a task
- ✅ Update your settings

If these work, your Supabase setup is complete!

---

## Troubleshooting

### Error: "Supabase key not found"

**Solution:** Check that `.env.local` has the correct keys in the root directory.

### Error: "Row Level Security violation"

**Solution:** Ensure RLS policies were created correctly in the migration. Check the SQL output for any errors.

### Authentication not working

**Solution:** 
- Verify email provider is enabled
- Check that redirect URLs include your current domain
- Test with a temporary password user first

### Tables not appearing

**Solution:**
- Run the migration again in SQL Editor
- Check the SQL for any errors (should show success message)
- Refresh the Table Editor page

### "Permission denied" on operations

**Solution:**
- Ensure you're logged in (check browser cookies)
- RLS policies might be too restrictive
- Check that the user exists in `auth.users`

---

## Next Steps

After setting up Supabase:

1. **Deploy to Vercel**: See `DEPLOYMENT.md`
2. **Set Up Integrations**: See `INTEGRATIONS.md`
3. **Run Scheduled Functions**: See scheduled functions guide

For more help, visit [Supabase Documentation](https://supabase.com/docs)
