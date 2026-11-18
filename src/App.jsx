import { useCallback, useEffect, useState } from "react";
import { api } from "./api/client.js";
import { useRouter } from "./router.js";
import { Header } from "./components/Header.jsx";
import { BookCard } from "./components/BookCard.jsx";
import { BookDetailModal } from "./components/BookDetailModal.jsx";
import { CartDrawer } from "./components/CartDrawer.jsx";
import { AdminDashboard } from "./components/AdminDashboard.jsx";
import { BookFormModal } from "./components/BookFormModal.jsx";
import { ConfirmDeleteModal } from "./components/ConfirmDeleteModal.jsx";
import { ConfirmRoleModal } from "./components/ConfirmRoleModal.jsx";
import { AuthPage } from "./components/AuthPage.jsx";
import { MyOrdersModal } from "./components/MyOrdersModal.jsx";

const AUTH_ROUTES = ["/login", "/signup"];
const KNOWN_ROUTES = ["/login", "/signup", "/store", "/admin"];
const EMPTY_USERS_META = { page: 1, limit: 20, total: 0, totalPages: 1 };

function sameSession(previous, next) {
  if (previous === next) return true;
  if (!previous || !next) return false;
  return (
    previous.id === next.id &&
    previous.username === next.username &&
    previous.email === next.email &&
    previous.role === next.role
  );
}

