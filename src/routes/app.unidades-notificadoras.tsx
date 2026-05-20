import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UNIDADE_NOTIFICADORA_TIPOS } from "@/lib/violencia-options";
import { toast } from "sonner";
import { Pencil, X } from "lucide-react";

export const Route = createFileRoute("/app/unidades-notificadoras")({
  component: Page,
});

type Row = { id: string; tipo: number; nome: string };

function Page() {
  const [rows, setRows] = useState<Row[]>([]);
  const [tipo, setTipo] = useState("1");
  const [nome, setNome] = useState("");
  const [busy, setBusy] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase.from("unidades_notificadoras").select("*").order("nome");
    setRows((data ?? []) as Row[]);
  }
  useEffect(() => { load(); }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = editId
      ? await supabase.from("unidades_notificadoras").update({ tipo: Number(tipo), nome }).eq("id", editId)
      : await supabase.from("unidades_notificadoras").insert({ tipo: Number(tipo), nome });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(editId ? "Atualizado" : "Cadastrado");
    setNome("");
    setEditId(null);
    setTipo("1");
    load();
  }

  function startEdit(r: Row) {
    setEditId(r.id);
    setTipo(String(r.tipo));
    setNome(r.nome);
  }
  function cancelEdit() {
    setEditId(null);
    setNome("");
    setTipo("1");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Unidades Notificadoras</h1>
      <p className="text-sm text-muted-foreground">Cadastro → Vigilância Epidemiológica → Unidade Notificadora</p>
      <Card>
        <CardHeader><CardTitle>{editId ? "Editar" : "Nova"}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={save} className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1"><Label>Tipo *</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{UNIDADE_NOTIFICADORA_TIPOS.map((o) => (
                  <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                ))}</SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 space-y-1"><Label>Nome da Unidade Notificadora *</Label>
              <Input required value={nome} onChange={(e) => setNome(e.target.value)} /></div>
            <div className="md:col-span-3 flex gap-2">
              <Button disabled={busy} type="submit">{busy ? "..." : "Salvar"}</Button>
              {editId && <Button type="button" variant="ghost" onClick={cancelEdit}><X className="h-4 w-4 mr-1" />Cancelar</Button>}
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Cadastradas ({rows.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Nome</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>{rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{UNIDADE_NOTIFICADORA_TIPOS.find((t) => t.value === r.tipo)?.label}</TableCell>
                <TableCell>{r.nome}</TableCell>
                <TableCell><Button size="sm" variant="ghost" onClick={() => startEdit(r)}><Pencil className="h-3 w-3 mr-1" />Editar</Button></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}