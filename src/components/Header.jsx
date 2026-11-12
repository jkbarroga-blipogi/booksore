export function Header({
  activeView,
  onNavigate,
  cartCount,
  onOpenCart,
  adminUser,
  onLogout,
}) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <button
          type="button"
          className="brand"
          onClick={() => onNavigate("storefront")}
          aria-label="Booksore home"
        >
          <span className="brand-name">Booksore</span>
          <span className="brand-tag">Independent Bookshop</span>
        </button>

        <nav className="header-nav" aria-label="Primary navigation">
          <button
            type="button"
            className={`nav-pill ${activeView === "storefront" ? "active" : ""}`}
            onClick={() => onNavigate("storefront")}
          >
            Storefront
          </button>

          <button
            type="button"
            className={`nav-pill ${activeView === "admin" ? "active" : ""}`}
            onClick={() => onNavigate("admin")}
          >
            {adminUser ? "Admin Inventory" : "Admin Sign In"}
          </button>

          {adminUser && (
            <button type="button" className="nav-pill" onClick={onLogout}>
              Sign Out
            </button>
          )}

          <button
            type="button"
            className="cart-btn"
            onClick={onOpenCart}
            aria-label={`Open shopping cart with ${cartCount} items`}
          >
            <span>Cart</span>
            <span className="cart-count">{cartCount}</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
