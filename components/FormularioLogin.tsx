"use client";
// Inicio de sesión único para ADMIN y EMPRENDEDOR: el servidor responde a
// qué panel debe ir cada uno según su rol.
import { useState } from "react";
import { pedirApi } from "@/lib/cliente-api";

export function FormularioLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError("");
    const r = await pedirApi<{ destino: string }>("/api/auth", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (!r.ok || !r.datos) {
      setError(r.error ?? "No se pudo iniciar sesión.");
      setEnviando(false);
      return;
    }
    // Vuelve a la página que se quería ver, solo si es del mismo panel (evita redirecciones abiertas)
    const desde = new URLSearchParams(window.location.search).get("desde");
    const destino = r.datos.destino;
    window.location.href = desde && (desde === destino || desde.startsWith(`${destino}/`)) ? desde : destino;
  }

  return (
    <form onSubmit={entrar} className="mt-6 space-y-4">
      <div>
        <label htmlFor="email" className="etiqueta">
          Correo electrónico
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          required
          maxLength={120}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="campo"
        />
      </div>
      <div>
        <label htmlFor="password" className="etiqueta">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={72}
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
      <button type="submit" disabled={enviando || !email || !password} className="btn-primario w-full">
        {enviando ? "Verificando…" : "Ingresar"}
      </button>
    </form>
  );
}
