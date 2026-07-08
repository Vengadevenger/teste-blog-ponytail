import BlogCard from "@/components/blog/BlogCard";
import Pagination from "@/components/blog/Pagination";
import Breadcrumb from "@/components/blog/Breadcrumb";
import SearchBox from "@/components/blog/SearchBox";

/** Corpo da listagem, compartilhado entre /blog (página 1) e /blog/page/[page]. */
export default function BlogListingBody({
  breadcrumbItems,
  category,
  query,
  posts,
  totalPosts,
  currentPage,
  totalPages,
  buildHref,
}) {
  return (
    <div>
      <Breadcrumb items={breadcrumbItems} />
      <SearchBox category={category} query={query} />

      {totalPosts === 0 ? (
        <p className="blog-empty-state">Nenhum post encontrado. Tente outra categoria ou termo de busca.</p>
      ) : (
        <>
          <div className="blog-grid">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>

          <Pagination currentPage={currentPage} totalPages={totalPages} buildHref={buildHref} />
        </>
      )}
    </div>
  );
}
