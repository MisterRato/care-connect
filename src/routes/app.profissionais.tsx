import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SEXO, CONSELHO_CLASSE } from "@/lib/violencia-options";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/app/profissionais")({ component: Page });

type UnidSaude = { id: string; nome: string };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

const empty = {
  nome: "", ocupacao: "", cbo: "", unidade_saude_id: "",
  cpf: "", cns: "", dt_nascimento: "", sexo: "", email: "", telefone: "",
  conselho_classe: "", numero_conselho: "", uf_conselho: "", data_admissao: "",
};

function Page() {
  const [rows, setRows] = useState<Row[]>([]);
  const [unidades, setUnidades] = useState<UnidSaude[]>([]);
  const [form, setForm] = useState({ ...empty });
  const [open, setOpen] = useState(false);
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

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const payload = {
      ...form,
      unidade_saude_id: form.unidade_saude_id || null,
      dt_nascimento: form.dt_nascimento || null,
      data_admissao: form.data_admissao || null,
    };
    const { error } = await supabase.from("profissionais").insert(payload);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Profissional cadastrado");
    setForm({ ...empty });
    setOpen(false);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Profissionais de Saúde</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Novo</Button></DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Novo Profissional</DialogTitle></DialogHeader>
            <form onSubmit={save} className="space-y-4">
              <Tabs defaultValue="pessoal">
                <TabsList>
                  <TabsTrigger value="pessoal">Pessoal</TabsTrigger>
                  <TabsTrigger value="ocupacao">Ocupação</TabsTrigger>
                  <TabsTrigger value="contato">Contato</TabsTrigger>
                </TabsList>
                <TabsContent value="pessoal" className="pt-3">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="md:col-span-2 space-y-1"><Label>Nome *</Label>
                      <Input required value={form.nome} onChange={(e) => set("nome", e.target.value)} /></div>
                    <div className="space-y-1"><Label>Sexo</Label>
                      <Select value={form.sexo} onValueChange={(v) => set("sexo", v)}>
                        <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                        <SelectContent>{SEXO.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                      </Select></div>
                    <div className="space-y-1"><Label>Dt. Nascimento</Label>
                      <Input type="date" value={form.dt_nascimento} onChange={(e) => set("dt_nascimento", e.target.value)} /></div>
                    <div className="space-y-1"><Label>CPF</Label><Input value={form.cpf} onChange={(e) => set("cpf", e.target.value)} /></div>
                    <div className="space-y-1"><Label>CNS</Label><Input value={form.cns} onChange={(e) => set("cns", e.target.value)} /></div>
                  </div>
                </TabsContent>
                <TabsContent value="ocupacao" className="pt-3">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="md:col-span-2 space-y-1"><Label>Descr. Ocupação</Label>
                      <Input value={form.ocupacao} onChange={(e) => set("ocupacao", e.target.value)} /></div>
                    <div className="space-y-1"><Label>CBO</Label><Input value={form.cbo} onChange={(e) => set("cbo", e.target.value)} /></div>
                    <div className="space-y-1"><Label>Conselho de Classe</Label>
                      <Select value={form.conselho_classe} onValueChange={(v) => set("conselho_classe", v)}>
                        <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                        <SelectContent>{CONSELHO_CLASSE.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select></div>
                    <div className="space-y-1"><Label>Nº Conselho</Label><Input value={form.numero_conselho} onChange={(e) => set("numero_conselho", e.target.value)} /></div>
                    <div className="space-y-1"><Label>UF Conselho</Label><Input maxLength={2} value={form.uf_conselho} onChange={(e) => set("uf_conselho", e.target.value.toUpperCase())} /></div>
                    <div className="space-y-1"><Label>Data de Admissão</Label><Input type="date" value={form.data_admissao} onChange={(e) => set("data_admissao", e.target.value)} /></div>
                    <div className="md:col-span-3 space-y-1"><Label>Unidade de Saúde</Label>
                      <Select value={form.unidade_saude_id} onValueChange={(v) => set("unidade_saude_id", v)}>
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>{unidades.map((u) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}</SelectContent>
                      </Select></div>
                  </div>
                </TabsContent>
                <TabsContent value="contato" className="pt-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1"><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
                    <div className="space-y-1"><Label>Telefone</Label><Input value={form.telefone} onChange={(e) => set("telefone", e.target.value)} /></div>
                  </div>
                </TabsContent>
              </Tabs>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={busy}>{busy ? "..." : "Salvar"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader><CardTitle>Cadastrados ({rows.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Ocupação</TableHead><TableHead>CBO</TableHead><TableHead>Conselho</TableHead><TableHead>Unidade</TableHead></TableRow></TableHeader>
            <TableBody>{rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.nome}</TableCell><TableCell>{r.ocupacao}</TableCell><TableCell>{r.cbo}</TableCell>
                <TableCell>{r.conselho_classe} {r.numero_conselho ? `· ${r.numero_conselho}/${r.uf_conselho ?? ""}` : ""}</TableCell>
                <TableCell>{unidades.find((u) => u.id === r.unidade_saude_id)?.nome ?? "-"}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
