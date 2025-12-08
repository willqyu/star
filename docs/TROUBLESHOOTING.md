# Troubleshooting Guide

Common issues and solutions for Personal CRM.

## Table of Contents

1. [Setup Issues](#setup-issues)
2. [Authentication Issues](#authentication-issues)
3. [Database Issues](#database-issues)
4. [UI/Frontend Issues](#uifrontend-issues)
5. [Performance Issues](#performance-issues)
6. [Deployment Issues](#deployment-issues)
7. [Integration Issues](#integration-issues)
8. [Getting Help](#getting-help)

## Setup Issues

### Issue: Node.js/npm not installed

**Symptoms**: `command not found: node` or `npm not found`

**Solution**:
1. Install Node.js from [nodejs.org](https://nodejs.org/)
   - Choose LTS version (recommended)
   - Includes npm automatically
2. Verify installation:
   ```bash
   node --version  # Should show v18.x.x or higher
   npm --version   # Should show 9.x.x or higher
   ```
3. Restart your terminal

### Issue: Dependencies installation fails

**Symptoms**:
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solutions**:

Option 1: Clear npm cache
```bash
npm cache clean --force
npm install
```

Option 2: Use npm legacy peer deps
```bash
npm install --legacy-peer-deps
```

Option 3: Delete lock file and reinstall
```bash
rm package-lock.json
npm install
```

### Issue: TypeScript compilation errors after npm install

**Symptoms**:
```
error TS2688: Cannot find type definition file for 'node'
```

**Solution**:
```bash
npm install --save-dev @types/node
npx tsc --noEmit  # Verify compilation
```

### Issue: Port 3000 already in use

**Symptoms**:
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions**:

Windows PowerShell:
```powershell
# Find process on port 3000
Get-NetTCPConnection -LocalPort 3000

# Kill the process
Stop-Process -Id <PID> -Force

# Or use different port
npm run dev -- -p 3001
```

macOS/Linux:
```bash
# Find process on port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port
npm run dev -- -p 3001
```

## Authentication Issues

### Issue: Cannot sign up

**Symptoms**: Signup page shows error or redirects to login

**Debugging Steps**:
1. Check Supabase configuration
   ```bash
   # Verify .env.local has correct values
   cat .env.local | grep NEXT_PUBLIC_SUPABASE
   ```

2. Check browser console for errors
   - Press F12 → Console tab
   - Look for red error messages
   - Note the error message

3. Verify Supabase is running
   - Go to Supabase dashboard
   - Check project status
   - Try signing up via dashboard directly

**Common causes**:
- Invalid Supabase URL or key
- Supabase project not active
- Email already registered
- Password doesn't meet requirements

**Solution**:
```bash
# Verify .env.local
nano .env.local

# Should have:
# NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### Issue: Session expires unexpectedly

**Symptoms**: Logged out after a few minutes

**Causes**:
1. JWT token expired (default 1 hour)
2. Cookie settings incorrect
3. Clock skew between client and server

**Solutions**:

1. Extend session timeout in Supabase
   - Go to Authentication settings
   - Increase JWT expiry

2. Verify system time is correct
   ```bash
   # Check system time
   date  # Should match actual time
   ```

3. Clear browser cookies and sign in again
   - Developer Tools → Storage → Cookies
   - Delete all cookies
   - Sign in fresh

### Issue: "User not found" error

**Symptoms**: Can login but get "User not found" in app

**Cause**: User created but not properly synced to database

**Solution**:
```typescript
// Manually create user settings record
const { data: { user } } = await supabase.auth.getUser();
await supabase
  .from('user_settings')
  .insert({
    user_id: user.id,
    theme: 'light',
    cold_contact_threshold_days: 90,
  });
```

## Database Issues

### Issue: "relation does not exist" error

**Symptoms**:
```
PostgreSQL error: relation "contacts" does not exist
```

**Cause**: Database schema not created

**Solution**:

1. Run migrations via Supabase CLI
   ```bash
   npx supabase db reset
   ```

2. Or manually run migration SQL
   - Go to Supabase dashboard
   - SQL Editor
   - Copy contents of `supabase/migrations/001_init.sql`
   - Run query

### Issue: RLS policies blocking queries

**Symptoms**:
```
"new row violates row-level security policy"
```

**Debugging**:
1. Check user is authenticated
   ```typescript
   const { data: { user } } = await supabase.auth.getUser();
   console.log('User:', user); // Should not be null
   ```

2. Verify user_id is set correctly
   ```typescript
   // In server action
   const { data, error } = await supabase
     .from('contacts')
     .select('*')
     .eq('user_id', user.id);
   
   console.log('Query error:', error);
   ```

3. Check RLS policy in Supabase
   - Dashboard → Contacts → Auth Policies
   - Verify policy uses `user_id = auth.uid()`

### Issue: Foreign key constraint violation

**Symptoms**:
```
PostgreSQL error: insert or update violates foreign key constraint
```

**Cause**: Referenced record doesn't exist or belongs to different user

**Example**:
```typescript
// ❌ Bad: contact_id from different user
await supabase.from('tasks').insert({
  user_id: myUserId,
  contact_id: otherUserContactId,  // WRONG!
});

// ✅ Good: verify contact belongs to user
const { data: contact } = await supabase
  .from('contacts')
  .select()
  .eq('id', contactId)
  .eq('user_id', userId)
  .single();

if (!contact) throw new Error('Contact not found');

await supabase.from('tasks').insert({
  user_id: userId,
  contact_id: contactId,
});
```

### Issue: Connection timeout

**Symptoms**:
```
Error: ETIMEDOUT - Connection timeout
```

**Causes**:
1. Network connection issue
2. Supabase service is down
3. Too many connections

**Solutions**:
1. Check internet connection
   ```bash
   ping 8.8.8.8  # Google DNS
   ```

2. Check Supabase status
   - Visit [status.supabase.com](https://status.supabase.com)

3. Check browser DevTools
   - Network tab → check request status
   - See if request is pending or failed

## UI/Frontend Issues

### Issue: Styles not loading (TailwindCSS)

**Symptoms**:
- Page shows but no colors/layout
- Looks like plain HTML
- CSS class warnings in console

**Cause**: TailwindCSS not compiled

**Solution**:
1. Verify `tailwind.config.ts` exists and is correct
2. Restart dev server
   ```bash
   # Stop: Ctrl+C
   npm run dev
   ```

3. Clear Next.js cache
   ```bash
   rm -r .next
   npm run dev
   ```

### Issue: Components not rendering

**Symptoms**:
- Blank page or missing sections
- React error in console
- Component doesn't show

**Debugging**:
1. Check browser console for errors (F12)
2. Check React DevTools
   - React tab → Component tree
   - Look for error boundaries

3. Test in browser:
   ```javascript
   // Console
   console.log(document.body.innerHTML)  // See what rendered
   ```

**Common causes**:
- Missing dependency import
- Async component not awaited
- Server action returning error silently

### Issue: Form submission not working

**Symptoms**:
- Click submit, nothing happens
- No error shown to user
- Request seems to fail silently

**Debugging**:
1. Check form inputs
   ```typescript
   // Add logging
   console.log('Form data:', Object.fromEntries(formData));
   ```

2. Check network requests
   - DevTools → Network tab
   - Filter by XHR/Fetch
   - Look for failed requests

3. Check server action
   ```typescript
   // Add error handling
   try {
     const result = await createContact(formData);
     console.log('Success:', result);
   } catch (err) {
     console.error('Error:', err.message);
   }
   ```

### Issue: Images not loading

**Symptoms**: Image placeholders or broken icons

**Solution**:
1. Verify image path
   ```typescript
   // Good: public folder
   <img src="/logo.png" alt="Logo" />

   // Avoid: relative paths in server components
   <img src="./logo.png" />  // Won't work
   ```

2. For Supabase Storage:
   ```typescript
   // Get public URL
   const { data } = supabase
     .storage
     .from('attachments')
     .getPublicUrl(filePath);

   <img src={data.publicUrl} alt="Attachment" />
   ```

## Performance Issues

### Issue: Page loads slowly

**Symptoms**: Slow Time to Interactive (TTI), poor Lighthouse score

**Debugging**:
1. Check network requests
   - DevTools → Network tab
   - Look for slow requests
   - Check waterfall view

2. Check JavaScript bundle size
   ```bash
   npm run build
   # Check terminal output for bundle size
   ```

3. Use Lighthouse
   - DevTools → Lighthouse
   - Generate report
   - See specific bottlenecks

**Solutions**:

1. Lazy load non-critical components
   ```typescript
   const AdvancedSettings = dynamic(
     () => import('./AdvancedSettings'),
     { loading: () => <Skeleton /> }
   );
   ```

2. Optimize database queries
   ```typescript
   // ❌ Bad: N+1 queries
   const contacts = await getContacts();
   for (const contact of contacts) {
     const tasks = await getTasks(contact.id);  // N queries!
   }

   // ✅ Good: Single query with relations
   const contacts = await supabase
     .from('contacts')
     .select('*, tasks(*)')
     .eq('user_id', userId);
   ```

3. Enable caching
   ```typescript
   // Cache static pages
   export const revalidate = 3600;  // Revalidate every hour
   ```

### Issue: Database queries are slow

**Debugging**:
1. Check query performance in Supabase
   - Dashboard → Logs
   - Look for slow queries (> 1 second)

2. Check indexes
   ```sql
   -- Verify index exists
   SELECT * FROM pg_indexes 
   WHERE tablename = 'contacts';
   ```

3. Check query plans
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM contacts WHERE user_id = 'xxx';
   ```

**Solutions**:
1. Add missing indexes
2. Optimize query (use SELECT specific columns)
3. Consider pagination for large datasets

## Deployment Issues

### Issue: Build fails on Vercel

**Symptoms**:
```
Build failed: Command npm run build exited with code 1
```

**Debugging**:
1. Check Vercel build logs
   - Go to deployment → Logs
   - Look for error message
   - Usually TypeScript or dependency error

2. Try building locally
   ```bash
   npm run build  # Reproduce error locally
   ```

**Common causes**:
- Missing environment variables
- TypeScript error
- Missing dependency

**Solution**:
1. Verify all environment variables in Vercel
   - Project Settings → Environment Variables
   - Should include all from .env.example

2. Fix TypeScript errors
   ```bash
   npx tsc --noEmit  # Check locally
   ```

### Issue: Deployment succeeds but app doesn't work

**Symptoms**: Deployment succeeds but app shows error on production

**Debugging**:
1. Check Vercel logs
   - Deployments tab → Select deployment
   - Click "Runtime Logs"
   - Look for errors

2. Check production environment variables
   - May be missing or incorrect
   - Verify Supabase URL and key match production database

3. Check network requests in browser
   - DevTools → Network tab
   - Look for 500 errors or failed requests

**Solution**:
```bash
# Test with production env locally
NEXT_PUBLIC_SUPABASE_URL=prod_url \
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod_key \
npm run build
npm run start
```

### Issue: Edge Functions not executing

**Symptoms**: Cron jobs or event handlers not triggering

**Solution**:
1. Verify function is deployed
   ```bash
   npx supabase functions list
   ```

2. Check function logs
   - Supabase dashboard → Edge Functions → Logs
   - Look for errors

3. Manually trigger to test
   ```bash
   npx supabase functions invoke process-cadences
   ```

4. Verify cron schedule
   - Supabase dashboard → Edge Functions
   - Check scheduled run configuration

## Integration Issues

### Issue: Google Calendar sync not working

**Symptoms**: Can't connect to Google Calendar, events not syncing

**See**: [docs/INTEGRATIONS.md](./INTEGRATIONS.md) → Google Calendar section

**Common issues**:
- OAuth credentials not set up
- Scopes not granted
- Refresh token expired

### Issue: Email notifications not sending

**Symptoms**: Tasks created but no email received

**Debugging**:
1. Check SMTP settings in .env.local
   ```bash
   SMTP_HOST=...
   SMTP_PORT=...
   SMTP_USER=...
   SMTP_PASS=...
   ```

2. Check email logs (if available)
3. Verify email address is correct

**See**: [docs/INTEGRATIONS.md](./INTEGRATIONS.md) → SMTP section

### Issue: Slack messages not posting

**Symptoms**: Events happen but no Slack message

**Solution**:
1. Verify Slack webhook URL
   ```bash
   # Check .env.local
   SLACK_WEBHOOK_URL=https://hooks.slack.com/...
   ```

2. Test webhook manually
   ```bash
   curl -X POST -H 'Content-type: application/json' \
     --data '{"text":"test"}' \
     $SLACK_WEBHOOK_URL
   ```

3. Check Slack app permissions
   - Slack workspace → Apps → Personal CRM
   - Verify webhook scopes

**See**: [docs/INTEGRATIONS.md](./INTEGRATIONS.md) → Slack section

## Getting Help

### Before asking for help:

1. **Read documentation**
   - Check relevant section in docs/
   - Search GitHub issues
   - Check README.md

2. **Check debug logs**
   - Browser console (F12)
   - Supabase logs
   - Vercel logs (if deployed)

3. **Reproduce locally**
   - Issue happens on your machine?
   - Happens with sample data?
   - Browser-specific or general?

4. **Try common solutions**
   - Clear cache (`rm -r .next`)
   - Restart dev server
   - Update dependencies (`npm update`)
   - Check environment variables

### Getting help

**GitHub Issues**:
1. Go to [Issues](https://github.com/owner/personal-crm/issues)
2. Search existing issues
3. Create new issue with:
   - Clear title
   - Steps to reproduce
   - Expected vs actual behavior
   - Error messages and logs
   - Environment info (OS, Node version, etc.)

**Discussion Forum**:
- Ask in [GitHub Discussions](https://github.com/owner/personal-crm/discussions)
- For questions without clear bug

**Stack Overflow**:
- Tag: `personal-crm` or `next-js`
- For general Next.js/React questions

### Useful information to include

```markdown
## Environment
- OS: Windows 10 / macOS 13 / Ubuntu 22.04
- Node: 18.17.0
- npm: 9.6.4

## Steps to Reproduce
1. ...
2. ...
3. ...

## Error Message
[Paste full error message]

## Screenshots
[Attach if UI-related]

## What I've tried
- [x] Cleared .next cache
- [x] Restarted dev server
- [x] Checked .env.local
```

### Common resources

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Supabase Docs](https://supabase.com/docs)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)

---

**Can't find your issue?** Create a GitHub issue with detailed information, and we'll help!

*Last updated: 2024*
