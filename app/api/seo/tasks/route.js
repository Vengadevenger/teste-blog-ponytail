import { NextResponse } from "next/server";
import { hasValidSession } from "@/lib/seo-audit/auth";
import { listTasks, updateTaskStatus, TASK_STATUSES } from "@/lib/seo-audit/tasks";

export const dynamic = "force-dynamic";

/** Lista todas as tarefas da fila. */
export async function GET() {
  if (!hasValidSession()) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  return NextResponse.json({ tasks: listTasks() });
}

/** Atualiza o status de uma tarefa: { id, status }. */
export async function PATCH(request) {
  if (!hasValidSession()) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  const { id, status } = await request.json().catch(() => ({}));
  if (!id || !TASK_STATUSES.includes(status)) {
    return NextResponse.json({ erro: "Informe id e um status válido." }, { status: 400 });
  }
  const task = updateTaskStatus(id, status);
  if (!task) {
    return NextResponse.json({ erro: "Tarefa não encontrada." }, { status: 404 });
  }
  return NextResponse.json({ task });
}
