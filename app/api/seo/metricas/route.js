import { NextResponse } from "next/server";
import { hasValidSession } from "@/lib/seo-audit/auth";
import { readJson, writeJson } from "@/lib/seo-audit/storage";
import * as gsc from "@/lib/seo-providers/gsc";
import * as ga4 from "@/lib/seo-providers/ga4";
import * as pagespeed from "@/lib/seo-providers/pagespeed";

export const dynamic = "force-dynamic";

const CACHE_FILE = "metrics-cache.json";
const HORAS_12 = 12 * 60 * 60 * 1000;
const DIAS_7 = 7 * 24 * 60 * 60 * 1000;
const PAGINAS_PSI = ["/", "/blog"];

function expirado(entrada, ttl) {
  return !entrada?.atualizadoEm || Date.now() - new Date(entrada.atualizadoEm).getTime() > ttl;
}

/** Métricas cacheadas + status de configuração de cada fonte. */
export async function GET() {
  if (!hasValidSession()) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  const cache = readJson(CACHE_FILE, {});
  return NextResponse.json({
    metricas: cache,
    fontes: {
      gsc: gsc.estaConfigurado(),
      ga4: ga4.estaConfigurado(),
      pagespeed: pagespeed.estaConfigurado(),
    },
    desatualizado: {
      gsc: expirado(cache.gsc, HORAS_12),
      ga4: expirado(cache.ga4, HORAS_12),
      pagespeed: expirado(cache.pagespeed, DIAS_7),
    },
  });
}

/**
 * Atualiza os dados ignorando o cache (botão "Atualizar dados").
 * { alvo: "metricas" } → GSC + GA4 (rápido)
 * { alvo: "pagespeed" } → Core Web Vitals (lento, ~1 min)
 */
export async function POST(request) {
  if (!hasValidSession()) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  const { alvo } = await request.json().catch(() => ({}));
  const cache = readJson(CACHE_FILE, {});
  const erros = {};

  if (alvo === "pagespeed") {
    if (!pagespeed.estaConfigurado()) {
      return NextResponse.json({ erro: "PageSpeed não configurado." }, { status: 400 });
    }
    try {
      cache.pagespeed = {
        atualizadoEm: new Date().toISOString(),
        dados: await pagespeed.buscarDados(PAGINAS_PSI),
      };
    } catch (e) {
      erros.pagespeed = e.message;
    }
  } else {
    if (gsc.estaConfigurado()) {
      try {
        cache.gsc = { atualizadoEm: new Date().toISOString(), dados: await gsc.buscarDados() };
      } catch (e) {
        erros.gsc = e.message;
      }
    }
    if (ga4.estaConfigurado()) {
      try {
        cache.ga4 = { atualizadoEm: new Date().toISOString(), dados: await ga4.buscarDados() };
      } catch (e) {
        erros.ga4 = e.message;
      }
    }
  }

  writeJson(CACHE_FILE, cache);
  return NextResponse.json({ metricas: cache, erros: Object.keys(erros).length ? erros : null });
}
