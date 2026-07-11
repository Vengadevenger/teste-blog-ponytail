/**
 * Verificações de SEO — funções puras, sem I/O.
 *
 * Cada verificação retorna:
 * { id, nome, status: "ok"|"aviso"|"erro", explicacao, comoCorrigir }
 * `explicacao` e `comoCorrigir` são escritas em linguagem simples, para o
 * dono do negócio — não para desenvolvedor.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://colabola.com.br";

const STOPWORDS = new Set([
  "a", "o", "e", "de", "da", "do", "das", "dos", "em", "na", "no", "um",
  "uma", "que", "com", "para", "por", "sua", "seu", "as", "os", "ao", "à",
]);

function check(id, nome, ok, explicacaoProblema, comoCorrigir, nivel = "erro") {
  return ok
    ? { id, nome, status: "ok", explicacao: "Tudo certo.", comoCorrigir: null }
    : { id, nome, status: nivel, explicacao: explicacaoProblema, comoCorrigir };
}

/** Remove acentos e caixa para comparação ("Seleção" → "selecao"). */
function normalize(text) {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Tokens significativos de um slug (sem stopwords). */
function slugKeywords(slug) {
  return slug.split("-").filter((t) => t && !STOPWORDS.has(t));
}

/**
 * Verificações que valem para qualquer página do site.
 * @param {object} page - página analisada (saída de parsePage + path/tipo/httpStatus)
 * @param {{rotas: string[], brokenLinks: string[]}} ctx
 */
export function runPageChecks(page, ctx) {
  const results = [];
  const t = page.title || "";
  const d = page.metaDescription || "";
  const h1s = page.headings.filter((h) => h.level === 1);

  results.push(
    check(
      "title",
      "Título da página (<title>)",
      t.length >= 30 && t.length <= 60,
      t
        ? `O título tem ${t.length} caracteres — o ideal é entre 30 e 60 para aparecer inteiro no Google.`
        : "A página não tem título. Sem ele, o Google mostra qualquer texto no lugar.",
      "Ajuste o título da página para ficar entre 30 e 60 caracteres, incluindo a palavra-chave principal.",
      t ? "aviso" : "erro"
    )
  );

  results.push(
    check(
      "meta-description",
      "Meta description",
      d.length >= 120 && d.length <= 160,
      d
        ? `A descrição tem ${d.length} caracteres — o ideal é entre 120 e 160.`
        : "A página não tem meta description. É o texto que aparece embaixo do título no Google e influencia diretamente os cliques.",
      "Escreva uma descrição entre 120 e 160 caracteres que convide o leitor a clicar.",
      d ? "aviso" : "erro"
    )
  );

  results.push(
    check(
      "h1-unico",
      "Um único H1",
      h1s.length === 1,
      h1s.length === 0
        ? "A página não tem título principal (H1). O Google usa o H1 para entender o assunto da página."
        : `A página tem ${h1s.length} títulos principais (H1) — deve ter exatamente um.`,
      "Garanta que a página tenha exatamente um H1, com o assunto principal."
    )
  );

  let pulo = null;
  let prev = 0;
  for (const h of page.headings) {
    if (prev > 0 && h.level > prev + 1) pulo = `H${prev} → H${h.level}`;
    prev = h.level;
  }
  results.push(
    check(
      "hierarquia-headings",
      "Hierarquia de títulos",
      !pulo,
      `Há um pulo na hierarquia de títulos (${pulo}). Isso confunde o Google sobre a estrutura do conteúdo.`,
      "Reorganize os títulos em ordem: H1, depois H2, depois H3 — sem pular níveis.",
      "aviso"
    )
  );

  const semAlt = page.images.filter((img) => img.alt === null || img.alt === "");
  results.push(
    check(
      "imagens-alt",
      "Imagens com texto alternativo",
      semAlt.length === 0,
      `${semAlt.length} imagem(ns) sem texto alternativo (alt): ${semAlt.map((i) => i.src).join(", ")}. O Google não "vê" imagens — ele lê o alt.`,
      "Adicione um alt descritivo em cada imagem (ex.: \"bola de futebol furada sendo consertada\").",
      "aviso"
    )
  );

  results.push(
    check(
      "links-quebrados",
      "Links internos quebrados",
      ctx.brokenLinks.length === 0,
      `Esta página tem link(s) para endereço(s) que não existem: ${ctx.brokenLinks.join(", ")}. Links quebrados prejudicam a experiência e o SEO.`,
      "Corrija ou remova esses links, apontando para páginas que existem."
    )
  );

  const esperado = `${SITE_URL}${page.path === "/" ? "" : page.path}` || SITE_URL;
  const canonicalOk =
    page.canonical === esperado || page.canonical === `${SITE_URL}${page.path}`;
  results.push(
    check(
      "canonical",
      "Canonical",
      canonicalOk,
      page.canonical
        ? `A canonical aponta para "${page.canonical}", mas deveria apontar para "${SITE_URL}${page.path}". Canonical errada pode fazer o Google ignorar a página.`
        : "A página não declara canonical — a tag que diz ao Google qual é o endereço oficial da página (importante inclusive na paginação).",
      "Adicione/corrija a tag canonical apontando para o endereço oficial da própria página.",
      "aviso"
    )
  );

  const ogOk = Boolean(page.og.title && page.og.description && page.og.image);
  const twOk = Boolean(page.twitter.card);
  results.push(
    check(
      "og-twitter",
      "Open Graph e Twitter Card",
      ogOk && twOk,
      `Faltam metadados de compartilhamento: ${[
        !page.og.title && "og:title",
        !page.og.description && "og:description",
        !page.og.image && "og:image",
        !twOk && "twitter:card",
      ]
        .filter(Boolean)
        .join(", ")}. Sem eles, o link fica "pelado" quando compartilhado no WhatsApp e redes sociais.`,
      "Adicione os metadados Open Graph (título, descrição, imagem) e Twitter Card na página.",
      "aviso"
    )
  );

  if (page.tipo === "post") {
    results.push(
      check(
        "json-ld",
        "Dados estruturados (JSON-LD)",
        page.jsonLdTypes.some((tp) => tp === "Article" || tp === "BlogPosting"),
        "O post não tem dados estruturados de artigo (Article/BlogPosting). Eles ajudam o Google a exibir o post com destaque nos resultados.",
        "Adicione JSON-LD do tipo Article ou BlogPosting no post.",
        "aviso"
      )
    );
  }

  const minimos = { venda: 300, post: 600, listagem: 0, pagina: 100 };
  const minimo = minimos[page.tipo] ?? 100;
  if (minimo > 0) {
    results.push(
      check(
        "conteudo-minimo",
        "Comprimento do conteúdo",
        page.wordCount >= minimo,
        `A página tem cerca de ${page.wordCount} palavras — abaixo do mínimo esperado (${minimo}) para este tipo de página. Conteúdo curto tende a rankear pior.`,
        "Amplie o conteúdo com informação útil (não encher linguiça): detalhes, exemplos, perguntas frequentes.",
        "aviso"
      )
    );
  }

  return results;
}

/**
 * Verificações específicas de posts do blog (cruzam com lib/blog-data.js).
 * @param {object} page
 * @param {object} post - objeto do post em lib/blog-data.js
 */
export function runPostChecks(page, post) {
  const results = [];
  const keywords = slugKeywords(post.slug);
  const metaTitle = normalize(post.metaTitle || post.title || "");
  const presentes = keywords.filter((k) => metaTitle.includes(normalize(k)));

  results.push(
    check(
      "post-metatitle-keyword",
      "Palavra-chave no metaTitle",
      keywords.length === 0 || presentes.length >= Math.ceil(keywords.length / 2),
      `O metaTitle não contém a palavra-chave do endereço do post ("${keywords.join(" ")}"). Título e endereço alinhados rankeiam melhor.`,
      `Inclua os termos principais do slug no metaTitle do post em lib/blog-data.js.`,
      "aviso"
    )
  );

  const tokens = post.slug.split("-").filter(Boolean);
  const stop = tokens.filter((tk) => STOPWORDS.has(tk));
  results.push(
    check(
      "post-slug-legivel",
      "Slug legível",
      tokens.length <= 8 && stop.length <= 2,
      `O slug "${post.slug}" tem ${tokens.length} palavras (${stop.length} são conectivos como "de", "que"). Slugs curtos e diretos funcionam melhor.`,
      "Prefira slugs com até 8 palavras, sem conectivos desnecessários. (Atenção: mudar slug de post já publicado exige redirecionamento.)",
      "aviso"
    )
  );

  const internos = page.links.filter((h) => h.startsWith("/") || h.startsWith(SITE_URL));
  const paraOutroPost = internos.some(
    (h) => h.replace(SITE_URL, "").startsWith("/blog/") && !h.includes(post.slug) && !h.replace(SITE_URL, "").startsWith("/blog/page")
  );
  const paraVenda = internos.some((h) => {
    const p = h.replace(SITE_URL, "").split(/[?#]/)[0];
    return p === "/" || p === "/comprar";
  });
  results.push(
    check(
      "post-links-internos",
      "Links para outros posts e para a página de venda",
      paraOutroPost && paraVenda,
      `${!paraOutroPost ? "O post não linka para nenhum outro post. " : ""}${!paraVenda ? "O post não linka para a página de venda." : ""} Links internos passam autoridade e levam o leitor até a compra.`,
      "Adicione no conteúdo pelo menos um link para outro post do mesmo tema e um link/CTA para a página de venda.",
      "aviso"
    )
  );

  return results;
}

/**
 * Verificações específicas da página de venda.
 * @param {object} page
 * @param {{imagensPesadas: {src: string, kb: number}[]}} ctx
 */
export function runSalePageChecks(page, ctx) {
  const results = [];
  const h1 = normalize(page.headings.find((h) => h.level === 1)?.text || "");

  results.push(
    check(
      "venda-h1-keyword",
      "Palavra-chave no H1 da página de venda",
      h1.includes("bola") && /(cola|consert|repar)/.test(h1),
      `O H1 da página de venda ("${h1 || "vazio"}") não contém a palavra-chave do produto (ex.: "conserto de bola", "Cola Bola").`,
      "Inclua no H1 o nome do produto e o que ele faz (ex.: \"Cola Bola — conserte sua bola em casa\").",
      "aviso"
    )
  );

  results.push(
    check(
      "venda-jsonld",
      "JSON-LD Product e Organization",
      page.jsonLdTypes.includes("Product") && page.jsonLdTypes.includes("Organization"),
      "A página de venda não tem dados estruturados de Produto e Organização. Com eles, o Google pode mostrar preço e avaliações direto no resultado da busca.",
      "Adicione JSON-LD dos tipos Product (com preço e avaliações, se houver) e Organization na página de venda."
    )
  );

  const ctas = page.links.filter((h) => {
    const p = h.replace(SITE_URL, "").split(/[?#]/)[0];
    return p === "/comprar" || p.includes("checkout") || p.includes("compra");
  });
  results.push(
    check(
      "venda-cta",
      "CTA de compra presente",
      ctas.length > 0,
      "Não foi encontrado nenhum botão/link de compra na página de venda.",
      "Adicione um CTA de compra claro e visível (e garanta que o clique seja rastreável no Analytics)."
    )
  );

  results.push(
    check(
      "venda-peso-imagens",
      "Peso das imagens da página de venda",
      ctx.imagensPesadas.length === 0,
      `Imagem(ns) pesada(s) encontrada(s): ${ctx.imagensPesadas
        .map((i) => `${i.src} (${i.kb} KB)`)
        .join(", ")}. Imagens pesadas atrasam o carregamento (LCP) da página mais importante do site.`,
      "Comprima essas imagens (WebP/AVIF, qualidade ~80) para ficarem abaixo de 200 KB.",
      "aviso"
    )
  );

  return results;
}

/**
 * Verificações do site como um todo.
 * @param {object[]} pages - todas as páginas auditadas
 * @param {{sitemapPaths: string[], rotas: string[], robotsTxt: string, incomingLinks: Object<string, number>}} ctx
 */
export function runSiteChecks(pages, ctx) {
  const results = [];

  const foraDoSitemap = ctx.rotas.filter(
    (r) => !ctx.sitemapPaths.includes(r) && r !== "/"
  );
  const homeNoSitemap = ctx.sitemapPaths.includes("/");
  const faltando = [...(homeNoSitemap ? [] : ["/"]), ...foraDoSitemap];
  results.push(
    check(
      "site-sitemap",
      "Sitemap cobre todas as páginas públicas",
      faltando.length === 0,
      `Página(s) fora do sitemap: ${faltando.join(", ")}. O sitemap é a lista que o Google usa para descobrir suas páginas.`,
      "Inclua essas rotas na saída de app/sitemap.js.",
      "aviso"
    )
  );

  const robots = ctx.robotsTxt.toLowerCase();
  const bloqueiaAdmin = robots.includes("disallow: /admin");
  const bloqueiaTudo = /disallow:\s*\/\s*$/m.test(ctx.robotsTxt);
  results.push(
    check(
      "site-robots",
      "robots.txt correto",
      bloqueiaAdmin && !bloqueiaTudo,
      bloqueiaTudo
        ? "O robots.txt está bloqueando o site inteiro para o Google!"
        : "O robots.txt não bloqueia a área administrativa (/admin) — ela pode acabar aparecendo no Google.",
      bloqueiaTudo
        ? "Remova a regra 'Disallow: /' do robots.txt imediatamente."
        : "Adicione 'Disallow: /admin/' em app/robots.js."
    )
  );

  const dupsDe = (campo) => {
    const vistos = new Map();
    const dups = [];
    for (const p of pages) {
      const v = p[campo];
      if (!v) continue;
      if (vistos.has(v)) dups.push(`"${v}" (${vistos.get(v)} e ${p.path})`);
      else vistos.set(v, p.path);
    }
    return dups;
  };

  const titulosDup = dupsDe("title");
  results.push(
    check(
      "site-titulos-duplicados",
      "Títulos únicos no site",
      titulosDup.length === 0,
      `Título(s) repetido(s) em mais de uma página: ${titulosDup.join("; ")}. Páginas com o mesmo título competem entre si no Google.`,
      "Reescreva os títulos para que cada página tenha um título único."
    )
  );

  const descDup = dupsDe("metaDescription");
  results.push(
    check(
      "site-descriptions-duplicadas",
      "Descriptions únicas no site",
      descDup.length === 0,
      `Meta description repetida em mais de uma página: ${descDup.join("; ")}.`,
      "Reescreva as descriptions para que cada página tenha a sua.",
      "aviso"
    )
  );

  // Similaridade (não idênticos, mas muito parecidos) — Jaccard de palavras
  const similares = [];
  const posts = pages.filter((p) => p.tipo === "post");
  for (let i = 0; i < posts.length; i++) {
    for (let j = i + 1; j < posts.length; j++) {
      const a = new Set((posts[i].title || "").toLowerCase().split(/\s+/));
      const b = new Set((posts[j].title || "").toLowerCase().split(/\s+/));
      const inter = [...a].filter((w) => b.has(w)).length;
      const uniao = new Set([...a, ...b]).size;
      if (uniao > 0 && inter / uniao > 0.7 && posts[i].title !== posts[j].title) {
        similares.push(`${posts[i].path} e ${posts[j].path}`);
      }
    }
  }
  results.push(
    check(
      "site-conteudo-similar",
      "Conteúdo muito similar entre páginas",
      similares.length === 0,
      `Páginas com títulos muito parecidos (podem competir entre si no Google): ${similares.join("; ")}.`,
      "Diferencie o foco de cada página ou considere unificá-las em uma só.",
      "aviso"
    )
  );

  const orfas = ctx.rotas.filter(
    (r) => (ctx.incomingLinks[r] || 0) === 0 && r !== "/"
  );
  results.push(
    check(
      "site-paginas-orfas",
      "Páginas órfãs (sem links internos apontando para elas)",
      orfas.length === 0,
      `Página(s) órfã(s): ${orfas.join(", ")}. Sem nenhum link interno apontando para elas, o Google as considera pouco importantes.`,
      "Adicione links internos apontando para essas páginas a partir de páginas do mesmo tema.",
      "aviso"
    )
  );

  const semFaq = pages.filter(
    (p) =>
      /perguntas frequentes|d[úu]vidas frequentes/i.test(
        p.headings.map((h) => h.text).join(" ")
      ) && !p.jsonLdTypes.includes("FAQPage")
  );
  results.push(
    check(
      "site-faq-schema",
      "FAQPage onde há seção de perguntas",
      semFaq.length === 0,
      `Página(s) com seção de perguntas frequentes sem o schema FAQPage: ${semFaq
        .map((p) => p.path)
        .join(", ")}. Com o schema, as perguntas podem aparecer direto no Google.`,
      "Adicione JSON-LD do tipo FAQPage nessas páginas.",
      "aviso"
    )
  );

  return results;
}
