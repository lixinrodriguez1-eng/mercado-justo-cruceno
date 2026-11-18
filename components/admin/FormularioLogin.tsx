"use client";
import Link from "next/link";
import { useState } from "react";
import { pedirApi } from "@/lib/cliente-api";

export function FormularioLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError("");
    const r = await pedirApi("/api/auth", { method: "POST", body: JSON.stringify({ password }) });
    if (!r.ok) {
      setError(r.error ?? "No se pudo iniciar sesión.");
      setEnviando(false);
      return;
    }
    // Volvemos a la página que se quería ver (solo rutas internas del panel)
    const desde = new URLSearchParams(window.location.search).get("desde");
    window.location.href = desde?.startsWith("/admin") ? desde : "/admin";
  }

  return (
    <form onSubmit={entrar} className="mt-6 space-y-4">
      <div>
        <label htmlFor="password" className="etiqueta">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? "error-login" : undefined}
          className="campo"
        />
        {error && (
          <p id="error-login" role="alert" className="error-campo">
            {error}
          </p>
        )}
      </div>
      <button type="submit" disabled={enviando || !password} className="btn-primario w-full">
        {enviando ? "Verificando…" : "Entrar"}
      </button>
      <Link href="/" className="btn-fantasma w-full">
        ← Volver a la tienda
      </Link>
    </form>
  );
}
