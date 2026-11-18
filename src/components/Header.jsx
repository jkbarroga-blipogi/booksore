export function Header({
  activeView,
  onNavigate,
  cartCount,
  onOpenCart,
  currentUser,
  onOpenOrders,
  onLogout,
}) {
  const isAdmin = currentUser?.role === "admin";
  const displayName = currentUser?.username || currentUser?.email || "Member";

  return (
    <header className="site-header">
      <div className="container header-inner">
        <button
          type="button"
          className="brand"
          onClick={() => onNavigate("/store")}
          aria-label="Booksore storefront"
        >
          <span className="brand-name">Booksore</span>
          <span className="brand-tag">Independent Bookshop</span>
        </button>

        <nav className="header-nav" aria-label="Primary navigation">
          <button
            type="button"
            className={`nav-pill ${activeView === "store" ? "active" : ""}`}
            onClick={() => onNavigate("/store")}
            aria-current={activeView === "store" ? "page" : undefined}
          >
            Storefront
          </button>

          <button type="button" className="nav-pill" onClick={onOpenOrders}>
            My Orders
          </button>

          {isAdmin && (
            <button
              type="button"
              className={`nav-pill ${activeView === "admin" ? "active" : ""}`}
              onClick={() => onNavigate("/admin")}
              aria-current={activeView === "admin" ? "page" : undefined}
            >
              Admin
            </button>
          )}

          <span className="nav-user" title={displayName}>
            <span className="nav-user-name">@{displayName}</span>
            <span className={`role-chip ${isAdmin ? "role-admin" : "role-customer"}`}>
              {isAdmin ? "Admin" : "Customer"}
            </span>
          </span>

          <button type="button" className="nav-pill nav-signout" onClick={onLogout}>
            Sign out
          </button>

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
