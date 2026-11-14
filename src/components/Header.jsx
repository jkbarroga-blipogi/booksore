export function Header({
  activeView,
  onNavigate,
  cartCount,
  onOpenCart,
  currentUser,
  onOpenAuth,
  onOpenOrders,
  onLogout,
}) {
  const isAdmin = currentUser?.role === "admin";
  const isCustomer = currentUser?.role === "customer";

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

          {isCustomer && (
            <>
              <span className="nav-pill" style={{ borderColor: "transparent", background: "var(--bg-accent-soft)", color: "var(--brand-primary)" }}>
                Hi, @{currentUser.username}
              </span>
              <button
                type="button"
                className="nav-pill"
                onClick={onOpenOrders}
              >
                My Orders
              </button>
            </>
          )}

          {isAdmin && (
            <button
              type="button"
              className={`nav-pill ${activeView === "admin" ? "active" : ""}`}
              onClick={() => onNavigate("admin")}
            >
              Admin Inventory
            </button>
          )}

          {!currentUser && (
            <>
              <button
                type="button"
                className="nav-pill"
                onClick={onOpenAuth}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`nav-pill ${activeView === "admin" ? "active" : ""}`}
                onClick={() => onNavigate("admin")}
              >
                Admin
              </button>
            </>
          )}

          {currentUser && (
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
