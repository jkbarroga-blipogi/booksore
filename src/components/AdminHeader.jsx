export function AdminHeader({ currentUser, onLogout }) {
  const displayName = currentUser.username || currentUser.email;

  return (
    <header className="site-header">
      <div className="container header-inner">
        <div className="brand">
          <span className="brand-name">Booksore Admin</span>
          <span className="brand-tag">Inventory and member roles</span>
        </div>
        <div className="header-nav">
          <span className="nav-user" title={displayName}>
            <span className="nav-user-name">@{displayName}</span>
            <span className="role-chip role-admin">Admin</span>
          </span>
          <button type="button" className="nav-pill nav-signout" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
