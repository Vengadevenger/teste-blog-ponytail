import crypto from "crypto";
import { readJson, writeJson } from "./storage";

const TASKS_FILE = "tasks.json";

export const TASK_STATUSES = ["pendente", "em_andamento", "concluida", "ignorada"];

/** Impacto/esforço estimados por verificação (usados ao gerar tarefas). */
const HINTS = {
  title: { impacto: "alto", esforco: "baixo" },
  "meta-description": { impacto: "alto", esforco: "baixo" },
  "h1-unico": { impacto: "médio", esforco: "baixo" },
  "hierarquia-headings": { impacto: "baixo", esforco: "baixo" },
  "imagens-alt": { impacto: "médio", esforco: "baixo" },
  "links-quebrados": { impacto: "alto", esforco: "baixo" },
  canonical: { impacto: "médio", esforco: "baixo" },
  "og-twitter": { impacto: "médio", esforco: "baixo" },
  "json-ld": { impacto: "médio", esforco: "médio" },
  "conteudo-minimo": { impacto: "médio", esforco: "alto" },
  "post-metatitle-keyword": { impacto: "alto", esforco: "baixo" },
  "post-slug-legivel": { impacto: "baixo", esforco: "médio" },
  "post-links-internos": { impacto: "alto", esforco: "baixo" },
  "venda-h1-keyword": { impacto: "alto", esforco: "baixo" },
  "venda-jsonld": { impacto: "alto", esforco: "médio" },
  "venda-cta": { impacto: "alto", esforco: "baixo" },
  "venda-peso-imagens": { impacto: "alto", esforco: "médio" },
  "site-sitemap": { impacto: "alto", esforco: "baixo" },
  "site-robots": { impacto: "alto", esforco: "baixo" },
  "site-titulos-duplicados": { impacto: "alto", esforco: "baixo" },
  "site-descriptions-duplicadas": { impacto: "médio", esforco: "baixo" },
  "site-conteudo-similar": { impacto: "médio", esforco: "alto" },
  "site-paginas-orfas": { impacto: "médio", esforco: "baixo" },
  "site-faq-schema": { impacto: "médio", esforco: "médio" },
};

/** Lista todas as tarefas persistidas. */
export function listTasks() {
  return readJson(TASKS_FILE, []);
}

/**
 * Atualiza o status de uma tarefa.
 * @param {string} id
 * @param {string} status - um de TASK_STATUSES
 * @returns {object|null} a tarefa atualizada, ou null se não encontrada
 */
export function updateTaskStatus(id, status) {
  const tasks = listTasks();
  const task = tasks.find((t) => t.id === id);
  if (!task) return null;
  task.status = status;
  task.atualizadaEm = new Date().toISOString();
  writeJson(TASKS_FILE, tasks);
  return task;
}

/**
 * Gera tarefas a partir dos problemas encontrados na auditoria.
 * Não duplica: se já existe tarefa aberta para o mesmo problema
 * (mesma página + mesma verificação), ela é mantida.
 * @param {object} audit - resultado de runAudit()
 * @returns {object[]} lista completa de tarefas após a sincronização
 */
export function syncTasksFromAudit(audit) {
  const tasks = listTasks();
  const abertas = new Set(
    tasks.filter((t) => t.status !== "concluida").map((t) => t.chave)
  );

  const problemas = [
    ...audit.paginas.flatMap((p) =>
      p.checks
        .filter((c) => c.status !== "ok")
        .map((c) => ({ escopo: p.path, check: c }))
    ),
    ...audit.site
      .filter((c) => c.status !== "ok")
      .map((c) => ({ escopo: "site", check: c })),
  ];

  for (const { escopo, check } of problemas) {
    const chave = `${escopo}|${check.id}`;
    if (abertas.has(chave)) continue;
    const hints = HINTS[check.id] || { impacto: "médio", esforco: "médio" };
    tasks.push({
      id: crypto.randomUUID(),
      chave,
      titulo: escopo === "site" ? check.nome : `${check.nome} — ${escopo}`,
      descricao: `${check.explicacao}\n\nComo corrigir: ${check.comoCorrigir}`,
      prioridade: check.status === "erro" ? "alta" : "média",
      impacto: hints.impacto,
      esforco: hints.esforco,
      status: "pendente",
      origem: "auditoria",
      criadaEm: new Date().toISOString(),
    });
    abertas.add(chave);
  }

  writeJson(TASKS_FILE, tasks);
  return tasks;
}
