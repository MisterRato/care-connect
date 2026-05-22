// Traduz mensagens de erro do Supabase/Postgres para pt-BR.
// Cobre as heurísticas H2 (linguagem do usuário) e H9 (recuperação de erros)
// apontadas no relatório de usabilidade.

const AUTH_MAP: Record<string, string> = {
  "invalid login credentials": "E-mail ou senha inválidos.",
  "invalid email or password": "E-mail ou senha inválidos.",
  "email not confirmed": "Confirme seu e-mail antes de entrar.",
  "user already registered": "Já existe uma conta com este e-mail.",
  "user not found": "Usuário não encontrado.",
  "password should be at least 6 characters":
    "A senha deve ter pelo menos 6 caracteres.",
  "signup requires a valid password": "Informe uma senha válida.",
  "email rate limit exceeded":
    "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  "rate limit exceeded":
    "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  "new password should be different from the old password":
    "A nova senha deve ser diferente da anterior.",
  "token has expired or is invalid":
    "Link expirado ou inválido. Solicite um novo.",
  "unable to validate email address: invalid format":
    "Formato de e-mail inválido.",
  "auth session missing!": "Sessão expirada. Entre novamente.",
  "network request failed":
    "Falha de conexão. Verifique sua internet e tente novamente.",
  "failed to fetch":
    "Falha de conexão. Verifique sua internet e tente novamente.",
};

const PG_CODE_MAP: Record<string, string> = {
  "23505": "Já existe um registro com esses dados.",
  "23503": "Não é possível concluir: existe vínculo com outros registros.",
  "23502": "Preencha os campos obrigatórios.",
  "23514": "Dados inválidos para este registro.",
  "42501": "Você não tem permissão para esta operação.",
  PGRST301: "Sessão expirada. Entre novamente.",
};

export function translateError(err: unknown): string {
  if (!err) return "Erro inesperado.";
  const anyErr = err as { message?: string; code?: string };
  const code = anyErr?.code;
  if (code && PG_CODE_MAP[code]) return PG_CODE_MAP[code];

  const raw =
    typeof err === "string"
      ? err
      : anyErr?.message ?? (err instanceof Error ? err.message : "");
  const key = raw.trim().toLowerCase();
  if (AUTH_MAP[key]) return AUTH_MAP[key];

  // tentativa por substring
  for (const k of Object.keys(AUTH_MAP)) {
    if (key.includes(k)) return AUTH_MAP[k];
  }
  return raw || "Erro inesperado.";
}