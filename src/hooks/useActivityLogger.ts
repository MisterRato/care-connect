/**
 * useActivityLogger
 *
 * Registro de logs de atividade — OWASP A09:2021 / LGPD Art. 46.
 * Anonimiza identificadores de recursos antes de gravar (minimização de dados).
 * Falhas no log nunca bloqueiam a operação principal.
 */
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type ActivityAction =
  | "LOGIN"
  | "LOGOUT"
  | "LOGIN_FAILED"
  | "VIEW_NOTIFICACAO"
  | "CREATE_NOTIFICACAO"
  | "EDIT_NOTIFICACAO"
  | "VIEW_USUARIO_SUS"
  | "EDIT_USUARIO_SUS"
  | "EXPORT_SINAN"
  | "CHANGE_ROLE"
  | "ACCESS_DENIED";

export interface ActivityLogEntry {
  action: ActivityAction;
  resource?: string; // ex: "notificacao:uuid" — sem dados pessoais
  metadata?: Record<string, string | number | boolean>;
  success?: boolean;
}

function anonymizeResource(resource?: string): string | null {
  if (!resource) return null;
  const [type, id] = resource.split(":");
  if (!id) return type;
  return `${type}:${id.slice(0, 6)}***`;
}

export function useActivityLogger() {
  const { user } = useAuth();

  const log = useCallback(
    async (entry: ActivityLogEntry) => {
      try {
        const { error } = await supabase.from("activity_logs").insert({
          user_id: user?.id ?? null,
          action: entry.action,
          resource: anonymizeResource(entry.resource),
          metadata: entry.metadata ?? {},
          success: entry.success ?? true,
        });
        if (error) {
          console.warn("[ActivityLogger] Falha ao registrar log:", error.message);
        }
      } catch (err) {
        console.warn("[ActivityLogger] Erro inesperado:", err);
      }
    },
    [user],
  );

  return { log };
}