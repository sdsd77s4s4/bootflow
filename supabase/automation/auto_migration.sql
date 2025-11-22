-- Auto migration for cobrancas: make cliente_profile_id nullable, add trigger and insert policy
-- IMPORTANT: run this file in the Supabase SQL editor (as a DB role with enough privileges). Do NOT run HTTP/curl here.

-- 1) Make cliente_profile_id temporarily nullable
ALTER TABLE public.cobrancas
  ALTER COLUMN cliente_profile_id DROP NOT NULL;

-- 2) Function to populate cliente_profile_id from cliente_id (email)
CREATE OR REPLACE FUNCTION public.set_cliente_profile_from_email()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.cliente_profile_id IS NULL AND NEW.cliente_id IS NOT NULL THEN
    SELECT id INTO NEW.cliente_profile_id
    FROM public.profiles
    WHERE email = NEW.cliente_id
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

-- 3) Attach trigger
DROP TRIGGER IF EXISTS trg_set_cliente_profile_from_email ON public.cobrancas;

CREATE TRIGGER trg_set_cliente_profile_from_email
BEFORE INSERT ON public.cobrancas
FOR EACH ROW
EXECUTE FUNCTION public.set_cliente_profile_from_email();

-- 4) Insert policy for authenticated users (allows insert when user sets their UUID or uses their email)
DROP POLICY IF EXISTS "Cobrancas: authenticated users can insert" ON public.cobrancas;

CREATE POLICY "Cobrancas: authenticated users can insert"
ON public.cobrancas
FOR INSERT
TO authenticated
WITH CHECK (
  (cliente_profile_id IS NOT NULL AND cliente_profile_id = auth.uid())
  OR
  (cliente_id IS NOT NULL AND EXISTS (
     SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.email = cliente_id
  ))
);

-- NOTE: After you validate that new inserts work and cliente_profile_id is populated, you can:
--  - ALTER TABLE public.cobrancas ALTER COLUMN cliente_profile_id SET NOT NULL;
--  - Update/drop policies that still reference cliente_id;
--  - Optionally DROP COLUMN cliente_id after thorough verification.

-- End of script
