"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  animate,
  useInView,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import { Lock } from "lucide-react";
import { MethodBadge } from "@/components/method-badge";

/* ------------------------------------------------------------------ */
/* Datos de las dos peticiones que recorre el bucle (flujo real)       */
/* ------------------------------------------------------------------ */

type Stage = "select" | "sending" | "response";

const CYCLES = [
  {
    method: "GET",
    url: "/reservas",
    tab: "Params",
    kind: "params" as const,
    params: [
      ["estado", "confirmada"],
      ["limit", "20"],
    ],
    ms: 18,
    kb: "2.4",
    body: [
      "[",
      "  {",
      '    "id": 1,',
      '    "cliente": "Ada",',
      '    "estado": "confirmada"',
      "  }",
      "]",
    ],
    token: false,
  },
  {
    method: "POST",
    url: "/auth/login",
    tab: "Body",
    kind: "body" as const,
    reqBody: ["{", '  "email": "ada@mesero.app",', '  "password": "••••••••"', "}"],
    ms: 24,
    kb: "0.3",
    body: ["{", '  "access_token": "eyJhbG…",', '  "token_type": "bearer"', "}"],
    token: true,
  },
];

const ENDPOINTS = [
  { m: "GET", p: "/reservas", cycle: 0 },
  { m: "POST", p: "/reservas", cycle: null },
  { m: "GET", p: "/reservas/{id}", cycle: null },
  { m: "POST", p: "/auth/login", cycle: 1 },
];

const TABS = ["Params", "Body", "Headers", "Auth"];

const TIMELINE: { cycle: number; stage: Stage; ms: number }[] = [
  { cycle: 0, stage: "select", ms: 1100 },
  { cycle: 0, stage: "sending", ms: 750 },
  { cycle: 0, stage: "response", ms: 2300 },
  { cycle: 1, stage: "select", ms: 1200 },
  { cycle: 1, stage: "sending", ms: 750 },
  { cycle: 1, stage: "response", ms: 2300 },
];

/* ------------------------------------------------------------------ */
/* Mockup animado de la ventana de Nala. Decorativo.                   */
/* ------------------------------------------------------------------ */

