import { googleAccessToken, googleConfigurado } from "./google-auth";

/**
 * Conector Google Search Console (Search Analytics API).
 * Propriedade definida por GSC_PROPERTY (ex.: "sc-domain:colabola.com.br"
 * ou "https://colabola.com.br/"). Se ausente, deriva do domínio do site.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://colabola.com.br";
const SCOPE = ["https://www.googleapis.com/auth/webmasters.readonly"];

function propriedade() {
  return process.env.GSC_PROPERTY || `sc-domain:${new URL(SITE_URL).hostname}`;
}

export function estaConfigurado() {
  return googleConfigurado();
}

async function consultar(body) {
  const token = await googleAccessToken(SCOPE);
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(propriedade())}/searchAnalytics/query`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `GSC respondeu ${res.status}`);
  return data.rows || [];
}

function isoDia(diasAtras) {
  const d = new Date();
  d.setDate(d.getDate() - diasAtras);
  return d.toISOString().slice(0, 10);
}

function somar(rows) {
  const t = rows.reduce(
    (acc, r) => ({
      cliques: acc.cliques + r.clicks,
      impressoes: acc.impressoes + r.impressions,
      posicaoPonderada: acc.posicaoPonderada + r.position * r.impressions,
    }),
    { cliques: 0, impressoes: 0, posicaoPonderada: 0 }
  );
  return {
    cliques: t.cliques,
    impressoes: t.impressoes,
    ctr: t.impressoes ? t.cliques / t.impressoes : 0,
    posicao: t.impressoes ? t.posicaoPonderada / t.impressoes : 0,
  };
}

/** Testa a conexão com uma consulta mínima. */
export async function testarConexao() {
  if (!estaConfigurado()) {
    return {
      ok: false,
      mensagem:
        "Faltam as chaves GOOGLE_SERVICE_ACCOUNT_EMAIL e GOOGLE_PRIVATE_KEY no .env.local — veja o passo a passo abaixo.",
    };
  }
  try {
    await consultar({ startDate: isoDia(7), endDate: isoDia(3), rowLimit: 1 });
    return { ok: true, mensagem: `Conectado à propriedade ${propriedade()}.` };
  } catch (e) {
    return { ok: false, mensagem: e.message };
  }
}

/**
 * Busca o pacote completo de métricas do GSC:
 * total 28d vs 28d anteriores, série diária, páginas, top queries e
 * queries em "striking distance" (posição 5–15).
 */
export async function buscarDados() {
  // O GSC tem ~2 dias de atraso nos dados
  const atual = { startDate: isoDia(30), endDate: isoDia(2) };
  const anterior = { startDate: isoDia(58), endDate: isoDia(30) };

  const [rowsAtual, rowsAnterior, porDia, porPagina, porQuery] = await Promise.all([
    consultar({ ...atual, rowLimit: 1 }),
    consultar({ ...anterior, rowLimit: 1 }),
    consultar({ ...atual, dimensions: ["date"], rowLimit: 30 }),
    consultar({ ...atual, dimensions: ["page"], rowLimit: 100 }),
    consultar({ ...atual, dimensions: ["query", "page"], rowLimit: 250 }),
  ]);

  const queries = porQuery.map((r) => ({
    query: r.keys[0],
    pagina: r.keys[1],
    cliques: r.clicks,
    impressoes: r.impressions,
    ctr: r.ctr,
    posicao: r.position,
  }));

  return {
    periodo: atual,
    total: somar(rowsAtual),
    totalAnterior: somar(rowsAnterior),
    serie: porDia
      .map((r) => ({ data: r.keys[0], cliques: r.clicks, impressoes: r.impressions }))
      .sort((a, b) => a.data.localeCompare(b.data)),
    paginas: porPagina
      .map((r) => ({
        pagina: r.keys[0],
        cliques: r.clicks,
        impressoes: r.impressions,
        ctr: r.ctr,
        posicao: r.position,
      }))
      .sort((a, b) => b.cliques - a.cliques),
    topQueries: [...queries].sort((a, b) => b.cliques - a.cliques).slice(0, 20),
    strikingDistance: queries
      .filter((q) => q.posicao >= 5 && q.posicao <= 15)
      .sort((a, b) => b.impressoes - a.impressoes)
      .slice(0, 20),
  };
}
