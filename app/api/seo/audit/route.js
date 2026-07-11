import { NextResponse } from "next/server";
import { hasValidSession } from "@/lib/seo-audit/auth";
import { runAudit, getLastAudit, getAuditHistory } from "@/lib/seo-audit/run-audit";
import { syncTasksFromAudit } from "@/lib/seo-audit/tasks";

export const dynamic = "force-dynamic";

/** Retorna a auditoria mais recente (ou null se nunca rodou). */
export async function GET() {
  if (!hasValidSession()) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  return NextResponse.json({ audit: getLastAudit(), historico: getAuditHistory() });
}

/** Roda uma nova auditoria completa e sincroniza a fila de tarefas. */
export async function POST(request) {
  if (!hasValidSession()) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  const origin = new URL(request.url).origin;
  const audit = await runAudit(origin);
  const tasks = syncTasksFromAudit(audit);
  return NextResponse.json({ audit, tasks, historico: getAuditHistory() });
}
