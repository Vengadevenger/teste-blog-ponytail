import crypto from "crypto";

/**
 * Autenticação Google via Conta de Serviço (Service Account), sem SDK.
 * Gera um JWT RS256 e troca por um access token OAuth2 — ~40 linhas em vez
 * da dependência `googleapis` inteira.
 *
 * Variáveis de ambiente necessárias (.env.local):
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@yyy.iam.gserviceaccount.com
 *   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
 */

const tokenCache = {}; // por escopo: { token, expiraEm }

function b64url(input) {
  return Buffer.from(input).toString("base64url");
}

/** Indica se as credenciais da conta de serviço Google estão no ambiente. */
export function googleConfigurado() {
  return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY);
}

/**
 * Retorna um access token válido para os escopos pedidos (cacheado ~50 min).
 * @param {string[]} scopes - ex.: ["https://www.googleapis.com/auth/webmasters.readonly"]
 * @returns {Promise<string>}
 */
export async function googleAccessToken(scopes) {
  const chave = scopes.join(" ");
  const agora = Math.floor(Date.now() / 1000);
  if (tokenCache[chave] && tokenCache[chave].expiraEm > agora + 60) {
    return tokenCache[chave].token;
  }

  const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({
      iss: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      scope: chave,
      aud: "https://oauth2.googleapis.com/token",
      iat: agora,
      exp: agora + 3600,
    })
  );
  const assinatura = crypto
    .sign("RSA-SHA256", Buffer.from(`${header}.${claims}`), privateKey)
    .toString("base64url");
  const jwt = `${header}.${claims}.${assinatura}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "Falha ao obter token Google");
  }

  tokenCache[chave] = { token: data.access_token, expiraEm: agora + 3000 };
  return data.access_token;
}
