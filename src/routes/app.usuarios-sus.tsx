import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  SEXO, RACA, ESCOLARIDADE, ESTADO_CIVIL, ORIENTACAO_SEXUAL,
  IDENTIDADE_GENERO, DEFICIENCIA_TIPOS, calcIdade,
} from "@/lib/violencia-options";
import { toast } from "sonner";
import { FileText, Plus } from "lucide-react";

export const Route = createFileRoute("/app/usuarios-sus")({
  component: Page,
});

type Row = {
  id: string; nome: string; cns: string | null; sexo: string | null;
  dt_nascimento: string | null; municipio: string | null;
};

const empty = {
  nome: "", nome_social: "", cns: "", dt_nascimento: "", sexo: "",
  nome_mae: "", raca: "", escolaridade: "", estado_civil: "",
  orientacao_sexual: "", identidade_genero: "", ocupacao: "", telefone: "",
  uf: "", municipio: "", cod_ibge_municipio: "", distrito: "", bairro: "",
  logradouro: "", numero: "", complemento: "", cep: "", ponto_referencia: "",
  tem_deficiencia: false, deficiencia_tipos: [] as string[], deficiencia_outra: "",
  idade_gestacional: "" as string | number, equipe: "",
};

function Page() {
  const [rows, setRows] = useState<Row[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...empty });
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");

  async function load() {
    let q = supabase.from("usuarios_sus").select("id,nome,cns,sexo,dt_nascimento,municipio").order("nome").limit(200);
    if (search.trim()) q = q.ilike("nome", `%${search.trim()}%`);
    const { data } = await q;
    setRows((data ?? []) as Row[]);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [search]);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function toggleDef(tipo: string, checked: boolean) {
    setForm((f) => ({
      ...f,
      deficiencia_tipos: checked
        ? [...f.deficiencia_tipos, tipo]
        : f.deficiencia_tipos.filter((t) => t !== tipo),
    }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { idade_gestacional, dt_nascimento, ...rest } = form;
    const payload = {
      ...rest,
      dt_nascimento: dt_nascimento || null,
      idade_gestacional: idade_gestacional === "" || idade_gestacional == null ? null : Number(idade_gestacional),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from("usuarios_sus").insert(payload as any);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Usuário SUS cadastrado");
    setOpen(false);
    setForm({ ...empty });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Usuários SUS</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Novo</Button></DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Novo Usuário SUS</DialogTitle></DialogHeader>
            <form onSubmit={save} className="space-y-4">
              <Tabs defaultValue="principal">
                <TabsList>
                  <TabsTrigger value="principal">Principal</TabsTrigger>
                  <TabsTrigger value="complemento">Complemento PSF</TabsTrigger>
                  <TabsTrigger value="cns">CNS / Trabalhador</TabsTrigger>
                  <TabsTrigger value="prenatal">Pré-natal</TabsTrigger>
                </TabsList>
                <TabsContent value="principal" className="space-y-3 pt-3">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="md:col-span-2 space-y-1"><Label>Nome *</Label>
                      <Input required value={form.nome} onChange={(e) => set("nome", e.target.value)} /></div>
                    <div className="space-y-1"><Label>Nome Social</Label>
                      <Input value={form.nome_social} onChange={(e) => set("nome_social", e.target.value)} /></div>
                    <div className="space-y-1"><Label>Dt. Nascimento</Label>
                      <Input type="date" value={form.dt_nascimento} onChange={(e) => set("dt_nascimento", e.target.value)} /></div>
                    <div className="space-y-1"><Label>Sexo</Label>
                      <Select value={form.sexo} onValueChange={(v) => set("sexo", v)}>
                        <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                        <SelectContent>{SEXO.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                      </Select></div>
                    <div className="space-y-1"><Label>Telefone</Label>
                      <Input value={form.telefone} onChange={(e) => set("telefone", e.target.value)} /></div>
                    <div className="md:col-span-2 space-y-1"><Label>Nome da Mãe</Label>
                      <Input value={form.nome_mae} onChange={(e) => set("nome_mae", e.target.value)} /></div>
                    <div className="space-y-1"><Label>UF</Label>
                      <Input maxLength={2} value={form.uf} onChange={(e) => set("uf", e.target.value.toUpperCase())} /></div>
                    <div className="space-y-1"><Label>Município</Label>
                      <Input value={form.municipio} onChange={(e) => set("municipio", e.target.value)} /></div>
                    <div className="space-y-1"><Label>Cód. IBGE</Label>
                      <Input value={form.cod_ibge_municipio} onChange={(e) => set("cod_ibge_municipio", e.target.value)} /></div>
                    <div className="space-y-1"><Label>Localidade/Distrito</Label>
                      <Input value={form.distrito} onChange={(e) => set("distrito", e.target.value)} /></div>
                    <div className="space-y-1"><Label>Bairro</Label>
                      <Input value={form.bairro} onChange={(e) => set("bairro", e.target.value)} /></div>
                    <div className="md:col-span-2 space-y-1"><Label>Logradouro</Label>
                      <Input value={form.logradouro} onChange={(e) => set("logradouro", e.target.value)} /></div>
                    <div className="space-y-1"><Label>Nr.</Label>
                      <Input value={form.numero} onChange={(e) => set("numero", e.target.value)} /></div>
                    <div className="md:col-span-2 space-y-1"><Label>End. Complem.</Label>
                      <Input value={form.complemento} onChange={(e) => set("complemento", e.target.value)} /></div>
                    <div className="space-y-1"><Label>CEP</Label>
                      <Input value={form.cep} onChange={(e) => set("cep", e.target.value)} /></div>
                    <div className="md:col-span-3 space-y-1"><Label>Ponto de Referência (Domicílio)</Label>
                      <Input value={form.ponto_referencia} onChange={(e) => set("ponto_referencia", e.target.value)} /></div>
                    <div className="space-y-1"><Label>Equipe (PSF)</Label>
                      <Input value={form.equipe} onChange={(e) => set("equipe", e.target.value)} placeholder="ex: 57" /></div>
                  </div>
                </TabsContent>
                <TabsContent value="complemento" className="space-y-3 pt-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1"><Label>Raça</Label>
                      <Select value={form.raca} onValueChange={(v) => set("raca", v)}><SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{RACA.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-1"><Label>Grau de Instrução</Label>
                      <Select value={form.escolaridade} onValueChange={(v) => set("escolaridade", v)}><SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{ESCOLARIDADE.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-1"><Label>Estado Civil</Label>
                      <Select value={form.estado_civil} onValueChange={(v) => set("estado_civil", v)}><SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{ESTADO_CIVIL.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-1"><Label>Orientação Sexual</Label>
                      <Select value={form.orientacao_sexual} onValueChange={(v) => set("orientacao_sexual", v)}><SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{ORIENTACAO_SEXUAL.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-1"><Label>Identid. Gênero</Label>
                      <Select value={form.identidade_genero} onValueChange={(v) => set("identidade_genero", v)}><SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{IDENTIDADE_GENERO.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
                    <div className="md:col-span-2 flex items-center gap-2">
                      <Checkbox id="def" checked={form.tem_deficiencia} onCheckedChange={(c) => set("tem_deficiencia", !!c)} />
                      <Label htmlFor="def">Tem alguma deficiência?</Label>
                    </div>
                    {form.tem_deficiencia && (
                      <div className="md:col-span-2 space-y-2 border rounded p-3">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {DEFICIENCIA_TIPOS.map((t) => (
                            <label key={t} className="flex items-center gap-2 text-sm">
                              <Checkbox checked={form.deficiencia_tipos.includes(t)} onCheckedChange={(c) => toggleDef(t, !!c)} />
                              {t}
                            </label>
                          ))}
                        </div>
                        {form.deficiencia_tipos.includes("Outra") && (
                          <div className="space-y-1"><Label>Outra (descrever)</Label>
                            <Input value={form.deficiencia_outra} onChange={(e) => set("deficiencia_outra", e.target.value)} /></div>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="cns" className="space-y-3 pt-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1"><Label>Cartão SUS (CNS)</Label>
                      <Input value={form.cns} onChange={(e) => set("cns", e.target.value)} /></div>
                    <div className="space-y-1"><Label>Descr. Ocupação</Label>
                      <Input value={form.ocupacao} onChange={(e) => set("ocupacao", e.target.value)} /></div>
                  </div>
                </TabsContent>
                <TabsContent value="prenatal" className="space-y-3 pt-3">
                  <div className="space-y-1 max-w-xs"><Label>Idade Gestacional (semanas)</Label>
                    <Input type="number" min={0} max={42} value={form.idade_gestacional}
                      onChange={(e) => set("idade_gestacional", e.target.value)} /></div>
                  <p className="text-xs text-muted-foreground">Usado para preencher o campo "Gestante" na ficha.</p>
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
      <div className="max-w-sm">
        <Input placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <Card>
        <CardHeader><CardTitle>{rows.length} usuários</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Nome</TableHead><TableHead>CNS</TableHead><TableHead>Sexo</TableHead>
              <TableHead>Idade</TableHead><TableHead>Município</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>{rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.nome}</TableCell>
                <TableCell>{r.cns}</TableCell><TableCell>{r.sexo}</TableCell>
                <TableCell>{calcIdade(r.dt_nascimento)}</TableCell>
                <TableCell>{r.municipio}</TableCell>
                <TableCell>
                  <Link to="/app/notificacoes/nova/$usuarioId" params={{ usuarioId: r.id }}>
                    <Button size="sm" variant="outline"><FileText className="h-3 w-3 mr-1" />Nova ficha Y09</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}