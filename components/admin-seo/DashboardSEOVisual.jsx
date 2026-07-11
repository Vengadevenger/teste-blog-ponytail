"use client";

import { useEffect, useState } from "react";

/**
 * Versão alternativa (visual) do dashboard: medidor de saúde, barras de
 * progresso, gráfico de problemas por página e tendência entre auditorias.
 * Mesmos dados e APIs da versão clássica — apenas a apresentação muda.
 */

const TASK_STATUS_LABEL = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  ignorada: "Ignorada",
};
const PRIORIDADE_ORDEM = { alta: 0, média: 1, baixa: 2 };
const NIVEL_DOTS = { baixo: 1, médio: 2, alto: 3 };

/** Saúde 0–100 de um conjunto de checks (erro pesa o dobro de aviso). */
function calcularSaude(checks) {
  const ok = checks.filter((c) => c.status === "ok").length;
  const avisos = checks.filter((c) => c.status === "aviso").length;
  const erros = checks.filter((c) => c.status === "erro").length;
  const total = ok + avisos + 2 * erros;
  return total === 0 ? 100 : Math.round((ok / total) * 100);
}

function corDaSaude(score) {
  if (score >= 80) return "var(--seo-verde)";
  if (score >= 50) return "var(--seo-laranja)";
  return "var(--seo-vermelho)";
}

/* Ícones SVG (sem emoji) */
function IconeCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconeAlerta() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <path d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconeErro() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  );
}
function IconeBusca() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
    </svg>
  );
}

/** Medidor circular de saúde (0–100). */
function Medidor({ score, tamanho = 132, rotulo }) {
  const espessura = 14;
  const r = (tamanho - espessura) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div className="seo-v-medidor" role="img" aria-label={`${rotulo}: ${score} de 100`}>
      <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`}>
        <circle cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none" stroke="var(--seo-borda)" strokeWidth={espessura} />
        <circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={r}
          fill="none"
          stroke={corDaSaude(score)}
          strokeWidth={espessura}
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * circ} ${circ}`}
          transform={`rotate(-90 ${tamanho / 2} ${tamanho / 2})`}
          className="seo-v-medidor-arco"
        />
        <text x="50%" y="46%" textAnchor="middle" dominantBaseline="central" className="seo-v-medidor-num">
          {score}
        </text>
        <text x="50%" y="64%" textAnchor="middle" dominantBaseline="central" className="seo-v-medidor-sub">
          /100
        </text>
      </svg>
      <span className="seo-v-medidor-rotulo">{rotulo}</span>
    </div>
  );
}

/** Barra de progresso com cor semântica. */
function Barra({ pct, cor }) {
  return (
    <div className="seo-v-barra" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="seo-v-barra-fill" style={{ width: `${pct}%`, background: cor }} />
    </div>
  );
}

/** 1 a 3 bolinhas para impacto/esforço. */
function Dots({ nivel, cor }) {
  const cheias = NIVEL_DOTS[nivel] || 2;
  return (
    <span className="seo-v-dots" aria-label={nivel} title={nivel}>
      {[1, 2, 3].map((i) => (
        <span key={i} className="seo-v-dot" style={{ background: i <= cheias ? cor : "var(--seo-borda)" }} />
      ))}
    </span>
  );
}

