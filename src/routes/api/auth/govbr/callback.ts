import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { buildRedirectUri, getGovbrConfig } from "@/lib/govbr";

function parseCookies(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (!k) continue;
    out[k] = decodeURIComponent(rest.join("="));
  }
  return out;
}

export const Route = createFileRoute("/api/auth/govbr/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const errParam = url.searchParams.get("error");
        const origin = url.origin;

        const fail = (msg: string) =>
          new Response(null, {
            status: 302,
            headers: { Location: `${origin}/login?govbr_error=${encodeURIComponent(msg)}` },
          });

        if (errParam) return fail(errParam);
        if (!code || !state) return fail("missing_code_or_state");

        const cookies = parseCookies(request.headers.get("cookie"));
        if (cookies.govbr_state !== state) return fail("state_mismatch");
        const codeVerifier = cookies.govbr_pkce;
        if (!codeVerifier) return fail("missing_pkce");

        try {
          const cfg = getGovbrConfig();
          const redirectUri = buildRedirectUri(request);
          const basicAuth = btoa(`${cfg.clientId}:${cfg.clientSecret}`);

          const tokenRes = await fetch(cfg.tokenUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Basic ${basicAuth}`,
            },
            body: new URLSearchParams({
              grant_type: "authorization_code",
              code,
              redirect_uri: redirectUri,
              code_verifier: codeVerifier,
            }).toString(),
          });
          if (!tokenRes.ok) {
            const t = await tokenRes.text();
            return fail(`token_exchange_failed:${tokenRes.status}:${t.slice(0, 200)}`);
          }
          const tokens = (await tokenRes.json()) as {
            access_token: string;
            id_token?: string;
          };

          const userRes = await fetch(cfg.userinfoUrl, {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          });
          if (!userRes.ok) return fail(`userinfo_failed:${userRes.status}`);
          const info = (await userRes.json()) as {
            sub: string;
            email?: string;
            email_verified?: boolean;
            name?: string;
            cpf?: string;
          };

          const cpf = info.cpf || info.sub;
          const email = info.email || `${cpf}@govbr.local`;
          const fullName = info.name || "Usuário Gov.br";

          // Upsert user
          const list = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
          let userId =
            list.data?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id;

          if (!userId) {
            const created = await supabaseAdmin.auth.admin.createUser({
              email,
              email_confirm: true,
              user_metadata: { full_name: fullName, govbr_sub: info.sub, cpf },
            });
            if (created.error || !created.data.user) {
              return fail(`create_user_failed:${created.error?.message ?? "unknown"}`);
            }
            userId = created.data.user.id;
          }

          // Generate a magic link the browser can follow to establish a session
          const link = await supabaseAdmin.auth.admin.generateLink({
            type: "magiclink",
            email,
            options: { redirectTo: `${origin}/app` },
          });
          if (link.error || !link.data.properties?.action_link) {
            return fail(`magiclink_failed:${link.error?.message ?? "unknown"}`);
          }

          const headers = new Headers();
          // clear cookies
          headers.append("Set-Cookie", "govbr_state=; Path=/; Max-Age=0");
          headers.append("Set-Cookie", "govbr_pkce=; Path=/; Max-Age=0");
          headers.set("Location", link.data.properties.action_link);
          return new Response(null, { status: 302, headers });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "erro";
          return fail(msg);
        }
      },
    },
  },
});
