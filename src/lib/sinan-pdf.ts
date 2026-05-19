import jsPDF from "jspdf";
import {
  GESTANTE, ZONA, LOCAL_OCORRENCIA, MOTIVACAO_VIOLENCIA, TIPO_VIOLENCIA,
  MEIO_AGRESSAO, VIOLENCIA_SEXUAL_TIPOS, PROCEDIMENTO_SEXUAL,
  NUMERO_ENVOLVIDOS, VINCULO_AUTOR, SEXO_AUTOR, SIM_NAO_IGN, CICLO_VIDA_AUTOR,
  ENCAMINHAMENTO, RACA, ESCOLARIDADE, ESTADO_CIVIL, ORIENTACAO_SEXUAL,
  IDENTIDADE_GENERO, SEXO, calcIdade,
} from "./violencia-options";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const lookup = (list: { value: string | number; label: string }[], v: Any) =>
  list.find((o) => String(o.value) === String(v))?.label ?? (v ? String(v) : "");

const fmtDate = (s?: string | null) => {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
};

export function exportFichaPDF(opts: {
  usuario: Any;
  notificacao?: Any;
  payload: Any;
  circLesao?: string;
  unidade?: Any;
  unidadeNotif?: Any;
  profissional?: Any;
}) {
  const { usuario, notificacao, payload: f, circLesao, unidade, unidadeNotif, profissional } = opts;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210, H = 297, M = 10;
  let y = M;

  const sectionFill: [number, number, number] = [30, 64, 110];
  const labelGray: [number, number, number] = [90, 90, 90];

  function ensure(space: number) {
    if (y + space > H - M) {
      doc.addPage();
      y = M;
    }
  }

  function section(title: string) {
    ensure(8);
    doc.setFillColor(...sectionFill);
    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.rect(M, y, W - 2 * M, 5.5, "F");
    doc.text(title, M + 1.5, y + 3.9);
    doc.setTextColor(0);
    y += 7;
  }

  function field(num: string, label: string, value: string, w: number, opts: { newLine?: boolean; x?: number } = {}) {
    const x = opts.x ?? M;
    const h = 9;
    ensure(h + 1);
    doc.setDrawColor(180);
    doc.rect(x, y, w, h);
    doc.setFontSize(6.5);
    doc.setTextColor(...labelGray);
    doc.setFont("helvetica", "bold");
    doc.text(`${num} ${label}`, x + 1, y + 2.2);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(0);
    const lines = doc.splitTextToSize(value || "", w - 2);
    doc.text(lines.slice(0, 2), x + 1, y + 5.5);
    if (opts.newLine !== false) {
      // caller manages cursor via row()
    }
    return { x: x + w, w, h };
  }

  function row(fields: Array<{ num: string; label: string; value: string; w: number }>) {
    let x = M;
    let h = 9;
    ensure(h + 1);
    for (const fl of fields) {
      field(fl.num, fl.label, fl.value, fl.w, { x });
      x += fl.w;
    }
    y += h;
  }

  function checkbox(x: number, cy: number, checked: boolean) {
    doc.setDrawColor(60);
    doc.rect(x, cy - 2.3, 2.6, 2.6);
    if (checked) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("X", x + 0.4, cy + 0.1);
      doc.setFont("helvetica", "normal");
    }
  }

  function checkList(num: string, label: string, options: string[], selected: string[], cols = 3) {
    ensure(12);
    doc.setFontSize(7);
    doc.setTextColor(...labelGray);
    doc.setFont("helvetica", "bold");
    doc.text(`${num} ${label}`, M, y);
    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    y += 3;
    const colW = (W - 2 * M) / cols;
    let i = 0;
    for (const opt of options) {
      const col = i % cols;
      const x = M + col * colW;
      if (col === 0) ensure(5);
      checkbox(x, y + 2, selected.includes(opt));
      doc.text(opt, x + 3.6, y + 2.4);
      if (col === cols - 1) y += 4.2;
      i++;
    }
    if (i % cols !== 0) y += 4.2;
    y += 1.5;
  }

  function simNaoRow(num: string, label: string, items: string[], values: Record<string, string>) {
    ensure(6);
    doc.setFontSize(7);
    doc.setTextColor(...labelGray);
    doc.setFont("helvetica", "bold");
    doc.text(`${num} ${label}`, M, y);
    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    y += 3;
    for (const it of items) {
      ensure(5);
      const v = values[it] ?? "2";
      doc.text(it, M + 1, y + 2.4);
      checkbox(W - M - 22, y + 2, v === "1");
      doc.text("Sim", W - M - 18, y + 2.4);
      checkbox(W - M - 10, y + 2, v !== "1");
      doc.text("Não", W - M - 6, y + 2.4);
      y += 4.2;
    }
    y += 1;
  }

  // ===== Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("MINISTÉRIO DA SAÚDE · SINAN", M, y + 4);
  doc.setFontSize(11);
  doc.text("FICHA DE NOTIFICAÇÃO INDIVIDUAL", W / 2, y + 4, { align: "center" });
  doc.setFontSize(8);
  doc.text(`Nº ${notificacao?.id?.slice(0, 8).toUpperCase() ?? "—"}`, W - M, y + 4, { align: "right" });
  doc.setDrawColor(120);
  doc.line(M, y + 6, W - M, y + 6);
  y += 9;

  // ===== Dados Gerais
  section("DADOS GERAIS");
  row([
    { num: "#1", label: "Tipo de Notificação", value: "2 - Individual", w: 45 },
    { num: "#2", label: "Agravo/Doença", value: "VIOLÊNCIA INTERPESSOAL/AUTOPROVOCADA", w: 100 },
    { num: "CID 10", label: "", value: "Y09", w: 45 },
  ]);
  row([
    { num: "#3", label: "Data da Notificação", value: fmtDate(f.data_notificacao), w: 45 },
    { num: "#4", label: "UF", value: unidade?.uf ?? "", w: 25 },
    { num: "#5", label: "Município de Notificação", value: unidade?.municipio ?? "", w: 75 },
    { num: "#5", label: "Cód. IBGE", value: unidade?.cod_ibge ?? "", w: 45 },
  ]);
  row([
    { num: "#6", label: "Unidade Notificadora", value: unidadeNotif ? `${unidadeNotif.tipo} - ${unidadeNotif.nome}` : "", w: 95 },
    { num: "#8", label: "Unidade de Saúde", value: unidade?.nome ?? "", w: 70 },
    { num: "CNES", label: "", value: unidade?.cnes ?? "", w: 25 },
  ]);
  row([
    { num: "#9", label: "Data da Ocorrência da Violência", value: fmtDate(f.data_ocorrencia), w: 60 },
  ]);

  // ===== Notificação Individual
  section("NOTIFICAÇÃO INDIVIDUAL");
  row([
    { num: "#10", label: "Nome do Paciente", value: usuario.nome ?? "", w: 130 },
    { num: "#11", label: "Data de Nascimento", value: fmtDate(usuario.dt_nascimento), w: 35 },
    { num: "#12", label: "Idade", value: String(calcIdade(usuario.dt_nascimento) ?? ""), w: 25 },
  ]);
  row([
    { num: "#13", label: "Sexo", value: lookup(SEXO, usuario.sexo), w: 30 },
    { num: "#14", label: "Gestante", value: lookup(GESTANTE, usuario.sexo === "F" ? "" : "6"), w: 50 },
    { num: "#15", label: "Raça/Cor", value: lookup(RACA, usuario.raca), w: 40 },
    { num: "#16", label: "Escolaridade", value: lookup(ESCOLARIDADE, usuario.escolaridade), w: 70 },
  ]);
  row([
    { num: "#17", label: "Cartão SUS", value: usuario.cns ?? "", w: 60 },
    { num: "#18", label: "Nome da Mãe", value: usuario.nome_mae ?? "", w: 130 },
  ]);

  // ===== Residência
  section("DADOS DE RESIDÊNCIA");
  row([
    { num: "#19", label: "UF", value: usuario.uf ?? "", w: 20 },
    { num: "#20", label: "Município", value: usuario.municipio ?? "", w: 75 },
    { num: "#20", label: "Cód. IBGE", value: usuario.cod_ibge_municipio ?? "", w: 35 },
    { num: "#21", label: "Distrito", value: usuario.distrito ?? "", w: 60 },
  ]);
  row([
    { num: "#22", label: "Bairro", value: usuario.bairro ?? "", w: 70 },
    { num: "#23", label: "Logradouro", value: usuario.logradouro ?? "", w: 90 },
    { num: "#24", label: "Número", value: usuario.numero ?? "", w: 30 },
  ]);
  row([
    { num: "#25", label: "Complemento", value: usuario.complemento ?? "", w: 70 },
    { num: "#28", label: "Ponto Ref.", value: usuario.ponto_referencia ?? "", w: 60 },
    { num: "#29", label: "CEP", value: usuario.cep ?? "", w: 30 },
    { num: "#30", label: "Telefone", value: usuario.telefone ?? "", w: 30 },
  ]);
  row([
    { num: "#31", label: "Zona", value: lookup(ZONA, f.ocorrencia?.local === "1" ? f.ocorrencia.zona : (unidade?.codigo_unidade === "39" ? "2" : "1")), w: 50 },
    { num: "#32", label: "País", value: "BRASIL", w: 140 },
  ]);

  // ===== Pessoa Atendida
  section("DADOS DA PESSOA ATENDIDA");
  row([
    { num: "#33", label: "Nome Social", value: usuario.nome_social ?? "", w: 100 },
    { num: "#34", label: "Ocupação", value: usuario.ocupacao ?? "", w: 90 },
  ]);
  row([
    { num: "#35", label: "Estado Civil", value: lookup(ESTADO_CIVIL, usuario.estado_civil), w: 65 },
    { num: "#36", label: "Orientação Sexual", value: lookup(ORIENTACAO_SEXUAL, usuario.orientacao_sexual), w: 65 },
    { num: "#37", label: "Identidade de Gênero", value: lookup(IDENTIDADE_GENERO, usuario.identidade_genero), w: 60 },
  ]);
  row([
    { num: "#38", label: "Possui deficiência/transtorno?", value: usuario.tem_deficiencia ? "1 - Sim" : "2 - Não", w: 60 },
    { num: "#39", label: "Tipos", value: usuario.tem_deficiencia ? [...(usuario.deficiencia_tipos ?? []), usuario.deficiencia_outra].filter(Boolean).join(", ") : "Não se aplica", w: 130 },
  ]);

  // ===== Ocorrência
  section("DADOS DA OCORRÊNCIA");
  const oc = f.ocorrencia ?? {};
  row([
    { num: "#40", label: "UF", value: oc.uf ?? "", w: 20 },
    { num: "#41", label: "Município", value: oc.municipio ?? "", w: 70 },
    { num: "#42", label: "Distrito", value: oc.distrito ?? "", w: 50 },
    { num: "#43", label: "Bairro", value: oc.bairro ?? "", w: 50 },
  ]);
  row([
    { num: "#44", label: "Logradouro", value: oc.logradouro ?? "", w: 110 },
    { num: "#45", label: "Número", value: oc.numero ?? "", w: 30 },
    { num: "#46", label: "Complemento", value: oc.complemento ?? "", w: 50 },
  ]);
  row([
    { num: "#49", label: "Ponto de Referência", value: oc.ponto_referencia ?? "", w: 100 },
    { num: "#50", label: "Zona", value: lookup(ZONA, oc.zona), w: 40 },
    { num: "#51", label: "Hora", value: oc.hora ?? "", w: 25 },
    { num: "#52", label: "Local", value: lookup(LOCAL_OCORRENCIA, oc.local), w: 25 },
  ]);
  row([
    { num: "#53", label: "Ocorreu outras vezes?", value: oc.outras_vezes ? "1 - Sim" : "2 - Não", w: 95 },
    { num: "#54", label: "Lesão autoprovocada?", value: oc.autoprovocada ? "1 - Sim" : "2 - Não", w: 95 },
  ]);

  // ===== Violência
  section("VIOLÊNCIA");
  row([{ num: "#55", label: "Motivação da Violência", value: lookup(MOTIVACAO_VIOLENCIA, f.motivacao), w: 190 }]);
  checkList("#56", "Tipo de Violência", TIPO_VIOLENCIA, f.tipo_violencia ?? []);
  checkList("#57", "Meio de Agressão", MEIO_AGRESSAO, f.meio_agressao ?? []);

  // ===== Sexual
  const sexualAtiva = (f.tipo_violencia ?? []).includes("Sexual");
  section("VIOLÊNCIA SEXUAL");
  if (sexualAtiva) {
    checkList("#58", "Tipo de Violência Sexual", VIOLENCIA_SEXUAL_TIPOS, f.sexual_tipos ?? []);
    simNaoRow("#59", "Procedimento Realizado", PROCEDIMENTO_SEXUAL, f.procedimentos ?? {});
  } else {
    row([
      { num: "#58", label: "Tipo de Violência Sexual", value: "8 - Não se aplica", w: 95 },
      { num: "#59", label: "Procedimento Realizado", value: "8 - Não se aplica", w: 95 },
    ]);
  }

  // ===== Autor
  section("DADOS DO PROVÁVEL AUTOR DA VIOLÊNCIA");
  const au = f.autor ?? {};
  row([
    { num: "#60", label: "Nº de Envolvidos", value: lookup(NUMERO_ENVOLVIDOS, au.numero_envolvidos), w: 60 },
    { num: "#62", label: "Sexo do Autor", value: lookup(SEXO_AUTOR, au.sexo), w: 50 },
    { num: "#63", label: "Susp. uso álcool", value: lookup(SIM_NAO_IGN, au.uso_alcool), w: 40 },
    { num: "#64", label: "Ciclo de Vida", value: lookup(CICLO_VIDA_AUTOR, au.ciclo_vida), w: 40 },
  ]);
  checkList("#61", "Vínculo / Grau de Parentesco com a Pessoa Atendida", VINCULO_AUTOR, au.vinculos ?? []);

  // ===== Encaminhamento
  section("ENCAMINHAMENTO");
  simNaoRow("#65", "Encaminhamento", ENCAMINHAMENTO, f.encaminhamentos ?? {});

  // ===== Dados Finais
  section("DADOS FINAIS");
  row([
    { num: "#66", label: "Violência relacionada ao trabalho", value: lookup(SIM_NAO_IGN, f.relacionada_trabalho), w: 95 },
    { num: "#67", label: "CAT emitida", value: f.relacionada_trabalho === "1" ? lookup(SIM_NAO_IGN, f.cat_emitida) : "8 - Não se aplica", w: 95 },
  ]);
  ensure(20);
  doc.setDrawColor(180);
  doc.rect(M, y, W - 2 * M, 18);
  doc.setFontSize(6.5);
  doc.setTextColor(...labelGray);
  doc.setFont("helvetica", "bold");
  doc.text("#68 Circunstância da Lesão (preenchido pela Epidemiologia)", M + 1, y + 2.4);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(0);
  const lines = doc.splitTextToSize(circLesao ?? "", W - 2 * M - 2);
  doc.text(lines.slice(0, 4), M + 1, y + 6);
  y += 19;
  row([{ num: "#69", label: "Data de Encerramento", value: fmtDate(f.data_notificacao), w: 60 }]);

  // ===== Observações
  section("OBSERVAÇÕES ADICIONAIS");
  const ob = f.obs ?? {};
  row([
    { num: "•", label: "Nome do Acompanhante", value: ob.acompanhante ?? "", w: 100 },
    { num: "•", label: "Vínculo/Parentesco", value: ob.vinculo ?? "", w: 60 },
    { num: "•", label: "Telefone", value: ob.telefone ?? "", w: 30 },
  ]);
  ensure(22);
  doc.setDrawColor(180);
  doc.rect(M, y, W - 2 * M, 20);
  doc.setFontSize(6.5);
  doc.setTextColor(...labelGray);
  doc.setFont("helvetica", "bold");
  doc.text("Observações", M + 1, y + 2.4);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(0);
  const obsLines = doc.splitTextToSize(ob.adicionais ?? "", W - 2 * M - 2);
  doc.text(obsLines.slice(0, 5), M + 1, y + 6);
  y += 22;

  // ===== Notificador
  section("NOTIFICADOR");
  row([
    { num: "•", label: "Município / Unidade de Saúde", value: unidade?.nome ?? "", w: 130 },
    { num: "•", label: "Cód. CNES", value: unidade?.cnes ?? "", w: 60 },
  ]);
  row([
    { num: "•", label: "Nome do Profissional", value: profissional?.nome ?? "", w: 130 },
    { num: "•", label: "Função", value: profissional?.ocupacao ?? "", w: 60 },
  ]);

  // Footer
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(120);
    doc.text(`SINAN · Y09 · gerado em ${new Date().toLocaleString("pt-BR")}`, M, H - 4);
    doc.text(`Página ${i}/${pages}`, W - M, H - 4, { align: "right" });
  }

  const fname = `ficha-violencia-${usuario.nome?.replace(/\s+/g, "_") ?? "paciente"}-${f.data_notificacao ?? ""}.pdf`;
  doc.save(fname);
}