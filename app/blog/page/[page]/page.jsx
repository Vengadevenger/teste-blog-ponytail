import { notFound, redirect } from "next/navigation";
import { getPaginatedPosts, buildBlogPageHref } from "@/lib/blog-data";
import BlogListingBody from "@/components/blog/BlogListingBody";

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  return {
    title: `Blog — Página ${resolvedParams.page}`,
    description: "Dicas, novidades e conteúdo sobre futebol, vôlei, basquete e manutenção de bolas esportivas.",
  };
}

export default async function BlogPaginatedPage({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const pageNumber = Number(resolvedParams.page);
  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    notFound();
  }
  if (pageNumber === 1) {
    redirect("/blog");
  }

  const category = resolvedSearchParams?.categoria || null;
  const query = resolvedSearchParams?.q || null;

  const { posts, currentPage, totalPages, totalPosts } = getPaginatedPosts({
    page: pageNumber,
    category,
    query,
  });

  if (pageNumber > totalPages) {
    notFound();
  }

  const breadcrumbItems = [
    { label: "Blog", href: "/blog" },
    ...(category ? [{ label: category }] : []),
    { label: `Página ${currentPage}` },
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
      buildHref={(page) => buildBlogPageHref(page, resolvedSearchParams)}
    />
  );
}
