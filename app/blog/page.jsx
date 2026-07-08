import { getPaginatedPosts, buildBlogPageHref } from "@/lib/blog-data";
import BlogListingBody from "@/components/blog/BlogListingBody";

export const metadata = {
  title: "Blog",
  description:
    "Dicas, novidades e conteúdo sobre futebol, vôlei, basquete e manutenção de bolas esportivas. Pelo time da Cola Bola.",
};

export default async function BlogListingPage({ searchParams }) {
  const resolvedParams = await searchParams;
  const category = resolvedParams?.categoria || null;
  const query = resolvedParams?.q || null;

  const { posts, currentPage, totalPages, totalPosts } = getPaginatedPosts({
    page: 1,
    category,
    query,
  });

  const breadcrumbItems = [
    { label: "Blog", href: "/blog" },
    ...(category ? [{ label: category }] : []),
  ];

  return (
    <BlogListingBody
      breadcrumbItems={breadcrumbItems}
      category={category}
      query={query}
      posts={posts}
      totalPosts={totalPosts}
      currentPage={currentPage}
      totalPages={totalPages}
      buildHref={(page) => buildBlogPageHref(page, resolvedParams)}
    />
  );
}
