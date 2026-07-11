import { googleAccessToken, googleConfigurado } from "./google-auth";

/**
 * Conector Google Analytics 4 (Data API).
 * Requer GA4_PROPERTY_ID (só o número, ex.: 123456789) e a mesma conta de
 * serviço do GSC adicionada como "Leitor" na propriedade do GA4.
 */

const SCOPE = ["https://www.googleapis.com/auth/analytics.readonly"];

export function estaConfigurado() {
  return googleConfigurado() && Boolean(process.env.GA4_PROPERTY_ID);
}

async function runReport(body) {
  const token = await googleAccessToken(SCOPE);
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${process.env.GA4_PROPERTY_ID}:runReport`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `GA4 respondeu ${res.status}`);
  return data;
}

const FILTRO_ORGANICO = {
  filter: {
    fieldName: "sessionDefaultChannelGroup",
    stringFilter: { value: "Organic Search" },
  },
};

export async function testarConexao() {
  if (!estaConfigurado()) {
    return {
      ok: false,
      mensagem:
        "Faltam chaves no .env.local (GA4_PROPERTY_ID e a conta de serviço do Google) — veja o passo a passo abaixo.",
    };
  }
  try {
    await runReport({
      dateRanges: [{ startDate: "7daysAgo", endDate: "yesterday" }],
      metrics: [{ name: "sessions" }],
      limit: 1,
    });
    return { ok: true, mensagem: `Conectado à propriedade GA4 ${process.env.GA4_PROPERTY_ID}.` };
  } catch (e) {
    return { ok: false, mensagem: e.message };
  }
}

/** Sessões orgânicas, engajamento e conversões (28d) + páginas de entrada orgânicas. */
export async function buscarDados() {
  const dateRanges = [{ startDate: "28daysAgo", endDate: "yesterday" }];

  const [resumo, entradas] = await Promise.all([
    runReport({
      dateRanges,
      metrics: [{ name: "sessions" }, { name: "engagementRate" }, { name: "keyEvents" }],
      dimensionFilter: FILTRO_ORGANICO,
    }),
    runReport({
      dateRanges,
      dimensions: [{ name: "landingPage" }],
      metrics: [{ name: "sessions" }, { name: "engagementRate" }],
      dimensionFilter: FILTRO_ORGANICO,
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 25,
    }),
  ]);

  const linha = resumo.rows?.[0]?.metricValues || [];
  return {
    sessoesOrganicas: Number(linha[0]?.value || 0),
    taxaEngajamento: Number(linha[1]?.value || 0),
    conversoes: Number(linha[2]?.value || 0),
    paginasEntrada: (entradas.rows || []).map((r) => ({
      pagina: r.dimensionValues[0].value,
      sessoes: Number(r.metricValues[0].value),
      engajamento: Number(r.metricValues[1].value),
    })),
  };
}
