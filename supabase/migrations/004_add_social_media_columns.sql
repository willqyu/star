-- Add Twitter and personal website URLs to contacts table
ALTER TABLE public.contacts
ADD COLUMN twitter_url text,
ADD COLUMN website_url text;

-- Create index on new columns for performance
CREATE INDEX idx_contacts_twitter_url ON public.contacts(twitter_url) WHERE twitter_url IS NOT NULL;
CREATE INDEX idx_contacts_website_url ON public.contacts(website_url) WHERE website_url IS NOT NULL;
