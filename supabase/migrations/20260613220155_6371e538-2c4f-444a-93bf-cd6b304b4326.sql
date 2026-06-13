
CREATE POLICY "Assets readable by anyone" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'assets');
CREATE POLICY "Assets writable by admins" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'assets' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Assets updatable by admins" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'assets' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Assets deletable by admins" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'assets' AND public.has_role(auth.uid(), 'admin'));