/** Lista de verificações (compartilhada entre páginas e site). */
function ListaChecks({ checks }) {
  return (
    <ul className="seo-check-lista">
      {checks.map((c) => (
        <li key={c.id} className={`seo-check seo-check-${c.status}`}>
          <div className="seo-check-cabecalho">
            <span className={`seo-badge seo-badge-${c.status}`}>
              {c.status === "ok" ? "OK" : c.status === "aviso" ? "Aviso" : "Erro"}
            </span>
            <strong>{c.nome}</strong>
          </div>
          {c.status !== "ok" && (
            <div className="seo-check-corpo">
              <p>{c.explicacao}</p>
              {c.comoCorrigir && (
                <p className="seo-check-corrigir">
                  <strong>Como corrigir:</strong> {c.comoCorrigir}
                </p>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Gráfico de barras horizontais: erros e avisos por página. */
function GraficoProblemas({ paginas }) {
  const dados = paginas.map((p) => ({
    path: p.path,
    erros: p.checks.filter((c) => c.status === "erro").length,
    avisos: p.checks.filter((c) => c.status === "aviso").length,
  }));
  const max = Math.max(1, ...dados.map((d) => d.erros + d.avisos));
  return (
    <div className="seo-v-grafico">
      {dados.map((d) => (
        <div key={d.path} className="seo-v-grafico-linha">
          <span className="seo-v-grafico-rotulo">{d.path}</span>
          <div className="seo-v-grafico-trilha">
            {d.erros > 0 && (
              <span
                className="seo-v-grafico-seg"
                style={{ width: `${(d.erros / max) * 100}%`, background: "var(--seo-vermelho)" }}
                title={`${d.erros} erro(s)`}
              >
                {d.erros}
              </span>
            )}
            {d.avisos > 0 && (
              <span
                className="seo-v-grafico-seg"
                style={{ width: `${(d.avisos / max) * 100}%`, background: "var(--seo-laranja)" }}
                title={`${d.avisos} aviso(s)`}
              >
                {d.avisos}
              </span>
            )}
            {d.erros === 0 && d.avisos === 0 && <span className="seo-v-grafico-zero">sem problemas</span>}
          </div>
        </div>
      ))}
      <div className="seo-v-legenda">
        <span><i style={{ background: "var(--seo-vermelho)" }} /> Erros</span>
        <span><i style={{ background: "var(--seo-laranja)" }} /> Avisos</span>
      </div>
    </div>
  );
}

/** Tendência de problemas nas últimas auditorias (colunas empilhadas). */
function GraficoTendencia({ historico }) {
  const serie = [...historico].reverse(); // mais antiga → mais recente
  const max = Math.max(1, ...serie.map((h) => h.resumo.erros + h.resumo.avisos));
  return (
    <div className="seo-v-tendencia" role="img" aria-label="Problemas encontrados nas últimas auditorias">
      {serie.map((h, i) => {
        const total = h.resumo.erros + h.resumo.avisos;
        return (
          <div
            key={h.executadaEm}
            className="seo-v-tendencia-col"
            title={`${new Date(h.executadaEm).toLocaleString("pt-BR")}: ${h.resumo.erros} erros, ${h.resumo.avisos} avisos`}
          >
            <span className="seo-v-tendencia-valor">{total}</span>
            <div className="seo-v-tendencia-barra" style={{ height: `${Math.max(8, (total / max) * 64)}px` }}>
              <div style={{ height: `${total ? (h.resumo.erros / total) * 100 : 0}%`, background: "var(--seo-vermelho)" }} />
              <div style={{ flex: 1, background: "var(--seo-laranja)" }} />
            </div>
            <span className="seo-v-tendencia-rotulo">
              {i === serie.length - 1
                ? "agora"
                : new Date(h.executadaEm).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardSEOVisual() {
  const [audit, setAudit] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [auditando, setAuditando] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/seo/audit").then((r) => r.json()),
      fetch("/api/seo/tasks").then((r) => r.json()),
    ])
      .then(([a, t]) => {
        setAudit(a.audit);
        setHistorico(a.historico || []);
        setTasks(t.tasks || []);
      })
      .catch(() => setErro("Não foi possível carregar os dados."))
      .finally(() => setCarregando(false));
  }, []);

  async function rodarAuditoria() {
    setAuditando(true);
    setErro(null);
    try {
      const res = await fetch("/api/seo/audit", { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAudit(data.audit);
      setHistorico(data.historico || []);
      setTasks(data.tasks || []);
    } catch {
      setErro("A auditoria falhou. Verifique se o servidor está rodando e tente de novo.");
    } finally {
      setAuditando(false);
    }
  }

  async function mudarStatusTarefa(id, status) {
    setTasks((atual) => atual.map((t) => (t.id === id ? { ...t, status } : t)));
    await fetch("/api/seo/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
  }

  if (carregando) return <p className="seo-carregando">Carregando…</p>;

  const todosChecks = audit ? [...audit.paginas.flatMap((p) => p.checks), ...audit.site] : [];
  const saudeGeral = audit ? calcularSaude(todosChecks) : null;
  const abertas = tasks
    .filter((t) => t.status === "pendente" || t.status === "em_andamento")
    .sort((a, b) => (PRIORIDADE_ORDEM[a.prioridade] ?? 9) - (PRIORIDADE_ORDEM[b.prioridade] ?? 9));
  const resolvidas = tasks.filter((t) => t.status === "concluida" || t.status === "ignorada").length;
  const pctTarefas = tasks.length === 0 ? 0 : Math.round((resolvidas / tasks.length) * 100);

  return (
    <div className="seo-dashboard">
      <div className="seo-toolbar">
        <button className="seo-btn seo-btn-icone" onClick={rodarAuditoria} disabled={auditando}>
          <IconeBusca /> {auditando ? "Auditando…" : "Rodar auditoria"}
        </button>
        {audit && (
          <span className="seo-toolbar-info">
            Última auditoria: {new Date(audit.executadaEm).toLocaleString("pt-BR")}
          </span>
        )}
      </div>
      {auditando && <div className="seo-v-indeterminada" aria-hidden="true" />}
      {erro && <p className="seo-erro-msg">{erro}</p>}

      {!audit && !erro && (
        <div className="seo-card">
          <p>
            Nenhuma auditoria ainda. Clique em <strong>Rodar auditoria</strong> para analisar todas
            as páginas do site.
          </p>
        </div>
      )}

      {audit && (
        <>
          {/* Painel de saúde: medidor geral + KPIs + tendência */}
          <div className="seo-v-painel">
            <div className="seo-card seo-v-painel-medidor">
              <Medidor score={saudeGeral} rotulo="Saúde SEO do site" />
            </div>
            <div className="seo-card seo-v-painel-kpis">
              <div className="seo-v-kpi">
                <span className="seo-v-kpi-num">{audit.totalPaginas}</span>
                <span className="seo-v-kpi-label">Páginas auditadas</span>
              </div>
              <div className="seo-v-kpi seo-v-kpi-erro">
                <span className="seo-v-kpi-num"><IconeErro /> {audit.resumo.erros}</span>
                <span className="seo-v-kpi-label">Erros</span>
              </div>
              <div className="seo-v-kpi seo-v-kpi-aviso">
                <span className="seo-v-kpi-num"><IconeAlerta /> {audit.resumo.avisos}</span>
                <span className="seo-v-kpi-label">Avisos</span>
              </div>
              <div className="seo-v-kpi seo-v-kpi-ok">
                <span className="seo-v-kpi-num"><IconeCheck /> {audit.resumo.ok}</span>
                <span className="seo-v-kpi-label">Verificações OK</span>
              </div>
            </div>
            {historico.length > 1 && (
              <div className="seo-card seo-v-painel-tendencia">
                <h3>Evolução dos problemas</h3>
                <GraficoTendencia historico={historico} />
              </div>
            )}
          </div>

          <section className="seo-secao">
            <h2>Problemas por página</h2>
            <div className="seo-card">
              <GraficoProblemas paginas={audit.paginas} />
            </div>
          </section>

          <section className="seo-secao">
            <h2>Saúde por página</h2>
            {audit.paginas.map((p) => {
              const score = calcularSaude(p.checks);
              const erros = p.checks.filter((c) => c.status === "erro").length;
              const avisos = p.checks.filter((c) => c.status === "aviso").length;
              return (
                <details key={p.path} className="seo-card seo-pagina">
                  <summary>
                    <span className="seo-pagina-path">{p.path}</span>
                    <span className="seo-pagina-tipo">{p.tipo}</span>
                    <span className="seo-v-pagina-saude">
                      <Barra pct={score} cor={corDaSaude(score)} />
                      <strong style={{ color: corDaSaude(score) }}>{score}</strong>
                    </span>
                  </summary>
                  <div className="seo-v-pagina-resumo">
                    {erros > 0 && <span className="seo-v-chip seo-v-chip-erro"><IconeErro /> {erros} erro(s)</span>}
                    {avisos > 0 && <span className="seo-v-chip seo-v-chip-aviso"><IconeAlerta /> {avisos} aviso(s)</span>}
                    {erros === 0 && avisos === 0 && <span className="seo-v-chip seo-v-chip-ok"><IconeCheck /> tudo certo</span>}
                  </div>
                  <ListaChecks checks={p.checks} />
                </details>
              );
            })}
          </section>

          <section className="seo-secao">
            <h2>Site como um todo</h2>
            <div className="seo-card">
              <ListaChecks checks={audit.site} />
            </div>
          </section>
        </>
      )}

      <section className="seo-secao">
        <div className="seo-v-tarefas-cabecalho">
          <h2>Tarefas</h2>
          {tasks.length > 0 && (
            <div className="seo-v-tarefas-progresso">
              <span>
                {resolvidas} de {tasks.length} resolvidas ({pctTarefas}%)
              </span>
              <Barra pct={pctTarefas} cor="var(--seo-verde)" />
            </div>
          )}
        </div>

        {abertas.length === 0 && (
          <div className="seo-card">
            <p>Nenhuma tarefa aberta. Rode uma auditoria para gerar novas tarefas.</p>
          </div>
        )}
        {abertas.map((t) => (
          <div key={t.id} className={`seo-card seo-tarefa seo-tarefa-${t.prioridade}`}>
            <div className="seo-tarefa-cabecalho">
              <strong>{t.titulo}</strong>
              <span className={`seo-badge seo-badge-prioridade-${t.prioridade}`}>
                prioridade {t.prioridade}
              </span>
            </div>
            <p className="seo-tarefa-descricao">{t.descricao}</p>
            <div className="seo-tarefa-rodape">
              <span className="seo-v-tarefa-niveis">
                Impacto <Dots nivel={t.impacto} cor="var(--seo-azul)" />
                Esforço <Dots nivel={t.esforco} cor="var(--seo-preto)" />
              </span>
              <select value={t.status} onChange={(e) => mudarStatusTarefa(t.id, e.target.value)}>
                {Object.entries(TASK_STATUS_LABEL).map(([valor, label]) => (
                  <option key={valor} value={valor}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
