// Utilitários de formatação pt-BR — H4 (consistência) e H5 (prevenção de erros).

export function formatDateBR(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR");
}

export function formatDateTimeBR(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("pt-BR");
}

/** Aplica máscara de CPF: 000.000.000-00 */
export function maskCPF(value: string): string {
  const d = (value || "").replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

/** Aplica máscara de telefone BR: (00) 00000-0000 ou (00) 0000-0000 */
export function maskPhoneBR(value: string): string {
  const d = (value || "").replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) {
    return d
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  }
  return d
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

/** Aplica máscara de CNS (cartão SUS): 000 0000 0000 0000 */
export function maskCNS(value: string): string {
  const d = (value || "").replace(/\D/g, "").slice(0, 15);
  return d.replace(/(\d{3})(\d{4})(\d{4})(\d{0,4})/, (_m, a, b, c, e) =>
    [a, b, c, e].filter(Boolean).join(" "),
  );
}