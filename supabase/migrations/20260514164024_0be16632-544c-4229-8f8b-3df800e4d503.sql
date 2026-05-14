
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Settings: public read" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Settings: admin insert" ON public.app_settings FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Settings: admin update" ON public.app_settings FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Settings: admin delete" ON public.app_settings FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

INSERT INTO public.app_settings (key, value) VALUES ('whatsapp_group_url', 'https://chat.whatsapp.com/GoSXeSQH10AK9VtLDLx3l1')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