export function App() {
  const { path, navigate } = useRouter();

  const [sessionReady, setSessionReady] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

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
  const [ordersModalOpen, setOrdersModalOpen] = useState(false);
  const [myOrders, setMyOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [toast, setToast] = useState("");

  const [users, setUsers] = useState([]);
  const [usersMeta, setUsersMeta] = useState(EMPTY_USERS_META);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [userFilters, setUserFilters] = useState({ q: "", page: 1 });
  const [roleTarget, setRoleTarget] = useState(null);

  const isAdmin = currentUser?.role === "admin";
  const isAuthRoute = AUTH_ROUTES.includes(path);
  const activeView = path === "/admin" ? "admin" : "store";

  const showToast = useCallback((message) => {
    setToast(message);
  }, []);

  const closeRoleModal = useCallback(() => {
    setRoleTarget(null);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    let active = true;
    api
      .getSession()
      .then((res) => {
        if (active) {
          setCurrentUser((previous) => (sameSession(previous, res.data) ? previous : res.data));
        }
      })
      .catch(() => {
        if (active) setCurrentUser(null);
      })
      .finally(() => {
        if (active) setSessionReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function syncSession() {
      api
        .getSession()
        .then((res) =>
          setCurrentUser((previous) => (sameSession(previous, res.data) ? previous : res.data)),
        )
        .catch(() => {});
    }
    function handleVisibility() {
      if (document.visibilityState === "visible") syncSession();
    }
    window.addEventListener("focus", syncSession);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("focus", syncSession);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  useEffect(() => {
    if (!sessionReady) return;

    if (!KNOWN_ROUTES.includes(path)) {
      navigate(currentUser ? "/store" : "/login", { replace: true });
      return;
    }

    if (!currentUser && !isAuthRoute) {
      navigate("/login", { replace: true });
      return;
    }

    if (currentUser && isAuthRoute) {
      navigate("/store", { replace: true });
      return;
    }

    if (currentUser && path === "/admin" && !isAdmin) {
      navigate("/store", { replace: true });
      showToast("Admin tools are limited to administrator accounts.");
    }
  }, [sessionReady, currentUser, path, isAuthRoute, isAdmin, navigate, showToast]);

  useEffect(() => {
    const titles = {
      "/login": "Sign in | Booksore",
      "/signup": "Create account | Booksore",
      "/store": "Storefront | Booksore",
      "/admin": "Admin desk | Booksore",
    };
    document.title = titles[path] || "Booksore | Independent Bookshop";
  }, [path]);

  const fetchCatalog = useCallback(async () => {
    if (!currentUser) return;
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
        page: path === "/admin" ? 1 : filters.page,
        limit: path === "/admin" ? 100 : 12,
      });
      setBooks(res.data);
      setMeta(res.meta);
      setStats(res.meta.stats);

      setCart((previous) =>
        previous
          .map((item) => {
            const fresh = res.data.find((book) => book.id === item.book.id);
            if (!fresh) return item;
            return {
              book: fresh,
              quantity: Math.min(item.quantity, Math.max(fresh.stock, 0)),
            };
          })
          .filter((item) => item.quantity > 0),
      );
    } catch (err) {
      if (err.status === 401) {
        setCurrentUser(null);
        navigate("/login", { replace: true });
        return;
      }
      setLoadError(err.message || "Unable to load the catalog.");
    } finally {
      setLoading(false);
    }
  }, [currentUser, filters, path, navigate]);

  useEffect(() => {
    if (currentUser && (path === "/store" || path === "/admin")) {
      fetchCatalog();
    }
  }, [currentUser, path, fetchCatalog]);

  const loadUsers = useCallback(async (nextFilters) => {
    setUsersLoading(true);
    setUsersError("");
    try {
      const res = await api.listUsers({
        q: nextFilters.q || undefined,
        page: nextFilters.page,
        limit: 20,
      });
      setUsers(res.data);
      setUsersMeta(res.meta);
    } catch (err) {
      setUsersError(err.message || "Unable to load members.");
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionReady && isAdmin && path === "/admin") {
      loadUsers(userFilters);
    }
  }, [sessionReady, isAdmin, path, userFilters, loadUsers]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
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
    setCart((previous) => {
      const existing = previous.find((item) => item.book.id === book.id);
      if (existing) {
        if (existing.quantity >= book.stock) return previous;
        return previous.map((item) =>
          item.book.id === book.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...previous, { book, quantity: 1 }];
    });
    showToast(`Added "${book.title}" to cart`);
  }

  function handleUpdateCartQty(bookId, nextQty) {
    if (nextQty <= 0) {
      setCart((previous) => previous.filter((item) => item.book.id !== bookId));
      return;
    }
    setCart((previous) =>
      previous.map((item) =>
        item.book.id === bookId
          ? { ...item, quantity: Math.min(nextQty, item.book.stock) }
          : item,
      ),
    );
  }

  function handleRemoveCartItem(bookId) {
    setCart((previous) => previous.filter((item) => item.book.id !== bookId));
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
    setCurrentUser(res.data);
    setFilters((previous) => ({ ...previous, page: 1 }));
    navigate("/store");
    showToast(`Signed in as @${res.data.username || res.data.email}`);
  }

  async function handleRegister(credentials) {
    const res = await api.register(credentials);
    setCurrentUser(res.data);
    navigate("/store");
    showToast(`Account created. Welcome, @${res.data.username}`);
  }

  async function handleOpenOrders() {
    setOrdersModalOpen(true);
    setOrdersLoading(true);
    try {
      const res = await api.getMyOrders();
      setMyOrders(res.data);
    } catch (err) {
      showToast(err.message || "Failed to load orders");
    } finally {
      setOrdersLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await api.logout();
      showToast("Signed out");
    } catch {
      showToast("Signed out on this device. The server could not be reached.");
    }
    setCurrentUser(null);
    setCart([]);
    setBooks([]);
    setLoading(true);
    setUsers([]);
    setUsersMeta(EMPTY_USERS_META);
    setUserFilters({ q: "", page: 1 });
    navigate("/login", { replace: true });
  }

  async function handleSaveBook(payload) {
    if (editingBook) {
      await api.updateBook(editingBook.id, payload);
      showToast(`Updated "${payload.title}"`);
    } else {
      await api.createBook(payload);
      showToast(`Added "${payload.title}" to the catalog`);
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
    setCart((previous) => previous.filter((item) => item.book.id !== book.id));
    await fetchCatalog();
    showToast(`Deleted "${book.title}"`);
  }

  async function handleRoleChange(user) {
    const nextRole = user.role === "admin" ? "customer" : "admin";
    await api.updateUserRole(user.id, nextRole);
    await loadUsers(userFilters);
    showToast(
      nextRole === "admin"
        ? `@${user.username || user.email} is now an admin`
        : `@${user.username || user.email} is now a customer`,
    );
  }

  function handleSearchUsers(query) {
    setUserFilters({ q: query, page: 1 });
  }

  function handleUsersPage(page) {
    setUserFilters((previous) => ({ ...previous, page }));
  }

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const showShell = currentUser && !isAuthRoute;

  if (!sessionReady) {
    return (
      <div className="boot-screen" role="status" aria-live="polite">
        <span className="auth-mark">B</span>
        <p>Opening the bookshop...</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      {showShell ? (
        <>
          <Header
            activeView={activeView}
            onNavigate={navigate}
            cartCount={totalCartItems}
            onOpenCart={() => setCartOpen(true)}
            currentUser={currentUser}
            onOpenOrders={handleOpenOrders}
            onLogout={handleLogout}
          />

          <main id="main-content" className="main-content container" tabIndex="-1">
            {path === "/admin" && isAdmin ? (
              <AdminDashboard
                adminUser={currentUser}
                books={books}
                stats={stats}
                users={users}
                usersMeta={usersMeta}
                usersLoading={usersLoading}
                usersError={usersError}
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
                onSearchUsers={handleSearchUsers}
                onUsersPage={handleUsersPage}
                onRequestRoleChange={setRoleTarget}
              />
            ) : (
              <>
                <section className="hero-banner" aria-label="Bookshop overview">
                  <div>
                    <p className="hero-eyebrow">Curated shelf and live stock</p>
                    <h1 className="hero-title">Independent books, thoughtfully kept.</h1>
                    <p className="hero-subtitle">
                      Browse literary fiction, systems engineering, design craft, and timeless
                      essays with real-time inventory checkout.
                    </p>
                  </div>

                  <div className="hero-metrics">
                    <div className="metric-box">
                      <div className="metric-value">{stats.totalTitles}</div>
                      <div className="metric-label">Catalog titles</div>
                    </div>
                    <div className="metric-box">
                      <div className="metric-value">{stats.totalUnits}</div>
                      <div className="metric-label">Copies ready</div>
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
                    onChange={(event) =>
                      setFilters((previous) => ({
                        ...previous,
                        q: event.target.value,
                        page: 1,
                      }))
                    }
                  />

                  <select
                    className="select"
                    aria-label="Filter by genre"
                    value={filters.genre}
                    onChange={(event) =>
                      setFilters((previous) => ({
                        ...previous,
                        genre: event.target.value,
                        page: 1,
                      }))
                    }
                  >
                    <option value="">All genres</option>
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
                    onChange={(event) =>
                      setFilters((previous) => ({
                        ...previous,
                        sort: event.target.value,
                        page: 1,
                      }))
                    }
                  >
                    <option value="createdAt:desc">Newest arrivals</option>
                    <option value="title:asc">Title (A to Z)</option>
                    <option value="priceCents:asc">Price (low to high)</option>
                    <option value="priceCents:desc">Price (high to low)</option>
                    <option value="publishedYear:desc">Publication year</option>
                  </select>

                  <label className="checkbox-pill">
                    <input
                      type="checkbox"
                      checked={filters.inStock}
                      onChange={(event) =>
                        setFilters((previous) => ({
                          ...previous,
                          inStock: event.target.checked,
                          page: 1,
                        }))
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
                            setFilters((previous) => ({
                              ...previous,
                              page: Math.max(1, previous.page - 1),
                            }))
                          }
                        >
                          Previous
                        </button>
                        <span className="pagination-label">
                          Page {meta.page} of {meta.totalPages}
                        </span>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          disabled={meta.page >= meta.totalPages}
                          onClick={() =>
                            setFilters((previous) => ({
                              ...previous,
                              page: Math.min(meta.totalPages, previous.page + 1),
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
            )}
          </main>
        </>
      ) : (
        <AuthPage
          key={path}
          mode={path === "/signup" ? "register" : "login"}
          onLogin={handleLogin}
          onRegister={handleRegister}
          onNavigate={navigate}
        />
      )}

      <MyOrdersModal
        isOpen={ordersModalOpen}
        onClose={() => setOrdersModalOpen(false)}
        orders={myOrders}
        loading={ordersLoading}
      />

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

      <ConfirmRoleModal
        user={roleTarget}
        onClose={closeRoleModal}
        onConfirm={handleRoleChange}
      />

      {toast && (
        <div className="toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  );
}
