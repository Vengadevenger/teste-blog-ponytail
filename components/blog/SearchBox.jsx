/**
 * Busca do blog — form GET nativo: o navegador monta a query string e navega.
 * Sem client component, sem useState/useRouter (a categoria/filtro já vive
 * na sidebar via <Link>, então aqui só sobrou a busca por texto).
 */
export default function SearchBox({ category, query }) {
  return (
    <form className="blog-search" action="/blog" method="GET">
      {category && <input type="hidden" name="categoria" value={category} />}
      <input
        type="search"
        name="q"
        placeholder="Buscar no blog..."
        defaultValue={query || ""}
        className="blog-search-input"
        aria-label="Buscar posts do blog"
      />
      <button type="submit" className="blog-search-btn">
        Buscar
      </button>
    </form>
  );
}
