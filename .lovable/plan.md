# Fase 2 — Implementação completa

Escopo grande. Vou dividir em 3 entregas sequenciais (cada uma roda sozinha e pode ser validada antes da próxima). Confirme que a divisão faz sentido antes de eu codar.

## Entrega 2.1 — Cadastros completos do e-SUS

Expandir as tabelas que hoje têm só o mínimo:

**unidades_saude** — novas colunas (todas as abas do e-SUS):
- Endereço: `cep`, `logradouro`, `numero`, `complemento`, `bairro`, `distrito`, `ponto_referencia`
- Outras Inf.: `cnes` (já existe), `cnpj`, `tipo_unidade`, `subtipo`, `esfera_administrativa`, `gestao`, `nivel_atencao`
- Contato: `telefone`, `email`
- Equipe / horário: `equipe` (já existe), `horario_funcionamento`

**usuarios_sus** — novas abas:
- Complemento PSF: `micro_area`, `area`, `numero_prontuario`, `data_cadastro_psf`
- CNS: `cns` (já existe), `cpf`, `rg`, `rg_orgao_emissor`, `rg_uf`, `passaporte`
- Saúde do Trabalhador: `situacao_mercado_trabalho`, `ocupacao_cbo`, `vinculo_trabalho`, `tempo_servico`
- Domicílio: `tipo_domicilio`, `material_parede`, `abastecimento_agua`, `tratamento_agua`, `escoamento_sanitario`, `destino_lixo`, `energia_eletrica`, `num_comodos`, `num_moradores`
- Pré-natal (campos já cobertos via `gestante`/`idade_gestacional`; adicionar `dpp`, `dum`, `num_consultas_prenatal`)

**profissionais** — novas colunas:
- Aba Pessoal: `cpf`, `cns`, `dt_nascimento`, `sexo`, `email`, `telefone`
- Aba Ocupação: `ocupacao` (já existe), `cbo`, `conselho_classe`, `numero_conselho`, `uf_conselho`, `data_admissao`
- `unidade_saude_id` (já existe)

Migration única adicionando todas as colunas como nullable (não quebra dados existentes).

Telas atualizadas: `app.unidades-saude.tsx`, `app.usuarios-sus.tsx`, `app.profissionais.tsx` — cada uma vira um formulário com abas (shadcn Tabs) replicando o layout do e-SUS.

## Entrega 2.2 — Ficha completa #1–#69 + regras condicionais

Hoje a `FichaViolencia.tsx` (595 linhas) cobre as abas principais. Faltam concluir:

**Abas a finalizar/criar:**
1. **Dados Gerais** (#1–#7) — ok, revisar UF/município auto do estabelecimento
2. **Notificação Individual** (#8–#14) — auto-fill paciente
3. **Residência** (#15–#22) — auto-fill paciente
4. **Pessoa Atendida** (#23–#34) — escolaridade, ocupação CBO, orientação, identidade gênero, deficiências (multi)
5. **Ocorrência** (#35–#44) — data, hora, UF/município/bairro, local, zona, "ocorreu outras vezes", motivação (multi)
6. **Violência** (#45–#54) — tipos (multi), meio de agressão (multi)
7. **Violência Sexual** (#55–#62) — visível só se #45 "Sexual"; profilaxias, procedimentos, conduta
8. **Autor** (#63–#67) — vínculo (multi), nº envolvidos, sexo, suspeita álcool, ciclo de vida
9. **Encaminhamento** (#65–#67) — rede (multi: saúde, CRAS/CREAS, conselho tutelar, MP, IML, etc.)
10. **Dados Finais** (#68–#69) — **#68 Circunstância da lesão (CID)** bloqueado para UBS; #69 evolução
11. **Observações** — texto livre
12. **Notificador** — auto-fill do profissional logado (CNES, função CBO)

**Regras condicionais completas:**
- #38 "Ocorreu outras vezes" = Não → oculta #39
- #45 inclui "Sexual" → desbloqueia aba Violência Sexual + força #58/#59 = "8 - Não se aplica" se vazio quando não-sexual
- #56 "Sexual" + #58 "Profilaxia HIV" = Sim → mostra #59 (medicamentos)
- #41 "Local: Residência" → auto-copia endereço de residência para ocorrência
- #66 "Encaminhamento" inclui "Outros" → obrigatório descrever em #67
- #23 Idade calculada de #19 data nascimento, read-only
- #11 Gestante = "Não se aplica" quando #25 sexo = M ou idade < 10 / > 50
- #68 só editável se role = epidemiologia ou admin; UBS vê read-only com aviso

## Entrega 2.3 — Permissões, lista filtrável e export

- RLS revisada: UBS update bloqueado em `circunstancia_lesao` (já via coluna separada; reforçar via trigger)
- Lista `app.notificacoes.tsx` com filtros (status, unidade, data) e badge "Aguarda Epi" / "Concluída"
- Tela específica `/app/epi` para fila de notificações pendentes do #68 (role epidemiologia)

## Detalhes técnicos

- Migration: `ALTER TABLE ... ADD COLUMN ... IF NOT EXISTS` para todas as colunas novas
- `payload jsonb` continua armazenando #1–#69 (chaves `f1`...`f69`)
- Componente `FichaViolencia.tsx` será dividido em sub-componentes por aba (`tabs/DadosGerais.tsx`, `tabs/Ocorrencia.tsx`, etc.) para não passar de ~250 linhas por arquivo
- Hook `useFichaState` central com `useMemo` para regras condicionais
- Trigger PG: `BEFORE UPDATE ON notificacoes_violencia` que rejeita alteração em `circunstancia_lesao` se `NOT has_role(auth.uid(), 'epidemiologia') AND NOT has_role(auth.uid(), 'admin')`

## Não incluído nesta fase (Fase 3)

- Export PDF no layout oficial SINAN
- Integração e-SUS / SINAN Net (XML)
- Auditoria/histórico de alterações

---

**Pergunta antes de eu começar:** posso entregar tudo de uma vez (vai gerar ~15 arquivos novos + migration grande), ou prefere que eu faça 2.1 → você valida → 2.2 → valida → 2.3?
