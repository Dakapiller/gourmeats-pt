
-- ============ ROLES & PROFILES ============
CREATE TYPE public.app_role AS ENUM ('admin', 'editor');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by owner" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Profiles updatable by owner" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users see own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Shared updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ CONTENT TABLES ============

-- site_settings: singleton row
CREATE TABLE public.site_settings (
  id INT PRIMARY KEY DEFAULT 1,
  site_name TEXT NOT NULL DEFAULT 'Gourmeats',
  meta_title TEXT NOT NULL DEFAULT 'Gourmeats — Menus em vídeo para restaurantes',
  meta_description TEXT NOT NULL DEFAULT 'Transforme a sua carta num menu em vídeo. Os clientes vêem os pratos em vídeo antes de pedir.',
  og_image_url TEXT,
  whatsapp_number TEXT NOT NULL DEFAULT '+351916082384',
  whatsapp_display TEXT NOT NULL DEFAULT '+351 916 082 384',
  contact_email TEXT NOT NULL DEFAULT 'andre.duque@gourmeatsapp.com',
  cta_message TEXT NOT NULL DEFAULT 'Olá! Vi a Gourmeats e queria saber mais.',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT singleton CHECK (id = 1)
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin write settings" ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER tr_site_settings_updated BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Reusable macro: content table with sort_order
-- hero_section (singleton)
CREATE TABLE public.hero_section (
  id INT PRIMARY KEY DEFAULT 1,
  kicker TEXT NOT NULL DEFAULT 'Menu digital em vídeo',
  headline TEXT NOT NULL DEFAULT 'Os seus clientes veem os pratos em vídeo antes de pedir.',
  subheadline TEXT NOT NULL DEFAULT 'Substitua a carta em papel ou PDF por um menu em vídeo acessível por QR code. Sem app, sem download. Apenas vídeos profissionais que vendem por si.',
  primary_cta_label TEXT NOT NULL DEFAULT 'Falar no WhatsApp',
  secondary_cta_label TEXT NOT NULL DEFAULT 'Ver demo',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT hero_singleton CHECK (id = 1)
);
GRANT SELECT ON public.hero_section TO anon, authenticated;
GRANT ALL ON public.hero_section TO service_role;
ALTER TABLE public.hero_section ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read hero" ON public.hero_section FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin write hero" ON public.hero_section FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER tr_hero_updated BEFORE UPDATE ON public.hero_section FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- hero_stats
CREATE TABLE public.hero_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hero_stats TO anon, authenticated;
GRANT ALL ON public.hero_stats TO service_role;
ALTER TABLE public.hero_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read hero_stats" ON public.hero_stats FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin write hero_stats" ON public.hero_stats FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER tr_hero_stats_updated BEFORE UPDATE ON public.hero_stats FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- proof_cards
CREATE TABLE public.proof_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.proof_cards TO anon, authenticated;
GRANT ALL ON public.proof_cards TO service_role;
ALTER TABLE public.proof_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read proof" ON public.proof_cards FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin write proof" ON public.proof_cards FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER tr_proof_updated BEFORE UPDATE ON public.proof_cards FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- restaurants
CREATE TABLE public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  link_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.restaurants TO anon, authenticated;
GRANT ALL ON public.restaurants TO service_role;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read restaurants" ON public.restaurants FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin write restaurants" ON public.restaurants FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER tr_restaurants_updated BEFORE UPDATE ON public.restaurants FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- metrics
CREATE TABLE public.metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value TEXT NOT NULL,
  description TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.metrics TO anon, authenticated;
GRANT ALL ON public.metrics TO service_role;
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read metrics" ON public.metrics FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin write metrics" ON public.metrics FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER tr_metrics_updated BEFORE UPDATE ON public.metrics FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- features
CREATE TABLE public.features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  icon TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.features TO anon, authenticated;
GRANT ALL ON public.features TO service_role;
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read features" ON public.features FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin write features" ON public.features FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER tr_features_updated BEFORE UPDATE ON public.features FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- faq_items
CREATE TABLE public.faq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.faq_items TO anon, authenticated;
GRANT ALL ON public.faq_items TO service_role;
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read faq" ON public.faq_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin write faq" ON public.faq_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER tr_faq_updated BEFORE UPDATE ON public.faq_items FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- cta_section (singleton)
CREATE TABLE public.cta_section (
  id INT PRIMARY KEY DEFAULT 1,
  headline TEXT NOT NULL DEFAULT 'Pronto para transformar a sua carta?',
  subheadline TEXT NOT NULL DEFAULT 'Falamos consigo no WhatsApp. Mostramos exemplos reais e fazemos uma demo para o seu restaurante em menos de 24h.',
  primary_cta_label TEXT NOT NULL DEFAULT 'Falar no WhatsApp agora',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cta_singleton CHECK (id = 1)
);
GRANT SELECT ON public.cta_section TO anon, authenticated;
GRANT ALL ON public.cta_section TO service_role;
ALTER TABLE public.cta_section ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read cta" ON public.cta_section FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin write cta" ON public.cta_section FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER tr_cta_updated BEFORE UPDATE ON public.cta_section FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ SEED ============
INSERT INTO public.site_settings (id) VALUES (1);
INSERT INTO public.hero_section (id) VALUES (1);
INSERT INTO public.cta_section (id) VALUES (1);

INSERT INTO public.hero_stats (value, label, sort_order) VALUES
  ('26+', 'restaurantes ativos', 1),
  ('100%', 'no browser, sem app', 2),
  ('<24h', 'demo para o seu menu', 3),
  ('3 idiomas', 'PT · EN · ES', 4),
  ('Até +25%', 'ticket médio', 5);

INSERT INTO public.proof_cards (quote, author_name, author_role, sort_order) VALUES
  ('Os clientes decidem mais rápido e pedem mais. O ticket médio subiu visivelmente desde que pusemos os vídeos.', 'André', 'Restaurante em Lisboa', 1),
  ('Acabaram-se as perguntas sobre os pratos. Os vídeos vendem por nós e a equipa ganhou tempo para servir.', 'Sofia', 'Restaurante no Porto', 2),
  ('A diferença é imediata. Turistas escolhem em segundos e o menu fica sempre atualizado.', 'Miguel', 'Restaurante no Algarve', 3);

INSERT INTO public.restaurants (name, sort_order) VALUES
  ('Restaurante 1', 1), ('Restaurante 2', 2), ('Restaurante 3', 3),
  ('Restaurante 4', 4), ('Restaurante 5', 5), ('Restaurante 6', 6);

INSERT INTO public.metrics (value, description, sort_order) VALUES
  ('+25%', 'ticket médio em restaurantes com menu em vídeo', 1),
  ('-40%', 'tempo de decisão dos clientes', 2),
  ('3×', 'mais cliques em pratos com vídeo vs. fotografia', 3),
  ('0', 'apps para instalar — funciona em qualquer telemóvel', 4);

INSERT INTO public.features (icon, title, description, sort_order) VALUES
  ('video', 'Vídeos profissionais', 'Filmamos os seus pratos com qualidade cinema. Cada vídeo é otimizado para mobile e carrega em segundos.', 1),
  ('qr', 'Acesso por QR code', 'Um QR code na mesa. Sem app, sem download, sem login. Abre direto no browser do telemóvel.', 2),
  ('languages', 'Multi-idioma', 'PT, EN e ES de série. Ideal para turistas. Adicionamos mais idiomas quando precisar.', 3),
  ('edit', 'Atualizações em tempo real', 'Esgotou um prato? Alterou o preço? Atualizamos em minutos sem reimprimir nada.', 4),
  ('analytics', 'Analytics dos pratos', 'Veja quais os pratos mais vistos, mais clicados e em que idiomas. Decida o que filmar a seguir com dados.', 5),
  ('support', 'Suporte humano', 'Falamos consigo no WhatsApp. Tratamos da gravação, edição e setup completo.', 6);

INSERT INTO public.faq_items (question, answer, sort_order) VALUES
  ('Os clientes precisam de instalar uma app?', 'Não. O menu abre no browser do telemóvel ao ler o QR code. Funciona em qualquer iPhone ou Android, sem qualquer download.', 1),
  ('Quanto tempo demora a montar?', 'Tipicamente 1 a 2 semanas: gravação dos vídeos, edição e setup. Em casos urgentes conseguimos uma versão preliminar em 48h.', 2),
  ('Quem grava os vídeos?', 'A nossa equipa. Vamos ao restaurante, filmamos os pratos com equipamento profissional e tratamos de toda a pós-produção.', 3),
  ('Funciona para fazer pedidos online?', 'Não. A Gourmeats é um menu digital em vídeo — substitui a carta. Para take-away ou delivery temos parceiros que recomendamos.', 4),
  ('Quanto custa?', 'Há um setup inicial (gravação + montagem) e uma mensalidade. Os valores dependem do número de pratos. Falamos consigo no WhatsApp para um orçamento.', 5),
  ('Posso atualizar o menu sozinho?', 'Sim. Tem acesso a um painel onde altera preços, descrições, esconde pratos esgotados e adiciona novidades. Os vídeos novos gravamos nós.', 6);
