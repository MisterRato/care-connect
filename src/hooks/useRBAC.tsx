/**
 * useRBAC — Controle de Acesso Baseado em Função (frontend).
 *
 * Defesa em profundidade: a validação real ocorre no banco via RLS
 * com a função `has_role()`. Este módulo apenas oculta UI quando o
 * usuário não tem permissão.
 *
 * OWASP A01:2021 / LGPD Art. 6º VII / Art. 46.
 */
import { useCallback, useMemo, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";

export type UserRole = "admin" | "epidemiologia" | "ubs";

export type Permission =
  | "notificacao:read"
  | "notificacao:create"
  | "notificacao:edit"
  | "notificacao:edit_circunstancia" // somente epi/admin (#68)
  | "usuario_sus:read"
  | "usuario_sus:write"
  | "profissional:write"
  | "unidade:write"
  | "export:sinan"
  | "users:manage"
  | "logs:read";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    "notificacao:read",
    "notificacao:create",
    "notificacao:edit",
    "notificacao:edit_circunstancia",
    "usuario_sus:read",
    "usuario_sus:write",
    "profissional:write",
    "unidade:write",
    "export:sinan",
    "users:manage",
    "logs:read",
  ],
  epidemiologia: [
    "notificacao:read",
    "notificacao:edit",
    "notificacao:edit_circunstancia",
    "usuario_sus:read",
    "export:sinan",
  ],
  ubs: [
    "notificacao:read",
    "notificacao:create",
    "notificacao:edit",
    "usuario_sus:read",
    "usuario_sus:write",
    "profissional:write",
  ],
};

export function hasPermission(roles: UserRole[], permission: Permission): boolean {
  return roles.some((r) => ROLE_PERMISSIONS[r]?.includes(permission));
}

export function useRBAC() {
  const { roles } = useAuth();
  const typedRoles = roles as UserRole[];

  const can = useCallback(
    (permission: Permission) => hasPermission(typedRoles, permission),
    [typedRoles],
  );

  const primaryRole = useMemo<UserRole | null>(() => {
    if (typedRoles.includes("admin")) return "admin";
    if (typedRoles.includes("epidemiologia")) return "epidemiologia";
    if (typedRoles.includes("ubs")) return "ubs";
    return null;
  }, [typedRoles]);

  return { roles: typedRoles, role: primaryRole, can };
}

interface RequirePermissionProps {
  permission: Permission;
  fallback?: ReactNode;
  children: ReactNode;
}

export function RequirePermission({
  permission,
  fallback = null,
  children,
}: RequirePermissionProps) {
  const { can } = useRBAC();
  return <>{can(permission) ? children : fallback}</>;
}