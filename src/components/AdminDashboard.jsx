import { useState } from "react";
import { formatPrice } from "../utils/format.js";

const TABS = [
  { id: "inventory", label: "Inventory" },
  { id: "users", label: "Users" },
];

function formatJoined(value) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function AdminDashboard({
  adminUser,
  books,
  stats,
  users,
  usersMeta,
  usersLoading,
  usersError,
  onAddBook,
  onEditBook,
  onDeleteBook,
  onQuickUpdate,
  onSearchUsers,
  onUsersPage,
  onRequestRoleChange,
}) {
  const [activeTab, setActiveTab] = useState("inventory");
  const [userQuery, setUserQuery] = useState("");

  function selectTab(tabId) {
    setActiveTab(tabId);
    document.getElementById(`admin-tab-${tabId}`)?.focus();
  }

  function handleTabKeyDown(event, tabId) {
    const index = TABS.findIndex((tab) => tab.id === tabId);
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const offset = event.key === "ArrowRight" ? 1 : -1;
      const next = TABS[(index + offset + TABS.length) % TABS.length];
      selectTab(next.id);
    }
    if (event.key === "Home") {
      event.preventDefault();
      selectTab(TABS[0].id);
    }
    if (event.key === "End") {
      event.preventDefault();
      selectTab(TABS[TABS.length - 1].id);
    }
  }

  function handleUserSearch(event) {
    event.preventDefault();
    onSearchUsers(userQuery.trim());
  }

  return (
    <section className="admin-panel" aria-labelledby="admin-heading">
      <div className="admin-header-bar">
        <div>
          <p className="hero-eyebrow">Store operations</p>
          <h1 id="admin-heading" className="section-title admin-title">
            Admin desk
          </h1>
          <p className="admin-signed-in">
            Signed in as {adminUser.username ? `@${adminUser.username}` : adminUser.email}
          </p>
        </div>

        <div className="admin-tab-list" role="tablist" aria-label="Admin sections">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`admin-tab-${tab.id}`}
              aria-selected={activeTab === tab.id}
              aria-controls={`admin-panel-${tab.id}`}
              tabIndex={activeTab === tab.id ? 0 : -1}
              className={`admin-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(event) => handleTabKeyDown(event, tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "inventory" ? (
        <div
          role="tabpanel"
          id="admin-panel-inventory"
          aria-labelledby="admin-tab-inventory"
          className="admin-tab-panel"
        >
          <div className="admin-panel-actions">
            <p className="admin-panel-hint">
              {stats.totalTitles} titles in the catalog. Update stock or add a new arrival.
            </p>
            <button type="button" className="btn btn-primary" onClick={onAddBook}>
              Add book
            </button>
          </div>

          <div className="admin-kpis">
            <div className="metric-box">
              <div className="metric-value">{stats.totalTitles}</div>
              <div className="metric-label">Total titles</div>
            </div>
            <div className="metric-box">
              <div className="metric-value">{stats.totalUnits}</div>
              <div className="metric-label">Total units</div>
            </div>
            <div className="metric-box">
              <div className="metric-value">{stats.lowStockCount}</div>
              <div className="metric-label">Low stock (1 to 3)</div>
            </div>
            <div className="metric-box">
              <div className="metric-value">{stats.outOfStockCount}</div>
              <div className="metric-label">Out of stock</div>
            </div>
          </div>

          <div className="table-wrap">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th scope="col">Title and author</th>
                  <th scope="col">ISBN</th>
                  <th scope="col">Genre</th>
                  <th scope="col">Price</th>
                  <th scope="col">Stock</th>
                  <th scope="col">Featured</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book.id}>
                    <td>
                      <div className="table-primary">{book.title}</div>
                      <div className="table-secondary">{book.author}</div>
                    </td>
                    <td className="numeric">{book.isbn}</td>
                    <td>{book.genre}</td>
                    <td className="numeric table-primary">{formatPrice(book.priceCents)}</td>
                    <td>
                      <div className="qty-stepper">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          aria-label={`Decrease stock for ${book.title}`}
                          disabled={book.stock <= 0}
                          onClick={() =>
                            onQuickUpdate(book.id, { stock: Math.max(0, book.stock - 1) })
                          }
                        >
                          -
                        </button>
                        <span className="qty-value">{book.stock}</span>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          aria-label={`Increase stock for ${book.title}`}
                          onClick={() => onQuickUpdate(book.id, { stock: book.stock + 1 })}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`btn btn-sm ${book.featured ? "btn-primary" : "btn-secondary"}`}
                        aria-pressed={book.featured}
                        onClick={() => onQuickUpdate(book.id, { featured: !book.featured })}
                      >
                        {book.featured ? "Featured" : "Standard"}
                      </button>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => onEditBook(book)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => onDeleteBook(book)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div
          role="tabpanel"
          id="admin-panel-users"
          aria-labelledby="admin-tab-users"
          className="admin-tab-panel"
        >
          <div className="users-toolbar">
            <form className="users-search" onSubmit={handleUserSearch} role="search">
              <label className="visually-hidden" htmlFor="user-search">
                Search members by username or email
              </label>
              <input
                id="user-search"
                className="input"
                type="search"
                value={userQuery}
                onChange={(event) => setUserQuery(event.target.value)}
                placeholder="Search username or email"
              />
              <button type="submit" className="btn btn-secondary">
                Search
              </button>
            </form>
            <p className="admin-panel-hint">
              {usersMeta.total} member{usersMeta.total === 1 ? "" : "s"} in the shop
            </p>
          </div>

          <p className="admin-panel-hint">
            Promote a reader to admin to unlock inventory and member controls. Demote an
            admin to return the account to a standard customer role.
          </p>

          {usersError && (
            <div className="alert alert-error" role="alert">
              {usersError}
            </div>
          )}

          <div className="table-wrap">
            <table className="inventory-table users-table">
              <thead>
                <tr>
                  <th scope="col">Member</th>
                  <th scope="col">Role</th>
                  <th scope="col">Joined</th>
                  <th scope="col">Access</th>
                </tr>
              </thead>
              <tbody>
                {usersLoading ? (
                  <tr>
                    <td colSpan="4" className="table-empty">
                      Loading members...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="table-empty">
                      No members match this search.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const isSelf = user.id === adminUser.id;
                    const isAdmin = user.role === "admin";
                    const handle = user.username ? `@${user.username}` : user.email;

                    return (
                      <tr key={user.id}>
                        <td>
                          <div className="table-primary">
                            {handle}
                            {isSelf && <span className="self-chip">You</span>}
                          </div>
                          <div className="table-secondary">
                            {user.email || "No email on file"}
                          </div>
                        </td>
                        <td>
                          <span className={`role-chip ${isAdmin ? "role-admin" : "role-customer"}`}>
                            {isAdmin ? "Admin" : "Customer"}
                          </span>
                        </td>
                        <td>{formatJoined(user.createdAt)}</td>
                        <td>
                          {isSelf ? (
                            <span className="table-secondary">Current account</span>
                          ) : (
                            <button
                              type="button"
                              className={`btn btn-sm ${isAdmin ? "btn-danger" : "btn-primary"}`}
                              onClick={() => onRequestRoleChange(user)}
                            >
                              {isAdmin ? "Make customer" : "Make admin"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {usersMeta.totalPages > 1 && (
            <div className="pagination">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={usersMeta.page <= 1 || usersLoading}
                onClick={() => onUsersPage(usersMeta.page - 1)}
              >
                Previous
              </button>
              <span className="pagination-label">
                Page {usersMeta.page} of {usersMeta.totalPages}
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={usersMeta.page >= usersMeta.totalPages || usersLoading}
                onClick={() => onUsersPage(usersMeta.page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
