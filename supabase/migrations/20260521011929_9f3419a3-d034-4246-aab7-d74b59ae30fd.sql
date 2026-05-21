-- 1. Activity logs (auditoria - OWASP A09:2021 / LGPD Art. 46)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  resource    TEXT,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  success     BOOLEAN NOT NULL DEFAULT true,
  ip_hint     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id    ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action     ON public.activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "logs_insert_self"
  ON public.activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "logs_select_admin"
  ON public.activity_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Append-only: bloqueia UPDATE e DELETE via API
CREATE POLICY "logs_no_update"
  ON public.activity_logs FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "logs_no_delete"
  ON public.activity_logs FOR DELETE
  TO authenticated
  USING (false);

COMMENT ON TABLE public.activity_logs IS
  'Registro imutável de ações críticas. Append-only por política RLS. LGPD Art. 46 / OWASP A09:2021.';

-- 2. Anonimização de CPF (LGPD Art. 6º III / Art. 12)
CREATE OR REPLACE FUNCTION public.anonymize_cpf(cpf TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
PARALLEL SAFE
SET search_path = public
AS $$
BEGIN
  IF cpf IS NULL OR length(regexp_replace(cpf, '[^0-9]', '', 'g')) < 11 THEN
    RETURN '***.***.***-**';
  END IF;
  RETURN substring(regexp_replace(cpf, '[^0-9]', '', 'g'), 1, 3) || '.***.***-**';
END;
$$;