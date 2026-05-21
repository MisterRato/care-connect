// Gov.br OIDC config helpers (server-side use only — read inside handlers)

export function getGovbrConfig() {
  const env = (process.env.GOVBR_ENV || "staging").toLowerCase();
  const isProd = env === "prod" || env === "production";
  const base = isProd
    ? "https://sso.acesso.gov.br"
    : "https://sso.staging.acesso.gov.br";
  const clientId = process.env.GOVBR_CLIENT_ID;
  const clientSecret = process.env.GOVBR_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Gov.br não configurado: GOVBR_CLIENT_ID/GOVBR_CLIENT_SECRET ausentes");
  }
  return {
    base,
    clientId,
    clientSecret,
    authorizeUrl: `${base}/authorize`,
    tokenUrl: `${base}/token`,
    userinfoUrl: `${base}/userinfo`,
    scope: "openid email profile",
  };
}

export function buildRedirectUri(request: Request): string {
  const url = new URL(request.url);
  return `${url.origin}/api/auth/govbr/callback`;
}

export function b64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function sha256b64url(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return b64url(hash);
}

export function randomString(len = 48): string {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return b64url(arr);
}
