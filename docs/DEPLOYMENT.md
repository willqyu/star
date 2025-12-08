# Deployment Guide

This guide covers deploying your Personal CRM to production using Vercel and Supabase.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Prepare Your Repository](#prepare-your-repository)
3. [Deploy to Vercel](#deploy-to-vercel)
4. [Configure Supabase for Production](#configure-supabase-for-production)
5. [Post-Deployment](#post-deployment)
6. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

Before deploying, ensure you have:

1. **GitHub Account** - to host your code repository
2. **Vercel Account** - [vercel.com](https://vercel.com) (free tier available)
3. **Supabase Project** - already set up (see `docs/SUPABASE_SETUP.md`)
4. **Domain Name** (optional) - if you want a custom domain

---

## Prepare Your Repository

### Step 1: Push to GitHub

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit: Personal CRM"

# Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/personal-crm.git
git branch -M main
git push -u origin main
```

### Step 2: Verify Production Readiness

```bash
# Build locally to catch errors
npm run build

# Check for any TypeScript errors
npx tsc --noEmit
```

### Step 3: Update Environment Variables

In your repo, create a `.env.example` file for reference (commit this, NOT `.env.local`):

```env
# .env.example (commit this file)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Optional
NEXT_PUBLIC_SENTRY_DSN=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
SLACK_BOT_TOKEN=
```

```bash
git add .env.example
git commit -m "Add environment variables example"
git push
```

---

## Deploy to Vercel

### Step 1: Connect Repository

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **Import Project**
3. Select **Import Git Repository**
4. Paste your GitHub repo URL and click **Continue**
5. Vercel will analyze your project and auto-detect Next.js

### Step 2: Configure Environment Variables

In the Vercel import dialog:

1. Click **Environment Variables**
2. Add all variables from your `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
   SUPABASE_SERVICE_ROLE_KEY = eyJ...
   ```
3. Click **Deploy**

### Step 3: Build and Deploy

Vercel will:
1. Clone your repository
2. Install dependencies
3. Run `npm run build`
4. Deploy to Vercel's global CDN

This typically takes 2-3 minutes. You'll get a URL like: `https://personal-crm-xxxxx.vercel.app`

### Step 4: Verify Deployment

1. Visit the Vercel URL
2. Test signup/login flow
3. Create a contact and verify data saves
4. Check browser console for errors

---

## Configure Supabase for Production

### Step 1: Update Redirect URLs

In Supabase Dashboard:

1. Go to **Authentication** → **URL Configuration**
2. Update your production redirect URLs:

```
https://your-domain.vercel.app
https://your-domain.vercel.app/auth/callback
https://your-domain.vercel.app/dashboard
```

3. Save

### Step 2: Enable HTTPS

Vercel automatically provides HTTPS. No additional action needed.

### Step 3: Update Supabase Policies

Review RLS policies to ensure they're secure:

```bash
# In Supabase SQL Editor, run:
SELECT * FROM pg_policies WHERE tablename = 'contacts';
```

All policies should include `auth.uid() = user_id` checks.

### Step 4: Set Up Database Backups

In Supabase Dashboard:

1. Go to **Settings** → **Database**
2. Enable **Automatic Backups**
3. Set backup frequency to **Daily**
4. Test backup restoration process

### Step 5: Configure API Rate Limiting

In Supabase Dashboard:

1. Go to **Settings** → **API**
2. Enable **API Key Management**
3. Consider rotating keys periodically

---

## Post-Deployment

### Step 1: Test All Features

- [ ] Sign up with new email
- [ ] Create contact
- [ ] Add interaction
- [ ] Create task
- [ ] Update contact
- [ ] Delete task
- [ ] Update settings

### Step 2: Monitor Logs

**Vercel Logs:**
```bash
vercel logs --prod
```

**Supabase Logs:**
- Dashboard → Settings → Logs

### Step 3: Set Up Email Notifications

If you configured email in integrations:

1. Test sending email
2. Set up email templates
3. Configure bounce handling

### Step 4: Add Custom Domain (Optional)

In Vercel Dashboard:

1. Select your project
2. Go to **Settings** → **Domains**
3. Add your custom domain
4. Follow DNS configuration steps

### Step 5: Create Production Backup Plan

Regular backups are critical:

```bash
# Download Supabase backup locally
npx supabase db pull --schema-only > schema.sql
git add schema.sql
git commit -m "Backup database schema"
```

---

## Monitoring & Maintenance

### Weekly Tasks

- [ ] Check Vercel deployment logs for errors
- [ ] Verify Supabase uptime status
- [ ] Test critical user flows

### Monthly Tasks

- [ ] Review Supabase usage metrics
- [ ] Check for and update dependencies: `npm outdated`
- [ ] Verify scheduled functions (if using crons)
- [ ] Download database backups

### Quarterly Tasks

- [ ] Security audit of RLS policies
- [ ] Update API keys/tokens
- [ ] Performance optimization review
- [ ] Disaster recovery drill

### Commands for Maintenance

```bash
# Check for outdated packages
npm outdated

# Update packages safely
npm update

# Update major versions (with caution)
npm install -g npm-check-updates
ncu -i

# Build and test before pushing
npm run build
npm run test
git push
```

---

## Troubleshooting Deployment

### Deployment Fails During Build

**Solution:**
```bash
# Check build locally
npm run build

# Look for errors in package.json scripts
# Verify all imports are correct
vercel logs --prod
```

### Database Connection Fails

**Solution:**
1. Verify environment variables in Vercel
2. Check Supabase project is running
3. Test connection: `curl <SUPABASE_URL>/rest/v1/contacts?limit=1`

### Authentication Not Working

**Solution:**
1. Verify redirect URLs in Supabase match Vercel domain
2. Check `.env` variables are set
3. Clear browser cookies and try again
4. Check Supabase auth logs

### Performance Issues

**Solution:**
- Check Vercel Analytics: Dashboard → **Analytics**
- Enable caching headers in `next.config.js`
- Optimize database queries
- Use Supabase query optimization tools

---

## Scaling Considerations

As your CRM grows:

### Database

- Monitor Supabase storage usage
- Archive old data if needed
- Add database indexes for large tables
- Consider read replicas for high traffic

### Functions

- Supabase Edge Functions scale automatically
- Monitor function execution time
- Optimize queries for better performance

### Frontend

- Vercel automatically scales
- Use ISR (Incremental Static Regeneration) for better performance
- Implement image optimization with `next/image`

### Monitoring

```bash
# Set up monitoring alerts
# Vercel Dashboard → Settings → Alerts

# Monitor database performance
# Supabase Dashboard → Settings → Database → Performance
```

---

## Rollback Procedure

If deployment fails:

```bash
# Revert to previous commit
git log --oneline
git revert <commit-hash>
git push

# Vercel automatically redeploys from git push
# Or manually trigger in Vercel Dashboard
```

---

## Disaster Recovery

### Database Disaster

1. Restore from Supabase backup: **Settings** → **Backups**
2. Verify data integrity
3. Test all features
4. Notify users if needed

### Credential Compromise

1. Rotate Supabase API keys
2. Update Vercel environment variables
3. Invalidate user sessions (if needed)
4. Audit access logs

---

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Vercel Support**: https://vercel.com/support

---

## Going Live Checklist

- [ ] Custom domain configured
- [ ] Email notifications working
- [ ] Database backups automated
- [ ] Monitoring/alerts configured
- [ ] RLS policies reviewed
- [ ] All environment variables set
- [ ] HTTPS enabled
- [ ] User guide prepared
- [ ] Support process established
- [ ] Disaster recovery plan documented

Congratulations! Your Personal CRM is now live! 🚀
