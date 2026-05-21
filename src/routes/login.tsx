import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/app" });
  }, [loading, session, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("govbr_error");
    if (err) {
      toast.error(`Falha no login Gov.br: ${err}`);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  async function signInOAuth(provider: "google" | "apple") {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin + "/app",
      });
      if (result.error) throw result.error;
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function signInGovbr() {
    window.location.href = "/api/auth/govbr/start";
  }

  function signInMeta() {
    toast.error(
      "Login com Meta (Facebook) não está disponível no Lovable Cloud gerenciado. Requer conexão direta com Supabase para habilitar o provedor Facebook.",
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Conta criada. Você já pode entrar.");
        setMode("signin");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>SISViolência — SINAN</CardTitle>
          <CardDescription>
            {mode === "signin" ? "Entre com suas credenciais" : "Crie uma conta"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-4">
            <Button type="button" variant="outline" className="w-full" disabled={busy} onClick={() => signInOAuth("google")}>
              Entrar com Google
            </Button>
            <Button type="button" variant="outline" className="w-full" disabled={busy} onClick={() => signInOAuth("apple")}>
              Entrar com Apple
            </Button>
            <Button type="button" variant="outline" className="w-full" disabled={busy} onClick={signInGovbr}>
              Entrar com Gov.br
            </Button>
            <Button type="button" variant="outline" className="w-full" disabled={busy} onClick={signInMeta}>
              Entrar com Meta
            </Button>
          </div>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">ou com e-mail</span>
            </div>
          </div>
          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Aguarde..." : mode === "signin" ? "Entrar" : "Cadastrar"}
            </Button>
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground w-full text-center"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
            </button>
            <p className="text-xs text-muted-foreground text-center">
              O primeiro usuário cadastrado recebe papel de <strong>admin</strong>. Os demais recebem <strong>UBS</strong>.
              Admins podem alterar papéis na tabela.
            </p>
            <div className="text-center">
              <Link to="/" className="text-xs text-muted-foreground hover:underline">← Início</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}