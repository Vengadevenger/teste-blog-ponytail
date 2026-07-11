/**
 * Extração de dados de SEO do HTML renderizado.
 *
 * ponytail: parser por regex em vez de biblioteca — o HTML aqui é sempre
 * gerado pelo Next.js (bem-formado e previsível). Se um dia a extração
 * falhar, trocar por `node-html-parser`.
 */

/** Extrai os atributos de uma tag HTML como objeto { nome: valor }. */
function parseAttrs(tag) {
  const attrs = {};
  const re = /([a-zA-Z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let m;
  while ((m = re.exec(tag))) attrs[m[1].toLowerCase()] = m[2] ?? m[3] ?? "";
  return attrs;
}

/** Remove tags e decodifica entidades básicas, retornando texto puro. */
function stripTags(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Analisa o HTML final de uma página e devolve os dados usados pela auditoria.
 * @param {string} html - HTML completo renderizado (o que o Google vê)
 * @returns {{
 *   title: string|null, metaDescription: string|null, canonical: string|null,
 *   robotsMeta: string|null, headings: {level: number, text: string}[],
 *   images: {src: string, alt: string|null}[], links: string[],
 *   og: Object<string,string>, twitter: Object<string,string>,
 *   jsonLdTypes: string[], wordCount: number
 * }}
 */
export function parsePage(html) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? stripTags(titleMatch[1]) : null;

  let metaDescription = null;
  let robotsMeta = null;
  const og = {};
  const twitter = {};
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    const a = parseAttrs(tag);
    if (a.name === "description") metaDescription = a.content ?? "";
    if (a.name === "robots") robotsMeta = a.content ?? "";
    if (a.property?.startsWith("og:")) og[a.property.slice(3)] = a.content ?? "";
    if (a.name?.startsWith("twitter:")) twitter[a.name.slice(8)] = a.content ?? "";
  }

  let canonical = null;
  for (const tag of html.match(/<link\b[^>]*>/gi) || []) {
    const a = parseAttrs(tag);
    if (a.rel === "canonical") canonical = a.href ?? "";
  }

  const headings = [];
  const hRe = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let h;
  while ((h = hRe.exec(html))) headings.push({ level: Number(h[1]), text: stripTags(h[2]) });

  const images = (html.match(/<img\b[^>]*>/gi) || []).map((tag) => {
    const a = parseAttrs(tag);
    return { src: a.src ?? "", alt: "alt" in a ? a.alt : null };
  });

  const links = [];
  const aRe = /<a\b[^>]*>/gi;
  let l;
  while ((l = aRe.exec(html))) {
    const href = parseAttrs(l[0]).href;
    if (href) links.push(href);
  }

  const jsonLdTypes = [];
  const ldRe = /<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi;
  let ld;
  while ((ld = ldRe.exec(html))) {
    try {
      const data = JSON.parse(ld[1]);
      for (const item of Array.isArray(data) ? data : [data]) {
        if (item["@type"]) jsonLdTypes.push(item["@type"]);
      }
    } catch {
      jsonLdTypes.push("(JSON-LD inválido)");
    }
  }

  const bodyMatch = html.match(/<body[\s\S]*?<\/body>/i);
  const bodyText = stripTags(
    (bodyMatch ? bodyMatch[0] : html).replace(
      /<(script|style|noscript|svg)\b[\s\S]*?<\/\1>/gi,
      " "
    )
  );
  const wordCount = bodyText ? bodyText.split(/\s+/).length : 0;

  return {
    title,
    metaDescription,
    canonical,
    robotsMeta,
    headings,
    images,
    links,
    og,
    twitter,
    jsonLdTypes,
    wordCount,
  };
}
