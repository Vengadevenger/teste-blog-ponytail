"use client";

import { useEffect, useState } from "react";

/**
 * Painel de Integrações: status de cada ferramenta de SEO, teste de conexão
 * e instruções de configuração para leigo. As instruções completas também
 * estão em SETUP-SEO-DASHBOARD.md.
 */

const INSTRUCOES = {
  gsc: [
    "Acesse console.cloud.google.com e crie um projeto (grátis, não precisa de cartão).",
    'No menu, vá em "APIs e serviços" → "Biblioteca" e ative a "Google Search Console API".',
    'Vá em "IAM e administrador" → "Contas de serviço" → "Criar conta de serviço". Dê qualquer nome e conclua.',
    'Clique na conta criada → aba "Chaves" → "Adicionar chave" → JSON. Um arquivo será baixado.',
    "No arquivo baixado, copie o valor de client_email para GOOGLE_SERVICE_ACCOUNT_EMAIL e o de private_key para GOOGLE_PRIVATE_KEY no .env.local (entre aspas, com os \\n).",
    'Em search.google.com/search-console, abra sua propriedade → Configurações → "Usuários e permissões" → adicione o client_email como usuário com permissão "Total".',
    "Reinicie o servidor e clique em Testar conexão.",
  ],
  ga4: [
    "Use a mesma conta de serviço do Search Console (passos acima).",
    "Em analytics.google.com, vá em Administrador → (coluna Propriedade) → Gerenciamento de acesso à propriedade.",
    'Adicione o client_email da conta de serviço com o papel "Leitor".',
    "Ainda no Administrador, em Configurações da propriedade, copie o ID da propriedade (só números) para GA4_PROPERTY_ID no .env.local.",
    "Reinicie o servidor e clique em Testar conexão.",
  ],
  pagespeed: [
    "Acesse console.cloud.google.com (mesmo projeto do Search Console serve).",
    'Em "APIs e serviços" → "Biblioteca", ative a "PageSpeed Insights API".',
    'Em "APIs e serviços" → "Credenciais" → "Criar credenciais" → "Chave de API". Copie a chave.',
    "Cole no .env.local como PAGESPEED_API_KEY e reinicie o servidor.",
  ],
  indexnow: [
    'Clique em "Ativar IndexNow" abaixo — a chave é gerada e publicada automaticamente.',
    "Quando o site estiver no ar, o arquivo de verificação fica acessível e os envios passam a valer.",
    'Bônus: cadastre o site no Bing Webmaster Tools (bing.com/webmasters) — dá para importar tudo do Search Console com 1 clique.',
  ],
};

export default function IntegracoesSEO() {
  const [integracoes, setIntegracoes] = useState(null);
  const [resultados, setResultados] = useState({});
  const [ocupado, setOcupado] = useState(null);
  const [erro, setErro] = useState(null);

  function carregar() {
    fetch("/api/seo/integracoes")
      .then((r) => r.json())
      .then((data) => setIntegracoes(data.integracoes))
      .catch(() => setErro("Não foi possível carregar as integrações."));
  }

  useEffect(carregar, []);

  async function executar(id, body) {
    setOcupado(id);
    try {
      const res = await fetch("/api/seo/integracoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setResultados((r) => ({ ...r, [id]: data.resultado || { ok: false, mensagem: data.erro } }));
      carregar();
    } catch {
      setResultados((r) => ({ ...r, [id]: { ok: false, mensagem: "Falha na requisição." } }));
    } finally {
      setOcupado(null);
    }
  }

  if (erro) return <p className="seo-erro-msg">{erro}</p>;
  if (!integracoes) return <p className="seo-carregando">Carregando…</p>;

  return (
    <div className="seo-dashboard">
      <div className="seo-card seo-aviso-metricas">
        <strong>Como funciona:</strong> cada ferramenta abaixo é uma fonte de dados. As chaves são
        guardadas no arquivo <code>.env.local</code>, que fica só na sua máquina e nunca vai para o
        GitHub. Configure na ordem — o Search Console é o que mais importa.
      </div>

      {integracoes.map((i) => {
        const resultado = resultados[i.id];
        return (
          <div key={i.id} className="seo-card seo-int">
            <div className="seo-int-cabecalho">
              <span
                className={`seo-int-status ${i.configurado ? "seo-int-status-on" : ""}`}
                title={i.configurado ? "Conectada" : "Não configurada"}
              />
              <div className="seo-int-titulo">
                <strong>{i.nome}</strong>
                <span className={`seo-int-tag ${i.configurado ? "seo-int-tag-on" : ""}`}>
                  {i.configurado ? "Conectada" : "Não configurada"}
                </span>
              </div>
              <div className="seo-int-acoes">
                {i.id === "indexnow" && !i.configurado && (
                  <button
                    className="seo-btn"
                    onClick={() => executar(i.id, { acao: "ativar-indexnow" })}
                    disabled={ocupado === i.id}
                  >
                    {ocupado === i.id ? "Ativando…" : "Ativar IndexNow"}
                  </button>
                )}
                {i.id === "indexnow" && i.configurado && (
                  <button
                    className="seo-btn"
                    onClick={() => executar(i.id, { acao: "notificar-buscadores" })}
                    disabled={ocupado === i.id}
                  >
                    {ocupado === i.id ? "Enviando…" : "Notificar buscadores"}
                  </button>
                )}
                <button
                  className="seo-btn seo-btn-secundario"
                  onClick={() => executar(i.id, { acao: "testar", id: i.id })}
                  disabled={ocupado === i.id}
                >
                  {ocupado === i.id ? "Testando…" : "Testar conexão"}
                </button>
              </div>
            </div>

            <p className="seo-int-descricao">{i.descricao}</p>

            {i.envVars.length > 0 && (
              <p className="seo-int-envs">
                Chaves no .env.local: {i.envVars.map((v) => <code key={v}>{v}</code>)}
              </p>
            )}

            {resultado && (
              <p className={`seo-int-resultado ${resultado.ok ? "seo-int-ok" : "seo-int-falha"}`}>
                {resultado.ok ? "✓" : "✕"} {resultado.mensagem}
              </p>
            )}

            <details className="seo-int-instrucoes">
              <summary>Como configurar (passo a passo)</summary>
              <ol>
                {INSTRUCOES[i.id].map((passo, idx) => (
                  <li key={idx}>{passo}</li>
                ))}
              </ol>
            </details>
          </div>
        );
      })}

      <div className="seo-card seo-int-rodape">
        <strong>E as ferramentas pagas (Ahrefs, Semrush)?</strong> A arquitetura já está pronta para
        recebê-las (basta um conector novo em <code>lib/seo-providers/</code>), mas as APIs delas
        custam caro e o contrato do projeto as deixa fora do escopo. As fontes acima cobrem o
        essencial de graça.
      </div>
    </div>
  );
}
