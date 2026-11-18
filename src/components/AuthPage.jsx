import { useEffect, useState } from "react";

const COPY = {
  login: {
    eyebrow: "Members only",
    title: "Welcome back to the shop.",
    description:
      "Sign in to browse the shelves, keep your cart, and review every order you have placed.",
    submitLabel: "Sign in",
    loadingLabel: "Signing in...",
    switchPrompt: "New to the shop?",
    switchLabel: "Create an account",
    switchPath: "/signup",
  },
  register: {
    eyebrow: "Open a reader account",
    title: "Start your reading list.",
    description:
      "Create a member account to enter the bookstore, place orders, and keep your purchase history in one place.",
    submitLabel: "Create account",
    loadingLabel: "Creating account...",
    switchPrompt: "Already a member?",
    switchLabel: "Sign in",
    switchPath: "/login",
  },
};

export function AuthPage({ mode = "login", onLogin, onRegister, onNavigate }) {
  const copy = COPY[mode];
  const [identifier, setIdentifier] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";

  useEffect(() => {
    const field = document.getElementById(isRegister ? "signup-username" : "login-identifier");
    field?.focus();
  }, [isRegister]);

  function switchMode() {
    setErrorMsg("");
    onNavigate(copy.switchPath);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMsg("");

    if (isRegister) {
      const cleanUsername = username.trim();
      if (!/^[a-zA-Z0-9_]{3,30}$/.test(cleanUsername)) {
        setErrorMsg("Use 3 to 30 letters, numbers, or underscores for your username.");
        return;
      }
      if (password.length < 6) {
        setErrorMsg("Use at least 6 characters for your password.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg("Passwords do not match. Check both fields and try again.");
        return;
      }
    } else if (!identifier.trim() || !password) {
      setErrorMsg("Enter your username or email and your password.");
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await onRegister({ username: username.trim(), password });
      } else {
        await onLogin({ username: identifier.trim(), password });
      }
    } catch (err) {
      setErrorMsg(err.message || "We could not complete that request. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-brand-panel" aria-hidden="true">
        <div className="auth-brand-top">
          <span className="auth-mark">B</span>
          <div>
            <p className="auth-brand-name">Booksore</p>
            <p className="auth-brand-caption">Independent Bookshop</p>
          </div>
        </div>

        <div className="auth-brand-copy">
          <p className="auth-eyebrow">Private shelves, open minds</p>
          <h1 className="auth-display">A quiet room for every reader.</h1>
          <p className="auth-lede">
            Signed-in members can browse curated titles, follow live stock, and keep a record
            of every order.
          </p>
        </div>

        <div className="auth-shelf" aria-hidden="true">
          <span className="shelf-book shelf-book-a" />
          <span className="shelf-book shelf-book-b" />
          <span className="shelf-book shelf-book-c" />
          <span className="shelf-book shelf-book-d" />
          <span className="shelf-book shelf-book-e" />
          <span className="shelf-book shelf-book-f" />
          <span className="shelf-book shelf-book-g" />
        </div>

        <p className="auth-quote">A good book is a quiet door.</p>
      </section>

      <section className="auth-form-panel" aria-labelledby="auth-title">
        <div className="auth-form-inner">
          <div className="auth-mobile-brand">
            <span className="auth-mark">B</span>
            <span className="auth-brand-name">Booksore</span>
          </div>

          <p className="auth-eyebrow">{copy.eyebrow}</p>
          <h1 id="auth-title" className="auth-title">
            {copy.title}
          </h1>
          <p className="auth-description">{copy.description}</p>

          {errorMsg && (
            <div className="alert alert-error auth-alert" role="alert">
              {errorMsg}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {isRegister ? (
              <label className="form-field">
                <span className="field-label">Username</span>
                <input
                  className="input"
                  type="text"
                  name="username"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="e.g. maria_clara"
                  aria-describedby="username-hint"
                  id="signup-username"
                  required
                />
                <span id="username-hint" className="field-hint">
                  3 to 30 characters. Letters, numbers, and underscores only.
                </span>
              </label>
            ) : (
              <label className="form-field">
                <span className="field-label">Username or email</span>
                <input
                  className="input"
                  type="text"
                  name="username"
                  autoComplete="username"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder="your username or member email"
                  id="login-identifier"
                  required
                />
              </label>
            )}

            <label className="form-field">
              <span className="field-label">Password</span>
              <div className="password-field">
                <input
                  className="input"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={isRegister ? "At least 6 characters" : "Enter your password"}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-pressed={showPassword}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            {isRegister && (
              <label className="form-field">
                <span className="field-label">Confirm password</span>
                <input
                  className="input"
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repeat your password"
                  required
                />
              </label>
            )}

            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? copy.loadingLabel : copy.submitLabel}
            </button>
          </form>

          <div className="auth-switch">
            <span>{copy.switchPrompt}</span>
            <button type="button" className="link-button" onClick={switchMode} disabled={loading}>
              {copy.switchLabel}
            </button>
          </div>

          <p className="auth-footnote">
            Staff accounts use the same sign-in form. Admin tools appear only for accounts
            with an administrator role.
          </p>
        </div>
      </section>
    </main>
  );
}
