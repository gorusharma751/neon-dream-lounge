ALTER TABLE public.admin_settings ADD COLUMN mongodb_url text DEFAULT null;
ALTER TABLE public.admin_settings ADD COLUMN use_mongodb boolean DEFAULT false;