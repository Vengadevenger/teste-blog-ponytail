import crypto from "crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "seo_dashboard_session";

/** Indica se a senha do dashboard foi configurada no ambiente. */
export function isPasswordConfigured() {
  return Boolean(process.env.SEO_DASHBOARD_PASSWORD);
}

/**
 * Token de sessão derivado da senha. Suficiente para uso pessoal:
 * o cookie httpOnly guarda o hash, nunca a senha em si.
 * @param {string} senha
 */
export function tokenForPassword(senha) {
  return crypto.createHash("sha256").update(`colabola-seo:${senha}`).digest("hex");
}

/** Valida a senha digitada contra a variável de ambiente. */
export function isCorrectPassword(senha) {
  return isPasswordConfigured() && senha === process.env.SEO_DASHBOARD_PASSWORD;
}

/** Verifica se a requisição atual tem uma sessão válida (via cookie). */
export function hasValidSession() {
  if (!isPasswordConfigured()) return false;
  const value = cookies().get(SESSION_COOKIE)?.value;
  return value === tokenForPassword(process.env.SEO_DASHBOARD_PASSWORD);
}
