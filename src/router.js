import { useCallback, useEffect, useState } from "react";

function readPath() {
  return window.location.pathname || "/";
}

export function useRouter() {
  const [path, setPath] = useState(readPath);

  useEffect(() => {
    function handlePopState() {
      setPath(readPath());
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = useCallback((nextPath, { replace = false } = {}) => {
    if (nextPath === readPath()) return;
    if (replace) {
      window.history.replaceState({}, "", nextPath);
    } else {
      window.history.pushState({}, "", nextPath);
    }
    setPath(nextPath);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  return { path, navigate };
}
