import "@/styles/seo-dashboard.css";

export const metadata = {
  title: "Dashboard SEO — Cola Bola",
  robots: { index: false, follow: false },
};

export default function AdminSeoLayout({ children }) {
  return (
    <div className="seo-admin">
      <header className="seo-admin-header">
        <span className="seo-admin-logo">⚽ Cola Bola</span>
        <h1 className="seo-admin-title">Dashboard SEO</h1>
      </header>
      <main className="seo-admin-main">{children}</main>
    </div>
  );
}
