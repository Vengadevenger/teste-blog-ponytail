import fs from "fs";
import path from "path";
import sitemap from "@/app/sitemap";
import { getPostBySlug } from "@/lib/blog-data";
import { parsePage } from "./parse-html";
import { runPageChecks, runPostChecks, runSalePageChecks, runSiteChecks } from "./checks";
import { readJson, writeJson } from "./storage";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://colabola.com.br";
const HISTORY_FILE = "audit-history.json";
const MAX_HISTORY = 10;
const IMG_HEAVY_KB = 200;

/** Normaliza um href interno para um path ("/blog/x"), ou null se for externo. */
function toInternalPath(href) {
  if (href.startsWith(SITE_URL)) href = href.slice(SITE_URL.length) || "/";
  if (!href.startsWith("/")) return null;
  if (href.startsWith("/api/")) return null;
  return href.split(/[?#]/)[0] || "/";
}

/**
 * Descoberta automática de rotas: varre `app/` (rotas estáticas) e a saída
 * de `app/sitemap.js` (rotas dinâmicas, ex.: posts). Rotas novas entram
 * automaticamente, sem configuração.
 * @returns {string[]} paths ordenados, ex.: ["/", "/blog", "/blog/slug"]
 */
export function discoverRoutes() {
  const rotas = new Set();

  const appDir = path.join(process.cwd(), "app");
  (function walk(dir, rota) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    if (entries.some((e) => e.isFile() && /^page\.(jsx?|tsx?)$/.test(e.name))) {
      rotas.add(rota || "/");
    }
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      // dinâmicas ([slug]) vêm do sitemap; admin/api não são públicas
      if (e.name.startsWith("[") || e.name === "api" || e.name === "admin") continue;
      walk(path.join(dir, e.name), `${rota}/${e.name}`);
    }
  })(appDir, "");

  for (const entry of sitemap()) {
    const p = toInternalPath(entry.url);
    if (p) rotas.add(p);
  }

  return [...rotas].sort();
}

/** Classifica o tipo da página para aplicar as verificações certas. */
function classifyRoute(rota) {
  if (rota === "/") return "venda";
  if (rota === "/blog" || /^\/blog\/page\/\d+$/.test(rota)) return "listagem";
  if (rota.startsWith("/blog/")) return "post";
  return "pagina";
}

/** Tamanho em KB (arredondado) de uma imagem em public/, ou 0 se não existir. */
function imageKb(src) {
  try {
    const clean = src.split(/[?#]/)[0];
    // ponytail: ignora imagens otimizadas via /_next/image; mede só as servidas de public/
    if (!clean.startsWith("/") || clean.startsWith("/_next/")) return 0;
    return Math.round(fs.statSync(path.join(process.cwd(), "public", clean)).size / 1024);
  } catch {
    return 0;
  }
}

/**
 * Roda a auditoria completa: descobre rotas, busca o HTML renderizado de
 * cada uma no servidor local (o que o Google realmente vê), roda todas as
 * verificações e persiste o resultado em `.seo-dashboard/audit-history.json`.
 * @param {string} origin - ex.: "http://localhost:3000"
 */
export async function runAudit(origin) {
  const rotas = discoverRoutes();

  const pages = [];
  for (const rota of rotas) {
    let html = "";
    let httpStatus = 0;
    try {
      const res = await fetch(`${origin}${rota === "/" ? "" : rota}` || origin, {
        cache: "no-store",
      });
      httpStatus = res.status;
      html = await res.text();
    } catch {
      // servidor local indisponível para esta rota — registrado abaixo
    }
    pages.push({ path: rota, tipo: classifyRoute(rota), httpStatus, ...parsePage(html) });
  }

  // Grafo de links internos: entradas por página + links quebrados
  const inventario = new Set(rotas);
  const incomingLinks = {};
  const brokenByPage = {};
  for (const page of pages) {
    const internos = new Set(page.links.map(toInternalPath).filter(Boolean));
    brokenByPage[page.path] = [];
    for (const destino of internos) {
      if (inventario.has(destino)) {
        if (destino !== page.path) {
          incomingLinks[destino] = (incomingLinks[destino] || 0) + 1;
        }
      } else {
        brokenByPage[page.path].push(destino);
      }
    }
  }

  let robotsTxt = "";
  try {
    robotsTxt = await (await fetch(`${origin}/robots.txt`, { cache: "no-store" })).text();
  } catch {}

  const sitemapPaths = sitemap()
    .map((e) => toInternalPath(e.url))
    .filter(Boolean);

  const paginas = pages.map((page) => {
    let checks;
    if (page.httpStatus !== 200) {
      checks = [
        {
          id: "http",
          nome: "Página acessível",
          status: "erro",
          explicacao: `A página respondeu com status ${page.httpStatus || "sem resposta"} — não foi possível auditá-la.`,
          comoCorrigir: "Verifique se o servidor local está rodando e se a rota existe.",
        },
      ];
    } else {
      checks = runPageChecks(page, { rotas, brokenLinks: brokenByPage[page.path] });
      if (page.tipo === "post") {
        const post = getPostBySlug(page.path.replace("/blog/", ""));
        if (post) checks.push(...runPostChecks(page, post));
      }
      if (page.tipo === "venda") {
        const imagensPesadas = page.images
          .map((img) => ({ src: img.src, kb: imageKb(img.src) }))
          .filter((img) => img.kb > IMG_HEAVY_KB);
        checks.push(...runSalePageChecks(page, { imagensPesadas }));
      }
    }
    return {
      path: page.path,
      tipo: page.tipo,
      title: page.title,
      metaDescription: page.metaDescription,
      linksEntrada: incomingLinks[page.path] || 0,
      checks,
    };
  });

  const okPages = pages.filter((p) => p.httpStatus === 200);
  const site = runSiteChecks(okPages, { sitemapPaths, rotas, robotsTxt, incomingLinks });

  const todos = [...paginas.flatMap((p) => p.checks), ...site];
  const audit = {
    executadaEm: new Date().toISOString(),
    totalPaginas: rotas.length,
    resumo: {
      ok: todos.filter((c) => c.status === "ok").length,
      avisos: todos.filter((c) => c.status === "aviso").length,
      erros: todos.filter((c) => c.status === "erro").length,
    },
    paginas,
    site,
  };

  const history = readJson(HISTORY_FILE, []);
  history.unshift(audit);
  writeJson(HISTORY_FILE, history.slice(0, MAX_HISTORY));

  return audit;
}

/** Retorna a auditoria mais recente persistida, ou null. */
export function getLastAudit() {
  return readJson(HISTORY_FILE, [])[0] || null;
}

/** Resumo das auditorias anteriores (mais recente primeiro), para gráfico de tendência. */
export function getAuditHistory() {
  return readJson(HISTORY_FILE, []).map((a) => ({
    executadaEm: a.executadaEm,
    totalPaginas: a.totalPaginas,
    resumo: a.resumo,
  }));
}
