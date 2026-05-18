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
  IDENTIDADE_GENERO, DEFICIENCIA_TIPOS, SITUACAO_TRABALHO, TIPO_DOMICILIO,
  MATERIAL_PAREDE, ABASTECIMENTO_AGUA, TRATAMENTO_AGUA, ESCOAMENTO_SANITARIO,
  DESTINO_LIXO, ENERGIA_ELETRICA, calcIdade,
} from "@/lib/violencia-options";
import { toast } from "sonner";
import { FileText, Plus } from "lucide-react";

export const Route = createFileRoute("/app/usuarios-sus")({ component: Page });

type Row = {
  id: string; nome: string; cns: string | null; sexo: string | null;
  dt_nascimento: string | null; municipio: string | null;
};

const empty = {
  // Principal
  nome: "", nome_social: "", cns: "", dt_nascimento: "", sexo: "",
  nome_mae: "", telefone: "", equipe: "",
  uf: "", municipio: "", cod_ibge_municipio: "", distrito: "", bairro: "",
  logradouro: "", numero: "", complemento: "", cep: "", ponto_referencia: "",
  // Complemento PSF
  micro_area: "", area: "", numero_prontuario: "", data_cadastro_psf: "",
  // Sócio
  raca: "", escolaridade: "", estado_civil: "",
  orientacao_sexual: "", identidade_genero: "", ocupacao: "",
  tem_deficiencia: false, deficiencia_tipos: [] as string[], deficiencia_outra: "",
  // CNS / Documentos
  cpf: "", rg: "", rg_orgao_emissor: "", rg_uf: "", passaporte: "",
  // Saúde do Trabalhador
  situacao_mercado_trabalho: "", ocupacao_cbo: "", vinculo_trabalho: "", tempo_servico: "",
  // Domicílio
  tipo_domicilio: "", material_parede: "", abastecimento_agua: "", tratamento_agua: "",
  escoamento_sanitario: "", destino_lixo: "", energia_eletrica: "",
  num_comodos: "" as string | number, num_moradores: "" as string | number,
  // Pré-natal
  idade_gestacional: "" as string | number, dpp: "", dum: "", num_consultas_prenatal: "" as string | number,
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
      deficiencia_tipos: checked ? [...f.deficiencia_tipos, tipo] : f.deficiencia_tipos.filter((t) => t !== tipo),
    }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const toNum = (v: string | number) => v === "" || v == null ? null : Number(v);
    const toDate = (v: string) => v || null;
    const payload = {
      ...form,
      dt_nascimento: toDate(form.dt_nascimento),
      data_cadastro_psf: toDate(form.data_cadastro_psf),
      dpp: toDate(form.dpp),
      dum: toDate(form.dum),
      idade_gestacional: toNum(form.idade_gestacional),
      num_comodos: toNum(form.num_comodos),
      num_moradores: toNum(form.num_moradores),
      num_consultas_prenatal: toNum(form.num_consultas_prenatal),
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

  const fSexo = form.sexo === "F";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Usuários SUS</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Novo</Button></DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Novo Usuário SUS</DialogTitle></DialogHeader>
            <form onSubmit={save} className="space-y-4">
              <Tabs defaultValue="principal">
                <TabsList className="flex-wrap h-auto">
                  <TabsTrigger value="principal">Principal</TabsTrigger>
                  <TabsTrigger value="psf">Complemento PSF</TabsTrigger>
                  <TabsTrigger value="cns">CNS / Documentos</TabsTrigger>
                  <TabsTrigger value="socio">Sócio-demográfico</TabsTrigger>
                  <TabsTrigger value="trab">Saúde do Trabalhador</TabsTrigger>
                  <TabsTrigger value="dom">Domicílio</TabsTrigger>
                  {fSexo && <TabsTrigger value="prenatal">Pré-natal</TabsTrigger>}
                </TabsList>

                <TabsContent value="principal" className="pt-3">
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
                    <div className="space-y-1"><Label>Distrito</Label>
                      <Input value={form.distrito} onChange={(e) => set("distrito", e.target.value)} /></div>
                    <div className="space-y-1"><Label>Bairro</Label>
                      <Input value={form.bairro} onChange={(e) => set("bairro", e.target.value)} /></div>
                    <div className="md:col-span-2 space-y-1"><Label>Logradouro</Label>
                      <Input value={form.logradouro} onChange={(e) => set("logradouro", e.target.value)} /></div>
                    <div className="space-y-1"><Label>Nr.</Label>
                      <Input value={form.numero} onChange={(e) => set("numero", e.target.value)} /></div>
                    <div className="md:col-span-2 space-y-1"><Label>Complemento</Label>
                      <Input value={form.complemento} onChange={(e) => set("complemento", e.target.value)} /></div>
                    <div className="space-y-1"><Label>CEP</Label>
                      <Input value={form.cep} onChange={(e) => set("cep", e.target.value)} /></div>
                    <div className="md:col-span-3 space-y-1"><Label>Ponto de Referência</Label>
                      <Input value={form.ponto_referencia} onChange={(e) => set("ponto_referencia", e.target.value)} /></div>
                    <div className="space-y-1"><Label>Equipe (PSF)</Label>
                      <Input value={form.equipe} onChange={(e) => set("equipe", e.target.value)} placeholder="ex: 57" /></div>
                  </div>
                </TabsContent>

                <TabsContent value="psf" className="pt-3">
                  <div className="grid gap-3 md:grid-cols-4">
                    <div className="space-y-1"><Label>Área</Label><Input value={form.area} onChange={(e) => set("area", e.target.value)} /></div>
                    <div className="space-y-1"><Label>Micro-área</Label><Input value={form.micro_area} onChange={(e) => set("micro_area", e.target.value)} /></div>
                    <div className="space-y-1"><Label>Nº Prontuário</Label><Input value={form.numero_prontuario} onChange={(e) => set("numero_prontuario", e.target.value)} /></div>
                    <div className="space-y-1"><Label>Data Cadastro PSF</Label><Input type="date" value={form.data_cadastro_psf} onChange={(e) => set("data_cadastro_psf", e.target.value)} /></div>
                  </div>
                </TabsContent>

                <TabsContent value="cns" className="pt-3">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-1"><Label>Cartão SUS (CNS)</Label><Input value={form.cns} onChange={(e) => set("cns", e.target.value)} /></div>
                    <div className="space-y-1"><Label>CPF</Label><Input value={form.cpf} onChange={(e) => set("cpf", e.target.value)} /></div>
                    <div className="space-y-1"><Label>RG</Label><Input value={form.rg} onChange={(e) => set("rg", e.target.value)} /></div>
                    <div className="space-y-1"><Label>RG Órgão Emissor</Label><Input value={form.rg_orgao_emissor} onChange={(e) => set("rg_orgao_emissor", e.target.value)} /></div>
                    <div className="space-y-1"><Label>RG UF</Label><Input maxLength={2} value={form.rg_uf} onChange={(e) => set("rg_uf", e.target.value.toUpperCase())} /></div>
                    <div className="space-y-1"><Label>Passaporte</Label><Input value={form.passaporte} onChange={(e) => set("passaporte", e.target.value)} /></div>
                  </div>
                </TabsContent>

                <TabsContent value="socio" className="pt-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1"><Label>Raça/Cor</Label>
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
                    <div className="space-y-1"><Label>Ocupação (descrição)</Label>
                      <Input value={form.ocupacao} onChange={(e) => set("ocupacao", e.target.value)} /></div>
                    <div className="md:col-span-2 flex items-center gap-2">
                      <Checkbox id="def" checked={form.tem_deficiencia} onCheckedChange={(c) => set("tem_deficiencia", !!c)} />
                      <Label htmlFor="def">Tem alguma deficiência/transtorno?</Label>
                    </div>
                    {form.tem_deficiencia && (
                      <div className="md:col-span-2 space-y-2 border rounded p-3">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {DEFICIENCIA_TIPOS.map((t) => (
                            <label key={t} className="flex items-center gap-2 text-sm">
                              <Checkbox checked={form.deficiencia_tipos.includes(t)} onCheckedChange={(c) => toggleDef(t, !!c)} />{t}
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

                <TabsContent value="trab" className="pt-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1"><Label>Situação no mercado de trabalho</Label>
                      <Select value={form.situacao_mercado_trabalho} onValueChange={(v) => set("situacao_mercado_trabalho", v)}>
                        <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                        <SelectContent>{SITUACAO_TRABALHO.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select></div>
                    <div className="space-y-1"><Label>Ocupação CBO</Label><Input value={form.ocupacao_cbo} onChange={(e) => set("ocupacao_cbo", e.target.value)} /></div>
                    <div className="space-y-1"><Label>Vínculo de Trabalho</Label><Input value={form.vinculo_trabalho} onChange={(e) => set("vinculo_trabalho", e.target.value)} /></div>
                    <div className="space-y-1"><Label>Tempo de Serviço</Label><Input value={form.tempo_servico} onChange={(e) => set("tempo_servico", e.target.value)} placeholder="ex: 3 anos" /></div>
                  </div>
                </TabsContent>

                <TabsContent value="dom" className="pt-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    {[
                      ["Tipo de Domicílio", "tipo_domicilio", TIPO_DOMICILIO],
                      ["Material Predominante - Paredes", "material_parede", MATERIAL_PAREDE],
                      ["Abastecimento de Água", "abastecimento_agua", ABASTECIMENTO_AGUA],
                      ["Tratamento da Água", "tratamento_agua", TRATAMENTO_AGUA],
                      ["Escoamento Sanitário", "escoamento_sanitario", ESCOAMENTO_SANITARIO],
                      ["Destino do Lixo", "destino_lixo", DESTINO_LIXO],
                      ["Energia Elétrica", "energia_eletrica", ENERGIA_ELETRICA],
                    ].map(([label, key, opts]) => (
                      <div key={key as string} className="space-y-1"><Label>{label as string}</Label>
                        <Select value={(form as Record<string, string>)[key as string]} onValueChange={(v) => set(key as keyof typeof form, v as never)}>
                          <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                          <SelectContent>{(opts as string[]).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                        </Select></div>
                    ))}
                    <div className="space-y-1"><Label>Nº de Cômodos</Label><Input type="number" min={0} value={form.num_comodos} onChange={(e) => set("num_comodos", e.target.value)} /></div>
                    <div className="space-y-1"><Label>Nº de Moradores</Label><Input type="number" min={0} value={form.num_moradores} onChange={(e) => set("num_moradores", e.target.value)} /></div>
                  </div>
                </TabsContent>

                {fSexo && (
                  <TabsContent value="prenatal" className="pt-3">
                    <div className="grid gap-3 md:grid-cols-4">
                      <div className="space-y-1"><Label>Idade Gestacional (sem.)</Label>
                        <Input type="number" min={0} max={42} value={form.idade_gestacional} onChange={(e) => set("idade_gestacional", e.target.value)} /></div>
                      <div className="space-y-1"><Label>DUM</Label><Input type="date" value={form.dum} onChange={(e) => set("dum", e.target.value)} /></div>
                      <div className="space-y-1"><Label>DPP</Label><Input type="date" value={form.dpp} onChange={(e) => set("dpp", e.target.value)} /></div>
                      <div className="space-y-1"><Label>Nº consultas pré-natal</Label>
                        <Input type="number" min={0} value={form.num_consultas_prenatal} onChange={(e) => set("num_consultas_prenatal", e.target.value)} /></div>
                    </div>
                    <p className="text-xs text-muted-foreground pt-2">Usado para preencher o campo "Gestante" (#14) na ficha de notificação.</p>
                  </TabsContent>
                )}
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
