"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Módulo Métricas (Fase 3): dados reais do Google Search Console, GA4 e
 * PageSpeed. Sem credenciais configuradas, orienta o usuário para a aba
 * Integrações (degradação graciosa).
 */

const pct = (n) => `${(n * 100).toFixed(1)}%`;
const num = (n) => n.toLocaleString("pt-BR");

function variacao(atual, anterior) {
  if (!anterior) return null;
  return ((atual - anterior) / anterior) * 100;
}

function Delta({ valor, invertido = false }) {
  if (valor === null || !isFinite(valor)) return null;
  const positivo = invertido ? valor < 0 : valor > 0;
  return (
    <span className={`seo-m-delta ${positivo ? "seo-m-delta-bom" : "seo-m-delta-ruim"}`}>
      {valor > 0 ? "▲" : "▼"} {Math.abs(valor).toFixed(0)}%
    </span>
  );
}

/** Gráfico de linha (SVG puro): cliques e impressões por dia. */
function GraficoLinha({ serie }) {
  const W = 720;
  const H = 180;
  const PAD = 8;
  if (!serie?.length) return null;

  const maxCliques = Math.max(1, ...serie.map((d) => d.cliques));
  const maxImpressoes = Math.max(1, ...serie.map((d) => d.impressoes));
  const x = (i) => PAD + (i / Math.max(1, serie.length - 1)) * (W - 2 * PAD);
  const y = (v, max) => H - PAD - (v / max) * (H - 2 * PAD);

  const linha = (campo, max) =>
    serie.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d[campo], max).toFixed(1)}`).join(" ");

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="seo-m-grafico"
        role="img"
        aria-label="Cliques e impressões por dia nos últimos 28 dias"
      >
        <path d={linha("impressoes", maxImpressoes)} fill="none" stroke="var(--seo-amarelo)" strokeWidth="2.5" />
        <path d={linha("cliques", maxCliques)} fill="none" stroke="var(--seo-azul)" strokeWidth="2.5" />
        {serie.map((d, i) => (
          <circle key={d.data} cx={x(i)} cy={y(d.cliques, maxCliques)} r="6" fill="transparent">
            <title>{`${new Date(`${d.data}T00:00:00`).toLocaleDateString("pt-BR")}: ${d.cliques} cliques, ${d.impressoes} impressões`}</title>
          </circle>
        ))}
      </svg>
      <div className="seo-v-legenda">
        <span><i style={{ background: "var(--seo-azul)" }} /> Cliques</span>
        <span><i style={{ background: "var(--seo-amarelo)" }} /> Impressões</span>
      </div>
    </div>
  );
}

function corVital(metrica, valor) {
  const limites = { lcpMs: [2500, 4000], inpMs: [200, 500], cls: [0.1, 0.25] };
  const [bom, ruim] = limites[metrica];
  if (valor <= bom) return "seo-badge-ok";
  if (valor <= ruim) return "seo-badge-aviso";
  return "seo-badge-erro";
}

export default function MetricasSEO() {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);
  const [atualizando, setAtualizando] = useState(null);

  function carregar() {
    fetch("/api/seo/metricas")
      .then((r) => r.json())
      .then(setDados)
      .catch(() => setErro("Não foi possível carregar as métricas."));
  }

  useEffect(carregar, []);

  async function atualizar(alvo) {
    setAtualizando(alvo);
    setErro(null);
    try {
      const res = await fetch("/api/seo/metricas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alvo }),
      });
      const data = await res.json();
      if (data.erros) {
        setErro(Object.entries(data.erros).map(([k, v]) => `${k}: ${v}`).join(" · "));
      }
      carregar();
    } catch {
      setErro("A atualização falhou. Tente de novo.");
    } finally {
      setAtualizando(null);
    }
  }

  if (erro && !dados) return <p className="seo-erro-msg">{erro}</p>;
  if (!dados) return <p className="seo-carregando">Carregando…</p>;

  const { fontes, metricas } = dados;
  const nenhumaFonte = !fontes.gsc && !fontes.ga4 && !fontes.pagespeed;

  if (nenhumaFonte) {
    return (
      <div className="seo-card seo-aviso-metricas">
        <strong>Nenhuma fonte de dados conectada ainda.</strong> As métricas reais do Google
        (cliques, impressões, posição) aparecem aqui depois que você conectar as ferramentas na
        aba <Link href="/admin/seo?visao=integracoes">Integrações</Link> — leva uns 10 minutos e
        é grátis.
      </div>
    );
  }

  const gsc = metricas.gsc?.dados;
  const ga4 = metricas.ga4?.dados;
  const psi = metricas.pagespeed?.dados;

  return (
    <div className="seo-dashboard">
      <div className="seo-toolbar">
        <button className="seo-btn" onClick={() => atualizar("metricas")} disabled={!!atualizando || (!fontes.gsc && !fontes.ga4)}>
          {atualizando === "metricas" ? "Atualizando…" : "Atualizar dados"}
        </button>
        <button
          className="seo-btn seo-btn-secundario"
          onClick={() => atualizar("pagespeed")}
          disabled={!!atualizando || !fontes.pagespeed}
        >
          {atualizando === "pagespeed" ? "Medindo… (~1 min)" : "Atualizar performance"}
        </button>
        {metricas.gsc?.atualizadoEm && (
          <span className="seo-toolbar-info">
            Dados de {new Date(metricas.gsc.atualizadoEm).toLocaleString("pt-BR")}
          </span>
        )}
      </div>
      {atualizando && <div className="seo-v-indeterminada" aria-hidden="true" />}
      {erro && <p className="seo-erro-msg">{erro}</p>}

      {fontes.gsc && !gsc && (
        <div className="seo-card">
          <p>
            Search Console conectado. Clique em <strong>Atualizar dados</strong> para buscar as
            primeiras métricas.
          </p>
        </div>
      )}

      {gsc && (
        <>
          <div className="seo-cards-grid">
            <div className="seo-card seo-metric">
              <span className="seo-metric-valor">
                {num(gsc.total.cliques)} <Delta valor={variacao(gsc.total.cliques, gsc.totalAnterior.cliques)} />
              </span>
              <span className="seo-metric-label">Cliques (28 dias)</span>
            </div>
            <div className="seo-card seo-metric">
              <span className="seo-metric-valor">
                {num(gsc.total.impressoes)} <Delta valor={variacao(gsc.total.impressoes, gsc.totalAnterior.impressoes)} />
              </span>
              <span className="seo-metric-label">Impressões (28 dias)</span>
            </div>
            <div className="seo-card seo-metric">
              <span className="seo-metric-valor">{pct(gsc.total.ctr)}</span>
              <span className="seo-metric-label">CTR médio</span>
            </div>
            <div className="seo-card seo-metric">
              <span className="seo-metric-valor">
                {gsc.total.posicao.toFixed(1)} <Delta valor={variacao(gsc.total.posicao, gsc.totalAnterior.posicao)} invertido />
              </span>
              <span className="seo-metric-label">Posição média</span>
            </div>
          </div>

          <section className="seo-secao">
            <h2>Cliques e impressões por dia</h2>
            <div className="seo-card">
              <GraficoLinha serie={gsc.serie} />
            </div>
          </section>

          {gsc.strikingDistance.length > 0 && (
            <section className="seo-secao">
              <h2>Oportunidades — a poucas posições da 1ª página</h2>
              <div className="seo-card">
                <p className="seo-m-dica">
                  Estas buscas já mostram seu site entre as posições 5 e 15. Otimizar as páginas
                  para elas é o ganho mais rápido possível.
                </p>
                <table className="seo-m-tabela">
                  <thead>
                    <tr><th>Busca</th><th>Página</th><th>Posição</th><th>Impressões</th></tr>
                  </thead>
                  <tbody>
                    {gsc.strikingDistance.map((q) => (
                      <tr key={`${q.query}|${q.pagina}`}>
                        <td>{q.query}</td>
                        <td className="seo-m-pagina">{q.pagina.replace(/^https?:\/\/[^/]+/, "") || "/"}</td>
                        <td>{q.posicao.toFixed(1)}</td>
                        <td>{num(q.impressoes)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <section className="seo-secao">
            <h2>Páginas no Google</h2>
            <div className="seo-card">
              <table className="seo-m-tabela">
                <thead>
                  <tr><th>Página</th><th>Cliques</th><th>Impressões</th><th>CTR</th><th>Posição</th></tr>
                </thead>
                <tbody>
                  {gsc.paginas.slice(0, 25).map((p) => (
                    <tr key={p.pagina}>
                      <td className="seo-m-pagina">{p.pagina.replace(/^https?:\/\/[^/]+/, "") || "/"}</td>
                      <td>{num(p.cliques)}</td>
                      <td>{num(p.impressoes)}</td>
                      <td>{pct(p.ctr)}</td>
                      <td>{p.posicao.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {ga4 && (
        <section className="seo-secao">
          <h2>Tráfego orgânico (Analytics)</h2>
          <div className="seo-cards-grid">
            <div className="seo-card seo-metric">
              <span className="seo-metric-valor">{num(ga4.sessoesOrganicas)}</span>
              <span className="seo-metric-label">Sessões orgânicas (28d)</span>
            </div>
            <div className="seo-card seo-metric">
              <span className="seo-metric-valor">{pct(ga4.taxaEngajamento)}</span>
              <span className="seo-metric-label">Taxa de engajamento</span>
            </div>
            <div className="seo-card seo-metric">
              <span className="seo-metric-valor">{num(ga4.conversoes)}</span>
              <span className="seo-metric-label">Conversões</span>
            </div>
          </div>
        </section>
      )}

      {psi && (
        <section className="seo-secao">
          <h2>Performance (Core Web Vitals)</h2>
          <div className="seo-card">
            <table className="seo-m-tabela">
              <thead>
                <tr><th>Página</th><th>Dispositivo</th><th>Nota</th><th>LCP</th><th>INP</th><th>CLS</th></tr>
              </thead>
              <tbody>
                {psi.flatMap((p) =>
                  ["mobile", "desktop"].map((disp) => {
                    const m = p[disp];
                    if (!m || m.erro) {
                      return (
                        <tr key={`${p.pagina}-${disp}`}>
                          <td className="seo-m-pagina">{p.pagina}</td>
                          <td>{disp === "mobile" ? "Celular" : "Computador"}</td>
                          <td colSpan={4}>{m?.erro || "sem dados"}</td>
                        </tr>
                      );
                    }
                    return (
                      <tr key={`${p.pagina}-${disp}`}>
                        <td className="seo-m-pagina">{p.pagina}</td>
                        <td>{disp === "mobile" ? "Celular" : "Computador"}</td>
                        <td>{m.nota}</td>
                        <td><span className={`seo-badge ${corVital("lcpMs", m.lcpMs)}`}>{(m.lcpMs / 1000).toFixed(1)}s</span></td>
                        <td><span className={`seo-badge ${corVital("inpMs", m.inpMs)}`}>{m.inpMs}ms</span></td>
                        <td><span className={`seo-badge ${corVital("cls", m.cls)}`}>{m.cls}</span></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
