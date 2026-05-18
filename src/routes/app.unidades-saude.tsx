import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export const Route = createFileRoute("/app/unidades-saude")({
  component: Page,
});

type Row = {
  id: string; nome: string; cnes: string | null; uf: string | null;
  municipio: string | null; cod_ibge: string | null; codigo_unidade: string | null; equipe: string | null;
};

function Page() {
  const [rows, setRows] = useState<Row[]>([]);
  const [form, setForm] = useState({ nome: "", cnes: "", uf: "", municipio: "", cod_ibge: "", codigo_unidade: "", equipe: "" });
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data } = await supabase.from("unidades_saude").select("*").order("nome");
    setRows((data ?? []) as Row[]);
  }
  useEffect(() => { load(); }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("unidades_saude").insert(form);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Unidade cadastrada");
    setForm({ nome: "", cnes: "", uf: "", municipio: "", cod_ibge: "", codigo_unidade: "", equipe: "" });
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Unidades de Saúde</h1>
      <Card>
        <CardHeader><CardTitle>Nova unidade</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={save} className="grid gap-3 md:grid-cols-4">
            <div className="md:col-span-2 space-y-1"><Label>Unidade de Saúde *</Label>
              <Input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
            <div className="space-y-1"><Label>Cód. C.N.E.S.</Label>
              <Input value={form.cnes} onChange={(e) => setForm({ ...form, cnes: e.target.value })} /></div>
            <div className="space-y-1"><Label>Código Unidade</Label>
              <Input value={form.codigo_unidade} onChange={(e) => setForm({ ...form, codigo_unidade: e.target.value })} placeholder="ex: 39" /></div>
            <div className="space-y-1"><Label>UF</Label>
              <Input maxLength={2} value={form.uf} onChange={(e) => setForm({ ...form, uf: e.target.value.toUpperCase() })} /></div>
            <div className="space-y-1"><Label>Município</Label>
              <Input value={form.municipio} onChange={(e) => setForm({ ...form, municipio: e.target.value })} /></div>
            <div className="space-y-1"><Label>Cód. IBGE</Label>
              <Input value={form.cod_ibge} onChange={(e) => setForm({ ...form, cod_ibge: e.target.value })} /></div>
            <div className="space-y-1"><Label>Equipe</Label>
              <Input value={form.equipe} onChange={(e) => setForm({ ...form, equipe: e.target.value })} placeholder="ex: 57" /></div>
            <div className="md:col-span-4"><Button disabled={busy} type="submit">{busy ? "Salvando..." : "Salvar"}</Button></div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Cadastradas ({rows.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Nome</TableHead><TableHead>CNES</TableHead><TableHead>Cód</TableHead>
              <TableHead>UF</TableHead><TableHead>Município</TableHead><TableHead>Equipe</TableHead>
            </TableRow></TableHeader>
            <TableBody>{rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.nome}</TableCell><TableCell>{r.cnes}</TableCell><TableCell>{r.codigo_unidade}</TableCell>
                <TableCell>{r.uf}</TableCell><TableCell>{r.municipio}</TableCell><TableCell>{r.equipe}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}