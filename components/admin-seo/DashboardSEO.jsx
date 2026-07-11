"use client";

import { useEffect, useState } from "react";

const STATUS_LABEL = { ok: "OK", aviso: "Aviso", erro: "Erro" };
const TASK_STATUS_LABEL = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  ignorada: "Ignorada",
};
const PRIORIDADE_ORDEM = { alta: 0, média: 1, baixa: 2 };

function Badge({ status }) {
  return <span className={`seo-badge seo-badge-${status}`}>{STATUS_LABEL[status]}</span>;
}

function ResumoCards({ audit }) {
  return (
    <div className="seo-cards-grid">
      <div className="seo-card seo-metric">
        <span className="seo-metric-valor">{audit.totalPaginas}</span>
        <span className="seo-metric-label">Páginas auditadas</span>
      </div>
      <div className="seo-card seo-metric seo-metric-erro">
        <span className="seo-metric-valor">{audit.resumo.erros}</span>
        <span className="seo-metric-label">Erros</span>
      </div>
      <div className="seo-card seo-metric seo-metric-aviso">
        <span className="seo-metric-valor">{audit.resumo.avisos}</span>
        <span className="seo-metric-label">Avisos</span>
      </div>
      <div className="seo-card seo-metric seo-metric-ok">
        <span className="seo-metric-valor">{audit.resumo.ok}</span>
        <span className="seo-metric-label">Verificações OK</span>
      </div>
    </div>
  );
}

function ListaChecks({ checks }) {
  return (
    <ul className="seo-check-lista">
      {checks.map((c) => (
        <li key={c.id} className={`seo-check seo-check-${c.status}`}>
          <div className="seo-check-cabecalho">
            <Badge status={c.status} />
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

export default function DashboardSEO() {
  const [audit, setAudit] = useState(null);
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

  const tarefasAbertas = tasks
    .filter((t) => t.status === "pendente" || t.status === "em_andamento")
    .sort((a, b) => (PRIORIDADE_ORDEM[a.prioridade] ?? 9) - (PRIORIDADE_ORDEM[b.prioridade] ?? 9));
  const tarefasFechadas = tasks.filter(
    (t) => t.status === "concluida" || t.status === "ignorada"
  );

  return (
    <div className="seo-dashboard">
      <div className="seo-card seo-aviso-metricas">
        <strong>Métricas do Google ainda não configuradas.</strong> Por enquanto o dashboard
        mostra a auditoria interna do site. A conexão com Google Search Console, Analytics e
        PageSpeed chega na Fase 3 — as instruções estarão em SETUP-SEO-DASHBOARD.md.
      </div>

      <div className="seo-toolbar">
        <button className="seo-btn" onClick={rodarAuditoria} disabled={auditando}>
          {auditando ? "Auditando… (pode levar alguns segundos)" : "🔍 Rodar auditoria"}
        </button>
        {audit && (
          <span className="seo-toolbar-info">
            Última auditoria: {new Date(audit.executadaEm).toLocaleString("pt-BR")}
          </span>
        )}
      </div>

      {erro && <p className="seo-erro-msg">{erro}</p>}

      {!audit && !erro && (
        <div className="seo-card">
          <p>
            Nenhuma auditoria ainda. Clique em <strong>Rodar auditoria</strong> para analisar
            todas as páginas do site (página de venda, blog e posts).
          </p>
        </div>
      )}

      {audit && (
        <>
          <ResumoCards audit={audit} />

          <section className="seo-secao">
            <h2>Site como um todo</h2>
            <div className="seo-card">
              <ListaChecks checks={audit.site} />
            </div>
          </section>

          <section className="seo-secao">
            <h2>Páginas ({audit.paginas.length})</h2>
            {audit.paginas.map((p) => {
              const erros = p.checks.filter((c) => c.status === "erro").length;
              const avisos = p.checks.filter((c) => c.status === "aviso").length;
              return (
                <details key={p.path} className="seo-card seo-pagina">
                  <summary>
                    <span className="seo-pagina-path">{p.path}</span>
                    <span className="seo-pagina-tipo">{p.tipo}</span>
                    <span className="seo-pagina-contagem">
                      {erros > 0 && <Badge status="erro" />}
                      {erros > 0 && ` ${erros} `}
                      {avisos > 0 && <Badge status="aviso" />}
                      {avisos > 0 && ` ${avisos} `}
                      {erros === 0 && avisos === 0 && <Badge status="ok" />}
                    </span>
                  </summary>
                  <ListaChecks checks={p.checks} />
                </details>
              );
            })}
          </section>
        </>
      )}

      <section className="seo-secao">
        <h2>Tarefas ({tarefasAbertas.length} abertas)</h2>
        {tarefasAbertas.length === 0 && (
          <div className="seo-card">
            <p>Nenhuma tarefa aberta. Rode uma auditoria para gerar novas tarefas.</p>
          </div>
        )}
        {tarefasAbertas.map((t) => (
          <div key={t.id} className={`seo-card seo-tarefa seo-tarefa-${t.prioridade}`}>
            <div className="seo-tarefa-cabecalho">
              <strong>{t.titulo}</strong>
              <span className={`seo-badge seo-badge-prioridade-${t.prioridade}`}>
                prioridade {t.prioridade}
              </span>
            </div>
            <p className="seo-tarefa-descricao">{t.descricao}</p>
            <div className="seo-tarefa-rodape">
              <span>
                Impacto: <strong>{t.impacto}</strong> · Esforço: <strong>{t.esforco}</strong>
              </span>
              <select
                value={t.status}
                onChange={(e) => mudarStatusTarefa(t.id, e.target.value)}
              >
                {Object.entries(TASK_STATUS_LABEL).map(([valor, label]) => (
                  <option key={valor} value={valor}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
        {tarefasFechadas.length > 0 && (
          <details className="seo-card seo-tarefas-fechadas">
            <summary>Concluídas / ignoradas ({tarefasFechadas.length})</summary>
            {tarefasFechadas.map((t) => (
              <div key={t.id} className="seo-tarefa-fechada">
                <span>{t.titulo}</span>
                <select
                  value={t.status}
                  onChange={(e) => mudarStatusTarefa(t.id, e.target.value)}
                >
                  {Object.entries(TASK_STATUS_LABEL).map(([valor, label]) => (
                    <option key={valor} value={valor}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </details>
        )}
      </section>
    </div>
  );
}
