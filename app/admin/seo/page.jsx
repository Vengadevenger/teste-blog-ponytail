import Link from "next/link";
import { hasValidSession, isPasswordConfigured } from "@/lib/seo-audit/auth";
import LoginForm from "@/components/admin-seo/LoginForm";
import DashboardSEO from "@/components/admin-seo/DashboardSEO";
import DashboardSEOVisual from "@/components/admin-seo/DashboardSEOVisual";
import MetricasSEO from "@/components/admin-seo/MetricasSEO";
import IntegracoesSEO from "@/components/admin-seo/IntegracoesSEO";

export const dynamic = "force-dynamic";

export default function AdminSeoPage({ searchParams }) {
  if (!isPasswordConfigured()) {
    return (
      <div className="seo-card seo-aviso-config">
        <h2>Falta configurar a senha de acesso</h2>
        <p>
          Crie (ou edite) o arquivo <code>.env.local</code> na raiz do projeto e adicione a
          linha abaixo, trocando pelo valor que você quiser usar como senha:
        </p>
        <pre>SEO_DASHBOARD_PASSWORD=sua-senha-aqui</pre>
        <p>Depois reinicie o servidor e recarregue esta página.</p>
      </div>
    );
  }

  if (!hasValidSession()) return <LoginForm />;

  // Visões 1 e 2 em avaliação — quando o Leon escolher uma, a outra sai.
  const ABAS = {
    classica: { rotulo: "Visão 1 — Lista", componente: <DashboardSEO /> },
    visual: { rotulo: "Visão 2 — Visual", componente: <DashboardSEOVisual /> },
    metricas: { rotulo: "Métricas (Google)", componente: <MetricasSEO /> },
    integracoes: { rotulo: "Integrações", componente: <IntegracoesSEO /> },
  };
  const visao = ABAS[searchParams?.visao] ? searchParams.visao : "classica";

  return (
    <>
      <nav className="seo-visoes" aria-label="Seções do dashboard">
        {Object.entries(ABAS).map(([chave, aba]) => (
          <Link
            key={chave}
            href={chave === "classica" ? "/admin/seo" : `/admin/seo?visao=${chave}`}
            className={visao === chave ? "seo-visao-ativa" : ""}
          >
            {aba.rotulo}
          </Link>
        ))}
      </nav>
      {ABAS[visao].componente}
    </>
  );
}
