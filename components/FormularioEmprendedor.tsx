"use client";
// =============================================================
// Formulario del emprendedor, compartido por:
//  - el REGISTRO público (POST /api/registro): incluye correo y contraseña
//  - el PERFIL del panel (PUT /api/panel/perfil): solo datos públicos
// La validación de aquí es solo de ayuda; la definitiva (y la desinfección
// contra XSS) la hace el servidor en lib/validacion.ts.
// =============================================================
import { useState } from "react";
import { pedirApi } from "@/lib/cliente-api";
import type { BarrioDTO, EmprendedorDTO, OpcionDTO } from "@/lib/tipos";

interface Props {
  modo: "registro" | "perfil";
  rubros: OpcionDTO[];
  barrios: BarrioDTO[];
  inicial?: EmprendedorDTO;
}

export function FormularioEmprendedor({ modo, rubros, barrios, inicial }: Props) {
  const registro = modo === "registro";
  const [form, setForm] = useState({
    nombre: inicial?.nombre ?? "",
    emprendimiento: inicial?.emprendimiento ?? "",
    rubroId: inicial ? String(inicial.rubro.id) : "",
    barrioId: inicial ? String(inicial.barrio.id) : "",
    whatsapp: inicial ? inicial.whatsapp.replace(/^591/, "") : "",
    historia: inicial?.historia ?? "",
    foto: inicial?.foto ?? "",
    email: "",
    password: "",
    acepta: false,
  });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const actualizar = (campo: keyof typeof form, valor: string | boolean) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setGuardado(false);
    setErrores((previos) => {
      const resto = { ...previos };
      delete resto[campo];
      return resto;
    });
  };

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErrores({});
    const cuerpo = { ...form, rubroId: Number(form.rubroId), barrioId: Number(form.barrioId) };
    const r = await pedirApi<{ destino?: string }>(registro ? "/api/registro" : "/api/panel/perfil", {
      method: registro ? "POST" : "PUT",
      body: JSON.stringify(cuerpo),
    });
    setEnviando(false);
    if (!r.ok) {
      const nuevos = { general: r.error ?? "No se pudo guardar.", ...r.errores };
      setErrores(nuevos);
      // Lleva el foco al primer campo con error (accesibilidad)
      const primero = Object.keys(r.errores ?? {})[0];
      if (primero) document.getElementById(`e-${primero}`)?.focus();
      return;
    }
    if (registro) window.location.href = r.datos?.destino ?? "/panel";
    else setGuardado(true);
  }

  const a11y = (campo: string) => ({
    id: `e-${campo}`,
    name: campo,
    "aria-invalid": !!errores[campo],
    "aria-describedby": errores[campo] ? `e-${campo}-error` : undefined,
  });
  const error = (campo: string) =>
    errores[campo] ? (
      <p id={`e-${campo}-error`} className="error-campo">
        {errores[campo]}
      </p>
    ) : null;

  return (
    <form onSubmit={enviar} noValidate className="space-y-5">
      {registro && (
        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-2 font-titulo text-xl font-bold">1. Tu cuenta</legend>
          <div>
            <label htmlFor="e-email" className="etiqueta">
              Correo electrónico
            </label>
            <input
              {...a11y("email")}
              type="email"
              autoComplete="email"
              required
              maxLength={120}
              className="campo"
              value={form.email}
              onChange={(e) => actualizar("email", e.target.value)}
            />
            {error("email")}
          </div>
          <div>
            <label htmlFor="e-password" className="etiqueta">
              Contraseña
            </label>
            <input
              {...a11y("password")}
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={72}
              className="campo"
              value={form.password}
              onChange={(e) => actualizar("password", e.target.value)}
            />
            <p className="mt-1 text-xs text-cafe-600">Mínimo 8 caracteres, con letras y números.</p>
            {error("password")}
          </div>
        </fieldset>
      )}

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 font-titulo text-xl font-bold">
          {registro ? "2. Tu emprendimiento" : "Datos públicos"}
        </legend>
        <div>
          <label htmlFor="e-nombre" className="etiqueta">
            Tu nombre completo
          </label>
          <input
            {...a11y("nombre")}
            autoComplete="name"
            required
            maxLength={100}
            className="campo"
            value={form.nombre}
            onChange={(e) => actualizar("nombre", e.target.value)}
          />
          {error("nombre")}
        </div>
        <div>
          <label htmlFor="e-emprendimiento" className="etiqueta">
            Nombre del emprendimiento
          </label>
          <input
            {...a11y("emprendimiento")}
            required
            maxLength={100}
            className="campo"
            value={form.emprendimiento}
            onChange={(e) => actualizar("emprendimiento", e.target.value)}
          />
          {error("emprendimiento")}
        </div>
        <div>
          <label htmlFor="e-rubroId" className="etiqueta">
            Rubro
          </label>
          <select
            {...a11y("rubroId")}
            required
            className="campo"
            value={form.rubroId}
            onChange={(e) => actualizar("rubroId", e.target.value)}
          >
            <option value="">Selecciona…</option>
            {rubros.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </select>
          {error("rubroId")}
        </div>
        <div>
          <label htmlFor="e-barrioId" className="etiqueta">
            Barrio
          </label>
          <select
            {...a11y("barrioId")}
            required
            className="campo"
            value={form.barrioId}
            onChange={(e) => actualizar("barrioId", e.target.value)}
          >
            <option value="">Selecciona…</option>
            {barrios.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nombre} ({b.zona})
              </option>
            ))}
          </select>
          {error("barrioId")}
        </div>
        <div>
          <label htmlFor="e-whatsapp" className="etiqueta">
            Celular con WhatsApp
          </label>
          <input
            {...a11y("whatsapp")}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            maxLength={16}
            placeholder="Ej. 71234567"
            className="campo"
            value={form.whatsapp}
            onChange={(e) => actualizar("whatsapp", e.target.value)}
          />
          {error("whatsapp")}
        </div>
        <div>
          <label htmlFor="e-foto" className="etiqueta">
            Foto de tu taller o producto <span className="font-normal text-cafe-500">(opcional, URL https)</span>
          </label>
          <input
            {...a11y("foto")}
            type="url"
            maxLength={500}
            placeholder="https://…"
            className="campo"
            value={form.foto}
            onChange={(e) => actualizar("foto", e.target.value)}
          />
          {error("foto")}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="e-historia" className="etiqueta">
            Tu historia
          </label>
          <textarea
            {...a11y("historia")}
            required
            rows={6}
            maxLength={2000}
            className="campo resize-y"
            placeholder="¿Quién eres, qué produces, desde cuándo y cómo? ¿Qué cambia para tu familia si vendes más?"
            value={form.historia}
            onChange={(e) => actualizar("historia", e.target.value)}
          />
          <p className="mt-1 text-xs text-cafe-600">{form.historia.trim().length} / 2000 caracteres (mínimo 40).</p>
          {error("historia")}
        </div>
      </fieldset>

      {registro && (
        <div>
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed">
            <input
              {...a11y("acepta")}
              type="checkbox"
              className="mt-1 size-5 shrink-0 accent-acento-500"
              checked={form.acepta}
              onChange={(e) => actualizar("acepta", e.target.checked)}
            />
            <span>
              Me comprometo con los principios de comercio justo: precios transparentes, productos de elaboración
              propia, trato digno a quienes trabajan conmigo y datos verdaderos en mi perfil.
            </span>
          </label>
          {error("acepta")}
        </div>
      )}

      {errores.general && (
        <p role="alert" className="rounded-xl bg-error/10 p-3 text-sm font-semibold text-error">
          {errores.general}
        </p>
      )}
      {guardado && (
        <p role="status" className="rounded-xl bg-exito/10 p-3 text-sm font-semibold text-exito">
          Perfil actualizado.
        </p>
      )}

      <button type="submit" disabled={enviando} className="btn-primario w-full py-3 text-base sm:w-auto">
        {enviando ? "Enviando…" : registro ? "Enviar solicitud" : "Guardar perfil"}
      </button>
    </form>
  );
}
