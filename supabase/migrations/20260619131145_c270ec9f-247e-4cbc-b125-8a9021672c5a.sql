
-- 1. Remove public read on site_settings (landing renders server-side via service role)
DROP POLICY IF EXISTS "Public read settings" ON public.site_settings;

-- 2. Restrict restaurant-logos bucket writes to admins
DROP POLICY IF EXISTS "Authenticated upload restaurant logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update restaurant logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete restaurant logos" ON storage.objects;

CREATE POLICY "Admins upload restaurant logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'restaurant-logos' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins update restaurant logos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'restaurant-logos' AND public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (bucket_id = 'restaurant-logos' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins delete restaurant logos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'restaurant-logos' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3. Revoke EXECUTE on internal trigger/security-definer helpers from regular roles.
--    These functions only run as triggers; users should never call them directly.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bootstrap_user_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_featured_restaurants_limit() FROM PUBLIC, anon, authenticated;
