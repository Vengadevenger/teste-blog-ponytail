/**
 * Conector PageSpeed Insights (Core Web Vitals).
 * Requer só PAGESPEED_API_KEY (chave de API simples do Google Cloud).
 * Mede as principais páginas em mobile e desktop; dados de campo (CrUX)
 * quando existem, senão dados de laboratório (Lighthouse).
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://colabola.com.br";

export function estaConfigurado() {
  return Boolean(process.env.PAGESPEED_API_KEY);
}

async function medir(url, strategy) {
  const api = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  api.searchParams.set("url", url);
  api.searchParams.set("strategy", strategy);
  api.searchParams.set("category", "performance");
  api.searchParams.set("key", process.env.PAGESPEED_API_KEY);

  const res = await fetch(api, { cache: "no-store" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `PageSpeed respondeu ${res.status}`);

  const campo = data.loadingExperience?.metrics || {};
  const lab = data.lighthouseResult?.audits || {};
  return {
    fonte: data.loadingExperience?.metrics ? "campo (usuários reais)" : "laboratório",
    nota: Math.round((data.lighthouseResult?.categories?.performance?.score || 0) * 100),
    lcpMs:
      campo.LARGEST_CONTENTFUL_PAINT_MS?.percentile ??
      Math.round(lab["largest-contentful-paint"]?.numericValue || 0),
    inpMs:
      campo.INTERACTION_TO_NEXT_PAINT?.percentile ??
      Math.round(lab["interaction-to-next-paint"]?.numericValue || 0),
    cls:
      (campo.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile ?? null) !== null
        ? campo.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile / 100
        : Number(lab["cumulative-layout-shift"]?.numericValue?.toFixed(3) || 0),
  };
}

export async function testarConexao() {
  if (!estaConfigurado()) {
    return {
      ok: false,
      mensagem: "Falta a chave PAGESPEED_API_KEY no .env.local — veja o passo a passo abaixo.",
    };
  }
  try {
    await medir("https://www.google.com", "mobile");
    return { ok: true, mensagem: "Chave de API válida." };
  } catch (e) {
    return { ok: false, mensagem: e.message };
  }
}

/**
 * Mede as páginas principais (mobile e desktop). Demora ~20s por página,
 * por isso roda sob demanda e o resultado fica cacheado por 7 dias.
 * @param {string[]} paths - ex.: ["/", "/blog"]
 */
export async function buscarDados(paths) {
  const resultados = [];
  for (const path of paths) {
    const url = `${SITE_URL}${path === "/" ? "" : path}` || SITE_URL;
    const pagina = { pagina: path };
    for (const strategy of ["mobile", "desktop"]) {
      try {
        pagina[strategy] = await medir(url, strategy);
      } catch (e) {
        pagina[strategy] = { erro: e.message };
      }
    }
    resultados.push(pagina);
  }
  return resultados;
}
