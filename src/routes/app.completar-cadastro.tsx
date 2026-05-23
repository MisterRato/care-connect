import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SEXO, CONSELHO_CLASSE } from "@/lib/violencia-options";
import { toast } from "sonner";
import { translateError } from "@/lib/error-messages";

export const Route = createFileRoute("/app/completar-cadastro")({ component: Page });

type UnidSaude = { id: string; nome: string };

function Page() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [unidades, setUnidades] = useState<UnidSaude[]>([]);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    cpf: "",
    cns: "",
    sexo: "",
    dt_nascimento: "",
    ocupacao: "",
    cbo: "",
    conselho_classe: "",
    numero_conselho: "",
    uf_conselho: "",
    unidade_saude_id: "",
  });

  useEffect(() => {
    if (!user) return;
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    setForm((f) => ({
      ...f,
      nome: f.nome || (meta.full_name as string) || (meta.name as string) || "",
      email: f.email || user.email || "",
    }));
  }, [user]);

  useEffect(() => {
    supabase.from("unidades_saude").select("id,nome").order("nome").then(({ data }) => {
      setUnidades((data ?? []) as UnidSaude[]);
    });
  }, []);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const payload = {
      ...form,
      user_id: user.id,
      unidade_saude_id: form.unidade_saude_id || null,
      dt_nascimento: form.dt_nascimento || null,
    };
    const { error } = await supabase.from("profissionais").insert(payload);
    setBusy(false);
    if (error) {
      toast.error(translateError(error));
      return;
    }
    toast.success("Cadastro concluído. Bem-vindo(a)!");
    navigate({ to: "/app" });
  }

  if (loading) return <div className="text-muted-foreground">Carregando...</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Complete seu cadastro de profissional</CardTitle>
          <CardDescription>
            Não encontramos um cadastro de profissional vinculado à sua conta. Preencha os dados abaixo
            para começar a usar o sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-5">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="md:col-span-2 space-y-1">
                <Label>Nome completo *</Label>
                <Input required value={form.nome} onChange={(e) => set("nome", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Sexo</Label>
                <Select value={form.sexo} onValueChange={(v) => set("sexo", v)}>
                  <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                  <SelectContent>{SEXO.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Dt. Nascimento</Label>
                <Input type="date" value={form.dt_nascimento} onChange={(e) => set("dt_nascimento", e.target.value)} /></div>
              <div className="space-y-1"><Label>CPF</Label>
                <Input value={form.cpf} onChange={(e) => set("cpf", e.target.value)} /></div>
              <div className="space-y-1"><Label>CNS</Label>
                <Input value={form.cns} onChange={(e) => set("cns", e.target.value)} /></div>
              <div className="space-y-1"><Label>E-mail *</Label>
                <Input type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
              <div className="space-y-1"><Label>Telefone</Label>
                <Input value={form.telefone} onChange={(e) => set("telefone", e.target.value)} /></div>
              <div className="md:col-span-2 space-y-1"><Label>Ocupação</Label>
                <Input value={form.ocupacao} onChange={(e) => set("ocupacao", e.target.value)} /></div>
              <div className="space-y-1"><Label>CBO</Label>
                <Input value={form.cbo} onChange={(e) => set("cbo", e.target.value)} /></div>
              <div className="space-y-1"><Label>Conselho</Label>
                <Select value={form.conselho_classe} onValueChange={(v) => set("conselho_classe", v)}>
                  <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                  <SelectContent>{CONSELHO_CLASSE.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Nº Conselho</Label>
                <Input value={form.numero_conselho} onChange={(e) => set("numero_conselho", e.target.value)} /></div>
              <div className="space-y-1"><Label>UF</Label>
                <Input maxLength={2} value={form.uf_conselho} onChange={(e) => set("uf_conselho", e.target.value.toUpperCase())} /></div>
              <div className="md:col-span-3 space-y-1"><Label>Unidade de Saúde</Label>
                <Select value={form.unidade_saude_id} onValueChange={(v) => set("unidade_saude_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{unidades.map((u) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="submit" disabled={busy}>{busy ? "Salvando..." : "Concluir cadastro"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}