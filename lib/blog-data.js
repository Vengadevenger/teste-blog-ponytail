/**
 * Fonte de dados do blog Cola Bola.
 *
 * Hoje os posts vivem neste array (mock). Quando a integração com o Notion
 * entrar, troque apenas `getAllPostsRaw()` por uma chamada à API do Notion
 * que devolva objetos no mesmo formato — nenhuma página/componente precisa
 * mudar, pois todos consomem os helpers abaixo (getAllPosts, getPostBySlug, etc).
 *
 * Formato de cada post (equivalente a uma linha/página do banco no Notion):
 * {
 *   id: number,
 *   slug: string,            // usado na URL /blog/[slug]
 *   title: string,
 *   excerpt: string,         // resumo curto exibido no card e usado como meta description
 *   content: string,         // HTML do corpo do post (no Notion viria via rich text -> HTML)
 *   category: string,        // "Futebol" | "Seleção" | "Vôlei" | "Basquete" | ...
 *   date: string,            // ISO "YYYY-MM-DD"
 *   image: string,           // imagem do card na listagem (300x200, proporção 3:2)
 *   heroImage: string,       // opcional — imagem do banner no post individual (800x400). Se ausente, usa `image`.
 *   author: string,
 *   readTime: string,        // ex: "5 min"
 *   metaTitle: string,       // opcional, sobrepõe o <title> de SEO
 *   metaDescription: string, // opcional, sobrepõe a meta description
 * }
 */

