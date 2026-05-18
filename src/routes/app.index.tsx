import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Users, Hospital, Building2, Stethoscope } from "lucide-react";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

function Dashboard() {
  const items = [
    { to: "/app/notificacoes", title: "Notificações", icon: FileText, desc: "Fichas de violência (Y09)" },
    { to: "/app/usuarios-sus", title: "Usuários SUS", icon: Users, desc: "Pacientes / Prontuário" },
    { to: "/app/unidades-saude", title: "Unidades de Saúde", icon: Hospital, desc: "UBS / CNES" },
    { to: "/app/unidades-notificadoras", title: "Unid. Notificadoras", icon: Building2, desc: "Vigilância Epidemiológica" },
    { to: "/app/profissionais", title: "Profissionais", icon: Stethoscope, desc: "Equipe de saúde" },
  ] as const;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Painel</h1>
        <p className="text-muted-foreground">Notificação de Violência Interpessoal/Autoprovocada — CID Y09</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <Link key={it.to} to={it.to}>
            <Card className="h-full hover:border-primary transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <it.icon className="h-4 w-4" /> {it.title}
                </CardTitle>
                <CardDescription>{it.desc}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}