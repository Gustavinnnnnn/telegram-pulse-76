
CREATE POLICY "Packages: admin insert" ON public.dm_packages FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Packages: admin update" ON public.dm_packages FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Packages: admin delete" ON public.dm_packages FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.dm_purchases ADD COLUMN IF NOT EXISTS admin_notes text;
