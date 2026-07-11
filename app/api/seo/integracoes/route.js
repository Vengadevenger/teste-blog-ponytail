import { NextResponse } from "next/server";
import { hasValidSession } from "@/lib/seo-audit/auth";
import { statusIntegracoes, getProvider } from "@/lib/seo-providers";
import { ativar, submeterUrls } from "@/lib/seo-providers/indexnow";
import { discoverRoutes } from "@/lib/seo-audit/run-audit";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://colabola.com.br";

/** Status de todas as integrações. */
export async function GET() {
  if (!hasValidSession()) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  return NextResponse.json({ integracoes: statusIntegracoes() });
}

/**
 * Ações: { acao: "testar", id } | { acao: "ativar-indexnow" } |
 * { acao: "notificar-buscadores" }
 */
export async function POST(request) {
  if (!hasValidSession()) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  const { acao, id } = await request.json().catch(() => ({}));

  try {
    if (acao === "testar") {
      const provider = getProvider(id);
      if (!provider) return NextResponse.json({ erro: "Integração desconhecida." }, { status: 400 });
      const resultado = await provider.modulo.testarConexao();
      return NextResponse.json({ resultado });
    }

    if (acao === "ativar-indexnow") {
      const cfg = ativar();
      return NextResponse.json({
        resultado: { ok: true, mensagem: `IndexNow ativado. Chave publicada em /${cfg.chave}.txt.` },
      });
    }

    if (acao === "notificar-buscadores") {
      const urls = discoverRoutes().map((r) => `${SITE_URL}${r === "/" ? "" : r}` || SITE_URL);
      const resultado = await submeterUrls(urls);
      return NextResponse.json({ resultado });
    }

    return NextResponse.json({ erro: "Ação inválida." }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ resultado: { ok: false, mensagem: e.message } });
  }
}
