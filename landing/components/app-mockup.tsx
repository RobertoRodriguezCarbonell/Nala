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
import { Lock, Search } from "lucide-react";
import { MethodBadge } from "@/components/method-badge";

/* ================================================================== */
/* Datos del recorrido                                                 */
/* ================================================================== */

type View = "Endpoints" | "Diff de esquema" | "Tipos TS" | "Historial";
type Stage = "select" | "typing" | "sending" | "response";

interface Req {
  method: string;
  url: string;
  tab: "Params" | "Body";
  params?: [string, string][];
  body?: string;
  status: string;
  ms: number;
  kb: string;
  resp: string;
  token?: boolean;
}

const REQS: Req[] = [
  {
    method: "GET",
    url: "/reservas",
    tab: "Params",
    params: [
      ["estado", "confirmada"],
      ["limit", "20"],
    ],
    status: "200 OK",
    ms: 18,
    kb: "2.4",
    resp: '[\n  {\n    "id": 1,\n    "cliente": "Ada",\n    "estado": "confirmada"\n  }\n]',
  },
  {
    method: "POST",
    url: "/auth/login",
    tab: "Body",
    body: '{\n  "email": "ada@mesero.app",\n  "password": "••••••••"\n}',
    status: "200 OK",
    ms: 24,
    kb: "0.3",
    resp: '{\n  "access_token": "eyJhbG…",\n  "token_type": "bearer"\n}',
    token: true,
  },
  {
    method: "POST",
    url: "/reservas",
    tab: "Body",
    body: '{\n  "cliente": "Grace",\n  "personas": 4,\n  "estado": "pendiente"\n}',
    status: "201 Created",
    ms: 31,
    kb: "0.4",
    resp: '{\n  "id": 7,\n  "cliente": "Grace",\n  "estado": "pendiente"\n}',
  },
];

const ENDPOINTS = [
  { m: "GET", p: "/reservas", req: 0 },
  { m: "POST", p: "/reservas", req: 2 },
  { m: "GET", p: "/reservas/{id}", req: null },
  { m: "POST", p: "/auth/login", req: 1 },
];

const REQ_TABS = ["Params", "Body", "Headers", "Auth"];

const SERVICE_TABS: { label: View; badge?: number }[] = [
  { label: "Endpoints", badge: 12 },
  { label: "Diff de esquema", badge: 3 },
  { label: "Tipos TS" },
  { label: "Historial" },
];

const TS_CODE = `export interface Reserva {
  id: number;
  cliente: string;
  personas: number;
  estado: "pendiente" | "confirmada";
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}`;

const DIFF_ROWS: { sign: "+" | "~" | "-"; text: string; breaking?: boolean }[] = [
  { sign: "+", text: "GET /reservas/{id}/factura" },
  { sign: "+", text: "Reserva.notas?: string" },
  { sign: "~", text: "POST /reservas · personas ahora required", breaking: true },
  { sign: "-", text: "GET /salones  (eliminado)", breaking: true },
];

const HISTORY_ROWS = [
  { status: "200", m: "GET", p: "/reservas", ms: "18 ms", when: "hace 2 min" },
  { status: "200", m: "POST", p: "/auth/login", ms: "24 ms", when: "hace 5 min" },
  { status: "201", m: "POST", p: "/reservas", ms: "31 ms", when: "hace 8 min" },
  { status: "404", m: "GET", p: "/reservas/99", ms: "12 ms", when: "hace 12 min" },
];

interface Scene {
  view: View;
  ep?: number;
  stage?: Stage;
  ms: number;
}

