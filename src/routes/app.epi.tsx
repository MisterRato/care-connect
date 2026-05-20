import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, AlertTriangle, CheckCircle2, ListChecks } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export const Route = createFileRoute("/app/epi")({
  component: Page,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

function diffDays(a: string, b: string) {
  return Math.max(0, Math.floor((+new Date(b) - +new Date(a)) / 86400000));
}

function Page() {
  const navigate = useNavigate();
  const { isEpi, isAdmin, loading } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [units, setUnits] = useState<Row[]>([]);
  const [filterUnit, setFilterUnit] = useState<string>("__all");
  const [filterFrom, setFilterFrom] = useState<string>("");

  useEffect(() => {
    if (loading) return;
    if (!isEpi && !isAdmin) {
      navigate({ to: "/app" });
    }
  }, [loading, isEpi, isAdmin, navigate]);

  async function load() {
    const [{ data }, { data: u }] = await Promise.all([
      supabase
        .from("notificacoes_violencia")
        .select("id,status,data_notificacao,data_ocorrencia,circunstancia_lesao,unidade_saude_id,usuarios_sus(nome),unidades_saude(nome)")
        .order("data_notificacao", { ascending: false })
        .limit(500),
      supabase.from("unidades_saude").select("id,nome").order("nome"),
    ]);
    setRows(data ?? []);
    setUnits(u ?? []);
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filterUnit !== "__all" && r.unidade_saude_id !== filterUnit) return false;
      if (filterFrom && r.data_notificacao < filterFrom) return false;
      return true;
    });
  }, [rows, filterUnit, filterFrom]);

  const pendentes = filtered.filter((r) => r.status === "ubs" || r.status === "epi");
  const concluidas = filtered.filter((r) => r.status === "encerrada");
  const hoje = new Date().toISOString().slice(0, 10);

  const tempoMedio = useMemo(() => {
    if (pendentes.length === 0) return 0;
    const total = pendentes.reduce((acc, r) => acc + diffDays(r.data_notificacao, hoje), 0);
    return Math.round(total / pendentes.length);
  }, [pendentes, hoje]);

  const atrasadas = pendentes.filter((r) => diffDays(r.data_notificacao, hoje) > 7).length;

  const mensal = useMemo(() => {
    const buckets: Record<string, { mes: string; criadas: number; encerradas: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const k = d.toISOString().slice(0, 7);
      buckets[k] = { mes: k, criadas: 0, encerradas: 0 };
    }
    for (const r of filtered) {
      const k = String(r.data_notificacao).slice(0, 7);
      if (buckets[k]) {
        buckets[k].criadas++;
        if (r.status === "encerrada") buckets[k].encerradas++;
      }
    }
    return Object.values(buckets);
  }, [filtered]);

  async function assumir(id: string) {
    const { error } = await supabase.from("notificacoes_violencia").update({ status: "epi" }).eq("id", id);
    if (!error) load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Fila de Epidemiologia</h1>
        <p className="text-sm text-muted-foreground">Notificações aguardando preenchimento do campo #68 (Circunstância da Lesão).</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard icon={<ListChecks className="h-4 w-4" />} label="Pendentes" value={pendentes.length} />
        <MetricCard icon={<Clock className="h-4 w-4" />} label="Tempo médio (dias)" value={tempoMedio} />
        <MetricCard icon={<AlertTriangle className="h-4 w-4" />} label="Atrasadas (>7d)" value={atrasadas} accent={atrasadas > 0 ? "destructive" : undefined} />
        <MetricCard icon={<CheckCircle2 className="h-4 w-4" />} label="Encerradas" value={concluidas.length} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Notificações por mês</CardTitle></CardHeader>
        <CardContent style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mensal}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="mes" fontSize={12} />
              <YAxis fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="criadas" fill="hsl(var(--primary))" name="Criadas" />
              <Bar dataKey="encerradas" fill="hsl(var(--muted-foreground))" name="Encerradas" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fila de pendentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label>Unidade</Label>
              <Select value={filterUnit} onValueChange={setFilterUnit}>
                <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">Todas as unidades</SelectItem>
                  {units.map((u) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Desde</Label>
              <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setFilterUnit("__all"); setFilterFrom(""); }}>Limpar</Button>
          </div>

          {pendentes.length === 0 ? (
            <Alert><AlertDescription>Nenhuma notificação pendente. Tudo em dia!</AlertDescription></Alert>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Data Notif.</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Espera</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow></TableHeader>
              <TableBody>{pendentes.map((r) => {
                const dias = diffDays(r.data_notificacao, hoje);
                return (
                  <TableRow key={r.id}>
                    <TableCell>{r.data_notificacao}</TableCell>
                    <TableCell className="font-medium">{r.usuarios_sus?.nome}</TableCell>
                    <TableCell>{r.unidades_saude?.nome ?? "-"}</TableCell>
                    <TableCell>
                      <span className={dias > 7 ? "text-destructive font-medium" : ""}>{dias} dia{dias === 1 ? "" : "s"}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.status === "ubs" ? "secondary" : "default"}>{r.status}</Badge>
                    </TableCell>
                    <TableCell className="flex gap-2 justify-end">
                      {r.status === "ubs" && (
                        <Button size="sm" variant="outline" onClick={() => assumir(r.id)}>Assumir</Button>
                      )}
                      <Link to="/app/notificacoes/$id" params={{ id: r.id }}>
                        <Button size="sm">Preencher #68</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}</TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent?: "destructive" }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon} {label}</div>
        <div className={`text-3xl font-semibold mt-2 ${accent === "destructive" ? "text-destructive" : ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}