import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllPosts,
  getPostBySlug,
  getRelatedPosts,
  getAdjacentPosts,
  formatPostDate,
} from "@/lib/blog-data";
import Breadcrumb from "@/components/blog/Breadcrumb";
import RelatedPosts from "@/components/blog/RelatedPosts";
import ShareButtons from "@/components/blog/ShareButtons";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://colabola.com.br";

/** Gera as rotas estáticas de todos os posts em build time. */
export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

/** SEO por post: title, description e Open Graph tags. */
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  const url = `${SITE_URL}/blog/${post.slug}`;
  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt;
  const heroImage = post.heroImage || post.image;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      images: [{ url: `${SITE_URL}${heroImage}`, width: 800, height: 400, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${SITE_URL}${heroImage}`],
    },
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const relatedPosts = getRelatedPosts(post, 3);
  const { previous, next } = getAdjacentPosts(post.slug);
  const postUrl = `${SITE_URL}/blog/${post.slug}`;
  const heroImage = post.heroImage || post.image;

  const breadcrumbItems = [
    { label: "Blog", href: "/blog" },
    { label: post.category, href: `/blog?categoria=${encodeURIComponent(post.category)}` },
    { label: post.title },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: `${SITE_URL}${heroImage}`,
    author: { "@type": "Organization", name: post.author },
    publisher: { "@type": "Organization", name: "Cola Bola" },
    datePublished: post.date,
    mainEntityOfPage: postUrl,
  };

  return (
    <article>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Breadcrumb items={breadcrumbItems} />

      <div className="blog-post-hero">
        <Image
          src={heroImage}
          alt={post.title}
          width={800}
          height={400}
          priority
          className="blog-post-hero-image"
          unoptimized={heroImage.endsWith(".svg")}
        />
        <div className="blog-post-hero-overlay">
          <span className="blog-post-hero-category">{post.category}</span>
          <h1 className="blog-post-hero-title">{post.title}</h1>
          <p className="blog-post-hero-meta">
            Por {post.author} · {formatPostDate(post.date)} · {post.readTime} de leitura
          </p>
        </div>
      </div>

      <div className="blog-post-layout">
        <div className="blog-post-content">
          {/* Conteúdo controlado pela equipe Cola Bola (hoje mock, futuramente Notion) */}
          <div dangerouslySetInnerHTML={{ __html: post.content }} />

          <div className="blog-post-cta">
            <h3>Bola furada de novo?</h3>
            <p>Consertar em casa é mais rápido e mais barato do que comprar outra.</p>
            <Link href="/comprar" className="blog-post-cta-btn">
              Saiba Mais
            </Link>
          </div>

          <nav className="blog-post-adjacent-nav">
            {previous ? (
              <Link href={`/blog/${previous.slug}`} className="blog-post-adjacent-link">
                <span>← Post anterior</span>
                <strong>{previous.title}</strong>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link href={`/blog/${next.slug}`} className="blog-post-adjacent-link blog-post-adjacent-next">
                <span>Próximo post →</span>
                <strong>{next.title}</strong>
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </div>

        <aside className="blog-post-sidebar">
          <div className="blog-sidebar-widget">
            <h3 className="blog-sidebar-widget-title">Autor</h3>
            <p>{post.author}</p>
          </div>
          <ShareButtons title={post.title} url={postUrl} />
          <RelatedPosts posts={relatedPosts} />
        </aside>
      </div>
    </article>
  );
}
