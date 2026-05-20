import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { FileDown } from "lucide-react";
import { exportNotificacoesXML, type SinanRow } from "@/lib/sinan-xml";
import { toast } from "sonner";

export const Route = createFileRoute("/app/export-sinan")({
  component: Page,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

function Page() {
  const [rows, setRows] = useState<Row[]>([]);
  const [units, setUnits] = useState<Row[]>([]);
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [unit, setUnit] = useState<string>("__all");
  const [status, setStatus] = useState<string>("encerrada");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);

  async function load() {
    let q = supabase
      .from("notificacoes_violencia")
      .select("id,status,data_notificacao,circunstancia_lesao,usuario_sus_id,unidade_saude_id,unidade_notificadora_id,profissional_id,payload,data_ocorrencia,usuarios_sus(nome),unidades_saude(nome)")
      .order("data_notificacao", { ascending: false })
      .limit(500);
    if (status !== "__all") q = q.eq("status", status);
    if (from) q = q.gte("data_notificacao", from);
    if (to) q = q.lte("data_notificacao", to);
    if (unit !== "__all") q = q.eq("unidade_saude_id", unit);
    const { data } = await q;
    setRows(data ?? []);
    setSelected({});
  }

  useEffect(() => {
    supabase.from("unidades_saude").select("id,nome").order("nome").then(({ data }) => setUnits(data ?? []));
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedIds = useMemo(() => Object.entries(selected).filter(([, v]) => v).map(([k]) => k), [selected]);
  const allChecked = rows.length > 0 && rows.every((r) => selected[r.id]);

  async function exportXML(ids: string[]) {
    setBusy(true);
    try {
      const list = rows.filter((r) => ids.includes(r.id));
      // hydrate usuario / unidade / profissional referenciados
      const usuarioIds = Array.from(new Set(list.map((r) => r.usuario_sus_id).filter(Boolean)));
      const unidadeIds = Array.from(new Set(list.map((r) => r.unidade_saude_id).filter(Boolean)));
      const unidNotifIds = Array.from(new Set(list.map((r) => r.unidade_notificadora_id).filter(Boolean)));
      const profIds = Array.from(new Set(list.map((r) => r.profissional_id).filter(Boolean)));

      const [us, ud, un, pr] = await Promise.all([
        usuarioIds.length ? supabase.from("usuarios_sus").select("*").in("id", usuarioIds) : Promise.resolve({ data: [] }),
        unidadeIds.length ? supabase.from("unidades_saude").select("*").in("id", unidadeIds) : Promise.resolve({ data: [] }),
        unidNotifIds.length ? supabase.from("unidades_notificadoras").select("*").in("id", unidNotifIds) : Promise.resolve({ data: [] }),
        profIds.length ? supabase.from("profissionais").select("*").in("id", profIds) : Promise.resolve({ data: [] }),
      ]);
      const usMap = new Map((us.data ?? []).map((x: Row) => [x.id, x]));
      const udMap = new Map((ud.data ?? []).map((x: Row) => [x.id, x]));
      const unMap = new Map((un.data ?? []).map((x: Row) => [x.id, x]));
      const prMap = new Map((pr.data ?? []).map((x: Row) => [x.id, x]));

      const sinanRows: SinanRow[] = list.map((r) => ({
        notificacao: r,
        usuario: usMap.get(r.usuario_sus_id),
        unidade: udMap.get(r.unidade_saude_id),
        unidadeNotif: unMap.get(r.unidade_notificadora_id),
        profissional: prMap.get(r.profissional_id),
      }));
      await exportNotificacoesXML(sinanRows);
      toast.success(`${sinanRows.length} ficha(s) exportada(s)`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Exportar SINAN Net (XML)</h1>
        <p className="text-sm text-muted-foreground">Gera arquivo XML compatível com importação no SINAN Net.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Filtros</CardTitle><CardDescription>Selecione o período e unidade. Recomendado exportar apenas notificações encerradas.</CardDescription></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-5 items-end">
          <div className="space-y-1"><Label>De</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div className="space-y-1"><Label>Até</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          <div className="space-y-1"><Label>Unidade</Label>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Todas</SelectItem>
                {units.map((u) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="encerrada">Encerradas</SelectItem>
                <SelectItem value="epi">Em Epi</SelectItem>
                <SelectItem value="ubs">Em UBS</SelectItem>
                <SelectItem value="__all">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={load}>Aplicar filtros</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Resultados ({rows.length})</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" disabled={busy || selectedIds.length === 0} onClick={() => exportXML(selectedIds)}>
              <FileDown className="h-4 w-4 mr-1" /> Exportar selecionados ({selectedIds.length})
            </Button>
            <Button disabled={busy || rows.length === 0} onClick={() => exportXML(rows.map((r) => r.id))}>
              <FileDown className="h-4 w-4 mr-1" /> Exportar todos
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead className="w-10">
                <Checkbox checked={allChecked} onCheckedChange={(c) => {
                  const all: Record<string, boolean> = {};
                  if (c) rows.forEach((r) => (all[r.id] = true));
                  setSelected(all);
                }} />
              </TableHead>
              <TableHead>Data Notif.</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>#68</TableHead>
            </TableRow></TableHeader>
            <TableBody>{rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell><Checkbox checked={!!selected[r.id]} onCheckedChange={(c) => setSelected((s) => ({ ...s, [r.id]: !!c }))} /></TableCell>
                <TableCell>{r.data_notificacao}</TableCell>
                <TableCell className="font-medium">{r.usuarios_sus?.nome}</TableCell>
                <TableCell>{r.unidades_saude?.nome ?? "-"}</TableCell>
                <TableCell><Badge variant={r.status === "encerrada" ? "outline" : r.status === "epi" ? "default" : "secondary"}>{r.status}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.circunstancia_lesao ?? "—"}</TableCell>
              </TableRow>
            ))}{rows.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma notificação para os filtros atuais.</TableCell></TableRow>
            )}</TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}