const POSTS = [
  {
    id: 1,
    slug: "por-que-bola-murcha-rapido",
    title: "5 Motivos Pelos Quais Sua Bola de Futebol Murcha Rápido",
    excerpt:
      "Descubra os 5 motivos principais que fazem uma bola de futebol perder pressão rápido demais e como evitar esse problema que rouba o seu jogo.",
    category: "Futebol",
    date: "2026-07-06",
    image: "/images/blog/criancas-bola.avif",
    heroImage: "/images/blog/bola-murcha.jpg",
    author: "Cola Bola",
    readTime: "5 min",
    metaTitle: "5 Motivos Pelos Quais Sua Bola de Futebol Murcha Rápido | Cola Bola",
    metaDescription:
      "Sua bola de futebol fura ou murcha toda semana? Veja os 5 motivos mais comuns e como consertar em casa em menos de 2 minutos com Cola Bola.",
    content: `
      <p>Se você já perdeu a conta de quantas bolas comprou este ano só porque furaram ou murcharam rápido demais, esse post é para você. A maioria das pessoas acha que bola furada é sinônimo de bola perdida — mas na maior parte dos casos, dá para recuperar em casa, sem borracharia e sem gastar de novo.</p>

      <h2>1. Micro furos causados pelo próprio piso</h2>
      <p>Jogar em asfalto, cimento ou piso rústico desgasta a superfície da bola aos poucos. Cada chute cria um micro atrito que, com o tempo, abre um furo pequeno demais para ser visto a olho nu — mas grande o suficiente para a bola murchar em um ou dois dias.</p>

      <h2>2. Válvula ressecada ou mal vedada</h2>
      <p>A válvula é o ponto mais frágil da bola. Com o uso, o material resseca e perde a vedação, deixando o ar escapar lentamente. É por isso que muita gente enche a bola à noite e de manhã ela já está murcha, sem nenhum furo visível no corpo.</p>

      <h2>3. Calor e variação de temperatura</h2>
      <p>Deixar a bola no porta-malas do carro ou exposta ao sol forte dilata o ar interno e força pontos frágeis da costura e do revestimento. Esse estresse térmico repetido é uma das causas mais ignoradas de bola murchando sem motivo aparente.</p>

      <h2>4. Costuras e emendas com desgaste</h2>
      <p>Bolas com costura (e não termocoladas) têm pontos de emenda que se abrem com o tempo e o uso intenso. É um desgaste natural, mas que muita gente confunde com "bola de má qualidade" quando na verdade é só falta de manutenção.</p>

      <h2>5. Conserto malfeito com produto errado</h2>
      <p>Super bonder e cola de sapateiro secam rígidos. A bola dobra, estica e comprime a cada toque — e uma cola rígida racha nesse movimento, abrindo o furo de novo em poucos dias. O problema não é tentar consertar, é tentar consertar com o produto errado.</p>

      <h2>Como evitar comprar bola nova toda vez</h2>
      <p>Antes de jogar a bola fora, vale testar um conserto de verdade. O Cola Bola foi desenvolvido especificamente para vedar furos em bolas esportivas: a fórmula fica flexível depois de curada, acompanha a deformação da bola durante o jogo e segura a pressão do ar — diferente de colas genéricas.</p>
      <p>O processo leva menos de 2 minutos: localizar o furo, limpar a área, aplicar o produto e esperar a cura. Sem sair de casa, sem depender de borracharia (que na maioria das vezes nem aceita consertar bola).</p>
    `,
  },
  {
    id: 2,
    slug: "selecao-brasil-amistosos-setembro-2026",
    title: "Depois da Eliminação: O Que Esperar da Seleção Brasileira em Setembro",
    excerpt:
      "Com a Data Fifa de setembro se aproximando, veja o que costuma mudar na Seleção Brasileira depois de uma Copa do Mundo abaixo do esperado.",
    category: "Seleção",
    date: "2026-07-06",
    image: "/images/blog/neymar-chora.jpg",
    heroImage: "/images/blog/Selecao-fim-de-jogo.webp",
    author: "Cola Bola",
    readTime: "4 min",
    metaTitle: "O Que Esperar da Seleção Brasileira em Setembro | Cola Bola",
    metaDescription:
      "Depois de uma Copa do Mundo abaixo do esperado, veja o que costuma mudar na Seleção Brasileira nos amistosos de setembro e por que o torcedor segue na expectativa.",
    content: `
      <p><em>Nota: este post é um exemplo de estrutura de conteúdo para a categoria "Seleção". Atualize os parágrafos abaixo com o resultado real da Copa e a convocação oficial assim que forem divulgados.</em></p>

      <p>Toda vez que a Seleção Brasileira fecha um ciclo de Copa do Mundo abaixo da expectativa, o mesmo roteiro se repete: debate sobre o técnico, pressão por renovação do elenco e a torcida dividida entre acreditar no próximo ciclo ou já cobrar mudanças imediatas.</p>

      <h2>A Data Fifa de setembro como primeiro termômetro</h2>
      <p>Os amistosos da Data Fifa de setembro costumam ser o primeiro momento em que a comissão técnica testa nomes fora da lista "fixa", aproveitando a ausência de pressão de resultado imediato para observar jogadores que vinham em boa fase nos clubes.</p>

      <h2>Renovação de elenco: o que costuma mudar</h2>
      <p>Historicamente, depois de eliminações precoces, é comum ver: entrada de jogadores mais jovens, reavaliação de quem estava marcado como titular absoluto e mudança de esquema tático para se adequar às características do elenco disponível.</p>

      <h2>O papel da torcida nesse momento</h2>
      <p>Independente do resultado da Copa, setembro é o mês em que o torcedor volta a acompanhar de perto os jogos da Seleção — muitas vezes reunindo a galera para assistir junto, seja em casa, no bar ou organizando a própria pelada no mesmo fim de semana.</p>

      <h2>E por falar em pelada organizada para assistir ao jogo...</h2>
      <p>Se a resenha do jogo da Seleção também incluir uma bola rolando entre os amigos antes ou depois da partida, vale checar se a bola do grupo está furada ou murchando rápido demais. Não precisa comprar outra: dá para consertar em casa em menos de 2 minutos com o Cola Bola e garantir que ninguém fica de fora da pelada por causa de bola vazia.</p>
    `,
  },
];

