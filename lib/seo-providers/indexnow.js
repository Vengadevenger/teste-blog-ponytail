import crypto from "crypto";
import fs from "fs";
import path from "path";
import { readJson, writeJson } from "@/lib/seo-audit/storage";

/**
 * Conector IndexNow: avisa Bing, Yandex e outros buscadores na hora em que
 * uma página é criada ou atualizada (indexação mais rápida). O Google não
 * usa IndexNow — para ele, o sitemap.xml continua sendo o canal.
 *
 * "Ativar" gera uma chave, salva em .seo-dashboard/indexnow.json e publica
 * o arquivo de verificação public/{chave}.txt (exigência do protocolo).
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://colabola.com.br";
const ARQUIVO = "indexnow.json";

export function estaConfigurado() {
  const cfg = readJson(ARQUIVO, null);
  return Boolean(cfg?.chave && fs.existsSync(path.join(process.cwd(), "public", `${cfg.chave}.txt`)));
}

/** Gera a chave e publica o arquivo de verificação em public/. */
export function ativar() {
  let cfg = readJson(ARQUIVO, null);
  if (!cfg?.chave) {
    cfg = { chave: crypto.randomBytes(16).toString("hex"), ativadoEm: new Date().toISOString() };
    writeJson(ARQUIVO, cfg);
  }
  fs.writeFileSync(path.join(process.cwd(), "public", `${cfg.chave}.txt`), cfg.chave, "utf8");
  return cfg;
}

export async function testarConexao() {
  if (!estaConfigurado()) {
    return { ok: false, mensagem: "IndexNow ainda não foi ativado." };
  }
  const cfg = readJson(ARQUIVO, null);
  return {
    ok: true,
    mensagem: `Ativo. Arquivo de verificação: ${SITE_URL}/${cfg.chave}.txt (válido quando o site estiver no ar).`,
  };
}

/**
 * Notifica os buscadores sobre uma lista de URLs (máx. 10.000 por chamada).
 * @param {string[]} urls - URLs completas
 */
export async function submeterUrls(urls) {
  const cfg = readJson(ARQUIVO, null);
  if (!cfg?.chave) throw new Error("Ative o IndexNow antes de notificar os buscadores.");

  const host = new URL(SITE_URL).hostname;
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host,
      key: cfg.chave,
      keyLocation: `${SITE_URL}/${cfg.chave}.txt`,
      urlList: urls,
    }),
    cache: "no-store",
  });

  // 200 = ok, 202 = aceito (chave será validada depois)
  if (res.status === 200 || res.status === 202) {
    writeJson(ARQUIVO, { ...cfg, ultimoEnvio: new Date().toISOString(), urlsEnviadas: urls.length });
    return { ok: true, mensagem: `${urls.length} URL(s) enviadas aos buscadores (status ${res.status}).` };
  }
  const corpo = await res.text();
  throw new Error(`IndexNow respondeu ${res.status}: ${corpo || "sem detalhes"}`);
}
