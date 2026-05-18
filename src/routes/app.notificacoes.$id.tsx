import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FichaViolencia } from "@/components/notificacao/FichaViolencia";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/app/notificacoes/$id")({
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [notif, setNotif] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [usuario, setUsuario] = useState<any>(null);
  useEffect(() => {
    supabase.from("notificacoes_violencia").select("*").eq("id", id).single().then(async ({ data }) => {
      setNotif(data);
      if (data) {
        const { data: u } = await supabase.from("usuarios_sus").select("*").eq("id", data.usuario_sus_id).single();
        setUsuario(u);
      }
    });
  }, [id]);
  if (!notif || !usuario) return <div className="text-muted-foreground">Carregando...</div>;
  return (
    <div className="space-y-3">
      <Link to="/app/notificacoes"><Button variant="ghost" size="sm"><ChevronLeft className="h-4 w-4 mr-1" />Voltar</Button></Link>
      <FichaViolencia usuario={usuario} notificacao={notif} />
    </div>
  );
}