import Link from "next/link";

/** Sidebar de categorias exibida no layout compartilhado do blog. */
export default function BlogSidebar({ categories, activeCategory }) {
  return (
    <aside className="blog-layout-sidebar">
      <h3 className="blog-sidebar-widget-title">Categorias</h3>
      <ul className="blog-category-list">
        <li>
          <Link href="/blog" className={!activeCategory ? "is-active" : ""}>
            Todas
          </Link>
        </li>
        {categories.map((category) => (
          <li key={category.name}>
            <Link
              href={`/blog?categoria=${encodeURIComponent(category.name)}`}
              className={activeCategory === category.name ? "is-active" : ""}
            >
              {category.name} <span className="blog-category-count">{category.count}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="blog-sidebar-cta">
        <p>Bola furou de novo?</p>
        <Link href="/comprar" className="blog-sidebar-cta-btn">
          Saiba Mais
        </Link>
      </div>
    </aside>
  );
}
