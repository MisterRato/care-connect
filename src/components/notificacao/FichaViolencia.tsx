import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ZONA, GESTANTE, LOCAL_OCORRENCIA, MOTIVACAO_VIOLENCIA, TIPO_VIOLENCIA,
  MEIO_AGRESSAO, VIOLENCIA_SEXUAL_TIPOS, PROCEDIMENTO_SEXUAL,
  NUMERO_ENVOLVIDOS, VINCULO_AUTOR, SEXO_AUTOR, SIM_NAO_IGN, CICLO_VIDA_AUTOR,
  ENCAMINHAMENTO, calcIdade,
} from "@/lib/violencia-options";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

type Props = {
  usuario: Any;            // usuarios_sus row
  notificacao?: Any | null; // existing row (edit) or null (new)
};

type UnidSaude = { id: string; nome: string; cnes: string | null; uf: string | null; municipio: string | null; cod_ibge: string | null; codigo_unidade: string | null; equipe: string | null };
type UnidNotif = { id: string; tipo: number; nome: string };
type Profissional = { id: string; nome: string; ocupacao: string | null; unidade_saude_id: string | null };

const SIM_NAO_PROC = SIM_NAO_IGN.filter((o) => o.value !== "9");

function gestanteFromIdade(idade: number | null | undefined): string {
  if (idade == null) return "6"; // não se aplica
  if (idade <= 13) return "1";
  if (idade <= 26) return "2";
  if (idade <= 42) return "3";
  return "4";
}

const RESIDENCIA_KEYS: Array<[string, string]> = [
  ["uf", "uf"], ["municipio", "municipio"], ["cod_ibge_municipio", "cod_ibge_municipio"],
  ["distrito", "distrito"], ["bairro", "bairro"], ["logradouro", "logradouro"],
  ["numero", "numero"], ["complemento", "complemento"], ["ponto_referencia", "ponto_referencia"],
];