export function AppMockup() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.35 });
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (reduce || !inView) return;
    const t = setTimeout(
      () => setStep((s) => (s + 1) % TIMELINE.length),
      TIMELINE[step].ms,
    );
    return () => clearTimeout(t);
  }, [step, reduce, inView]);

  const frame: { cycle: number; stage: Stage } = reduce
    ? { cycle: 0, stage: "response" }
    : TIMELINE[step];
  const c = CYCLES[frame.cycle];
  const sending = frame.stage === "sending";
  const showResponse = frame.stage === "response";

  return (
    <div ref={ref}>
      <motion.div
        animate={reduce ? undefined : { y: [0, -6, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="overflow-hidden rounded-xl border border-border-strong bg-bg shadow-2xl shadow-black/50"
      >
        {/* Titlebar */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
          <span className="h-3 w-3 rounded-full bg-delete/80" />
          <span className="h-3 w-3 rounded-full bg-post/80" />
          <span className="h-3 w-3 rounded-full bg-get/80" />
          <span className="ml-2 font-mono text-xs text-fg-faint">Nala</span>
        </div>

        <div className="grid min-h-[212px] grid-cols-[180px_1fr_210px] text-xs">
          {/* Sidebar */}
          <div className="border-r border-border bg-raised/40 p-3">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-wide text-fg-faint">
              Servicios
            </div>
            <div className="mb-1 flex items-center gap-1.5 text-fg-muted">
              <span>▾</span>
              <span className="font-medium">Mesero API</span>
            </div>
            <ul className="space-y-0.5 pl-1">
              {ENDPOINTS.map((e) => {
                const active = e.cycle === frame.cycle;
                return (
                  <li key={e.m + e.p} className="relative">
                    {active && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute inset-0 rounded-md border-l-2 border-accent bg-accent/10"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    <div className="relative flex items-center gap-2 px-2 py-1">
                      <MethodBadge method={e.m} />
                      <span
                        className={`truncate font-mono text-[11px] ${
                          active ? "text-fg" : "text-fg-muted"
                        }`}
                      >
                        {e.p}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Centro: constructor */}
          <div className="border-r border-border p-3">
            {/* Fila URL + Enviar */}
            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center gap-2 overflow-hidden rounded-md border border-border bg-card px-2.5 py-2">
                <MethodBadge method={c.method} className="text-[11px]" />
                <AnimatePresence mode="wait">
                  <motion.span
                    key={c.url}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.25 }}
                    className="truncate font-mono text-[11px] text-fg-muted"
                  >
                    <span className="text-accent">{`{{`}</span>baseUrl
                    <span className="text-accent">{`}}`}</span>
                    {c.url}
                  </motion.span>
                </AnimatePresence>
              </div>
              <SendButton sending={sending} />
            </div>

            {/* Pestañas */}
            <div className="mt-3 flex gap-4 border-b border-border pb-2 font-mono text-[11px]">
              {TABS.map((t) => {
                const active = t === c.tab;
                return (
                  <span key={t} className="relative pb-1">
                    <span className={active ? "text-fg" : "text-fg-faint"}>{t}</span>
                    {active && (
                      <motion.span
                        layoutId="tab-underline"
                        className="absolute -bottom-[9px] left-0 right-0 h-0.5 bg-accent"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                  </span>
                );
              })}
            </div>

            {/* Contenido de la pestaña */}
            <div className="mt-3 min-h-[64px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={frame.cycle}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.28 }}
                  className="space-y-2 font-mono text-[11px]"
                >
                  {c.kind === "params"
                    ? c.params!.map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-fg-muted">{k}</span>
                          <span className="text-fg-faint">{v}</span>
                        </div>
                      ))
                    : c.reqBody!.map((line, i) => (
                        <div key={i} className="whitespace-pre text-fg-muted">
                          {line}
                        </div>
                      ))}
                </motion.div>
              </AnimatePresence>

              {/* Chip de token guardado tras el login */}
              <AnimatePresence>
                {c.token && showResponse && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 420, damping: 26 }}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-get/30 bg-get/10 px-2.5 py-1 font-mono text-[10px] text-get"
                  >
                    <Lock size={11} /> Token guardado · Bearer
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Derecha: respuesta */}
          <div className="relative p-3">
            {/* Barra de progreso al enviar */}
            <AnimatePresence>
              {sending && (
                <motion.div
                  className="absolute left-0 top-0 h-0.5 bg-accent"
                  initial={{ width: "0%", opacity: 1 }}
                  animate={{ width: "100%" }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, ease: "easeInOut" }}
                />
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {sending ? (
                <motion.div
                  key="sending"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 font-mono text-[11px] text-fg-faint"
                >
                  <Spinner /> Enviando…
                </motion.div>
              ) : showResponse ? (
                <motion.div
                  key={`resp-${frame.cycle}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="flex flex-wrap items-center gap-2 font-mono text-[11px]"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 460, damping: 22 }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-get" />
                    <span className="font-semibold text-get">200 OK</span>
                    <CountUp to={c.ms} suffix=" ms" />
                    <CountUp to={Number(c.kb)} decimals={1} suffix=" KB" />
                  </motion.div>

                  <motion.pre
                    key={`body-${frame.cycle}`}
                    className="mt-3 font-mono text-[10px] leading-relaxed text-fg-muted"
                    initial="hidden"
                    animate="show"
                    variants={{ show: { transition: { staggerChildren: 0.06 } } }}
                  >
                    {c.body.map((line, i) => (
                      <motion.div
                        key={i}
                        className="whitespace-pre"
                        variants={{
                          hidden: { opacity: 0, x: 6 },
                          show: { opacity: 1, x: 0 },
                        }}
                      >
                        {line}
                      </motion.div>
                    ))}
                  </motion.pre>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-mono text-[11px] text-fg-disabled"
                >
                  Lista para enviar
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Subcomponentes                                                      */
/* ------------------------------------------------------------------ */

/** Botón Enviar con pulsación + onda al disparar la petición. */
function SendButton({ sending }: { sending: boolean }) {
  return (
    <div className="relative">
      <motion.div
        animate={sending ? { scale: [1, 0.92, 1] } : { scale: 1 }}
        transition={{ duration: 0.35 }}
        className="rounded-md bg-accent px-3 py-2 font-mono text-[11px] font-medium text-bg"
      >
        Enviar
      </motion.div>
      <AnimatePresence>
        {sending && (
          <motion.span
            className="pointer-events-none absolute inset-0 rounded-md border border-accent"
            initial={{ opacity: 0.6, scale: 1 }}
            animate={{ opacity: 0, scale: 1.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/** Spinner monocromo. */
function Spinner() {
  return (
    <motion.span
      className="inline-block h-3 w-3 rounded-full border-[1.5px] border-fg-faint border-t-accent"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
    />
  );
}

/** Cuenta ascendente de un número (tiempo / tamaño) al llegar la respuesta. */
function CountUp({
  to,
  suffix,
  decimals = 0,
}: {
  to: number;
  suffix: string;
  decimals?: number;
}) {
  const mv = useMotionValue(0);
  const [val, setVal] = useState(0);

  useEffect(() => {
    const controls = animate(mv, to, {
      duration: 0.7,
      ease: "easeOut",
      onUpdate: (v) => setVal(v),
    });
    return () => controls.stop();
  }, [mv, to]);

  return (
    <span className="text-fg-faint">
      {val.toFixed(decimals)}
      {suffix}
    </span>
  );
}
