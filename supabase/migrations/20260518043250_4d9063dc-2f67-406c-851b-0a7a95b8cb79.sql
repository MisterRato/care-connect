
-- Enum de papéis
CREATE TYPE public.app_role AS ENUM ('admin', 'ubs', 'epidemiologia');

-- Tabela de papéis
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  unidade_saude_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função has_role (security definer evita recursão em RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "user_roles select own or admin" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_roles admin manage" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Unidade de Saúde
CREATE TABLE public.unidades_saude (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnes TEXT,
  uf TEXT,
  municipio TEXT,
  cod_ibge TEXT,
  codigo_unidade TEXT,
  equipe TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.unidades_saude ENABLE ROW LEVEL SECURITY;
CREATE POLICY "unidades_saude read auth" ON public.unidades_saude FOR SELECT TO authenticated USING (true);
CREATE POLICY "unidades_saude write auth" ON public.unidades_saude FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Profissional de Saúde
CREATE TABLE public.profissionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  ocupacao TEXT,
  unidade_saude_id UUID REFERENCES public.unidades_saude(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profissionais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profissionais read auth" ON public.profissionais FOR SELECT TO authenticated USING (true);
CREATE POLICY "profissionais write auth" ON public.profissionais FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Usuário SUS
CREATE TABLE public.usuarios_sus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  nome_social TEXT,
  dt_nascimento DATE,
  sexo TEXT,
  cns TEXT,
  nome_mae TEXT,
  raca TEXT,
  escolaridade TEXT,
  estado_civil TEXT,
  orientacao_sexual TEXT,
  identidade_genero TEXT,
  ocupacao TEXT,
  telefone TEXT,
  -- residência
  uf TEXT,
  municipio TEXT,
  cod_ibge_municipio TEXT,
  distrito TEXT,
  bairro TEXT,
  logradouro TEXT,
  numero TEXT,
  complemento TEXT,
  cep TEXT,
  ponto_referencia TEXT,
  -- deficiência
  tem_deficiencia BOOLEAN DEFAULT FALSE,
  deficiencia_tipos JSONB DEFAULT '[]'::jsonb,
  deficiencia_outra TEXT,
  -- pré-natal
  idade_gestacional INTEGER,
  -- vínculo
  unidade_saude_id UUID REFERENCES public.unidades_saude(id) ON DELETE SET NULL,
  equipe TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.usuarios_sus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usuarios_sus read auth" ON public.usuarios_sus FOR SELECT TO authenticated USING (true);
CREATE POLICY "usuarios_sus write auth" ON public.usuarios_sus FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Unidade Notificadora
CREATE TABLE public.unidades_notificadoras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo SMALLINT NOT NULL,
  nome TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.unidades_notificadoras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "unidades_notificadoras read auth" ON public.unidades_notificadoras FOR SELECT TO authenticated USING (true);
CREATE POLICY "unidades_notificadoras write auth" ON public.unidades_notificadoras FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Notificação de violência
CREATE TYPE public.notificacao_status AS ENUM ('ubs', 'epi', 'encerrada');

CREATE TABLE public.notificacoes_violencia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_sus_id UUID NOT NULL REFERENCES public.usuarios_sus(id) ON DELETE RESTRICT,
  unidade_saude_id UUID REFERENCES public.unidades_saude(id) ON DELETE SET NULL,
  unidade_notificadora_id UUID REFERENCES public.unidades_notificadoras(id) ON DELETE SET NULL,
  profissional_id UUID REFERENCES public.profissionais(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  data_notificacao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_ocorrencia DATE,
  status public.notificacao_status NOT NULL DEFAULT 'ubs',
  circunstancia_lesao TEXT, -- #68: liberado pela Epidemiologia
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notificacoes_violencia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notif read auth" ON public.notificacoes_violencia
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "notif insert ubs" ON public.notificacoes_violencia
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'ubs')
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "notif update ubs or epi" ON public.notificacoes_violencia
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'ubs')
    OR public.has_role(auth.uid(), 'epidemiologia')
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'ubs')
    OR public.has_role(auth.uid(), 'epidemiologia')
    OR public.has_role(auth.uid(), 'admin')
  );

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER touch_notif_updated_at BEFORE UPDATE ON public.notificacoes_violencia
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- Atribui papel 'admin' ao primeiro usuário cadastrado; demais recebem 'ubs' por padrão.
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE has_any BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.user_roles) INTO has_any;
  IF has_any THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'ubs');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();
