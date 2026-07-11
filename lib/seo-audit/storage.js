import fs from "fs";
import path from "path";

const DIR = path.join(process.cwd(), ".seo-dashboard");

/**
 * Lê um arquivo JSON de `.seo-dashboard/`. Retorna `fallback` se o arquivo
 * não existir ou estiver corrompido.
 * @param {string} name - nome do arquivo (ex.: "tasks.json")
 * @param {*} fallback
 */
export function readJson(name, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DIR, name), "utf8"));
  } catch {
    return fallback;
  }
}

/**
 * Grava um arquivo JSON em `.seo-dashboard/`, criando a pasta se necessário.
 * @param {string} name
 * @param {*} data
 */
export function writeJson(name, data) {
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(path.join(DIR, name), JSON.stringify(data, null, 2), "utf8");
}
