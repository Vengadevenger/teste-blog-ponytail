import Image from "next/image";
import Link from "next/link";
import { formatPostDate } from "@/lib/blog-data";

/** Bloco de posts relacionados, usado na sidebar do post individual. */
export default function RelatedPosts({ posts }) {
  if (!posts || posts.length === 0) return null;

  return (
    <div className="blog-sidebar-widget">
      <h3 className="blog-sidebar-widget-title">Posts Relacionados</h3>
      <ul className="blog-related-list">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link href={`/blog/${post.slug}`} className="blog-related-link">
              <div className="blog-related-image-wrapper">
                <Image
                  src={post.image}
                  alt={post.title}
                  width={80}
                  height={60}
                  loading="lazy"
                  unoptimized={post.image.endsWith(".svg")}
                />
              </div>
              <div>
                <p className="blog-related-title">{post.title}</p>
                <p className="blog-related-meta">{formatPostDate(post.date)}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
