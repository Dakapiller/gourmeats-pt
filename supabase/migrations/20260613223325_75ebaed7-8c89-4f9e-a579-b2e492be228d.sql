
CREATE POLICY "Public read restaurant logos" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'restaurant-logos');

CREATE POLICY "Authenticated upload restaurant logos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'restaurant-logos');

CREATE POLICY "Authenticated update restaurant logos" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'restaurant-logos');

CREATE POLICY "Authenticated delete restaurant logos" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'restaurant-logos');