const SCENES: Scene[] = [
  { view: "Endpoints", ep: 0, stage: "select", ms: 1200 },
  { view: "Endpoints", ep: 0, stage: "typing", ms: 1700 },
  { view: "Endpoints", ep: 0, stage: "sending", ms: 800 },
  { view: "Endpoints", ep: 0, stage: "response", ms: 2600 },
  { view: "Endpoints", ep: 1, stage: "select", ms: 1200 },
  { view: "Endpoints", ep: 1, stage: "typing", ms: 1900 },
  { view: "Endpoints", ep: 1, stage: "sending", ms: 800 },
  { view: "Endpoints", ep: 1, stage: "response", ms: 2600 },
  { view: "Endpoints", ep: 2, stage: "select", ms: 1200 },
  { view: "Endpoints", ep: 2, stage: "typing", ms: 1900 },
  { view: "Endpoints", ep: 2, stage: "sending", ms: 800 },
  { view: "Endpoints", ep: 2, stage: "response", ms: 2600 },
  { view: "Tipos TS", ms: 5200 },
  { view: "Diff de esquema", ms: 4200 },
  { view: "Historial", ms: 3800 },
];

function statusColor(status: string) {
  if (status.startsWith("2")) return "text-get";
  if (status.startsWith("4") || status.startsWith("5")) return "text-delete";
  return "text-fg";
}

/* ================================================================== */
/* Ventana completa de Nala, animada. Decorativa.                      */
/* ================================================================== */

