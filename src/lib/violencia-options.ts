// Catálogos de opções da Ficha de Notificação de Violência (SINAN)

export const UNIDADE_NOTIFICADORA_TIPOS = [
  { value: 1, label: "1 - Unidade de Saúde" },
  { value: 2, label: "2 - Unidade de Assistência Social" },
  { value: 3, label: "3 - Estabelecimento de Ensino" },
  { value: 4, label: "4 - Conselho Tutelar" },
  { value: 5, label: "5 - Unidade de Saúde Indígena" },
  { value: 6, label: "6 - Centro Especializado de Atendimento à Mulher" },
  { value: 7, label: "7 - Outros" },
];

export const SEXO = [
  { value: "M", label: "Masculino" },
  { value: "F", label: "Feminino" },
  { value: "I", label: "Ignorado" },
];

export const RACA = [
  { value: "1", label: "1 - Branca" },
  { value: "2", label: "2 - Preta" },
  { value: "3", label: "3 - Amarela" },
  { value: "4", label: "4 - Parda" },
  { value: "5", label: "5 - Indígena" },
  { value: "9", label: "9 - Ignorado" },
];

export const ESCOLARIDADE = [
  { value: "0", label: "0 - Analfabeto" },
  { value: "1", label: "1 - 1ª a 4ª série incompleta do EF" },
  { value: "2", label: "2 - 4ª série completa do EF" },
  { value: "3", label: "3 - 5ª a 8ª série incompleta do EF" },
  { value: "4", label: "4 - Ensino fundamental completo" },
  { value: "5", label: "5 - Ensino médio incompleto" },
  { value: "6", label: "6 - Ensino médio completo" },
  { value: "7", label: "7 - Educação superior incompleta" },
  { value: "8", label: "8 - Educação superior completa" },
  { value: "9", label: "9 - Ignorado" },
  { value: "10", label: "10 - Não se aplica" },
];

export const ESTADO_CIVIL = [
  { value: "1", label: "1 - Solteiro" },
  { value: "2", label: "2 - Casado/União estável" },
  { value: "3", label: "3 - Viúvo" },
  { value: "4", label: "4 - Separado/Divorciado" },
  { value: "9", label: "9 - Ignorado" },
];

export const ORIENTACAO_SEXUAL = [
  { value: "1", label: "1 - Heterossexual" },
  { value: "2", label: "2 - Homossexual (gay/lésbica)" },
  { value: "3", label: "3 - Bissexual" },
  { value: "4", label: "4 - Outra" },
  { value: "9", label: "9 - Não se aplica/Ignorado" },
];

export const IDENTIDADE_GENERO = [
  { value: "1", label: "1 - Travesti" },
  { value: "2", label: "2 - Mulher transexual" },
  { value: "3", label: "3 - Homem transexual" },
  { value: "4", label: "4 - Outra" },
  { value: "9", label: "9 - Não se aplica/Ignorado" },
];

export const ZONA = [
  { value: "1", label: "1 - Urbana" },
  { value: "2", label: "2 - Rural" },
  { value: "3", label: "3 - Periurbana" },
  { value: "9", label: "9 - Ignorado" },
];

export const GESTANTE = [
  { value: "1", label: "1 - 1º trimestre" },
  { value: "2", label: "2 - 2º trimestre" },
  { value: "3", label: "3 - 3º trimestre" },
  { value: "4", label: "4 - Idade gestacional ignorada" },
  { value: "5", label: "5 - Não" },
  { value: "6", label: "6 - Não se aplica" },
  { value: "9", label: "9 - Ignorado" },
];

export const DEFICIENCIA_TIPOS = [
  "Auditiva",
  "Visual",
  "Intelectual-Cognitiva",
  "Física",
  "Transtorno mental/comportamental",
  "Outra",
];

export const LOCAL_OCORRENCIA = [
  { value: "1", label: "1 - Residência" },
  { value: "2", label: "2 - Habitação coletiva" },
  { value: "3", label: "3 - Escola" },
  { value: "4", label: "4 - Local de prática esportiva" },
  { value: "5", label: "5 - Bar ou similar" },
  { value: "6", label: "6 - Via pública" },
  { value: "7", label: "7 - Comércio/serviços" },
  { value: "8", label: "8 - Industrias/construção" },
  { value: "9", label: "9 - Outros" },
];

