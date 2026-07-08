"use client";

import { useState } from "react";

/** Botões de compartilhamento social do post (WhatsApp é o canal mais usado pelo público da marca). */
export default function ShareButtons({ title, url }) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = [
    {
      name: "WhatsApp",
      href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
    },
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      name: "X",
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    },
    {
      name: "Telegram",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    },
  ];

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard indisponível (ex: contexto não seguro) — ignora silenciosamente
    }
  }

  return (
    <div className="blog-sidebar-widget">
      <h3 className="blog-sidebar-widget-title">Compartilhe</h3>
      <div className="blog-share-buttons">
        {shareLinks.map((link) => (
          <a
            key={link.name}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="blog-share-btn"
          >
            {link.name}
          </a>
        ))}
        <button type="button" className="blog-share-btn" onClick={handleCopyLink}>
          {copied ? "Link copiado!" : "Copiar link"}
        </button>
      </div>
    </div>
  );
}
