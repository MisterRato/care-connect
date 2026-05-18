
## Objetivo

Construir a Ficha de Notificação Individual de **Violência Interpessoal/Autoprovocada** (CID Y09), no padrão SINAN, integrada ao fluxo:

- Cadastro → Sistema → Unidade de Saúde
- Cadastro → Usuário SUS → Usuário SUS
- Operação → Prontuário Eletrônico

A ficha é aberta a partir do Prontuário Eletrônico de um Usuário SUS e pré-preenchida automaticamente com os dados já cadastrados. Campos obrigatórios da UBS são editáveis; campos da Epidemiologia ficam bloqueados para a UBS.

## Antes de eu codar — preciso confirmar 3 pontos

Como o app ainda está no template em branco, antes de implementar a ficha eu preciso saber:

1. **Backend**: posso ativar o **Lovable Cloud** para persistir Unidade de Saúde, Usuário SUS, Profissional, Domicílio, Prontuário, Unidade Notificadora e a Notificação? (recomendado — caso contrário tudo fica em memória e nada salva entre sessões).
2. **Escopo desta entrega**: você quer que eu já construa **todos os módulos de cadastro de apoio** (Unidade de Saúde com aba Endereço/Outras Inf., Usuário SUS com todas as abas Principal/Complemento PSF/CNS/Saúde do Trabalhador, Profissional de Saúde, Domicílio PSF, Pré-natal, Unidade Notificadora) ou começo pela **ficha de notificação + Unidade Notificadora** usando mocks/seeds para Unidade de Saúde e Usuário SUS, e construo os cadastros completos depois?
3. **Autenticação e papéis**: existem dois perfis com permissões diferentes — **UBS** (preenche tudo exceto #68 Circunstância da lesão) e **Epidemiologia – Secretaria de Saúde** (libera #68 com CIDs). Posso modelar isso com login + tabela de papéis (admin / ubs / epidemiologia)?

Minha recomendação: **Cloud ativo + entrega em 2 fases** (Fase 1 abaixo agora, Fase 2 depois).

## Arquitetura

```text
src/routes/
  index.tsx                      → dashboard com atalhos
  _authenticated.tsx             → guarda de login
  _authenticated/
    cadastro/
      sistema.unidade-saude.tsx
      usuario-sus.tsx
      usuario-sus.$id.tsx        (abas: Principal, Complemento PSF, CNS, Saúde Trab.)
      vigilancia.unidade-notificadora.tsx
      atendimento.profissional.tsx
      psf.domicilio.tsx
    operacao/
      prontuario.$usuarioId.tsx          (abre prontuário do paciente)
      prontuario.$usuarioId.notificacao-violencia.tsx   (a ficha)
    epidemiologia/
      notificacoes.tsx                   (lista p/ Sec. Saúde)
      notificacoes.$id.tsx               (libera campo #68)
```

A **Ficha de Notificação de Violência** é o componente central, organizada em abas conforme o SINAN:

```text
[Dados Gerais] [Notificação Individual] [Residência] [Pessoa Atendida]
[Ocorrência] [Violência] [Violência Sexual] [Autor] [Encaminhamento]
[Dados Finais] [Observações] [Notificador]
```

Cada campo segue o número e a fonte do dado descritos na sua especificação (#1–#69 + Observações + Notificador). Pré-preenchimento automático a partir de Unidade de Saúde, Usuário SUS e Profissional logado; regras de obrigatoriedade, mascaramento "8 – Não se aplica" e bloqueio do #68 implementadas como no SINAN.

### Regras condicionais já mapeadas

- #1 sempre `2 – Individual`; #2 sempre `VIOLÊNCIA INTERPESSOAL/AUTOPROVOCADA – Y09`; #32 sempre `BRASIL`.
- #3 = hoje; #69 = #3.
- #12 calculada a partir de #11.
- #14 Gestante: deriva de Pré-natal/Idade Gestacional do Usuário SUS.
- #31 Zona: se Unidade de Saúde = 39 e Equipe = 57 → Rural; senão Urbana.
- #52 Local da ocorrência = "residência" → copia #19→#40, #20→#41, #21→#42, #22→#43, #23→#44, #24→#45, #25→#46, #28→#49; outras opções liberam endereço próprio.
- #53, #54 checkbox → grava `1 – Sim` / `2 – Não`.
- #56 Tipo de violência sem "Sexual" → #58 e #59 = `8 – Não se aplica`; com "Sexual" → aba Violência Sexual obrigatória.
- #66 = Não → #67 = `8 – Não se aplica`; #66 = Sim → #67 obrigatório.
- #68 bloqueado para perfil UBS; liberado apenas para perfil Epidemiologia (com lista de CIDs).
- #38 = Não → #39 oculto; #39 com "Outra" → libera campo texto.

### Modelo de dados (Cloud / Postgres)

```text
unidades_saude(id, nome, cnes, uf, municipio, cod_ibge, equipe, ...)
usuarios_sus(id, nome, nome_social, dt_nascimento, sexo, cns, nome_mae,
             raca, escolaridade, estado_civil, orientacao_sexual,
             identidade_genero, ocupacao, deficiencia bool,
             deficiencia_tipos jsonb, endereco jsonb, telefone, ...)
profissionais(id, nome, ocupacao, unidade_saude_id)
domicilios_psf(id, usuario_sus_id, ponto_referencia, ...)
prontuarios(id, usuario_sus_id, ...)
pre_natal(id, usuario_sus_id, idade_gestacional, ...)
unidades_notificadoras(id, tipo enum, nome)
notificacoes_violencia(id, usuario_sus_id, unidade_saude_id,
                       profissional_id, status enum('ubs','epi','encerrada'),
                       payload jsonb,         -- todos os campos #1–#69
                       criada_em, atualizada_em)
user_roles(user_id, role enum('admin','ubs','epidemiologia'))
```

RLS: UBS lê/escreve notificações da própria unidade (exceto campo #68);
Epidemiologia lê todas e escreve apenas #68 / status.

## Fases sugeridas

**Fase 1 (esta entrega)**
- Ativar Cloud + auth + papéis (admin/ubs/epi).
- Tabelas mínimas: unidades_saude, usuarios_sus, profissionais, unidades_notificadoras, notificacoes_violencia, user_roles.
- Tela enxuta de cadastro para Unidade de Saúde, Usuário SUS e Unidade Notificadora (campos necessários para alimentar a ficha).
- **Ficha de Notificação de Violência completa** (#1–#69 + Observações + Notificador) com todas as regras condicionais, pré-preenchimento e bloqueio do #68.
- Lista de notificações para a UBS e para a Epidemiologia (com ação "Liberar circunstância da lesão").

**Fase 2 (depois)**
- Cadastros completos com todas as abas (Complemento PSF, CNS, Saúde do Trabalhador, Domicílio PSF, Pré-natal, Profissional com aba Ocupação).
- Impressão/Exportação da ficha em PDF no layout SINAN.
- Integração/Exportação para o e-SUS / SINAN Net.

## Próximo passo

Me confirme os 3 pontos do início (Cloud ✅/❌, escopo Fase 1 vs tudo, papéis ✅/❌) e eu já começo a implementação.