export const MOTIVACAO_VIOLENCIA = [
  { value: "1", label: "1 - Sexismo" },
  { value: "2", label: "2 - Homofobia/Lesbofobia/Bifobia/Transfobia" },
  { value: "3", label: "3 - Racismo" },
  { value: "4", label: "4 - Intolerância religiosa" },
  { value: "5", label: "5 - Xenofobia" },
  { value: "6", label: "6 - Conflito geracional" },
  { value: "7", label: "7 - Situação de rua" },
  { value: "8", label: "8 - Deficiência" },
  { value: "9", label: "9 - Outros" },
  { value: "10", label: "10 - Não se aplica" },
];

export const TIPO_VIOLENCIA = [
  "Física",
  "Psicológica/Moral",
  "Tortura",
  "Sexual",
  "Tráfico de seres humanos",
  "Financeira/Econômica",
  "Negligência/Abandono",
  "Trabalho infantil",
  "Intervenção legal",
  "Outros",
];

export const MEIO_AGRESSAO = [
  "Força corporal/espancamento",
  "Enforcamento",
  "Objeto contundente",
  "Objeto perfuro-cortante",
  "Substância/objeto quente",
  "Envenenamento",
  "Arma de fogo",
  "Ameaça",
  "Outro",
];

export const VIOLENCIA_SEXUAL_TIPOS = [
  "Assédio sexual",
  "Estupro",
  "Pornografia infantil",
  "Exploração sexual",
  "Outro",
];

export const PROCEDIMENTO_SEXUAL = [
  "Profilaxia DST",
  "Profilaxia HIV",
  "Profilaxia Hepatite B",
  "Coleta de sangue",
  "Coleta de sêmen",
  "Coleta de secreção vaginal",
  "Contracepção de emergência",
  "Aborto previsto em lei",
];

export const NUMERO_ENVOLVIDOS = [
  { value: "1", label: "1 - Um" },
  { value: "2", label: "2 - Dois ou mais" },
  { value: "9", label: "9 - Ignorado" },
];

export const VINCULO_AUTOR = [
  "Pai",
  "Mãe",
  "Padrasto",
  "Madrasta",
  "Cônjuge",
  "Ex-cônjuge",
  "Namorado(a)",
  "Ex-namorado(a)",
  "Filho(a)",
  "Irmão(ã)",
  "Amigos/conhecidos",
  "Desconhecido(a)",
  "Cuidador(a)",
  "Patrão/chefe",
  "Pessoa com relação institucional",
  "Policial/agente da lei",
  "Própria pessoa",
  "Outros",
];

export const SEXO_AUTOR = [
  { value: "M", label: "Masculino" },
  { value: "F", label: "Feminino" },
  { value: "A", label: "Ambos os sexos" },
  { value: "I", label: "Ignorado" },
];

export const SIM_NAO_IGN = [
  { value: "1", label: "1 - Sim" },
  { value: "2", label: "2 - Não" },
  { value: "9", label: "9 - Ignorado" },
];

export const CICLO_VIDA_AUTOR = [
  { value: "1", label: "1 - Criança (0-9 anos)" },
  { value: "2", label: "2 - Adolescente (10-19 anos)" },
  { value: "3", label: "3 - Jovem (20-24 anos)" },
  { value: "4", label: "4 - Pessoa adulta (25-59 anos)" },
  { value: "5", label: "5 - Pessoa idosa (60+ anos)" },
  { value: "9", label: "9 - Ignorado" },
];

export const ENCAMINHAMENTO = [
  "Rede de atenção à saúde",
  "Rede de assistência social (CRAS/CREAS)",
  "Conselho Tutelar",
  "Conselho do Idoso",
  "Delegacia de atendimento à mulher",
  "Delegacia de atendimento à criança/adolescente",
  "Delegacia de atendimento ao idoso",
  "Outras delegacias",
  "Ministério Público",
  "Defensoria Pública",
  "Justiça da infância e juventude",
  "Instituto Médico Legal (IML)",
  "Centro de Referência da Mulher",
];

export function calcIdade(dt?: string | null): number | "" {
  if (!dt) return "";
  const d = new Date(dt);
  if (isNaN(d.getTime())) return "";
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}