// ---------------------------------------------------------------------------
// Helpers — todas as páginas/componentes devem consumir estas funções,
// nunca o array POSTS diretamente. Isso mantém a troca para Notion isolada aqui.
// ---------------------------------------------------------------------------

/** Retorna todos os posts, mais recentes primeiro. */
export function getAllPosts() {
  return [...POSTS].sort((a, b) => new Date(b.date) - new Date(a.date));
}

/** Retorna a lista de categorias únicas presentes nos posts, com contagem. */
export function getAllCategories() {
  const posts = getAllPosts();
  const counts = posts.reduce((acc, post) => {
    acc[post.category] = (acc[post.category] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).map(([name, count]) => ({ name, count }));
}

/** Busca um post pelo slug. Retorna undefined se não existir. */
export function getPostBySlug(slug) {
  return getAllPosts().find((post) => post.slug === slug);
}

/** Filtra posts por categoria (case-insensitive). Se category for null/"todas", retorna todos. */
export function getPostsByCategory(category) {
  const posts = getAllPosts();
  if (!category || category.toLowerCase() === "todas") return posts;
  return posts.filter((post) => post.category.toLowerCase() === category.toLowerCase());
}

export const POSTS_PER_PAGE = 6;

/**
 * Retorna a página solicitada de posts (já filtrados por categoria/busca),
 * junto com metadados de paginação.
 */
export function getPaginatedPosts({ page = 1, category = null, query = null, perPage = POSTS_PER_PAGE } = {}) {
  let posts = getPostsByCategory(category);

  if (query) {
    const q = query.trim().toLowerCase();
    posts = posts.filter(
      (post) => post.title.toLowerCase().includes(q) || post.excerpt.toLowerCase().includes(q)
    );
  }

  const totalPosts = posts.length;
  const totalPages = Math.max(1, Math.ceil(totalPosts / perPage));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const start = (currentPage - 1) * perPage;
  const paginatedPosts = posts.slice(start, start + perPage);

  return {
    posts: paginatedPosts,
    currentPage,
    totalPages,
    totalPosts,
  };
}

/** Retorna até `count` posts relacionados (mesma categoria, excluindo o próprio post). */
export function getRelatedPosts(post, count = 3) {
  if (!post) return [];
  const sameCategory = getAllPosts().filter(
    (p) => p.category === post.category && p.slug !== post.slug
  );
  if (sameCategory.length >= count) return sameCategory.slice(0, count);

  const fallback = getAllPosts().filter(
    (p) => p.slug !== post.slug && !sameCategory.includes(p)
  );
  return [...sameCategory, ...fallback].slice(0, count);
}

/** Retorna o post anterior e o próximo (ordem cronológica) em relação ao slug informado. */
export function getAdjacentPosts(slug) {
  const posts = getAllPosts();
  const index = posts.findIndex((p) => p.slug === slug);
  if (index === -1) return { previous: null, next: null };

  return {
    previous: index < posts.length - 1 ? posts[index + 1] : null,
    next: index > 0 ? posts[index - 1] : null,
  };
}

/** Formata "2026-07-06" como "6 de julho de 2026". */
export function formatPostDate(isoDate) {
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}

/** Monta a URL de uma página de listagem preservando categoria/busca ativas. */
export function buildBlogPageHref(page, params) {
  const query = new URLSearchParams(params);
  query.delete("page");
  const queryString = query.toString();
  const base = page <= 1 ? "/blog" : `/blog/page/${page}`;
  return queryString ? `${base}?${queryString}` : base;
}

// ---------------------------------------------------------------------------
// Ponto de extensão futuro: quando a integração com o Notion for implementada,
// crie uma função como a abaixo e troque a implementação de getAllPosts() por
// ela (mantendo a mesma assinatura/retorno para não quebrar o restante do blog).
//
// export async function getAllPostsFromNotion() {
//   const response = await notion.databases.query({ database_id: process.env.NOTION_BLOG_DB_ID });
//   return response.results.map(mapNotionPageToPost);
// }
// ---------------------------------------------------------------------------
