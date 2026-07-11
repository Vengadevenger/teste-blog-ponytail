"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setEnviando(true);
    setErro(null);
    const res = await fetch("/api/seo/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senha }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setErro(data.erro || "Não foi possível entrar.");
      setEnviando(false);
    }
  }

  return (
    <form className="seo-card seo-login" onSubmit={handleSubmit}>
      <h2>Área restrita</h2>
      <p>Digite a senha para acessar o dashboard de SEO.</p>
      <input
        type="password"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        placeholder="Senha"
        autoFocus
        required
      />
      <button type="submit" className="seo-btn" disabled={enviando}>
        {enviando ? "Entrando..." : "Entrar"}
      </button>
      {erro && <p className="seo-login-erro">{erro}</p>}
    </form>
  );
}
