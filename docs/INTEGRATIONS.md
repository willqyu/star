# Integrations Guide

This document provides step-by-step instructions for integrating third-party platforms with your Personal CRM.

## Table of Contents

1. [Google Calendar Sync](#google-calendar-sync)
2. [Gmail Integration](#gmail-integration)
3. [LinkedIn Enrichment](#linkedin-enrichment)
4. [Email Notifications (SMTP)](#email-notifications-smtp)
5. [Slack Notifications](#slack-notifications)

---

## Google Calendar Sync

### Overview

Automatically sync meetings from your Google Calendar and create interactions for them.

### Prerequisites

- Google Cloud Project
- Calendar API enabled
- OAuth 2.0 credentials

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a Project** → **New Project**
3. Name it (e.g., "Personal CRM")
4. Click **Create**

### Step 2: Enable Calendar API

1. In the Google Cloud Console, search for **"Calendar API"**
2. Click the result and click **Enable**
3. Go to **APIs & Services** → **Credentials**

### Step 3: Create OAuth 2.0 Credentials

1. Click **Create Credentials** → **OAuth 2.0 Client ID**
2. Select **Web Application**
3. Under **Authorized redirect URIs**, add:
   ```
   https://yourdomain.com/api/auth/google/callback
   https://localhost:3000/api/auth/google/callback (for local development)
   ```
4. Click **Create**
5. Copy the **Client ID** and **Client Secret**

### Step 4: Store Credentials in Supabase

In your Supabase dashboard:

1. Go to **SQL Editor**
2. Create a table for OAuth tokens:

```sql
create table public.oauth_tokens (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null, -- 'google', 'linkedin', etc
  access_token text not null,
  refresh_token text,
  expires_at timestamp,
  created_at timestamp default now(),
  unique(user_id, provider)
);

-- Enable RLS
alter table public.oauth_tokens enable row level security;

create policy "Users can manage their own tokens"
  on public.oauth_tokens for all
  using (auth.uid() = user_id);
```

### Step 5: Create OAuth Connection Route

Create `/app/api/auth/google/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/auth/google/callback';

export async function POST(req: NextRequest) {
  const { code } = await req.json();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Exchange code for token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });

  const tokens = await tokenResponse.json();

  // Store token in Supabase
  const { error } = await supabase
    .from('oauth_tokens')
    .upsert({
      user_id: user.id,
      provider: 'google',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000),
    });

  if (error) throw error;

  return NextResponse.json({ success: true });
}
```

### Step 6: Environment Variables

Add to `.env.local`:

```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000 (or your production URL)
```

### Step 7: Add Calendar Sync Button

In your settings page, add a button to connect Google Calendar.

---

## Gmail Integration

### Overview

Extract contact information and last interaction dates from Gmail messages.

### Prerequisites

- Same as Google Calendar (reuse the OAuth credentials)
- Gmail API enabled in Google Cloud Console

### Step 1: Enable Gmail API

1. In Google Cloud Console, search for **"Gmail API"**
2. Click **Enable**

### Step 2: Create Edge Function

Create `/supabase/functions/sync-gmail/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)

serve(async (req) => {
  try {
    const { userId } = await req.json()

    // Get OAuth token for user
    const { data: oauthToken } = await supabase
      .from('oauth_tokens')
      .select('access_token')
      .eq('user_id', userId)
      .eq('provider', 'gmail')
      .single()

    if (!oauthToken) {
      return new Response(JSON.stringify({ error: 'Gmail not connected' }), { status: 400 })
    }

    // Fetch recent messages from Gmail
    const messages = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=50&q=from:*', {
      headers: { Authorization: `Bearer ${oauthToken.access_token}` },
    }).then(r => r.json())

    // Process messages and extract contact data
    // This is a simplified example
    for (const message of messages.messages || []) {
      const fullMessage = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${message.id}`, {
        headers: { Authorization: `Bearer ${oauthToken.access_token}` },
      }).then(r => r.json())

      // Extract sender, date, and update contacts table
      // Implementation details omitted for brevity
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
```

### Step 3: Deploy Edge Function

```bash
npx supabase functions deploy sync-gmail
```

### Step 4: Invoke from Server Action

Create a server action to trigger the sync:

```typescript
export async function syncGmail() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/sync-gmail`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ userId: user.id }),
    }
  );

  return response.json();
}
```

---

## LinkedIn Enrichment

### Overview

Enrich contact data using LinkedIn profile information.

### Prerequisites

- LinkedIn Developer Application approved
- LinkedIn API credentials

### Step 1: Create LinkedIn App

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Click **Create app**
3. Fill in application details
4. Request access to **Sign In with LinkedIn** and **Share on LinkedIn**
5. Get your **Client ID** and **Client Secret**

### Step 2: Store Credentials

Add to `.env.local`:

```env
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
```

### Step 3: Add LinkedIn Enrichment API Route

Create `/app/api/enrich/linkedin/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  try {
    // Call LinkedIn API to enrich contact data
    const response = await fetch('https://api.linkedin.com/rest/me', {
      headers: {
        Authorization: `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN}`,
      },
    });

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

---

## Email Notifications (SMTP)

### Overview

Send email notifications and reminders to users.

### Prerequisites

- SMTP credentials (Gmail, SendGrid, or other provider)

### Step 1: Choose Email Provider

**Option A: Gmail**
- Use an app password (2FA required)
- Add to `.env.local`:
  ```env
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=your-email@gmail.com
  SMTP_PASS=your-app-password
  ```

**Option B: SendGrid**
1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create API key
3. Add to `.env.local`:
   ```env
   SENDGRID_API_KEY=your_api_key
   ```

### Step 2: Create Email Service

Create `/lib/email.ts`:

```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail(
  to: string,
  subject: string,
  html: string
) {
  return transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject,
    html,
  });
}
```

### Step 3: Create Notification Functions

```typescript
export async function sendTaskReminder(
  userEmail: string,
  taskTitle: string,
  dueDate: Date
) {
  return sendEmail(
    userEmail,
    `Task Reminder: ${taskTitle}`,
    `<h2>${taskTitle}</h2><p>Due: ${dueDate.toLocaleDateString()}</p>`
  );
}

export async function sendInteractionSummary(
  userEmail: string,
  weekSummary: any[]
) {
  // Create HTML summary of the week's interactions
  // and send to user
}
```

---

## Slack Notifications

### Overview

Send notifications to Slack when important events occur.

### Prerequisites

- Slack Workspace
- Slack Bot Token

### Step 1: Create Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click **Create New App** → **From scratch**
3. Name it "Personal CRM"
4. Select your workspace

### Step 2: Configure Bot

1. Go to **OAuth & Permissions**
2. Add these scopes:
   - `chat:write`
   - `files:write`
3. Install to workspace
4. Copy the **Bot User OAuth Token**

### Step 3: Add to Environment

```env
SLACK_BOT_TOKEN=xoxb-...
```

### Step 4: Create Slack Notification Function

```typescript
import { Client } from "@slack/web-api";

const slack = new Client({ token: process.env.SLACK_BOT_TOKEN });

export async function notifySlack(
  channelId: string,
  message: string
) {
  return slack.chat.postMessage({
    channel: channelId,
    text: message,
  });
}

// Example: Notify when new contact is added
export async function notifyNewContact(contactName: string) {
  return notifySlack(
    process.env.SLACK_CHANNEL_ID!,
    `📌 New contact added: ${contactName}`
  );
}
```

---

## Testing Integrations

### Manual Testing

1. Connect your first integration (e.g., Google Calendar)
2. Verify the OAuth flow completes
3. Check that data appears in the UI
4. Test with a few interactions to ensure sync works

### Automated Testing

Add to your test suite:

```typescript
describe('Google Calendar Integration', () => {
  it('should connect to Google Calendar', async () => {
    // Test OAuth flow
  });

  it('should sync calendar events', async () => {
    // Test syncing events
  });

  it('should create interactions from events', async () => {
    // Test interaction creation
  });
});
```

---

## Troubleshooting

### OAuth Connection Fails

- Verify redirect URLs match exactly (including protocol and domain)
- Check that credentials are correct
- Ensure APIs are enabled in Google Cloud / Slack / LinkedIn dashboards

### Sync Not Working

- Check that OAuth token hasn't expired
- Verify Edge Functions are deployed
- Check Supabase logs for errors

### Email Not Sending

- Test SMTP credentials with a simple script
- Check spam folder
- Verify sender email matches SMTP user

---

## Security Best Practices

1. **Never commit secrets**: All credentials go in `.env.local` (already in `.gitignore`)
2. **Rotate tokens**: Regularly refresh OAuth tokens
3. **Encrypt data**: Use Supabase encryption for sensitive fields
4. **Limit scope**: Only request necessary permissions
5. **Audit logs**: Monitor who accesses integrated services

---

For more information, see:
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Google OAuth](https://developers.google.com/identity/protocols/oauth2)
- [LinkedIn API](https://docs.microsoft.com/en-us/linkedin/)
- [Slack API](https://api.slack.com)
