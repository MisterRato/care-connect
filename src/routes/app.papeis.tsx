import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { translateError } from "@/lib/error-messages";

export const Route = createFileRoute("/app/papeis")({
  component: Page,
});

type RoleRow = { id: string; user_id: string; role: string };

function Page() {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState<RoleRow[]>([]);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("ubs");

  async function load() {
    const { data } = await supabase.from("user_roles").select("*").order("created_at");
    setRows((data ?? []) as RoleRow[]);
  }
  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (!isAdmin) return <div className="text-muted-foreground">Acesso restrito a administradores.</div>;

  async function add(e: React.FormEvent) {
    e.preventDefault();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: role as any });
    if (error) return toast.error(translateError(error));
    toast.success("Papel atribuído");
    setUserId("");
    load();
  }
  async function remove(id: string) {
    const { error } = await supabase.from("user_roles").delete().eq("id", id);
    if (error) return toast.error(translateError(error));
    toast.success("Atribuição removida");
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Papéis de Usuário</h1>
      <Card>
        <CardHeader>
          <CardTitle>Atribuir papel</CardTitle>
          <CardDescription>Informe o UUID do usuário (auth.users) e escolha o papel.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={add} className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-2 space-y-1"><Label>User ID *</Label>
              <Input required value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="uuid" /></div>
            <div className="space-y-1"><Label>Papel</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">admin</SelectItem>
                  <SelectItem value="ubs">ubs</SelectItem>
                  <SelectItem value="epidemiologia">epidemiologia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3"><Button type="submit">Salvar</Button></div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{rows.length} atribuições</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>User ID</TableHead><TableHead>Papel</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>{rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.user_id}</TableCell>
                <TableCell>{r.role}</TableCell>
                <TableCell>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost">Remover</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover atribuição de papel?</AlertDialogTitle>
                        <AlertDialogDescription>
                          O usuário perderá imediatamente as permissões do papel
                          <strong> {r.role}</strong>. Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => remove(r.id)}>
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}