export function FichaViolencia({ usuario, notificacao }: Props) {
  const navigate = useNavigate();
  const { user, isUbs, isEpi, isAdmin } = useAuth();
  const isNew = !notificacao;
  const canEditUBS = isNew ? isUbs : isUbs && notificacao?.status === "ubs";
  const canEditEpi = isEpi;

  const today = new Date().toISOString().slice(0, 10);
  const [unidades, setUnidades] = useState<UnidSaude[]>([]);
  const [unidNotif, setUnidNotif] = useState<UnidNotif[]>([]);
  const [profs, setProfs] = useState<Profissional[]>([]);

  // Estado do formulário (payload da ficha)
  const [f, setF] = useState<Any>(() => notificacao?.payload ?? {
    data_notificacao: today,
    unidade_saude_id: usuario.unidade_saude_id ?? "",
    unidade_notificadora_id: "",
    profissional_id: "",
    data_ocorrencia: "",
    // ocorrência
    ocorrencia: {
      uf: "", municipio: "", distrito: "", bairro: "", logradouro: "",
      numero: "", complemento: "", ponto_referencia: "",
      zona: "", hora: "", local: "", outras_vezes: false, autoprovocada: false,
    },
    // violência
    motivacao: "",
    tipo_violencia: [] as string[],
    meio_agressao: [] as string[],
    // sexual
    sexual_tipos: [] as string[],
    procedimentos: {} as Record<string, "1" | "2">,
    // autor
    autor: {
      numero_envolvidos: "", vinculos: [] as string[], sexo: "",
      uso_alcool: "", ciclo_vida: "",
    },
    // encaminhamento
    encaminhamentos: {} as Record<string, "1" | "2">,
    // dados finais
    relacionada_trabalho: "",
    cat_emitida: "",
    data_encerramento: today,
    // observações
    obs: { acompanhante: "", vinculo: "", telefone: "", adicionais: "" },
  });
  const [circLesao, setCircLesao] = useState<string>(notificacao?.circunstancia_lesao ?? "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const [u, n, p] = await Promise.all([
        supabase.from("unidades_saude").select("*").order("nome"),
        supabase.from("unidades_notificadoras").select("*").order("nome"),
        supabase.from("profissionais").select("*").order("nome"),
      ]);
      setUnidades((u.data ?? []) as UnidSaude[]);
      setUnidNotif((n.data ?? []) as UnidNotif[]);
      setProfs((p.data ?? []) as Profissional[]);
    })();
  }, []);

  const unidade = unidades.find((u) => u.id === f.unidade_saude_id) ?? null;
  const idade = useMemo(() => calcIdade(usuario.dt_nascimento), [usuario.dt_nascimento]);

  // #14 Gestante derivada de pré-natal
  const gestante = useMemo(() => {
    if (usuario.sexo !== "F") return "6";
    return gestanteFromIdade(usuario.idade_gestacional);
  }, [usuario.sexo, usuario.idade_gestacional]);

  // #31 Zona da residência
  const zonaResidencia = useMemo(() => {
    if (unidade?.codigo_unidade === "39" && (usuario.equipe === "57" || unidade?.equipe === "57")) return "2";
    return "1";
  }, [unidade, usuario.equipe]);

  // Quando local = residência, copia endereço para ocorrência
  useEffect(() => {
    if (f.ocorrencia.local === "1") {
      const novo: Any = { ...f.ocorrencia, zona: zonaResidencia };
      for (const [resKey, ocoKey] of RESIDENCIA_KEYS) {
        novo[ocoKey] = usuario[resKey] ?? "";
      }
      setF((p: Any) => ({ ...p, ocorrencia: novo }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.ocorrencia.local]);

  // #56 sem 'Sexual' => zera/oculta aba sexual
  const sexualAtiva = f.tipo_violencia.includes("Sexual");

  // #66/#67
  useEffect(() => {
    if (f.relacionada_trabalho === "2") {
      setF((p: Any) => ({ ...p, cat_emitida: "8" }));
    }
  }, [f.relacionada_trabalho]);

  function update(path: string, value: Any) {
    setF((p: Any) => {
      const next = { ...p };
      const keys = path.split(".");
      let cur: Any = next;
      for (let i = 0; i < keys.length - 1; i++) {
        cur[keys[i]] = { ...cur[keys[i]] };
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  }

  function toggleArr(path: string, item: string, checked: boolean) {
    const cur: string[] = path.split(".").reduce((acc: Any, k) => acc[k], f) ?? [];
    const next = checked ? [...cur, item] : cur.filter((x) => x !== item);
    update(path, next);
  }

  async function save(novoStatus?: "ubs" | "epi" | "encerrada") {
    setBusy(true);
    try {
      // Regras de "não se aplica"
      const payload = { ...f };
      if (!sexualAtiva) {
        payload.sexual_tipos = [];
        payload.sexual_na = "8";
      }
      payload.data_encerramento = payload.data_notificacao;

      const baseRow = {
        usuario_sus_id: usuario.id,
        unidade_saude_id: f.unidade_saude_id || null,
        unidade_notificadora_id: f.unidade_notificadora_id || null,
        profissional_id: f.profissional_id || null,
        data_notificacao: f.data_notificacao,
        data_ocorrencia: f.data_ocorrencia || null,
        payload,
      };

      if (isNew) {
        const { data, error } = await supabase
          .from("notificacoes_violencia")
          .insert({ ...baseRow, created_by: user?.id ?? null, status: novoStatus ?? "ubs" })
          .select("id")
          .single();
        if (error) throw error;
        toast.success("Notificação criada");
        navigate({ to: "/app/notificacoes/$id", params: { id: data.id } });
      } else {
        const upd: Any = { ...baseRow };
        if (novoStatus) upd.status = novoStatus;
        if (canEditEpi) upd.circunstancia_lesao = circLesao;
        const { error } = await supabase
          .from("notificacoes_violencia")
          .update(upd)
          .eq("id", notificacao.id);
        if (error) throw error;
        toast.success("Notificação atualizada");
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const readonly = !canEditUBS;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Ficha de Notificação — Violência Interpessoal/Autoprovocada</CardTitle>
              <CardDescription>SINAN · CID Y09 · Notificação Individual</CardDescription>
            </div>
            <div className="flex flex-col gap-1 items-end">
              {notificacao && <Badge variant={notificacao.status === "ubs" ? "secondary" : notificacao.status === "epi" ? "default" : "outline"}>
                Status: {notificacao.status}
              </Badge>}
              <span className="text-xs text-muted-foreground">Paciente: <strong>{usuario.nome}</strong> · Idade: {idade}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="gerais">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="gerais">Dados Gerais</TabsTrigger>
          <TabsTrigger value="individual">Notif. Individual</TabsTrigger>
          <TabsTrigger value="residencia">Residência</TabsTrigger>
          <TabsTrigger value="pessoa">Pessoa Atendida</TabsTrigger>
          <TabsTrigger value="ocorrencia">Ocorrência</TabsTrigger>
          <TabsTrigger value="violencia">Violência</TabsTrigger>
          {sexualAtiva && <TabsTrigger value="sexual">Violência Sexual</TabsTrigger>}
          <TabsTrigger value="autor">Autor</TabsTrigger>
          <TabsTrigger value="encam">Encaminhamento</TabsTrigger>
          <TabsTrigger value="finais">Dados Finais</TabsTrigger>
          <TabsTrigger value="obs">Observações</TabsTrigger>
          <TabsTrigger value="notificador">Notificador</TabsTrigger>
        </TabsList>

        {/* Dados Gerais */}
        <TabsContent value="gerais" className="space-y-4 pt-4">
          <Card><CardContent className="grid gap-3 md:grid-cols-3 pt-6">
            <div className="space-y-1"><Label>#1 Tipo de Notificação</Label><Input value="2 - Individual" readOnly /></div>
            <div className="md:col-span-2 space-y-1"><Label>#2 Agravo/doença</Label>
              <Input value="VIOLÊNCIA INTERPESSOAL/AUTOPROVOCADA (Y09)" readOnly /></div>
            <div className="space-y-1"><Label>#3 Data da Notificação</Label>
              <Input type="date" value={f.data_notificacao} onChange={(e) => update("data_notificacao", e.target.value)} disabled={readonly} /></div>
            <div className="space-y-1"><Label>#6 Unidade Notificadora *</Label>
              <Select value={f.unidade_notificadora_id} onValueChange={(v) => update("unidade_notificadora_id", v)} disabled={readonly}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{unidNotif.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.tipo} - {u.nome}</SelectItem>
                ))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>#8 Unidade de Saúde</Label>
              <Select value={f.unidade_saude_id} onValueChange={(v) => update("unidade_saude_id", v)} disabled={readonly}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{unidades.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.nome} {u.cnes && `· ${u.cnes}`}</SelectItem>
                ))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>#4 UF</Label><Input value={unidade?.uf ?? ""} readOnly /></div>
            <div className="space-y-1"><Label>#5 Município de Notificação</Label><Input value={unidade?.municipio ?? ""} readOnly /></div>
            <div className="space-y-1"><Label>#5 Cód. IBGE</Label><Input value={unidade?.cod_ibge ?? ""} readOnly /></div>
            <div className="space-y-1"><Label>#9 Data da ocorrência da violência *</Label>
              <Input required type="date" value={f.data_ocorrencia} onChange={(e) => update("data_ocorrencia", e.target.value)} disabled={readonly} /></div>
          </CardContent></Card>
        </TabsContent>

        {/* Notificação Individual */}
        <TabsContent value="individual" className="pt-4">
          <Card><CardContent className="grid gap-3 md:grid-cols-3 pt-6">
            <div className="md:col-span-2 space-y-1"><Label>#10 Nome do paciente</Label><Input value={usuario.nome} readOnly /></div>
            <div className="space-y-1"><Label>#13 Sexo</Label><Input value={usuario.sexo ?? ""} readOnly /></div>
            <div className="space-y-1"><Label>#11 Data de nascimento</Label><Input value={usuario.dt_nascimento ?? ""} readOnly /></div>
            <div className="space-y-1"><Label>#12 Idade</Label><Input value={String(idade)} readOnly /></div>
            <div className="space-y-1"><Label>#14 Gestante</Label>
              <Input value={GESTANTE.find((g) => g.value === gestante)?.label ?? ""} readOnly /></div>
            <div className="space-y-1"><Label>#15 Raça/Cor</Label><Input value={usuario.raca ?? ""} readOnly /></div>
            <div className="space-y-1"><Label>#16 Escolaridade</Label><Input value={usuario.escolaridade ?? ""} readOnly /></div>
            <div className="space-y-1"><Label>#17 Cartão SUS</Label><Input value={usuario.cns ?? ""} readOnly /></div>
            <div className="md:col-span-2 space-y-1"><Label>#18 Nome da mãe</Label><Input value={usuario.nome_mae ?? ""} readOnly /></div>
          </CardContent></Card>
        </TabsContent>

        {/* Residência */}
        <TabsContent value="residencia" className="pt-4">
          <Card><CardContent className="grid gap-3 md:grid-cols-3 pt-6">
            <div className="space-y-1"><Label>#19 UF</Label><Input value={usuario.uf ?? ""} readOnly /></div>
            <div className="space-y-1"><Label>#20 Município de Residência</Label><Input value={usuario.municipio ?? ""} readOnly /></div>
            <div className="space-y-1"><Label>#20 Cód. IBGE</Label><Input value={usuario.cod_ibge_municipio ?? ""} readOnly /></div>
            <div className="space-y-1"><Label>#21 Distrito</Label><Input value={usuario.distrito ?? ""} readOnly /></div>
            <div className="space-y-1"><Label>#22 Bairro</Label><Input value={usuario.bairro ?? ""} readOnly /></div>
            <div className="md:col-span-2 space-y-1"><Label>#23 Logradouro</Label><Input value={usuario.logradouro ?? ""} readOnly /></div>
            <div className="space-y-1"><Label>#24 Número</Label><Input value={usuario.numero ?? ""} readOnly /></div>
            <div className="md:col-span-2 space-y-1"><Label>#25 Complemento</Label><Input value={usuario.complemento ?? ""} readOnly /></div>
            <div className="space-y-1"><Label>#28 Ponto de Referência</Label><Input value={usuario.ponto_referencia ?? ""} readOnly /></div>
            <div className="space-y-1"><Label>#29 CEP</Label><Input value={usuario.cep ?? ""} readOnly /></div>
            <div className="space-y-1"><Label>#30 Telefone</Label><Input value={usuario.telefone ?? ""} readOnly /></div>
            <div className="space-y-1"><Label>#31 Zona</Label>
              <Input value={ZONA.find((z) => z.value === zonaResidencia)?.label ?? ""} readOnly /></div>
            <div className="space-y-1"><Label>#32 País</Label><Input value="BRASIL" readOnly /></div>
          </CardContent></Card>
        </TabsContent>

        {/* Pessoa Atendida */}
        <TabsContent value="pessoa" className="pt-4">
          <Card><CardContent className="grid gap-3 md:grid-cols-3 pt-6">
            <div className="md:col-span-2 space-y-1"><Label>#33 Nome Social</Label><Input value={usuario.nome_social ?? ""} readOnly /></div>
            <div className="space-y-1"><Label>#34 Ocupação</Label><Input value={usuario.ocupacao ?? ""} readOnly /></div>
            <div className="space-y-1"><Label>#35 Estado Civil</Label><Input value={usuario.estado_civil ?? ""} readOnly /></div>
            <div className="space-y-1"><Label>#36 Orientação Sexual</Label><Input value={usuario.orientacao_sexual ?? ""} readOnly /></div>
            <div className="space-y-1"><Label>#37 Identidade de gênero</Label><Input value={usuario.identidade_genero ?? ""} readOnly /></div>
            <div className="md:col-span-3"><Label>#38 Possui deficiência/transtorno?</Label>
              <div className="text-sm pt-1">{usuario.tem_deficiencia ? "Sim" : "Não"}</div>
            </div>
            {usuario.tem_deficiencia && (
              <div className="md:col-span-3 space-y-1"><Label>#39 Tipos</Label>
                <div className="text-sm">{(usuario.deficiencia_tipos ?? []).join(", ")} {usuario.deficiencia_outra ? `· Outra: ${usuario.deficiencia_outra}` : ""}</div>
              </div>
            )}
          </CardContent></Card>
        </TabsContent>

        {/* Ocorrência */}
        <TabsContent value="ocorrencia" className="pt-4">
          <Card><CardContent className="space-y-4 pt-6">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1"><Label>#52 Local da ocorrência *</Label>
                <Select value={f.ocorrencia.local} onValueChange={(v) => update("ocorrencia.local", v)} disabled={readonly}>
                  <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                  <SelectContent>{LOCAL_OCORRENCIA.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>#51 Hora da Ocorrência *</Label>
                <Input type="time" value={f.ocorrencia.hora} onChange={(e) => update("ocorrencia.hora", e.target.value)} disabled={readonly} /></div>
              <div className="space-y-1"><Label>#50 Zona *</Label>
                <Select value={f.ocorrencia.zona} onValueChange={(v) => update("ocorrencia.zona", v)} disabled={readonly}>
                  <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                  <SelectContent>{ZONA.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            {f.ocorrencia.local === "1" && (
              <Alert><AlertDescription>Endereço copiado automaticamente da Residência (#19–#28).</AlertDescription></Alert>
            )}
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1"><Label>#40 UF</Label>
                <Input value={f.ocorrencia.uf} onChange={(e) => update("ocorrencia.uf", e.target.value.toUpperCase())} maxLength={2} disabled={readonly} /></div>
              <div className="space-y-1"><Label>#41 Município *</Label>
                <Input value={f.ocorrencia.municipio} onChange={(e) => update("ocorrencia.municipio", e.target.value)} disabled={readonly} /></div>
              <div className="space-y-1"><Label>#42 Distrito *</Label>
                <Input value={f.ocorrencia.distrito} onChange={(e) => update("ocorrencia.distrito", e.target.value)} disabled={readonly} /></div>
              <div className="space-y-1"><Label>#43 Bairro *</Label>
                <Input value={f.ocorrencia.bairro} onChange={(e) => update("ocorrencia.bairro", e.target.value)} disabled={readonly} /></div>
              <div className="md:col-span-2 space-y-1"><Label>#44 Logradouro *</Label>
                <Input value={f.ocorrencia.logradouro} onChange={(e) => update("ocorrencia.logradouro", e.target.value)} disabled={readonly} /></div>
              <div className="space-y-1"><Label>#45 Número *</Label>
                <Input value={f.ocorrencia.numero} onChange={(e) => update("ocorrencia.numero", e.target.value)} disabled={readonly} /></div>
              <div className="md:col-span-2 space-y-1"><Label>#46 Complemento</Label>
                <Input value={f.ocorrencia.complemento} onChange={(e) => update("ocorrencia.complemento", e.target.value)} disabled={readonly} /></div>
              <div className="md:col-span-3 space-y-1"><Label>#49 Ponto de Referência *</Label>
                <Input value={f.ocorrencia.ponto_referencia} onChange={(e) => update("ocorrencia.ponto_referencia", e.target.value)} disabled={readonly} /></div>
            </div>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2">
                <Checkbox checked={f.ocorrencia.outras_vezes} onCheckedChange={(c) => update("ocorrencia.outras_vezes", !!c)} disabled={readonly} />
                #53 Ocorreu outras vezes? <Badge variant="outline">{f.ocorrencia.outras_vezes ? "1 - Sim" : "2 - Não"}</Badge>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox checked={f.ocorrencia.autoprovocada} onCheckedChange={(c) => update("ocorrencia.autoprovocada", !!c)} disabled={readonly} />
                #54 Lesão autoprovocada? <Badge variant="outline">{f.ocorrencia.autoprovocada ? "1 - Sim" : "2 - Não"}</Badge>
              </label>
            </div>
          </CardContent></Card>
        </TabsContent>

        {/* Violência */}
        <TabsContent value="violencia" className="pt-4">
          <Card><CardContent className="space-y-4 pt-6">
            <div className="space-y-1 max-w-md"><Label>#55 Motivação *</Label>
              <Select value={f.motivacao} onValueChange={(v) => update("motivacao", v)} disabled={readonly}>
                <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                <SelectContent>{MOTIVACAO_VIOLENCIA.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>#56 Tipo de violência *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">{TIPO_VIOLENCIA.map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={f.tipo_violencia.includes(t)}
                    onCheckedChange={(c) => toggleArr("tipo_violencia", t, !!c)} disabled={readonly} />{t}
                </label>
              ))}</div>
            </div>
            <div className="space-y-2"><Label>#57 Meio de agressão *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">{MEIO_AGRESSAO.map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={f.meio_agressao.includes(t)}
                    onCheckedChange={(c) => toggleArr("meio_agressao", t, !!c)} disabled={readonly} />{t}
                </label>
              ))}</div>
            </div>
          </CardContent></Card>
        </TabsContent>

        {/* Violência Sexual */}
        {sexualAtiva && (
          <TabsContent value="sexual" className="pt-4">
            <Card><CardContent className="space-y-4 pt-6">
              <div className="space-y-2"><Label>#58 Tipo de violência sexual *</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">{VIOLENCIA_SEXUAL_TIPOS.map((t) => (
                  <label key={t} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={f.sexual_tipos.includes(t)}
                      onCheckedChange={(c) => toggleArr("sexual_tipos", t, !!c)} disabled={readonly} />{t}
                  </label>
                ))}</div>
              </div>
              <div className="space-y-2"><Label>#59 Procedimento realizado</Label>
                <div className="space-y-1">{PROCEDIMENTO_SEXUAL.map((p) => (
                  <div key={p} className="flex items-center justify-between border rounded px-3 py-2">
                    <span className="text-sm">{p}</span>
                    <Select value={f.procedimentos[p] ?? "2"} onValueChange={(v) => update(`procedimentos.${p}`, v)} disabled={readonly}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>{SIM_NAO_PROC.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                ))}</div>
              </div>
            </CardContent></Card>
          </TabsContent>
        )}

        {/* Autor */}
        <TabsContent value="autor" className="pt-4">
          <Card><CardContent className="space-y-4 pt-6">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1"><Label>#60 Número de envolvidos *</Label>
                <Select value={f.autor.numero_envolvidos} onValueChange={(v) => update("autor.numero_envolvidos", v)} disabled={readonly}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{NUMERO_ENVOLVIDOS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>#62 Sexo do provável autor *</Label>
                <Select value={f.autor.sexo} onValueChange={(v) => update("autor.sexo", v)} disabled={readonly}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SEXO_AUTOR.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>#63 Suspeita de uso de álcool *</Label>
                <Select value={f.autor.uso_alcool} onValueChange={(v) => update("autor.uso_alcool", v)} disabled={readonly}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SIM_NAO_IGN.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>#64 Ciclo de vida do autor *</Label>
                <Select value={f.autor.ciclo_vida} onValueChange={(v) => update("autor.ciclo_vida", v)} disabled={readonly}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CICLO_VIDA_AUTOR.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>#61 Vínculo / grau de parentesco *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">{VINCULO_AUTOR.map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={f.autor.vinculos.includes(t)}
                    onCheckedChange={(c) => toggleArr("autor.vinculos", t, !!c)} disabled={readonly} />{t}
                </label>
              ))}</div>
            </div>
          </CardContent></Card>
        </TabsContent>

        {/* Encaminhamento */}
        <TabsContent value="encam" className="pt-4">
          <Card><CardContent className="space-y-2 pt-6">
            <Label>#65 Encaminhamento (todos podem ficar como Não)</Label>
            <div className="space-y-1">{ENCAMINHAMENTO.map((p) => (
              <div key={p} className="flex items-center justify-between border rounded px-3 py-2">
                <span className="text-sm">{p}</span>
                <Select value={f.encaminhamentos[p] ?? "2"} onValueChange={(v) => update(`encaminhamentos.${p}`, v)} disabled={readonly}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>{SIM_NAO_PROC.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            ))}</div>
          </CardContent></Card>
        </TabsContent>

        {/* Dados finais */}
        <TabsContent value="finais" className="pt-4">
          <Card><CardContent className="grid gap-3 md:grid-cols-2 pt-6">
            <div className="space-y-1"><Label>#66 Violência relacionada ao trabalho *</Label>
              <Select value={f.relacionada_trabalho} onValueChange={(v) => update("relacionada_trabalho", v)} disabled={readonly}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SIM_NAO_IGN.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>#67 Comunicação de Acidente de Trabalho (CAT)</Label>
              {f.relacionada_trabalho === "1" ? (
                <Select value={f.cat_emitida} onValueChange={(v) => update("cat_emitida", v)} disabled={readonly}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{SIM_NAO_IGN.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              ) : <Input value="8 - Não se aplica" readOnly />}
            </div>
            <div className="md:col-span-2 space-y-1">
              <Label>#68 Circunstância da lesão {canEditEpi ? <Badge>liberado p/ Epidemiologia</Badge> : <Badge variant="outline">bloqueado p/ UBS</Badge>}</Label>
              <Textarea
                value={circLesao}
                onChange={(e) => setCircLesao(e.target.value)}
                disabled={!canEditEpi}
                placeholder="Preenchido pela Vigilância Epidemiológica (CIDs liberados)"
                rows={4}
              />
            </div>
            <div className="space-y-1"><Label>#69 Data de encerramento</Label>
              <Input value={f.data_notificacao} readOnly /></div>
          </CardContent></Card>
        </TabsContent>

        {/* Observações */}
        <TabsContent value="obs" className="pt-4">
          <Card><CardContent className="grid gap-3 md:grid-cols-3 pt-6">
            <div className="md:col-span-2 space-y-1"><Label>Nome do acompanhante</Label>
              <Input value={f.obs.acompanhante} onChange={(e) => update("obs.acompanhante", e.target.value)} disabled={readonly} /></div>
            <div className="space-y-1"><Label>Vínculo/parentesco</Label>
              <Input value={f.obs.vinculo} onChange={(e) => update("obs.vinculo", e.target.value)} disabled={readonly} /></div>
            <div className="space-y-1"><Label>(DDD) Telefone</Label>
              <Input value={f.obs.telefone} onChange={(e) => update("obs.telefone", e.target.value)} disabled={readonly} /></div>
            <div className="md:col-span-3 space-y-1"><Label>Observações Adicionais</Label>
              <Textarea rows={4} value={f.obs.adicionais} onChange={(e) => update("obs.adicionais", e.target.value)} disabled={readonly} /></div>
          </CardContent></Card>
        </TabsContent>

        {/* Notificador */}
        <TabsContent value="notificador" className="pt-4">
          <Card><CardContent className="grid gap-3 md:grid-cols-3 pt-6">
            <div className="md:col-span-2 space-y-1"><Label>Município / Unidade de Saúde</Label>
              <Input value={unidade?.nome ?? ""} readOnly /></div>
            <div className="space-y-1"><Label>Cód. CNES</Label><Input value={unidade?.cnes ?? ""} readOnly /></div>
            <div className="md:col-span-2 space-y-1"><Label>Profissional</Label>
              <Select value={f.profissional_id} onValueChange={(v) => update("profissional_id", v)} disabled={readonly}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{profs.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                ))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Função</Label>
              <Input value={profs.find((p) => p.id === f.profissional_id)?.ocupacao ?? ""} readOnly /></div>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap gap-2 pt-4 border-t">
        {(canEditUBS || isAdmin) && (
          <Button onClick={() => save()} disabled={busy}>
            {busy ? "Salvando..." : isNew ? "Salvar notificação" : "Salvar alterações"}
          </Button>
        )}
        {!isNew && canEditUBS && notificacao.status === "ubs" && (
          <Button variant="secondary" onClick={() => save("epi")} disabled={busy}>
            Enviar para Epidemiologia →
          </Button>
        )}
        {!isNew && canEditEpi && notificacao.status !== "encerrada" && (
          <>
            <Button variant="secondary" onClick={() => save("epi")} disabled={busy}>
              Salvar campo #68
            </Button>
            <Button onClick={() => save("encerrada")} disabled={busy}>
              Encerrar notificação
            </Button>
          </>
        )}
      </div>
    </div>
  );
}