import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  isCorrectPassword,
  isPasswordConfigured,
  tokenForPassword,
} from "@/lib/seo-audit/auth";

export const dynamic = "force-dynamic";

/** Login: valida a senha e cria o cookie de sessão (7 dias). */
export async function POST(request) {
  if (!isPasswordConfigured()) {
    return NextResponse.json(
      { erro: "Senha não configurada. Defina SEO_DASHBOARD_PASSWORD no .env.local." },
      { status: 500 }
    );
  }

  const { senha } = await request.json().catch(() => ({}));
  if (!isCorrectPassword(senha)) {
    return NextResponse.json({ erro: "Senha incorreta." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, tokenForPassword(senha), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}

/** Logout: apaga o cookie de sessão. */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
