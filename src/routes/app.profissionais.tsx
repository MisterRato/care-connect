import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export const Route = createFileRoute("/app/profissionais")({
  component: Page,
});

type UnidSaude = { id: string; nome: string };
type Row = { id: string; nome: string; ocupacao: string | null; unidade_saude_id: string | null };

function Page() {
  const [rows, setRows] = useState<Row[]>([]);
  const [unidades, setUnidades] = useState<UnidSaude[]>([]);
  const [form, setForm] = useState({ nome: "", ocupacao: "", unidade_saude_id: "" });
  const [busy, setBusy] = useState(false);

  async function load() {
    const [{ data: p }, { data: u }] = await Promise.all([
      supabase.from("profissionais").select("*").order("nome"),
      supabase.from("unidades_saude").select("id,nome").order("nome"),
    ]);
    setRows((p ?? []) as Row[]);
    setUnidades((u ?? []) as UnidSaude[]);
  }
  useEffect(() => { load(); }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const payload = { ...form, unidade_saude_id: form.unidade_saude_id || null };
    const { error } = await supabase.from("profissionais").insert(payload);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Profissional cadastrado");
    setForm({ nome: "", ocupacao: "", unidade_saude_id: "" });
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Profissionais de Saúde</h1>
      <Card>
        <CardHeader><CardTitle>Novo profissional</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={save} className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1"><Label>Nome *</Label>
              <Input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
            <div className="space-y-1"><Label>Descr. Ocupação</Label>
              <Input value={form.ocupacao} onChange={(e) => setForm({ ...form, ocupacao: e.target.value })} /></div>
            <div className="space-y-1"><Label>Unidade de Saúde</Label>
              <Select value={form.unidade_saude_id} onValueChange={(v) => setForm({ ...form, unidade_saude_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{unidades.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                ))}</SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3"><Button disabled={busy} type="submit">{busy ? "..." : "Salvar"}</Button></div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Cadastrados ({rows.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Ocupação</TableHead><TableHead>Unidade</TableHead></TableRow></TableHeader>
            <TableBody>{rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.nome}</TableCell><TableCell>{r.ocupacao}</TableCell>
                <TableCell>{unidades.find((u) => u.id === r.unidade_saude_id)?.nome ?? "-"}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}