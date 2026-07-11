# .seo-dashboard/

Pasta de dados do Dashboard SEO (`/admin/seo`). Os arquivos aqui são gerados
automaticamente pelo dashboard e **não devem ser editados à mão** nem
commitados (o `.gitignore` já cuida disso — só este README é versionado).

| Arquivo | O que guarda |
|---|---|
| `audit-history.json` | Resultados das últimas auditorias internas do site |
| `tasks.json` | Fila de tarefas de SEO (pendentes, em andamento, concluídas, ignoradas) |
| `metrics-cache.json` | Cache das métricas do Google (Fase 3) |
| `changelog.json` | Log de correções aplicadas pelo dashboard (Fase 2) |
| `backups/` | Backups de `lib/blog-data.js` criados antes de cada correção (Fase 2) |

Para apagar o histórico e começar do zero, basta deletar os arquivos `.json`
desta pasta (o dashboard recria tudo na próxima auditoria).
