import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/notificacoes")({
  component: Page,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

function Page() {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    supabase
      .from("notificacoes_violencia")
      .select("id,status,data_notificacao,data_ocorrencia,usuario_sus_id,unidade_saude_id,usuarios_sus(nome),unidades_saude(nome)")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => setRows(data ?? []));
  }, []);

  // If a child route is matched, show only the outlet
  // (we always render outlet — but child handles its own content)
  return (
    <div className="space-y-6">
      <Outlet />
      <ListView rows={rows} />
    </div>
  );
}

function ListView({ rows }: { rows: Row[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Notificações de Violência (Y09)</CardTitle>
        <Link to="/app/usuarios-sus"><Button size="sm">Nova ficha (selecionar paciente)</Button></Link>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow>
            <TableHead>Data Notif.</TableHead><TableHead>Paciente</TableHead>
            <TableHead>Unidade</TableHead><TableHead>Data ocorrência</TableHead>
            <TableHead>Status</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>{rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{r.data_notificacao}</TableCell>
              <TableCell className="font-medium">{r.usuarios_sus?.nome}</TableCell>
              <TableCell>{r.unidades_saude?.nome ?? "-"}</TableCell>
              <TableCell>{r.data_ocorrencia ?? "-"}</TableCell>
              <TableCell>
                <Badge variant={r.status === "ubs" ? "secondary" : r.status === "epi" ? "default" : "outline"}>
                  {r.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Link to="/app/notificacoes/$id" params={{ id: r.id }}>
                  <Button size="sm" variant="outline">Abrir</Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}{rows.length === 0 && (
            <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma notificação ainda.</TableCell></TableRow>
          )}</TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}