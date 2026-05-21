import { createFileRoute } from "@tanstack/react-router";
import { buildRedirectUri, getGovbrConfig, randomString, sha256b64url } from "@/lib/govbr";

export const Route = createFileRoute("/api/auth/govbr/start")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const cfg = getGovbrConfig();
          const redirectUri = buildRedirectUri(request);
          const state = randomString(24);
          const codeVerifier = randomString(48);
          const codeChallenge = await sha256b64url(codeVerifier);

          const url = new URL(cfg.authorizeUrl);
          url.searchParams.set("response_type", "code");
          url.searchParams.set("client_id", cfg.clientId);
          url.searchParams.set("redirect_uri", redirectUri);
          url.searchParams.set("scope", cfg.scope);
          url.searchParams.set("state", state);
          url.searchParams.set("nonce", randomString(16));
          url.searchParams.set("code_challenge", codeChallenge);
          url.searchParams.set("code_challenge_method", "S256");

          const isHttps = new URL(request.url).protocol === "https:";
          const cookieAttrs = `Path=/; HttpOnly; SameSite=Lax; Max-Age=600${isHttps ? "; Secure" : ""}`;

          const headers = new Headers();
          headers.append("Set-Cookie", `govbr_state=${state}; ${cookieAttrs}`);
          headers.append("Set-Cookie", `govbr_pkce=${codeVerifier}; ${cookieAttrs}`);
          headers.set("Location", url.toString());
          return new Response(null, { status: 302, headers });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Erro";
          return new Response(`Gov.br: ${msg}`, { status: 500 });
        }
      },
    },
  },
});
