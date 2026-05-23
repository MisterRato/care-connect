import { createFileRoute, Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, ChevronDown } from "lucide-react";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { loading, session, roles, isAdmin, isEpi, isUbs, signOut, user } = useAuth();
  const [profCheck, setProfCheck] = useState<"idle" | "checking" | "done">("idle");

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/login" });
  }, [loading, session, navigate]);

  // After login, ensure the user is linked to a profissional record.
  // Skip when already on the completar-cadastro page to avoid loops.
  useEffect(() => {
    if (loading || !session || !user) return;
    if (pathname.startsWith("/app/completar-cadastro")) return;
    if (profCheck !== "idle") return;
    setProfCheck("checking");
    (async () => {
      const email = user.email ?? "";
      // 1) by user_id
      const { data: byUid } = await supabase
        .from("profissionais")
        .select("id,user_id,email")
        .eq("user_id", user.id)
        .maybeSingle();
      if (byUid) {
        setProfCheck("done");
        return;
      }
      // 2) by email (link if found)
      if (email) {
        const { data: byEmail } = await supabase
          .from("profissionais")
          .select("id,user_id")
          .ilike("email", email)
          .maybeSingle();
        if (byEmail) {
          if (!byEmail.user_id) {
            await supabase.from("profissionais").update({ user_id: user.id }).eq("id", byEmail.id);
          }
          setProfCheck("done");
          return;
        }
      }
      setProfCheck("done");
      navigate({ to: "/app/completar-cadastro" });
    })();
  }, [loading, session, user, pathname, profCheck, navigate]);

  if (loading || !session) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto px-4 h-14 flex items-center gap-6">
          <Link to="/app" className="font-semibold">SISViolência</Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/app" activeProps={{ className: "text-primary font-medium" }} activeOptions={{ exact: true }}>
              Início
            </Link>
            <Link to="/app/notificacoes" activeProps={{ className: "text-primary font-medium" }}>
              Notificações
            </Link>
            {(isEpi || isAdmin) && (
              <Link to="/app/epi" activeProps={{ className: "text-primary font-medium" }}>
                Fila Epi
              </Link>
            )}
            {(isEpi || isAdmin) && (
              <Link to="/app/export-sinan" activeProps={{ className: "text-primary font-medium" }}>
                Exportar SINAN
              </Link>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`inline-flex items-center gap-1 transition-colors hover:text-foreground ${
                    pathname.startsWith("/app/usuarios-sus") ||
                    pathname.startsWith("/app/unidades-saude") ||
                    pathname.startsWith("/app/unidades-notificadoras") ||
                    pathname.startsWith("/app/profissionais") ||
                    pathname.startsWith("/app/papeis")
                      ? "text-primary font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  Cadastro <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem asChild>
                  <Link to="/app/usuarios-sus" className="w-full cursor-pointer">Usuários SUS</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/app/unidades-saude" className="w-full cursor-pointer">Unidades de Saúde</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/app/unidades-notificadoras" className="w-full cursor-pointer">Unid. Notificadoras</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/app/profissionais" className="w-full cursor-pointer">Profissionais</Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/app/papeis" className="w-full cursor-pointer">Papéis</Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{user?.email}</span>
            <div className="flex gap-1">
              {isAdmin && <Badge variant="default">admin</Badge>}
              {isUbs && !isAdmin && <Badge variant="secondary">UBS</Badge>}
              {isEpi && !isAdmin && <Badge variant="outline">Epi</Badge>}
              {roles.length === 0 && <Badge variant="destructive">sem papel</Badge>}
            </div>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}