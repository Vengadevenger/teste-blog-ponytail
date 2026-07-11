import * as gsc from "./gsc";
import * as ga4 from "./ga4";
import * as pagespeed from "./pagespeed";
import * as indexnow from "./indexnow";

/**
 * Registro central dos conectores de SEO. Para integrar uma ferramenta nova
 * (ex.: Ahrefs, Semrush), crie lib/seo-providers/<ferramenta>.js exportando
 * estaConfigurado() e testarConexao(), e adicione uma entrada aqui — o
 * painel de Integrações passa a exibi-la automaticamente.
 */
export const PROVIDERS = [
  {
    id: "gsc",
    nome: "Google Search Console",
    descricao:
      "Cliques, impressões, posição média e consultas que mostram seu site no Google. A fonte mais importante de todas.",
    envVars: ["GOOGLE_SERVICE_ACCOUNT_EMAIL", "GOOGLE_PRIVATE_KEY", "GSC_PROPERTY (opcional)"],
    modulo: gsc,
  },
  {
    id: "ga4",
    nome: "Google Analytics 4",
    descricao:
      "Sessões orgânicas, taxa de engajamento e conversões (cliques no botão de compra) vindas do Google.",
    envVars: ["GA4_PROPERTY_ID", "+ a mesma conta de serviço do Search Console"],
    modulo: ga4,
  },
  {
    id: "pagespeed",
    nome: "PageSpeed Insights",
    descricao:
      "Velocidade e Core Web Vitals (LCP, INP, CLS) — os indicadores de experiência que o Google usa no ranking.",
    envVars: ["PAGESPEED_API_KEY"],
    modulo: pagespeed,
  },
  {
    id: "indexnow",
    nome: "IndexNow (Bing e outros buscadores)",
    descricao:
      "Avisa Bing, Yandex e parceiros na hora em que sai conteúdo novo — indexação em minutos em vez de dias. Para o Google, o canal continua sendo o sitemap.xml.",
    envVars: [],
    modulo: indexnow,
  },
];

/** Status de todos os conectores (para o painel de Integrações). */
export function statusIntegracoes() {
  return PROVIDERS.map((p) => ({
    id: p.id,
    nome: p.nome,
    descricao: p.descricao,
    envVars: p.envVars,
    configurado: p.modulo.estaConfigurado(),
  }));
}

export function getProvider(id) {
  return PROVIDERS.find((p) => p.id === id) || null;
}
