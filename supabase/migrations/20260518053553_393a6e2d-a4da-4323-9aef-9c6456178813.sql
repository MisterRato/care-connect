
-- Fase 2: expand cadastros + lock #68 for UBS

-- unidades_saude
ALTER TABLE public.unidades_saude
  ADD COLUMN IF NOT EXISTS cep text,
  ADD COLUMN IF NOT EXISTS logradouro text,
  ADD COLUMN IF NOT EXISTS numero text,
  ADD COLUMN IF NOT EXISTS complemento text,
  ADD COLUMN IF NOT EXISTS bairro text,
  ADD COLUMN IF NOT EXISTS distrito text,
  ADD COLUMN IF NOT EXISTS ponto_referencia text,
  ADD COLUMN IF NOT EXISTS cnpj text,
  ADD COLUMN IF NOT EXISTS tipo_unidade text,
  ADD COLUMN IF NOT EXISTS subtipo text,
  ADD COLUMN IF NOT EXISTS esfera_administrativa text,
  ADD COLUMN IF NOT EXISTS gestao text,
  ADD COLUMN IF NOT EXISTS nivel_atencao text,
  ADD COLUMN IF NOT EXISTS telefone text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS horario_funcionamento text;

-- usuarios_sus
ALTER TABLE public.usuarios_sus
  ADD COLUMN IF NOT EXISTS micro_area text,
  ADD COLUMN IF NOT EXISTS area text,
  ADD COLUMN IF NOT EXISTS numero_prontuario text,
  ADD COLUMN IF NOT EXISTS data_cadastro_psf date,
  ADD COLUMN IF NOT EXISTS cpf text,
  ADD COLUMN IF NOT EXISTS rg text,
  ADD COLUMN IF NOT EXISTS rg_orgao_emissor text,
  ADD COLUMN IF NOT EXISTS rg_uf text,
  ADD COLUMN IF NOT EXISTS passaporte text,
  ADD COLUMN IF NOT EXISTS situacao_mercado_trabalho text,
  ADD COLUMN IF NOT EXISTS ocupacao_cbo text,
  ADD COLUMN IF NOT EXISTS vinculo_trabalho text,
  ADD COLUMN IF NOT EXISTS tempo_servico text,
  ADD COLUMN IF NOT EXISTS tipo_domicilio text,
  ADD COLUMN IF NOT EXISTS material_parede text,
  ADD COLUMN IF NOT EXISTS abastecimento_agua text,
  ADD COLUMN IF NOT EXISTS tratamento_agua text,
  ADD COLUMN IF NOT EXISTS escoamento_sanitario text,
  ADD COLUMN IF NOT EXISTS destino_lixo text,
  ADD COLUMN IF NOT EXISTS energia_eletrica text,
  ADD COLUMN IF NOT EXISTS num_comodos integer,
  ADD COLUMN IF NOT EXISTS num_moradores integer,
  ADD COLUMN IF NOT EXISTS dpp date,
  ADD COLUMN IF NOT EXISTS dum date,
  ADD COLUMN IF NOT EXISTS num_consultas_prenatal integer;

-- profissionais
ALTER TABLE public.profissionais
  ADD COLUMN IF NOT EXISTS cpf text,
  ADD COLUMN IF NOT EXISTS cns text,
  ADD COLUMN IF NOT EXISTS dt_nascimento date,
  ADD COLUMN IF NOT EXISTS sexo text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS telefone text,
  ADD COLUMN IF NOT EXISTS cbo text,
  ADD COLUMN IF NOT EXISTS conselho_classe text,
  ADD COLUMN IF NOT EXISTS numero_conselho text,
  ADD COLUMN IF NOT EXISTS uf_conselho text,
  ADD COLUMN IF NOT EXISTS data_admissao date;

-- Trigger: only epidemiologia or admin can change circunstancia_lesao
CREATE OR REPLACE FUNCTION public.tg_protect_circunstancia_lesao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.circunstancia_lesao IS DISTINCT FROM OLD.circunstancia_lesao THEN
    IF NOT (public.has_role(auth.uid(), 'epidemiologia') OR public.has_role(auth.uid(), 'admin')) THEN
      RAISE EXCEPTION 'Apenas epidemiologia pode alterar a circunstância da lesão (#68)';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_circunstancia_lesao ON public.notificacoes_violencia;
CREATE TRIGGER protect_circunstancia_lesao
  BEFORE UPDATE ON public.notificacoes_violencia
  FOR EACH ROW EXECUTE FUNCTION public.tg_protect_circunstancia_lesao();
