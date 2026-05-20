import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TIPO_UNIDADE, ESFERA_ADMIN, GESTAO, NIVEL_ATENCAO } from "@/lib/violencia-options";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";

export const Route = createFileRoute("/app/unidades-saude")({ component: Page });

const empty = {
  nome: "", cnes: "", codigo_unidade: "", cnpj: "",
  uf: "", municipio: "", cod_ibge: "", distrito: "", bairro: "",
  logradouro: "", numero: "", complemento: "", cep: "", ponto_referencia: "",
  tipo_unidade: "", subtipo: "", esfera_administrativa: "", gestao: "", nivel_atencao: "",
  telefone: "", email: "", equipe: "", horario_funcionamento: "",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

function Page() {
  const [rows, setRows] = useState<Row[]>([]);
  const [form, setForm] = useState({ ...empty });
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase.from("unidades_saude").select("*").order("nome");
    setRows((data ?? []) as Row[]);
  }
  useEffect(() => { load(); }, []);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function openNew() { setForm({ ...empty }); setEditId(null); setOpen(true); }
  function openEdit(r: Row) {
    const merged: typeof empty = { ...empty };
    for (const k of Object.keys(empty) as (keyof typeof empty)[]) {
      const v = r[k as string];
      if (v != null) (merged as Record<string, unknown>)[k as string] = v;
    }
    setForm(merged); setEditId(r.id); setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = editId
      ? await supabase.from("unidades_saude").update(form).eq("id", editId)
      : await supabase.from("unidades_saude").insert(form);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(editId ? "Unidade atualizada" : "Unidade cadastrada");
    setForm({ ...empty });
    setEditId(null);
    setOpen(false);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Unidades de Saúde</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditId(null); setForm({ ...empty }); } }}>
          <DialogTrigger asChild><Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Nova unidade</Button></DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editId ? "Editar Unidade de Saúde" : "Nova Unidade de Saúde"}</DialogTitle></DialogHeader>
            <form onSubmit={save} className="space-y-4">
              <Tabs defaultValue="principal">
                <TabsList className="flex-wrap h-auto">
                  <TabsTrigger value="principal">Principal</TabsTrigger>
                  <TabsTrigger value="endereco">Endereço</TabsTrigger>
                  <TabsTrigger value="outras">Outras Inf.</TabsTrigger>
                  <TabsTrigger value="contato">Contato</TabsTrigger>
                </TabsList>
                <TabsContent value="principal" className="pt-3">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="md:col-span-2 space-y-1"><Label>Unidade de Saúde *</Label>
                      <Input required value={form.nome} onChange={(e) => set("nome", e.target.value)} /></div>
                    <div className="space-y-1"><Label>Código Unidade</Label>
                      <Input value={form.codigo_unidade} onChange={(e) => set("codigo_unidade", e.target.value)} placeholder="ex: 39" /></div>
                    <div className="space-y-1"><Label>Equipe</Label>
                      <Input value={form.equipe} onChange={(e) => set("equipe", e.target.value)} placeholder="ex: 57" /></div>
                    <div className="space-y-1"><Label>Horário de Funcionamento</Label>
                      <Input value={form.horario_funcionamento} onChange={(e) => set("horario_funcionamento", e.target.value)} placeholder="07h–17h" /></div>
                  </div>
                </TabsContent>
                <TabsContent value="endereco" className="pt-3">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-1"><Label>CEP</Label><Input value={form.cep} onChange={(e) => set("cep", e.target.value)} /></div>
                    <div className="space-y-1"><Label>UF</Label><Input maxLength={2} value={form.uf} onChange={(e) => set("uf", e.target.value.toUpperCase())} /></div>
                    <div className="space-y-1"><Label>Município IBGE</Label><Input value={form.municipio} onChange={(e) => set("municipio", e.target.value)} /></div>
                    <div className="space-y-1"><Label>Cód. IBGE</Label><Input value={form.cod_ibge} onChange={(e) => set("cod_ibge", e.target.value)} /></div>
                    <div className="space-y-1"><Label>Distrito</Label><Input value={form.distrito} onChange={(e) => set("distrito", e.target.value)} /></div>
                    <div className="space-y-1"><Label>Bairro</Label><Input value={form.bairro} onChange={(e) => set("bairro", e.target.value)} /></div>
                    <div className="md:col-span-2 space-y-1"><Label>Logradouro</Label><Input value={form.logradouro} onChange={(e) => set("logradouro", e.target.value)} /></div>
                    <div className="space-y-1"><Label>Número</Label><Input value={form.numero} onChange={(e) => set("numero", e.target.value)} /></div>
                    <div className="md:col-span-2 space-y-1"><Label>Complemento</Label><Input value={form.complemento} onChange={(e) => set("complemento", e.target.value)} /></div>
                    <div className="md:col-span-3 space-y-1"><Label>Ponto de Referência</Label><Input value={form.ponto_referencia} onChange={(e) => set("ponto_referencia", e.target.value)} /></div>
                  </div>
                </TabsContent>
                <TabsContent value="outras" className="pt-3">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-1"><Label>Cód. C.N.E.S.</Label><Input value={form.cnes} onChange={(e) => set("cnes", e.target.value)} /></div>
                    <div className="space-y-1"><Label>CNPJ</Label><Input value={form.cnpj} onChange={(e) => set("cnpj", e.target.value)} /></div>
                    <div className="space-y-1"><Label>Tipo de Unidade</Label>
                      <Select value={form.tipo_unidade} onValueChange={(v) => set("tipo_unidade", v)}>
                        <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                        <SelectContent>{TIPO_UNIDADE.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select></div>
                    <div className="space-y-1"><Label>Subtipo</Label><Input value={form.subtipo} onChange={(e) => set("subtipo", e.target.value)} /></div>
                    <div className="space-y-1"><Label>Esfera Administrativa</Label>
                      <Select value={form.esfera_administrativa} onValueChange={(v) => set("esfera_administrativa", v)}>
                        <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                        <SelectContent>{ESFERA_ADMIN.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select></div>
                    <div className="space-y-1"><Label>Gestão</Label>
                      <Select value={form.gestao} onValueChange={(v) => set("gestao", v)}>
                        <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                        <SelectContent>{GESTAO.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select></div>
                    <div className="space-y-1"><Label>Nível de Atenção</Label>
                      <Select value={form.nivel_atencao} onValueChange={(v) => set("nivel_atencao", v)}>
                        <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                        <SelectContent>{NIVEL_ATENCAO.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select></div>
                  </div>
                </TabsContent>
                <TabsContent value="contato" className="pt-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1"><Label>Telefone</Label><Input value={form.telefone} onChange={(e) => set("telefone", e.target.value)} /></div>
                    <div className="space-y-1"><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
                  </div>
                </TabsContent>
              </Tabs>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={busy}>{busy ? "Salvando..." : "Salvar"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader><CardTitle>Cadastradas ({rows.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Nome</TableHead><TableHead>CNES</TableHead><TableHead>Cód</TableHead>
              <TableHead>UF</TableHead><TableHead>Município</TableHead><TableHead>Tipo</TableHead><TableHead>Equipe</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>{rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.nome}</TableCell>
                <TableCell>{r.cnes}</TableCell><TableCell>{r.codigo_unidade}</TableCell>
                <TableCell>{r.uf}</TableCell><TableCell>{r.municipio}</TableCell>
                <TableCell>{r.tipo_unidade}</TableCell><TableCell>{r.equipe}</TableCell>
                <TableCell><Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-3 w-3 mr-1" />Editar</Button></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
