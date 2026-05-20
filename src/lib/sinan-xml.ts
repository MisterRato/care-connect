// Gerador de XML no layout SINAN Net — Ficha de Violência (CID Y09)
// Estrutura simplificada compatível com importação no SINAN NET.
// Cada notificação vira <NOTIFICACAO> dentro de <SINAN_NET>.

/* eslint-disable @typescript-eslint/no-explicit-any */

function esc(v: any): string {
  if (v == null) return "";
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function tag(name: string, value: any): string {
  return `    <${name}>${esc(value)}</${name}>`;
}

function ymd(d: any): string {
  if (!d) return "";
  const s = String(d).slice(0, 10);
  return s;
}

function joinArr(arr: any): string {
  if (!Array.isArray(arr)) return "";
  return arr.join("|");
}

function mapProc(procs: Record<string, "1" | "2"> | undefined, key: string): string {
  if (!procs) return "";
  return procs[key] === "1" ? "1" : procs[key] === "2" ? "2" : "";
}

export type SinanRow = {
  notificacao: any;
  usuario: any;
  unidade?: any;
  unidadeNotif?: any;
  profissional?: any;
};

export function buildNotificacaoXML(row: SinanRow): string {
  const { notificacao: n, usuario: u, unidade: us, unidadeNotif: un, profissional: pr } = row;
  const p = n.payload ?? {};
  const oc = p.ocorrencia ?? {};
  const autor = p.autor ?? {};
  const obs = p.obs ?? {};
  const procs = p.procedimentos ?? {};
  const enc = p.encaminhamentos ?? {};

  const lines: string[] = [];
  lines.push(`  <NOTIFICACAO id="${esc(n.id)}">`);
  // Dados Gerais
  lines.push(tag("TP_NOT", "2"));
  lines.push(tag("ID_AGRAVO", "Y09"));
  lines.push(tag("DT_NOTIFIC", ymd(n.data_notificacao)));
  lines.push(tag("SG_UF_NOT", us?.uf ?? ""));
  lines.push(tag("ID_MUNICIP", us?.cod_ibge ?? ""));
  lines.push(tag("ID_REGIONA", ""));
  lines.push(tag("ID_UNIDADE", us?.cnes ?? ""));
  lines.push(tag("TP_UNI_NOT", un?.tipo ?? ""));
  lines.push(tag("DT_OCOR", ymd(n.data_ocorrencia)));
  // Paciente
  lines.push(tag("NM_PACIENT", u.nome ?? ""));
  lines.push(tag("NM_SOCIAL", u.nome_social ?? ""));
  lines.push(tag("DT_NASC", ymd(u.dt_nascimento)));
  lines.push(tag("NU_IDADE_N", u.dt_nascimento ?? ""));
  lines.push(tag("CS_SEXO", u.sexo ?? "I"));
  lines.push(tag("CS_GESTANT", p.gestante ?? ""));
  lines.push(tag("CS_RACA", u.raca ?? "9"));
  lines.push(tag("CS_ESCOL_N", u.escolaridade ?? "9"));
  lines.push(tag("NU_CARTAO_SUS", u.cns ?? ""));
  lines.push(tag("NM_MAE_PAC", u.nome_mae ?? ""));
  // Residência
  lines.push(tag("SG_UF", u.uf ?? ""));
  lines.push(tag("ID_MN_RESI", u.cod_ibge_municipio ?? ""));
  lines.push(tag("ID_DIST", u.distrito ?? ""));
  lines.push(tag("ID_BAIRRO", u.bairro ?? ""));
  lines.push(tag("NM_LOGRADO", u.logradouro ?? ""));
  lines.push(tag("NU_NUMERO", u.numero ?? ""));
  lines.push(tag("NM_COMPLEM", u.complemento ?? ""));
  lines.push(tag("NM_REFEREN", u.ponto_referencia ?? ""));
  lines.push(tag("NU_CEP", u.cep ?? ""));
  lines.push(tag("NU_DDD_TEL", u.telefone ?? ""));
  lines.push(tag("CS_ZONA", oc.local === "1" ? "1" : "1"));
  lines.push(tag("ID_PAIS", "BRASIL"));
  // Pessoa atendida
  lines.push(tag("ID_OCUPA_N", u.ocupacao ?? ""));
  lines.push(tag("SIT_CONJUG", u.estado_civil ?? ""));
  lines.push(tag("ORIENT_SEX", u.orientacao_sexual ?? ""));
  lines.push(tag("IDENT_GEN", u.identidade_genero ?? ""));
  lines.push(tag("DEFICIENTE", u.tem_deficiencia ? "1" : "2"));
  lines.push(tag("DEF_TIPOS", joinArr(u.deficiencia_tipos)));
  // Ocorrência
  lines.push(tag("DT_OCORR", ymd(n.data_ocorrencia)));
  lines.push(tag("HORA_OCOR", oc.hora ?? ""));
  lines.push(tag("UF_OCOR", oc.uf ?? ""));
  lines.push(tag("MUN_OCOR", oc.municipio ?? ""));
  lines.push(tag("DIST_OCOR", oc.distrito ?? ""));
  lines.push(tag("BAIR_OCOR", oc.bairro ?? ""));
  lines.push(tag("LOGR_OCOR", oc.logradouro ?? ""));
  lines.push(tag("NUM_OCOR", oc.numero ?? ""));
  lines.push(tag("COMP_OCOR", oc.complemento ?? ""));
  lines.push(tag("REF_OCOR", oc.ponto_referencia ?? ""));
  lines.push(tag("LOCAL_OCOR", oc.local ?? ""));
  lines.push(tag("ZONA_OCOR", oc.zona ?? ""));
  lines.push(tag("OUT_VEZES", oc.outras_vezes ? "1" : "2"));
  lines.push(tag("LES_AUTOP", oc.autoprovocada ? "1" : "2"));
  lines.push(tag("VIOL_MOTIV", p.motivacao ?? ""));
  // Violência
  lines.push(tag("VIOL_FISIC", p.tipo_violencia?.includes("Física") ? "1" : "2"));
  lines.push(tag("VIOL_PSICO", p.tipo_violencia?.includes("Psicológica/Moral") ? "1" : "2"));
  lines.push(tag("VIOL_TORT", p.tipo_violencia?.includes("Tortura") ? "1" : "2"));
  lines.push(tag("VIOL_SEXU", p.tipo_violencia?.includes("Sexual") ? "1" : "2"));
  lines.push(tag("VIOL_TRAF", p.tipo_violencia?.includes("Tráfico de seres humanos") ? "1" : "2"));
  lines.push(tag("VIOL_FINAN", p.tipo_violencia?.includes("Financeira/Econômica") ? "1" : "2"));
  lines.push(tag("VIOL_NEGLI", p.tipo_violencia?.includes("Negligência/Abandono") ? "1" : "2"));
  lines.push(tag("VIOL_INFAN", p.tipo_violencia?.includes("Trabalho infantil") ? "1" : "2"));
  lines.push(tag("VIOL_LEGAL", p.tipo_violencia?.includes("Intervenção legal") ? "1" : "2"));
  lines.push(tag("VIOL_OUTR", p.tipo_violencia?.includes("Outros") ? "1" : "2"));
  lines.push(tag("MEIO_AGRES", joinArr(p.meio_agressao)));
  // Violência Sexual
  const sexAtiv = p.tipo_violencia?.includes("Sexual");
  lines.push(tag("SEX_ASSED", sexAtiv && p.sexual_tipos?.includes("Assédio sexual") ? "1" : "2"));
  lines.push(tag("SEX_ESTUPR", sexAtiv && p.sexual_tipos?.includes("Estupro") ? "1" : "2"));
  lines.push(tag("SEX_PORNO", sexAtiv && p.sexual_tipos?.includes("Pornografia infantil") ? "1" : "2"));
  lines.push(tag("SEX_EXPLOR", sexAtiv && p.sexual_tipos?.includes("Exploração sexual") ? "1" : "2"));
  lines.push(tag("PROC_DST", mapProc(procs, "Profilaxia DST")));
  lines.push(tag("PROC_HIV", mapProc(procs, "Profilaxia HIV")));
  lines.push(tag("PROC_HEPB", mapProc(procs, "Profilaxia Hepatite B")));
  lines.push(tag("PROC_SANG", mapProc(procs, "Coleta de sangue")));
  lines.push(tag("PROC_SEMEN", mapProc(procs, "Coleta de sêmen")));
  lines.push(tag("PROC_SECVAG", mapProc(procs, "Coleta de secreção vaginal")));
  lines.push(tag("PROC_CONTRAC", mapProc(procs, "Contracepção de emergência")));
  lines.push(tag("PROC_ABORTO", mapProc(procs, "Aborto previsto em lei")));
  // Autor
  lines.push(tag("AUTOR_NUM", autor.numero_envolvidos ?? ""));
  lines.push(tag("AUTOR_VINC", joinArr(autor.vinculos)));
  lines.push(tag("AUTOR_SEXO", autor.sexo ?? ""));
  lines.push(tag("SUSP_ALCOO", autor.uso_alcool ?? ""));
  lines.push(tag("AUTOR_CICL", autor.ciclo_vida ?? ""));
  // Encaminhamento
  for (const k of [
    "Rede de atenção à saúde",
    "Rede de assistência social (CRAS/CREAS)",
    "Conselho Tutelar",
    "Conselho do Idoso",
    "Delegacia de atendimento à mulher",
    "Ministério Público",
    "Defensoria Pública",
    "Instituto Médico Legal (IML)",
  ]) {
    const code = k.split(" ")[0].toUpperCase().replace(/[^A-Z]/g, "").slice(0, 8);
    lines.push(tag(`ENC_${code}`, enc[k] ?? ""));
  }
  // Dados Finais
  lines.push(tag("REL_TRAB", p.relacionada_trabalho ?? ""));
  lines.push(tag("CAT_EMITID", p.cat_emitida ?? ""));
  lines.push(tag("CIRC_LESAO", n.circunstancia_lesao ?? ""));
  lines.push(tag("DT_ENCERRA", ymd(p.data_encerramento)));
  // Observações
  lines.push(tag("NM_ACOMPAN", obs.acompanhante ?? ""));
  lines.push(tag("VINC_ACOMP", obs.vinculo ?? ""));
  lines.push(tag("TEL_ACOMP", obs.telefone ?? ""));
  lines.push(tag("OBSERVACOES", obs.adicionais ?? ""));
  // Notificador
  lines.push(tag("NOME_NOTIF", pr?.nome ?? ""));
  lines.push(tag("FUNC_NOTIF", pr?.ocupacao ?? ""));
  lines.push(tag("CNES_NOTIF", us?.cnes ?? ""));
  lines.push(`  </NOTIFICACAO>`);
  return lines.join("\n");
}

export function buildSinanXML(rows: SinanRow[]): string {
  const now = new Date().toISOString();
  const header = `<?xml version="1.0" encoding="UTF-8"?>
<SINAN_NET versao="1.0" geradoEm="${esc(now)}" total="${rows.length}">`;
  const body = rows.map(buildNotificacaoXML).join("\n");
  return `${header}\n${body}\n</SINAN_NET>\n`;
}

export function downloadXML(filename: string, xml: string) {
  const blob = new Blob([xml], { type: "application/xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportNotificacoesXML(rows: SinanRow[], filename?: string) {
  const xml = buildSinanXML(rows);
  const name = filename ?? `sinan-y09-${new Date().toISOString().slice(0, 10)}.xml`;
  downloadXML(name, xml);
}