export function AppMockup() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (reduce || !inView) return;
    const t = setTimeout(
      () => setStep((s) => (s + 1) % SCENES.length),
      SCENES[step].ms,
    );
    return () => clearTimeout(t);
  }, [step, reduce, inView]);

  const scene: Scene = reduce
    ? { view: "Endpoints", ep: 0, stage: "response", ms: 0 }
    : SCENES[step];

  return (
    <div ref={ref}>
      <div className="flex h-[452px] flex-col overflow-hidden rounded-xl border border-border-strong bg-bg text-xs shadow-2xl shadow-black/50">
        {/* Titlebar */}
        <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-2.5">
          <span className="h-3 w-3 rounded-full bg-delete/80" />
          <span className="h-3 w-3 rounded-full bg-post/80" />
          <span className="h-3 w-3 rounded-full bg-get/80" />
          <span className="ml-2 font-mono text-xs text-fg-faint">Nala</span>
        </div>

        {/* Barra superior: servicio · entorno · buscador */}
        <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2">
          <span className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 font-mono text-[10px] text-fg-muted">
            <span className="text-fg-faint">▾</span> Mesero API
          </span>
          <span className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 font-mono text-[10px] text-fg-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-get" /> local
          </span>
          <div className="ml-auto flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-fg-faint">
            <Search size={11} />
            <span className="font-mono text-[10px]">Buscar…</span>
          </div>
        </div>

        {/* Pestañas de servicio */}
        <div className="flex shrink-0 gap-5 border-b border-border px-3 font-mono text-[11px]">
          {SERVICE_TABS.map((t) => {
            const active = t.label === scene.view;
            return (
              <span key={t.label} className="relative flex items-center gap-1.5 py-2">
                <span className={active ? "text-fg" : "text-fg-faint"}>{t.label}</span>
                {t.badge != null && (
                  <span className="rounded-full bg-raised px-1.5 text-[9px] text-fg-faint">
                    {t.badge}
                  </span>
                )}
                {active && (
                  <motion.span
                    layoutId="service-underline"
                    className="absolute -bottom-px left-0 right-0 h-0.5 bg-accent"
                    transition={{ type: "spring", stiffness: 360, damping: 30 }}
                  />
                )}
              </span>
            );
          })}
        </div>

        {/* Cuerpo: sidebar + área principal */}
        <div className="flex min-h-0 flex-1">
          <Sidebar scene={scene} />

          <div className="relative min-w-0 flex-1">
            <AnimatePresence mode="wait">
              {scene.view === "Endpoints" ? (
                <motion.div
                  key="endpoints"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex h-full"
                >
                  <Builder scene={scene} />
                  <ResponsePanel scene={scene} />
                </motion.div>
              ) : (
                <motion.div
                  key={scene.view}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="h-full overflow-hidden p-3"
                >
                  {scene.view === "Tipos TS" && <TypesView />}
                  {scene.view === "Diff de esquema" && <DiffView />}
                  {scene.view === "Historial" && <HistoryView />}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Paneles                                                             */
/* ================================================================== */

function Sidebar({ scene }: { scene: Scene }) {
  return (
    <div className="w-[168px] shrink-0 overflow-hidden border-r border-border bg-raised/40 p-3">
      <div className="mb-2 font-mono text-[10px] uppercase tracking-wide text-fg-faint">
        Servicios
      </div>
      <div className="mb-1 flex items-center gap-1.5 text-fg-muted">
        <span>▾</span>
        <span className="font-medium">Mesero API</span>
      </div>
      <ul className="space-y-0.5 pl-1">
        {ENDPOINTS.map((e) => {
          const active = scene.view === "Endpoints" && e.req === scene.ep;
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
  );
}

function Builder({ scene }: { scene: Scene }) {
  const req = REQS[scene.ep ?? 0];
  const stage = scene.stage ?? "response";
  const sending = stage === "sending";

  return (
    <div className="flex-1 overflow-hidden border-r border-border p-3">
      {/* URL + Enviar */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 overflow-hidden rounded-md border border-border bg-card px-2.5 py-2">
          <MethodBadge method={req.method} className="text-[11px]" />
          <AnimatePresence mode="wait">
            <motion.span
              key={req.url}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="truncate font-mono text-[11px] text-fg-muted"
            >
              <span className="text-accent">{`{{`}</span>baseUrl
              <span className="text-accent">{`}}`}</span>
              {req.url}
            </motion.span>
          </AnimatePresence>
        </div>
        <SendButton sending={sending} />
      </div>

      {/* Pestañas de petición */}
      <div className="mt-3 flex gap-4 border-b border-border pb-2 font-mono text-[11px]">
        {REQ_TABS.map((t) => {
          const active = t === req.tab;
          return (
            <span key={t} className="relative pb-1">
              <span className={active ? "text-fg" : "text-fg-faint"}>{t}</span>
              {active && (
                <motion.span
                  layoutId="req-underline"
                  className="absolute -bottom-[9px] left-0 right-0 h-0.5 bg-accent"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
            </span>
          );
        })}
      </div>

      {/* Contenido de la pestaña */}
      <div className="mt-3 min-h-[88px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={req.url}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28 }}
            className="font-mono text-[11px]"
          >
            {req.tab === "Params" ? (
              <ParamRows params={req.params!} stage={stage} />
            ) : (
              <TypeBlock
                text={req.body!}
                state={
                  stage === "select" ? "idle" : stage === "typing" ? "typing" : "done"
                }
                className="whitespace-pre text-fg-muted"
              />
            )}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {req.token && stage === "response" && (
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
  );
}

function ParamRows({
  params,
  stage,
}: {
  params: [string, string][];
  stage: Stage;
}) {
  const show = stage !== "select";
  return (
    <motion.div
      className="space-y-2"
      initial="hidden"
      animate={show ? "show" : "hidden"}
      variants={{ show: { transition: { staggerChildren: 0.25 } } }}
    >
      {params.map(([k, v], i) => (
        <motion.div
          key={k}
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
          className="flex justify-between"
        >
          <span className="text-fg-muted">{k}</span>
          <span className="text-fg-faint">
            {v}
            {stage === "typing" && i === params.length - 1 && <Caret />}
          </span>
        </motion.div>
      ))}
    </motion.div>
  );
}

function ResponsePanel({ scene }: { scene: Scene }) {
  const req = REQS[scene.ep ?? 0];
  const stage = scene.stage ?? "response";
  const sending = stage === "sending";
  const showResponse = stage === "response";

  return (
    <div className="relative w-[200px] shrink-0 overflow-hidden p-3">
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
            key={`resp-${scene.ep}`}
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
              <span className={`h-1.5 w-1.5 rounded-full ${req.status.startsWith("2") ? "bg-get" : "bg-delete"}`} />
              <span className={`font-semibold ${statusColor(req.status)}`}>{req.status}</span>
              <CountUp to={req.ms} suffix=" ms" />
              <CountUp to={Number(req.kb)} decimals={1} suffix=" KB" />
            </motion.div>

            <motion.pre
              key={`body-${scene.ep}`}
              className="mt-3 whitespace-pre font-mono text-[10px] leading-relaxed text-fg-muted"
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.06 } } }}
            >
              {req.resp.split("\n").map((line, i) => (
                <motion.div
                  key={i}
                  variants={{ hidden: { opacity: 0, x: 6 }, show: { opacity: 1, x: 0 } }}
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
  );
}

/* ---- Vistas de servicio ------------------------------------------ */

function TypesView() {
  return (
    <div className="h-full">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[11px] text-fg-muted">Tipos TS generados</span>
        <span className="rounded border border-border bg-card px-2 py-0.5 font-mono text-[10px] text-fg-faint">
          Copiar
        </span>
      </div>
      <TypeBlock
        text={TS_CODE}
        state="typing"
        cps={75}
        className="whitespace-pre font-mono text-[10px] leading-relaxed text-fg-muted"
      />
    </div>
  );
}

function DiffView() {
  return (
    <div className="h-full">
      <div className="mb-3 font-mono text-[11px] text-fg-muted">
        snapshot <span className="text-fg-faint">#7</span> → <span className="text-fg-faint">#8</span>
      </div>
      <motion.ul
        className="space-y-2 font-mono text-[11px]"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.18 } } }}
      >
        {DIFF_ROWS.map((r, i) => (
          <motion.li
            key={i}
            variants={{ hidden: { opacity: 0, x: 8 }, show: { opacity: 1, x: 0 } }}
            className="flex items-center gap-2"
          >
            <span
              className={
                r.sign === "+"
                  ? "text-get"
                  : r.sign === "-"
                    ? "text-delete"
                    : "text-post"
              }
            >
              {r.sign}
            </span>
            <span className="text-fg-muted">{r.text}</span>
            {r.breaking && (
              <span className="rounded-full border border-delete/30 bg-delete/10 px-1.5 py-0.5 text-[9px] text-delete">
                breaking
              </span>
            )}
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}

function HistoryView() {
  return (
    <div className="h-full">
      <div className="mb-3 font-mono text-[11px] text-fg-muted">
        Historial <span className="text-fg-faint">· cabeceras de auth redactadas</span>
      </div>
      <motion.ul
        className="space-y-1.5 font-mono text-[11px]"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.14 } } }}
      >
        {HISTORY_ROWS.map((r, i) => (
          <motion.li
            key={i}
            variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
            className="flex items-center gap-3"
          >
            <span className={`w-8 font-semibold ${statusColor(r.status)}`}>{r.status}</span>
            <MethodBadge method={r.m} />
            <span className="flex-1 truncate text-fg-muted">{r.p}</span>
            <span className="text-fg-faint">{r.ms}</span>
            <span className="w-20 text-right text-fg-disabled">{r.when}</span>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}

/* ================================================================== */
/* Primitivas de animación                                             */
/* ================================================================== */

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

function Spinner() {
  return (
    <motion.span
      className="inline-block h-3 w-3 rounded-full border-[1.5px] border-fg-faint border-t-accent"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
    />
  );
}

function Caret() {
  return (
    <motion.span
      className="ml-px inline-block h-3 w-[2px] translate-y-0.5 bg-accent"
      animate={{ opacity: [1, 0] }}
      transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
    />
  );
}

/** Escribe `text` carácter a carácter (efecto de tecleo). */
function TypeBlock({
  text,
  state,
  cps = 50,
  className,
}: {
  text: string;
  state: "idle" | "typing" | "done";
  cps?: number;
  className?: string;
}) {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (state !== "typing") return;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setN(i);
      if (i >= text.length) clearInterval(id);
    }, 1000 / cps);
    return () => clearInterval(id);
  }, [state, text, cps]);

  const shown =
    state === "done" ? text : state === "typing" ? text.slice(0, n) : "";

  return (
    <pre className={className}>
      {shown}
      {state === "typing" && n < text.length && <Caret />}
    </pre>
  );
}

/** Cuenta ascendente de un número (tiempo / tamaño). */
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
