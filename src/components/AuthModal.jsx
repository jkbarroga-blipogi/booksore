import { useState } from "react";

export function AuthModal({ isOpen, onClose, onLogin, onRegister, onSwitchToAdmin }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      if (mode === "register") {
        if (username.trim().length < 3) {
          throw new Error("Username must be at least 3 characters");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }
        await onRegister({ username: username.trim(), password });
      } else {
        if (!username.trim() || !password) {
          throw new Error("Username and password are required");
        }
        await onLogin({ username: username.trim(), password });
      }
      onClose();
      setUsername("");
      setPassword("");
    } catch (err) {
      setErrorMsg(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    setMode((prev) => (prev === "login" ? "register" : "login"));
    setErrorMsg("");
  }

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-panel" style={{ maxWidth: "440px" }}>
        <div className="modal-header">
          <h2 id="auth-modal-title" className="modal-title">
            {mode === "register" ? "Create Account" : "Customer Sign In"}
          </h2>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close sign in">
            x
          </button>
        </div>

        <p style={{ margin: "0 0 16px", color: "var(--ink-secondary)", fontSize: "0.88rem" }}>
          {mode === "register"
            ? "Sign up with a username and password to track orders and save past receipts."
            : "Sign in with your username and password to access your book orders."}
        </p>

        {errorMsg && (
          <div className="alert alert-error" role="alert">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <label className="form-field">
            <span className="field-label">Username</span>
            <input
              className="input"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. maria_clara"
              required
            />
          </label>

          <label className="form-field">
            <span className="field-label">Password</span>
            <input
              className="input"
              type="password"
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "register" ? "At least 6 characters" : "Enter your password"}
              required
            />
          </label>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: "4px" }}>
            {loading ? "Processing..." : mode === "register" ? "Create Account" : "Sign In"}
          </button>
        </form>

        <div style={{ marginTop: "18px", paddingTop: "14px", borderTop: "1px solid var(--border-subtle)", textAlign: "center", fontSize: "0.88rem", display: "flex", flexDirection: "column", gap: "8px" }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={toggleMode}
          >
            {mode === "register" ? "Already have an account? Sign In" : "Need an account? Sign Up"}
          </button>

          <button
            type="button"
            style={{ background: "none", border: "none", color: "var(--ink-muted)", fontSize: "0.8rem", textDecoration: "underline", cursor: "pointer", padding: "4px" }}
            onClick={() => {
              onClose();
              onSwitchToAdmin();
            }}
          >
            Store Manager? Open Admin Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
