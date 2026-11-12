import { useCallback, useEffect, useState } from "react";
import { api } from "./api/client.js";
import { Header } from "./components/Header.jsx";
import { BookCard } from "./components/BookCard.jsx";
import { BookDetailModal } from "./components/BookDetailModal.jsx";
import { CartDrawer } from "./components/CartDrawer.jsx";
import { AdminDashboard } from "./components/AdminDashboard.jsx";
import { BookFormModal } from "./components/BookFormModal.jsx";
import { ConfirmDeleteModal } from "./components/ConfirmDeleteModal.jsx";

export function App() {
  const [activeView, setActiveView] = useState("storefront");
  const [adminUser, setAdminUser] = useState(null);

  const [books, setBooks] = useState([]);
  const [stats, setStats] = useState({
    totalTitles: 0,
    totalUnits: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    genres: [],
  });
  const [meta, setMeta] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [filters, setFilters] = useState({
    q: "",
    genre: "",
    sort: "createdAt:desc",
    inStock: false,
    page: 1,
  });

  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [inspectedBook, setInspectedBook] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [deletingBook, setDeletingBook] = useState(null);
  const [toast, setToast] = useState("");

  const showToast = useCallback((message) => {
    setToast(message);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [sort, order] = filters.sort.split(":");
      const res = await api.listBooks({
        q: filters.q || undefined,
        genre: filters.genre || undefined,
        inStock: filters.inStock ? "true" : undefined,
        sort,
        order,
        page: activeView === "admin" ? 1 : filters.page,
        limit: activeView === "admin" ? 100 : 12,
      });
      setBooks(res.data);
      setMeta(res.meta);
      setStats(res.meta.stats);

      setCart((prev) =>
        prev
          .map((item) => {
            const fresh = res.data.find((b) => b.id === item.book.id);
            if (!fresh) return item;
            return {
              book: fresh,
              quantity: Math.min(item.quantity, Math.max(fresh.stock, 0)),
            };
          })
          .filter((item) => item.quantity > 0),
      );
    } catch (err) {
      setLoadError(err.message || "Unable to load catalog");
    } finally {
      setLoading(false);
    }
  }, [filters, activeView]);

  useEffect(() => {
    api
      .getSession()
      .then((res) => setAdminUser(res.data))
      .catch(() => setAdminUser(null));
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setInspectedBook(null);
        setCartOpen(false);
        setFormOpen(false);
        setDeletingBook(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function getCartQty(bookId) {
    return cart.find((item) => item.book.id === bookId)?.quantity ?? 0;
  }

  function handleAddToCart(book) {
    if (book.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.book.id === book.id);
      if (existing) {
        if (existing.quantity >= book.stock) return prev;
        return prev.map((item) =>
          item.book.id === book.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...prev, { book, quantity: 1 }];
    });
    showToast(`Added "${book.title}" to cart`);
  }

  function handleUpdateCartQty(bookId, nextQty) {
    if (nextQty <= 0) {
      setCart((prev) => prev.filter((item) => item.book.id !== bookId));
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.book.id === bookId
          ? { ...item, quantity: Math.min(nextQty, item.book.stock) }
          : item,
      ),
    );
  }

  function handleRemoveCartItem(bookId) {
    setCart((prev) => prev.filter((item) => item.book.id !== bookId));
  }

  async function handleCheckout() {
    const payload = cart.map((item) => ({
      bookId: item.book.id,
      quantity: item.quantity,
    }));
    const res = await api.checkout(payload);
    setCart([]);
    await fetchCatalog();
    showToast("Order placed successfully");
    return res.data;
  }

  async function handleLogin(credentials) {
    const res = await api.login(credentials);
    setAdminUser(res.data);
    showToast(`Signed in as ${res.data.email}`);
  }

  async function handleLogout() {
    await api.logout();
    setAdminUser(null);
    showToast("Signed out");
  }

  async function handleSaveBook(payload) {
    if (editingBook) {
      await api.updateBook(editingBook.id, payload);
      showToast(`Updated "${payload.title}"`);
    } else {
      await api.createBook(payload);
      showToast(`Added "${payload.title}" to catalog`);
    }
    await fetchCatalog();
  }

  async function handleQuickUpdate(bookId, updates) {
    try {
      await api.updateBook(bookId, updates);
      await fetchCatalog();
      showToast("Inventory updated");
    } catch (err) {
      showToast(err.message || "Update failed");
    }
  }

  async function handleConfirmDelete(book) {
    await api.deleteBook(book.id);
    setCart((prev) => prev.filter((item) => item.book.id !== book.id));
    await fetchCatalog();
    showToast(`Deleted "${book.title}"`);
  }

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="app-shell">
      <Header
        activeView={activeView}
        onNavigate={setActiveView}
        cartCount={totalCartItems}
        onOpenCart={() => setCartOpen(true)}
        adminUser={adminUser}
        onLogout={handleLogout}
      />

      <main className="main-content container">
        {activeView === "storefront" ? (
          <>
            <section className="hero-banner" aria-label="Bookshop overview">
              <div>
                <p className="hero-eyebrow">Curated Shelf & Live Stock</p>
                <h1 className="hero-title">Independent Books, Thoughtfully Kept</h1>
                <p className="hero-subtitle">
                  Browse literary fiction, systems engineering, design craft, and timeless essays
                  with real-time inventory checkout.
                </p>
              </div>

              <div className="hero-metrics">
                <div className="metric-box">
                  <div className="metric-value">{stats.totalTitles}</div>
                  <div className="metric-label">Catalog Titles</div>
                </div>
                <div className="metric-box">
                  <div className="metric-value">{stats.totalUnits}</div>
                  <div className="metric-label">Copies Ready</div>
                </div>
                <div className="metric-box">
                  <div className="metric-value">{stats.genres.length}</div>
                  <div className="metric-label">Genres</div>
                </div>
              </div>
            </section>

            <section className="toolbar" aria-label="Catalog filters">
              <input
                className="input"
                type="search"
                aria-label="Search books by title, author, or ISBN"
                placeholder="Search by title, author, or ISBN..."
                value={filters.q}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, q: e.target.value, page: 1 }))
                }
              />

              <select
                className="select"
                aria-label="Filter by genre"
                value={filters.genre}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, genre: e.target.value, page: 1 }))
                }
              >
                <option value="">All Genres</option>
                {stats.genres.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>

              <select
                className="select"
                aria-label="Sort books"
                value={filters.sort}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, sort: e.target.value, page: 1 }))
                }
              >
                <option value="createdAt:desc">Newest Arrivals</option>
                <option value="title:asc">Title (A to Z)</option>
                <option value="priceCents:asc">Price (Low to High)</option>
                <option value="priceCents:desc">Price (High to Low)</option>
                <option value="publishedYear:desc">Publication Year</option>
              </select>

              <label className="checkbox-pill">
                <input
                  type="checkbox"
                  checked={filters.inStock}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, inStock: e.target.checked, page: 1 }))
                  }
                />
                <span>In stock only</span>
              </label>
            </section>

            {loadError && (
              <div className="alert alert-error" role="alert">
                {loadError}
              </div>
            )}

            {loading ? (
              <div className="empty-state">Loading catalog...</div>
            ) : books.length === 0 ? (
              <div className="empty-state">No books match your current filters.</div>
            ) : (
              <>
                <div className="books-grid">
                  {books.map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      cartQty={getCartQty(book.id)}
                      onInspect={setInspectedBook}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>

                {meta.totalPages > 1 && (
                  <div className="pagination">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={meta.page <= 1}
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
                      }
                    >
                      Previous
                    </button>
                    <span style={{ fontSize: "0.9rem", color: "var(--ink-secondary)" }}>
                      Page {meta.page} of {meta.totalPages}
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={meta.page >= meta.totalPages}
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          page: Math.min(meta.totalPages, prev.page + 1),
                        }))
                      }
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <AdminDashboard
            adminUser={adminUser}
            books={books}
            stats={stats}
            onLogin={handleLogin}
            onAddBook={() => {
              setEditingBook(null);
              setFormOpen(true);
            }}
            onEditBook={(book) => {
              setEditingBook(book);
              setFormOpen(true);
            }}
            onDeleteBook={setDeletingBook}
            onQuickUpdate={handleQuickUpdate}
          />
        )}
      </main>

      <BookDetailModal
        book={inspectedBook}
        cartQty={inspectedBook ? getCartQty(inspectedBook.id) : 0}
        onClose={() => setInspectedBook(null)}
        onAddToCart={handleAddToCart}
      />

      <CartDrawer
        isOpen={cartOpen}
        items={cart}
        onClose={() => setCartOpen(false)}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onCheckout={handleCheckout}
      />

      <BookFormModal
        isOpen={formOpen}
        editingBook={editingBook}
        onClose={() => setFormOpen(false)}
        onSave={handleSaveBook}
      />

      <ConfirmDeleteModal
        book={deletingBook}
        onClose={() => setDeletingBook(null)}
        onConfirm={handleConfirmDelete}
      />

      {toast && (
        <div className="toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  );
}
