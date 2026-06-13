
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_order integer;

CREATE INDEX IF NOT EXISTS idx_restaurants_featured ON public.restaurants(featured, featured_order);

CREATE OR REPLACE FUNCTION public.enforce_featured_restaurants_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cnt int;
BEGIN
  IF NEW.featured = true AND (TG_OP = 'INSERT' OR OLD.featured IS DISTINCT FROM NEW.featured) THEN
    SELECT count(*) INTO cnt FROM public.restaurants WHERE featured = true AND id <> NEW.id;
    IF cnt >= 5 THEN
      RAISE EXCEPTION 'Já existem 5 restaurantes em destaque. Remove um antes de adicionar outro.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS restaurants_featured_limit ON public.restaurants;
CREATE TRIGGER restaurants_featured_limit
BEFORE INSERT OR UPDATE ON public.restaurants
FOR EACH ROW EXECUTE FUNCTION public.enforce_featured_restaurants_limit();
