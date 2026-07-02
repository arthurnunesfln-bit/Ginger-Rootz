import { useState, useRef, useEffect } from "react";
import {
  Send, Mic, Check, X, Pencil, Home, MessageCircle, Package, Truck, Users,
  Wallet, Boxes, FlaskConical, Store, Calendar, Settings, Menu, ChevronRight,
  Search, AlertTriangle, TrendingUp, Clock, MapPin, Phone, Sparkles,
  ArrowLeft, CircleDollarSign, Loader2, Bell,
  LayoutGrid, List as ListIcon, PackageCheck, Leaf,
} from "lucide-react";

/* ============================== THEME ============================== */
const T = {
  bg: "#FBF3E4",
  surface: "#FFFFFF",
  surfaceAlt: "#F3E8CE",
  ink: "#2E2318",
  inkSoft: "#7A6A52",
  inkFaint: "#B3A488",
  line: "#E6D6B8",
  gold: "#D98C2B",
  goldDark: "#A96A1B",
  goldBg: "#F6E3BE",
  green: "#5B7B4F",
  greenDark: "#405A38",
  greenBg: "#E3EAD6",
  rust: "#B4502E",
  rustBg: "#F3DED2",
  blue: "#4A6FA5",
  blueBg: "#E1E8F1",
  gray: "#8A8072",
  grayBg: "#EDE7D9",
};

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
`;

/* ============================== UTILS ============================== */
const uid = () => Math.random().toString(36).slice(2, 10);

function pad2(n) { return String(n).padStart(2, "0"); }
function toISO(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function todayISO() { return toISO(new Date()); }
function addDaysISO(base, days) {
  const d = base ? new Date(base + "T00:00:00") : new Date();
  d.setDate(d.getDate() + days);
  return toISO(d);
}
function formatBRL(n) {
  const v = Number(n) || 0;
  return "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatDateBR(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}
function weekdayLabel(iso) {
  const d = new Date(iso + "T00:00:00");
  return ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"][d.getDay()];
}
function isSameMonth(iso, ref) {
  return iso && iso.slice(0, 7) === ref.slice(0, 7);
}
function daysBetween(a, b) {
  const d1 = new Date(a + "T00:00:00"), d2 = new Date(b + "T00:00:00");
  return Math.round((d2 - d1) / 86400000);
}
function relativeDayLabel(iso) {
  const diff = daysBetween(todayISO(), iso);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Amanhã";
  if (diff === -1) return "Ontem";
  if (diff < 0) return `${formatDateBR(iso)} (atrasado)`;
  return formatDateBR(iso);
}

/* ============================== CONSTANTS ============================== */
const ORDER_STATUSES = [
  "Pedido recebido", "Aguardando produção", "Pronto", "Saiu para entrega",
  "Entregue", "Aguardando pagamento", "Pago", "Cancelado",
];
const OPEN_STATUSES = ORDER_STATUSES.filter(s => s !== "Pago" && s !== "Cancelado");
const EXPENSE_CATEGORIES = [
  "Ingredientes", "Embalagens", "Transporte", "Divulgação",
  "Equipamentos", "Higiene e limpeza", "Taxas", "Outras despesas",
];
const RESELLER_MODELS = ["Venda direta", "Consignação", "Comissão por unidade", "Reposição recorrente"];
const PAYMENT_METHODS = ["Pix", "Dinheiro", "Cartão", "Transferência"];

function statusStyle(status) {
  const map = {
    "Pedido recebido": { bg: T.goldBg, fg: T.goldDark },
    "Aguardando produção": { bg: T.grayBg, fg: T.gray },
    "Pronto": { bg: T.blueBg, fg: T.blue },
    "Saiu para entrega": { bg: T.blueBg, fg: T.blue },
    "Entregue": { bg: T.greenBg, fg: T.greenDark },
    "Aguardando pagamento": { bg: T.rustBg, fg: T.rust },
    "Pago": { bg: T.greenBg, fg: T.greenDark },
    "Cancelado": { bg: T.grayBg, fg: T.gray },
  };
  return map[status] || { bg: T.grayBg, fg: T.gray };
}

const NAV_ITEMS = [
  { id: "assistente", label: "Assistente", icon: MessageCircle },
  { id: "dashboard", label: "Início", icon: Home },
  { id: "pedidos", label: "Pedidos", icon: Package },
  { id: "entregas", label: "Entregas", icon: Truck },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "financeiro", label: "Financeiro", icon: Wallet },
  { id: "estoque", label: "Estoque", icon: Boxes },
  { id: "producao", label: "Produção", icon: FlaskConical },
  { id: "revendedores", label: "Revendedores", icon: Store },
  { id: "agenda", label: "Agenda", icon: Calendar },
  { id: "config", label: "Configurações", icon: Settings },
];
const MOBILE_PRIMARY = ["assistente", "dashboard", "pedidos", "agenda"];
const STORAGE_KEY = "ginger-assistant-data-v1";

/* ============================== DEMO DATA ============================== */
function buildDemoData() {
  const clients = [
    { id: "c1", name: "Paula", phone: "(48) 99111-2233", address: "Rua das Palmeiras, 120", neighborhood: "Trindade", notes: "Prefere entrega à tarde", preferredProducts: ["Ginger Tradicional"] },
    { id: "c2", name: "Ana", phone: "(48) 99222-3344", address: "Av. Beira Mar, 500", neighborhood: "Centro", notes: "", preferredProducts: ["Ginger com Hibisco"] },
    { id: "c3", name: "Lucas", phone: "(48) 99333-4455", address: "Rua Bocaiúva, 78", neighborhood: "Centro", notes: "Compra para eventos", preferredProducts: ["Ginger Tradicional", "Ginger com Hibisco"] },
  ];

  const products = [
    { id: "p1", name: "Ginger Tradicional", size: "290ml", price: 15, cost: 6, stock: 42, minStock: 15 },
    { id: "p2", name: "Ginger com Hibisco", size: "290ml", price: 17, cost: 7, stock: 18, minStock: 15 },
  ];

  const insumos = [
    { id: "i1", name: "Gengibre", unit: "kg", qty: 8, minStock: 3, lastCost: 12, supplier: "Feira do Produtor" },
    { id: "i2", name: "Açúcar", unit: "kg", qty: 14, minStock: 5, lastCost: 6, supplier: "Atacadão" },
    { id: "i3", name: "Limão", unit: "kg", qty: 2, minStock: 4, lastCost: 8, supplier: "Feira do Produtor" },
    { id: "i4", name: "Hibisco", unit: "kg", qty: 1.2, minStock: 1, lastCost: 40, supplier: "Empório Natural" },
    { id: "i5", name: "Garrafas 290ml", unit: "un", qty: 120, minStock: 50, lastCost: 1.2, supplier: "Vidros SC" },
    { id: "i6", name: "Tampas", unit: "un", qty: 150, minStock: 50, lastCost: 0.3, supplier: "Vidros SC" },
    { id: "i7", name: "Rótulos", unit: "un", qty: 90, minStock: 50, lastCost: 0.5, supplier: "Gráfica Local" },
  ];

  const orders = [
    { id: "o1", clientId: "c1", date: addDaysISO(null, -10), items: [{ product: "Ginger Tradicional", qty: 8, unitPrice: 15 }], discount: 0, deliveryDate: addDaysISO(null, -10), deliveryTime: "15:00", deliveryAddress: "Rua das Palmeiras, 120", paymentMethod: "Pix", notes: "", status: "Pago", paidValue: 120 },
    { id: "o2", clientId: "c2", date: addDaysISO(null, -5), items: [{ product: "Ginger com Hibisco", qty: 6, unitPrice: 17 }], discount: 0, deliveryDate: addDaysISO(null, 1), deliveryTime: "10:00", deliveryAddress: "Av. Beira Mar, 500", paymentMethod: null, notes: "", status: "Pronto", paidValue: 0 },
    { id: "o3", clientId: "c3", date: addDaysISO(null, -3), items: [{ product: "Ginger Tradicional", qty: 10, unitPrice: 15 }, { product: "Ginger com Hibisco", qty: 5, unitPrice: 17 }], discount: 0, deliveryDate: addDaysISO(null, 0), deliveryTime: "17:00", deliveryAddress: "Rua Bocaiúva, 78", paymentMethod: null, notes: "Evento de aniversário", status: "Saiu para entrega", paidValue: 0 },
    { id: "o4", clientId: "c1", date: addDaysISO(null, -1), items: [{ product: "Ginger Tradicional", qty: 4, unitPrice: 15 }], discount: 0, deliveryDate: addDaysISO(null, 2), deliveryTime: null, deliveryAddress: "Rua das Palmeiras, 120", paymentMethod: null, notes: "", status: "Aguardando produção", paidValue: 0 },
    { id: "o5", clientId: "c2", date: addDaysISO(null, -20), items: [{ product: "Ginger com Hibisco", qty: 12, unitPrice: 17 }], discount: 0, deliveryDate: addDaysISO(null, -18), deliveryTime: "14:00", deliveryAddress: "Av. Beira Mar, 500", paymentMethod: "Dinheiro", notes: "", status: "Pago", paidValue: 204 },
    { id: "o6", clientId: "c3", date: addDaysISO(null, -30), items: [{ product: "Ginger Tradicional", qty: 6, unitPrice: 15 }], discount: 0, deliveryDate: addDaysISO(null, -28), deliveryTime: "11:00", deliveryAddress: "Rua Bocaiúva, 78", paymentMethod: "Pix", notes: "", status: "Pago", paidValue: 90 },
    { id: "o7", clientId: "c2", date: addDaysISO(null, -2), items: [{ product: "Ginger Tradicional", qty: 3, unitPrice: 15 }], discount: 0, deliveryDate: addDaysISO(null, -2), deliveryTime: "16:00", deliveryAddress: "Av. Beira Mar, 500", paymentMethod: null, notes: "", status: "Aguardando pagamento", paidValue: 0 },
  ];

  const expenses = [
    { id: "e1", date: addDaysISO(null, -8), description: "Gengibre na feira", category: "Ingredientes", value: 45, supplier: "Feira do Produtor", paymentMethod: "Dinheiro" },
    { id: "e2", date: addDaysISO(null, -6), description: "Garrafas e tampas", category: "Embalagens", value: 180, supplier: "Vidros SC", paymentMethod: "Pix" },
    { id: "e3", date: addDaysISO(null, -3), description: "Combustível para entregas", category: "Transporte", value: 60, supplier: null, paymentMethod: "Dinheiro" },
    { id: "e4", date: addDaysISO(null, -15), description: "Anúncio no Instagram", category: "Divulgação", value: 50, supplier: "Meta Ads", paymentMethod: "Cartão" },
  ];

  const reminders = [
    { id: "r1", text: "Visitar Café da Praça", date: addDaysISO(null, 5), relatedTo: "Café da Praça", done: false },
    { id: "r2", text: "Cobrar pagamento da Ana", date: addDaysISO(null, 1), relatedTo: "Ana", done: false },
    { id: "r3", text: "Comprar limão — estoque baixo", date: addDaysISO(null, 0), relatedTo: "Insumos", done: false },
  ];

  const resellers = [
    { id: "res1", name: "Café da Praça", contact: "Marcos", phone: "(48) 99555-6677", address: "Praça XV, 45", neighborhood: "Centro", model: "Consignação", resalePrice: 12, suggestedPrice: 18, commission: 4, lastDelivery: addDaysISO(null, -10), nextVisit: addDaysISO(null, 5), stockThere: 14, amountDue: 96, notes: "Reposição a cada duas semanas" },
  ];

  const productionLots = [
    { id: "l1", code: "L-2026-014", product: "Ginger Tradicional", startDate: addDaysISO(null, -6), volume: "20L", forecastBottling: addDaysISO(null, 1), bottlingDate: null, bottlesForecast: 68, bottlesProduced: null, expiry: null, status: "Em fermentação" },
    { id: "l2", code: "L-2026-013", product: "Ginger com Hibisco", startDate: addDaysISO(null, -12), volume: "15L", forecastBottling: addDaysISO(null, -2), bottlingDate: addDaysISO(null, -2), bottlesForecast: 34, bottlesProduced: 34, expiry: addDaysISO(null, 58), status: "Finalizado" },
  ];

  return { clients, products, insumos, orders, expenses, reminders, resellers, productionLots };
}

/* ============================== AGGREGATIONS ============================== */
function clientById(clients, id) { return clients.find(c => c.id === id); }

function clientStats(clientId, orders) {
  const list = orders.filter(o => o.clientId === clientId && o.status !== "Cancelado");
  const totalQty = list.reduce((s, o) => s + o.items.reduce((a, i) => a + i.qty, 0), 0);
  const totalValue = list.reduce((s, o) => s + orderTotal(o), 0);
  const last = list.reduce((max, o) => (!max || o.date > max ? o.date : max), null);
  const pending = list.filter(o => o.status === "Aguardando pagamento").reduce((s, o) => s + (orderTotal(o) - (o.paidValue || 0)), 0);
  return { totalQty, totalValue, lastPurchase: last, pending, orderCount: list.length };
}

function orderTotal(o) {
  return o.items.reduce((s, i) => s + i.qty * i.unitPrice, 0) - (o.discount || 0);
}

function financeSummary(orders, expenses, monthOnly) {
  const ref = todayISO();
  const relevantOrders = orders.filter(o => o.status !== "Cancelado" && (!monthOnly || isSameMonth(o.date, ref)));
  const relevantExpenses = expenses.filter(e => !monthOnly || isSameMonth(e.date, ref));
  const income = relevantOrders.reduce((s, o) => {
    if (o.status === "Pago") return s + orderTotal(o);
    if (o.status === "Aguardando pagamento") return s + (o.paidValue || 0);
    return s;
  }, 0);
  const sales = relevantOrders.reduce((s, o) => s + orderTotal(o), 0);
  const spent = relevantExpenses.reduce((s, e) => s + e.value, 0);
  const pending = orders.filter(o => o.status === "Aguardando pagamento").reduce((s, o) => s + (orderTotal(o) - (o.paidValue || 0)), 0);
  return { income, sales, spent, balance: income - spent, pending };
}

function expensesByCategory(expenses) {
  const map = {};
  for (const e of expenses) map[e.category] = (map[e.category] || 0) + e.value;
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}

function topProducts(orders) {
  const map = {};
  for (const o of orders) {
    if (o.status === "Cancelado") continue;
    for (const i of o.items) map[i.product] = (map[i.product] || 0) + i.qty;
  }
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}

function topClients(orders, clients) {
  const map = {};
  for (const o of orders) {
    if (o.status === "Cancelado") continue;
    map[o.clientId] = (map[o.clientId] || 0) + orderTotal(o);
  }
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([id, val]) => ({ client: clientById(clients, id), value: val }));
}

function weeklySales(orders) {
  const weeks = [];
  for (let w = 3; w >= 0; w--) {
    const end = addDaysISO(null, -7 * w);
    const start = addDaysISO(end, -6);
    const total = orders
      .filter(o => o.status !== "Cancelado" && o.date >= start && o.date <= end)
      .reduce((s, o) => s + orderTotal(o), 0);
    weeks.push({ label: `${formatDateBR(start).slice(0, 5)}`, total });
  }
  return weeks;
}

/* ============================== SMALL UI ATOMS ============================== */
function Badge({ children, bg, fg, style }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap"
      style={{ backgroundColor: bg, color: fg, fontFamily: "Inter, sans-serif", ...style }}
    >
      {children}
    </span>
  );
}

function Card({ children, className = "", style, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border ${className}`}
      style={{ backgroundColor: T.surface, borderColor: T.line, ...style }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ eyebrow, title, action }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        {eyebrow && (
          <div className="text-xs font-semibold tracking-wide uppercase mb-1" style={{ color: T.gold, fontFamily: "Inter, sans-serif" }}>
            {eyebrow}
          </div>
        )}
        <h2 style={{ fontFamily: "Fraunces, serif", color: T.ink, fontSize: 22, fontWeight: 600 }}>{title}</h2>
      </div>
      {action}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, accent = T.gold, accentBg = T.goldBg, sub }) {
  return (
    <Card className="p-4 flex flex-col gap-2 shrink-0" style={{ minWidth: 150 }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: T.inkSoft, fontFamily: "Inter, sans-serif" }}>{label}</span>
        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: accentBg }}>
          <Icon size={14} style={{ color: accent }} />
        </div>
      </div>
      <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 20, fontWeight: 600, color: T.ink }}>{value}</div>
      {sub && <div className="text-xs" style={{ color: T.inkFaint, fontFamily: "Inter, sans-serif" }}>{sub}</div>}
    </Card>
  );
}

function EmptyState({ icon: Icon, title, text }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: T.goldBg }}>
        <Icon size={22} style={{ color: T.goldDark }} />
      </div>
      <div style={{ fontFamily: "Fraunces, serif", fontSize: 17, color: T.ink, fontWeight: 600 }}>{title}</div>
      <div className="text-sm mt-1 max-w-xs" style={{ color: T.inkSoft, fontFamily: "Inter, sans-serif" }}>{text}</div>
    </div>
  );
}

function Avatar({ name, size = 38 }) {
  const initials = (name || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const colors = [T.gold, T.green, T.blue, T.rust];
  const idx = (name || "").length % colors.length;
  return (
    <div
      className="rounded-full flex items-center justify-center font-semibold shrink-0"
      style={{ width: size, height: size, backgroundColor: colors[idx] + "22", color: colors[idx], fontFamily: "Fraunces, serif", fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}

/* ============================== NAVIGATION ============================== */
function Sidebar({ active, onSelect }) {
  return (
    <div
      className="hidden md:flex flex-col w-60 shrink-0 h-screen sticky top-0 border-r px-4 py-6"
      style={{ backgroundColor: T.surface, borderColor: T.line }}
    >
      <div className="flex items-center gap-2 px-2 mb-8">
        <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: T.gold }}>
          <Leaf size={18} color="#fff" />
        </div>
        <div>
          <div style={{ fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 16, color: T.ink }}>Ginger Assistant</div>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: T.inkFaint }}>Ginger Rootz</div>
        </div>
      </div>
      <nav className="flex flex-col gap-1 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const isActive = active === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left"
              style={{
                backgroundColor: isActive ? T.goldBg : "transparent",
                color: isActive ? T.goldDark : T.inkSoft,
                fontFamily: "Inter, sans-serif",
              }}
            >
              <Icon size={17} />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="mt-auto pt-4 px-2 text-xs italic" style={{ color: T.inkFaint, fontFamily: "Fraunces, serif" }}>
        "Você cuida do seu produto.<br/>O assistente organiza o resto."
      </div>
    </div>
  );
}

function BottomNav({ active, onSelect, onMore }) {
  const items = NAV_ITEMS.filter(n => MOBILE_PRIMARY.includes(n.id));
  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 border-t flex items-stretch z-30"
      style={{ backgroundColor: T.surface, borderColor: T.line }}
    >
      {items.map(item => {
        const isActive = active === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2"
            style={{ color: isActive ? T.goldDark : T.inkFaint }}
          >
            <Icon size={19} />
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 500 }}>{item.label}</span>
          </button>
        );
      })}
      <button onClick={onMore} className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2" style={{ color: T.inkFaint }}>
        <Menu size={19} />
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 500 }}>Mais</span>
      </button>
    </div>
  );
}

function MoreSheet({ onSelect, onClose }) {
  const items = NAV_ITEMS.filter(n => !MOBILE_PRIMARY.includes(n.id));
  return (
    <div className="md:hidden fixed inset-0 z-40 flex items-end" onClick={onClose}>
      <div className="absolute inset-0" style={{ backgroundColor: "rgba(46,35,24,0.4)" }} />
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full rounded-t-3xl p-5 pb-8"
        style={{ backgroundColor: T.surface }}
      >
        <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: T.line }} />
        <div className="grid grid-cols-3 gap-3">
          {items.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => { onSelect(item.id); onClose(); }}
                className="flex flex-col items-center gap-2 py-3 rounded-2xl"
                style={{ backgroundColor: T.bg }}
              >
                <Icon size={19} style={{ color: T.goldDark }} />
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11.5, color: T.ink, fontWeight: 500 }}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================== CONFIRMATION CARD ============================== */
function confirmationFields(intent, dados, ctx) {
  switch (intent) {
    case "criar_pedido": {
      const total = (dados.itens || []).reduce((s, i) => s + i.quantidade * i.preco_unitario, 0) - (dados.desconto || 0);
      return {
        title: "Novo pedido",
        rows: [
          ["Cliente", dados.cliente],
          ["Produto(s)", (dados.itens || []).map(i => `${i.quantidade}x ${i.produto} — ${formatBRL(i.preco_unitario)}`).join(" · ")],
          ["Valor total", formatBRL(total)],
          ["Data da entrega", dados.data_entrega ? formatDateBR(dados.data_entrega) : "A combinar"],
          dados.endereco_entrega ? ["Endereço", dados.endereco_entrega] : null,
          dados.forma_pagamento ? ["Forma de pagamento", dados.forma_pagamento] : null,
          ["Status", "Pedido recebido"],
        ].filter(Boolean),
      };
    }
    case "registrar_entrega": {
      const map = { integral: "Pago integralmente", ja_pago: "Já estava pago", parcial: "Pagamento parcial", pendente: "Ainda não foi pago" };
      return {
        title: "Confirmar entrega",
        rows: [
          ["Cliente", dados.cliente],
          ["Situação do pagamento", map[dados.status_pagamento] || dados.status_pagamento],
          dados.status_pagamento === "parcial" ? ["Valor pago", formatBRL(dados.valor_pago || 0)] : null,
        ].filter(Boolean),
      };
    }
    case "registrar_pagamento":
      return {
        title: "Registrar pagamento",
        rows: [
          ["Cliente", dados.cliente],
          ["Valor", dados.valor ? formatBRL(dados.valor) : "Valor total do pedido"],
          ["Forma de pagamento", dados.forma_pagamento || "Não informado"],
        ],
      };
    case "registrar_despesa":
      return {
        title: "Nova despesa",
        rows: [
          ["Descrição", dados.descricao],
          ["Categoria", dados.categoria || "Outras despesas"],
          ["Valor", formatBRL(dados.valor)],
          dados.fornecedor ? ["Fornecedor", dados.fornecedor] : null,
          ["Forma de pagamento", dados.forma_pagamento || "Não informado"],
        ].filter(Boolean),
      };
    case "registrar_compra_insumo":
      return {
        title: "Compra de insumo",
        rows: [
          ["Insumo", dados.insumo],
          ["Quantidade", `${dados.quantidade} ${dados.unidade || ""}`],
          ["Valor", formatBRL(dados.valor)],
          dados.fornecedor ? ["Fornecedor", dados.fornecedor] : null,
        ].filter(Boolean),
      };
    case "criar_lembrete":
      return {
        title: "Novo lembrete",
        rows: [
          ["Lembrete", dados.texto],
          ["Data", formatDateBR(dados.data)],
          dados.relacionado_a ? ["Relacionado a", dados.relacionado_a] : null,
        ].filter(Boolean),
      };
    case "criar_cliente":
      return {
        title: "Novo cliente",
        rows: [
          ["Nome", dados.nome],
          dados.telefone ? ["Telefone", dados.telefone] : null,
          dados.endereco ? ["Endereço", dados.endereco] : null,
        ].filter(Boolean),
      };
    case "registrar_consignacao":
      return {
        title: "Ponto de revenda / Consignação",
        rows: [
          ["Estabelecimento", dados.estabelecimento],
          ["Produto", dados.produto || "Ginger Tradicional"],
          ["Quantidade entregue", `${dados.quantidade} garrafas`],
          ["Preço de revenda", formatBRL(dados.preco_revenda)],
          dados.preco_sugerido ? ["Preço sugerido ao consumidor", formatBRL(dados.preco_sugerido)] : null,
          dados.comissao_unidade ? ["Comissão por unidade", formatBRL(dados.comissao_unidade)] : null,
          dados.data_proxima_visita ? ["Próxima visita", formatDateBR(dados.data_proxima_visita)] : null,
        ].filter(Boolean),
      };
    default:
      return { title: "Confirmação", rows: [] };
  }
}

function ConfirmCard({ intent, dados, onConfirm, onCorrect, onCancel }) {
  const { title, rows } = confirmationFields(intent, dados);
  return (
    <div
      className="rounded-2xl border overflow-hidden mt-2 max-w-sm"
      style={{ backgroundColor: T.surface, borderColor: T.goldBg, borderWidth: 1.5 }}
    >
      <div className="px-4 py-2.5 flex items-center gap-2" style={{ backgroundColor: T.goldBg }}>
        <Sparkles size={14} style={{ color: T.goldDark }} />
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12.5, fontWeight: 600, color: T.goldDark }}>{title}</span>
      </div>
      <div className="px-4 py-3 flex flex-col gap-2">
        {rows.map(([label, value], i) => (
          <div key={i} className="flex justify-between gap-4 text-sm">
            <span style={{ color: T.inkSoft, fontFamily: "Inter, sans-serif" }}>{label}</span>
            <span style={{ color: T.ink, fontFamily: "Inter, sans-serif", fontWeight: 500, textAlign: "right" }}>{value}</span>
          </div>
        ))}
      </div>
      <div className="px-3 pb-3 flex gap-2">
        <button
          onClick={onConfirm}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold"
          style={{ backgroundColor: T.green, color: "#fff", fontFamily: "Inter, sans-serif" }}
        >
          <Check size={15} /> Confirmar
        </button>
        <button
          onClick={onCorrect}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-sm font-medium"
          style={{ backgroundColor: T.goldBg, color: T.goldDark, fontFamily: "Inter, sans-serif" }}
        >
          <Pencil size={14} /> Corrigir
        </button>
        <button
          onClick={onCancel}
          className="flex items-center justify-center py-2 px-3 rounded-xl text-sm font-medium"
          style={{ backgroundColor: T.grayBg, color: T.gray, fontFamily: "Inter, sans-serif" }}
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}

/* ============================== ASSISTANT SYSTEM PROMPT ============================== */
function buildSystemPrompt(state) {
  const clientNames = state.clients.map(c => c.name).join(", ");
  const productNames = state.products.map(p => `${p.name} (${formatBRL(p.price)})`).join(", ");
  const insumoNames = state.insumos.map(i => i.name).join(", ");
  const resellerNames = state.resellers.map(r => r.name).join(", ") || "nenhum cadastrado ainda";
  const today = todayISO();

  return `Você é o motor de interpretação de linguagem natural do "Ginger Assistant", um app de gestão para uma microempresa de bebida fermentada artesanal de gengibre (Ginger Rootz). A usuária conversa em português informal, como se estivesse no WhatsApp, e você deve transformar cada mensagem em um registro estruturado.

DATA DE HOJE: ${today} (use isso para resolver datas relativas como "amanhã", "dia 8", "daqui a sete dias" — sempre devolva datas absolutas no formato YYYY-MM-DD).
CLIENTES JÁ CADASTRADOS: ${clientNames || "nenhum"}
PRODUTOS: ${productNames}
INSUMOS CADASTRADOS: ${insumoNames}
PONTOS DE REVENDA: ${resellerNames}

Responda SEMPRE e SOMENTE com um objeto JSON válido, sem texto antes ou depois, sem crases, sem markdown. Formato:

{
  "intent": "criar_pedido | registrar_entrega | registrar_pagamento | registrar_despesa | registrar_compra_insumo | criar_lembrete | criar_cliente | registrar_consignacao | consultar_vendas | consultar_despesas | consultar_estoque | consultar_pagamentos_pendentes | consultar_agenda | resumo_diario | conversa_geral",
  "status": "completo | faltando_info | consulta",
  "pergunta": "pergunta objetiva e curta, ou null",
  "dados": { ...campos dependendo da intenção, ou {} },
  "consulta_params": { "periodo": "hoje|semana|mes|total", "categoria": null, "cliente": null } ou null,
  "resposta_livre": "usada só para intent conversa_geral, ou null"
}

Regras:
- Se faltar uma informação ESSENCIAL (ex: preço, quantidade, cliente), status = "faltando_info" e faça só UMA pergunta curta e objetiva no campo "pergunta". Não pergunte várias coisas de uma vez.
- Se a mensagem já tem tudo que precisa para a intenção, status = "completo".
- Se for uma pergunta/consulta (ex: "quanto vendi hoje?"), status = "consulta" e preencha "consulta_params"; não invente números, apenas identifique o que a usuária quer saber.
- Para "criar_pedido", dados = { cliente, itens: [{produto, quantidade, preco_unitario}], data_entrega, horario_entrega, endereco_entrega, forma_pagamento, desconto, observacoes }.
- Para "registrar_entrega", dados = { cliente, status_pagamento: "integral|ja_pago|parcial|pendente", valor_pago }.
- Para "registrar_pagamento", dados = { cliente, valor, forma_pagamento, tipo: "integral|parcial" }.
- Para "registrar_despesa", dados = { descricao, categoria (uma de: Ingredientes, Embalagens, Transporte, Divulgação, Equipamentos, Higiene e limpeza, Taxas, Outras despesas), valor, fornecedor, forma_pagamento, data }.
- Para "registrar_compra_insumo", dados = { insumo, quantidade, unidade, valor, fornecedor }.
- Para "criar_lembrete", dados = { texto, data (YYYY-MM-DD resolvida), relacionado_a }.
- Para "criar_cliente", dados = { nome, telefone, endereco }.
- Para "registrar_consignacao", dados = { estabelecimento, produto, quantidade, preco_revenda, preco_sugerido, comissao_unidade, data_proxima_visita }.
- Use os nomes de clientes e produtos já cadastrados quando a mensagem se referir a eles, mesmo com pequenas variações de grafia.
- Nunca faça contas finais de dinheiro, apenas extraia os valores; o app calcula os totais.
- Para conversa_geral (saudações, agradecimentos, perguntas fora do escopo), responda de forma breve e acolhedora em "resposta_livre".

Exemplos:
Usuária: "A cliente Paula pediu oito garrafas tradicionais por 15 reais cada. Vou entregar no dia 8 na casa dela."
{"intent":"criar_pedido","status":"completo","pergunta":null,"dados":{"cliente":"Paula","itens":[{"produto":"Ginger Tradicional","quantidade":8,"preco_unitario":15}],"data_entrega":"${today.slice(0,8)}08","horario_entrega":null,"endereco_entrega":"casa dela","forma_pagamento":null,"desconto":0,"observacoes":null},"consulta_params":null,"resposta_livre":null}

Usuária: "Hoje comprei dois quilos de açúcar por 12 reais."
{"intent":"registrar_compra_insumo","status":"completo","pergunta":null,"dados":{"insumo":"Açúcar","quantidade":2,"unidade":"kg","valor":12,"fornecedor":null},"consulta_params":null,"resposta_livre":null}

Usuária: "Entreguei as oito garrafas da Paula e ela pagou por Pix."
{"intent":"registrar_entrega","status":"completo","pergunta":null,"dados":{"cliente":"Paula","status_pagamento":"integral","valor_pago":null},"consulta_params":null,"resposta_livre":null}

Usuária: "Me lembra de falar com o Café da Praça daqui a sete dias."
{"intent":"criar_lembrete","status":"completo","pergunta":null,"dados":{"texto":"Falar com o Café da Praça","data":"${addDaysISO(today,7)}","relacionado_a":"Café da Praça"},"consulta_params":null,"resposta_livre":null}

Usuária: "Quanto vendi hoje?"
{"intent":"consultar_vendas","status":"consulta","pergunta":null,"dados":{},"consulta_params":{"periodo":"hoje","categoria":null,"cliente":null},"resposta_livre":null}`;
}

/* ============================== ASSISTANT SCREEN ============================== */
const SUGGESTIONS = [
  "A Paula pediu 8 garrafas tradicionais por 15 reais para entregar dia 8",
  "Hoje comprei 2kg de açúcar por 12 reais",
  "Quanto vendi neste mês?",
  "Quem ainda está me devendo?",
  "Me lembra de ligar pro Café da Praça em 7 dias",
];

function ChatBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div className={`flex gap-2 max-w-[85%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        {!isUser && (
          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1" style={{ backgroundColor: T.gold }}>
            <Sparkles size={13} color="#fff" />
          </div>
        )}
        <div>
          <div
            className="px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line"
            style={{
              backgroundColor: isUser ? T.ink : T.surfaceAlt,
              color: isUser ? "#fff" : T.ink,
              borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {msg.text}
          </div>
          {msg.card && !msg.card.resolved && (
            <ConfirmCard
              intent={msg.card.intent}
              dados={msg.card.dados}
              onConfirm={() => msg.card.onConfirm()}
              onCorrect={() => msg.card.onCorrect()}
              onCancel={() => msg.card.onCancel()}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function AssistantScreen({ app }) {
  const { messages, sendMessage, isLoading, resumoDoDia } = app;
  const [text, setText] = useState("");
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length, isLoading]);

  function submit() {
    if (!text.trim() || isLoading) return;
    sendMessage(text.trim());
    setText("");
  }

  return (
    <div className="flex flex-col h-screen md:h-screen">
      <div
        className="px-5 py-4 flex items-center justify-between border-b shrink-0 relative overflow-hidden"
        style={{ backgroundColor: T.surface, borderColor: T.line }}
      >
        <div className="absolute -right-4 -top-6 w-24 h-24 rounded-full opacity-[0.06]" style={{ backgroundColor: T.gold }} />
        <div className="absolute right-10 top-3 w-8 h-8 rounded-full opacity-[0.08]" style={{ backgroundColor: T.green }} />
        <div className="flex items-center gap-3 relative">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: T.gold }}>
            <Sparkles size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16, color: T.ink }}>Assistente Ginger</div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11.5, color: T.inkFaint }}>
              {isLoading ? "digitando..." : "online"}
            </div>
          </div>
        </div>
        <button
          onClick={resumoDoDia}
          className="text-xs font-medium px-3 py-2 rounded-xl flex items-center gap-1.5 relative"
          style={{ backgroundColor: T.goldBg, color: T.goldDark, fontFamily: "Inter, sans-serif" }}
        >
          <Bell size={13} /> Resumo do dia
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ backgroundColor: T.bg }}>
        {messages.length === 0 && (
          <div className="mt-6">
            <EmptyState icon={MessageCircle} title="Conte o que aconteceu no seu negócio" text="Fale como se estivesse mandando mensagem no WhatsApp. Eu cuido de organizar tudo." />
            <div className="flex flex-wrap gap-2 justify-center px-4">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  className="text-xs px-3 py-2 rounded-full border"
                  style={{ borderColor: T.line, color: T.inkSoft, fontFamily: "Inter, sans-serif", backgroundColor: T.surface }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map(msg => <ChatBubble key={msg.id} msg={msg} />)}
        {isLoading && (
          <div className="flex justify-start mb-3">
            <div className="flex gap-2 items-center px-4 py-2.5 rounded-2xl" style={{ backgroundColor: T.surfaceAlt }}>
              <Loader2 size={14} className="animate-spin" style={{ color: T.goldDark }} />
              <span className="text-xs" style={{ color: T.inkSoft, fontFamily: "Inter, sans-serif" }}>pensando...</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="px-3 py-3 border-t shrink-0 pb-safe" style={{ backgroundColor: T.surface, borderColor: T.line }}>
        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") submit(); }}
            placeholder="Escreva sua mensagem..."
            className="flex-1 px-4 py-3 rounded-full text-sm outline-none border"
            style={{ backgroundColor: T.bg, borderColor: T.line, color: T.ink, fontFamily: "Inter, sans-serif" }}
          />
          <button
            onClick={() => sendMessage("(gravação de áudio) — em breve você poderá falar em vez de digitar")}
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: T.goldBg, color: T.goldDark }}
            title="Gravação de áudio — em breve"
          >
            <Mic size={17} />
          </button>
          <button
            onClick={submit}
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: T.gold, color: "#fff" }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================== DASHBOARD ============================== */
function DashboardScreen({ app }) {
  const { orders, expenses, clients, products, reminders } = app;
  const fin = financeSummary(orders, expenses, true);
  const openOrders = orders.filter(o => OPEN_STATUSES.includes(o.status)).length;
  const todayDeliveries = orders.filter(o => o.deliveryDate === todayISO() && !["Entregue","Pago","Cancelado"].includes(o.status));
  const pendingPayments = orders.filter(o => o.status === "Aguardando pagamento");
  const totalStock = products.reduce((s, p) => s + p.stock, 0);
  const upcoming = [...reminders].filter(r => !r.done).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
  const weeks = weeklySales(orders);
  const maxWeek = Math.max(1, ...weeks.map(w => w.total));
  const tProducts = topProducts(orders).slice(0, 3);
  const tClients = topClients(orders, clients).slice(0, 3);

  return (
    <div className="px-5 py-6 max-w-5xl mx-auto pb-24 md:pb-10">
      <SectionTitle eyebrow="Painel" title="Bom dia! Aqui está o seu negócio hoje" />

      <div className="flex gap-3 overflow-x-auto pb-2 mb-6 -mx-1 px-1">
        <StatCard label="Vendas no mês" value={formatBRL(fin.sales)} icon={TrendingUp} accent={T.green} accentBg={T.greenBg} />
        <StatCard label="Despesas no mês" value={formatBRL(fin.spent)} icon={Wallet} accent={T.rust} accentBg={T.rustBg} />
        <StatCard label="Saldo estimado" value={formatBRL(fin.balance)} icon={CircleDollarSign} accent={T.gold} accentBg={T.goldBg} />
        <StatCard label="Pedidos em aberto" value={openOrders} icon={Package} accent={T.blue} accentBg={T.blueBg} />
        <StatCard label="Entregas hoje" value={todayDeliveries.length} icon={Truck} accent={T.blue} accentBg={T.blueBg} />
        <StatCard label="Pagamentos pendentes" value={formatBRL(fin.pending)} icon={AlertTriangle} accent={T.rust} accentBg={T.rustBg} />
        <StatCard label="Garrafas em estoque" value={totalStock} icon={Boxes} accent={T.green} accentBg={T.greenBg} />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <Card className="p-5">
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: T.ink }} className="mb-4">Vendas por semana</div>
          <div className="flex items-end gap-3 h-28">
            {weeks.map((w, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div
                  className="w-full rounded-t-lg"
                  style={{ height: `${Math.max(6, (w.total / maxWeek) * 90)}px`, backgroundColor: i === 3 ? T.gold : T.goldBg }}
                />
                <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 10, color: T.inkFaint }}>{w.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: T.ink }} className="mb-3">Próximos compromissos</div>
          {upcoming.length === 0 && <div className="text-sm" style={{ color: T.inkFaint }}>Nenhum compromisso pendente.</div>}
          <div className="flex flex-col gap-2.5">
            {upcoming.map(r => (
              <div key={r.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: T.goldBg }}>
                  <Clock size={13} style={{ color: T.goldDark }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate" style={{ color: T.ink, fontFamily: "Inter, sans-serif" }}>{r.text}</div>
                  <div className="text-xs" style={{ color: T.inkFaint, fontFamily: "Inter, sans-serif" }}>{relativeDayLabel(r.date)}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5">
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: T.ink }} className="mb-3">Produtos mais vendidos</div>
          <div className="flex flex-col gap-2">
            {tProducts.map(([name, qty], i) => (
              <div key={i} className="flex justify-between text-sm">
                <span style={{ color: T.ink, fontFamily: "Inter, sans-serif" }}>{name}</span>
                <span style={{ color: T.inkSoft, fontFamily: "IBM Plex Mono, monospace" }}>{qty} un</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: T.ink }} className="mb-3">Clientes que mais compraram</div>
          <div className="flex flex-col gap-2">
            {tClients.map((tc, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span style={{ color: T.ink, fontFamily: "Inter, sans-serif" }}>{tc.client?.name}</span>
                <span style={{ color: T.inkSoft, fontFamily: "IBM Plex Mono, monospace" }}>{formatBRL(tc.value)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ============================== CLIENTS ============================== */
function ClientsScreen({ app }) {
  const { clients, orders, setActiveClient, startChatAction } = app;
  const [q, setQ] = useState("");
  const filtered = clients.filter(c => c.name.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q));

  return (
    <div className="px-5 py-6 max-w-3xl mx-auto pb-24 md:pb-10">
      <SectionTitle eyebrow="Pessoas" title="Clientes" />
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: T.inkFaint }} />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Buscar por nome ou telefone"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none border"
          style={{ backgroundColor: T.surface, borderColor: T.line, fontFamily: "Inter, sans-serif" }}
        />
      </div>
      <div className="flex flex-col gap-2.5">
        {filtered.map(c => {
          const stats = clientStats(c.id, orders);
          return (
            <Card key={c.id} className="p-4 flex items-center gap-3 cursor-pointer" onClick={() => setActiveClient(c.id)}>
              <Avatar name={c.name} />
              <div className="flex-1 min-w-0">
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 14.5, color: T.ink }}>{c.name}</div>
                <div className="text-xs" style={{ color: T.inkFaint, fontFamily: "Inter, sans-serif" }}>{c.neighborhood} · {stats.orderCount} pedidos · {formatBRL(stats.totalValue)}</div>
              </div>
              {stats.pending > 0 && <Badge bg={T.rustBg} fg={T.rust}>Deve {formatBRL(stats.pending)}</Badge>}
              <ChevronRight size={16} style={{ color: T.inkFaint }} />
            </Card>
          );
        })}
        {filtered.length === 0 && <EmptyState icon={Users} title="Nenhum cliente encontrado" text="Tente outra busca ou cadastre um novo cliente pelo assistente." />}
      </div>
    </div>
  );
}

function ClientDetailScreen({ app }) {
  const { clients, orders, activeClient, setActiveClient, goTab } = app;
  const c = clientById(clients, activeClient);
  if (!c) return null;
  const stats = clientStats(c.id, orders);
  const clientOrders = orders.filter(o => o.clientId === c.id).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="px-5 py-6 max-w-3xl mx-auto pb-24 md:pb-10">
      <button onClick={() => setActiveClient(null)} className="flex items-center gap-1.5 text-sm mb-5" style={{ color: T.inkSoft, fontFamily: "Inter, sans-serif" }}>
        <ArrowLeft size={15} /> Voltar
      </button>
      <div className="flex items-center gap-4 mb-6">
        <Avatar name={c.name} size={56} />
        <div>
          <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 22, color: T.ink }}>{c.name}</div>
          <div className="text-sm flex items-center gap-1" style={{ color: T.inkSoft, fontFamily: "Inter, sans-serif" }}><Phone size={12} /> {c.phone}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <Card className="p-3 text-center"><div style={{ fontFamily: "IBM Plex Mono, monospace", fontWeight: 600, color: T.ink }}>{stats.totalQty}</div><div className="text-xs" style={{ color: T.inkFaint }}>garrafas</div></Card>
        <Card className="p-3 text-center"><div style={{ fontFamily: "IBM Plex Mono, monospace", fontWeight: 600, color: T.ink }}>{formatBRL(stats.totalValue)}</div><div className="text-xs" style={{ color: T.inkFaint }}>total comprado</div></Card>
        <Card className="p-3 text-center"><div style={{ fontFamily: "IBM Plex Mono, monospace", fontWeight: 600, color: stats.pending > 0 ? T.rust : T.ink }}>{formatBRL(stats.pending)}</div><div className="text-xs" style={{ color: T.inkFaint }}>a receber</div></Card>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => goTab("assistente")} className="text-xs font-medium px-3 py-2 rounded-xl" style={{ backgroundColor: T.gold, color: "#fff", fontFamily: "Inter, sans-serif" }}>+ Novo pedido</button>
        <button onClick={() => goTab("assistente")} className="text-xs font-medium px-3 py-2 rounded-xl" style={{ backgroundColor: T.greenBg, color: T.greenDark, fontFamily: "Inter, sans-serif" }}>Registrar pagamento</button>
        <button onClick={() => goTab("assistente")} className="text-xs font-medium px-3 py-2 rounded-xl" style={{ backgroundColor: T.goldBg, color: T.goldDark, fontFamily: "Inter, sans-serif" }}>Criar lembrete</button>
        <button onClick={() => goTab("assistente")} className="text-xs font-medium px-3 py-2 rounded-xl" style={{ backgroundColor: T.blueBg, color: T.blue, fontFamily: "Inter, sans-serif" }}>Mensagem de recompra</button>
      </div>

      <Card className="p-4 mb-4">
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: T.ink }} className="mb-1">Endereço</div>
        <div className="text-sm flex items-start gap-1.5" style={{ color: T.inkSoft, fontFamily: "Inter, sans-serif" }}><MapPin size={13} className="mt-0.5 shrink-0" /> {c.address}, {c.neighborhood}</div>
        {c.notes && <div className="text-xs mt-2 italic" style={{ color: T.inkFaint }}>{c.notes}</div>}
      </Card>

      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: T.ink }} className="mb-2">Histórico de pedidos</div>
      <div className="flex flex-col gap-2">
        {clientOrders.map(o => {
          const s = statusStyle(o.status);
          return (
            <Card key={o.id} className="p-3 flex items-center justify-between">
              <div>
                <div className="text-sm" style={{ color: T.ink, fontFamily: "Inter, sans-serif" }}>{o.items.map(i => `${i.qty}x ${i.product}`).join(", ")}</div>
                <div className="text-xs" style={{ color: T.inkFaint, fontFamily: "Inter, sans-serif" }}>{formatDateBR(o.date)} · {formatBRL(orderTotal(o))}</div>
              </div>
              <Badge bg={s.bg} fg={s.fg}>{o.status}</Badge>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ============================== ORDERS ============================== */
function OrdersScreen({ app }) {
  const { orders, clients } = app;
  const [view, setView] = useState("lista");
  const sorted = [...orders].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="px-5 py-6 max-w-5xl mx-auto pb-24 md:pb-10">
      <SectionTitle
        eyebrow="Operação"
        title="Pedidos"
        action={
          <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: T.line }}>
            <button onClick={() => setView("lista")} className="px-3 py-2 flex items-center gap-1.5 text-xs font-medium" style={{ backgroundColor: view === "lista" ? T.goldBg : T.surface, color: view === "lista" ? T.goldDark : T.inkSoft }}>
              <ListIcon size={13} /> Lista
            </button>
            <button onClick={() => setView("kanban")} className="px-3 py-2 flex items-center gap-1.5 text-xs font-medium" style={{ backgroundColor: view === "kanban" ? T.goldBg : T.surface, color: view === "kanban" ? T.goldDark : T.inkSoft }}>
              <LayoutGrid size={13} /> Kanban
            </button>
          </div>
        }
      />

      {view === "lista" ? (
        <div className="flex flex-col gap-2.5">
          {sorted.map(o => {
            const c = clientById(clients, o.clientId);
            const s = statusStyle(o.status);
            return (
              <Card key={o.id} className="p-4 flex items-center gap-3">
                <Avatar name={c?.name || "?"} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium" style={{ color: T.ink, fontFamily: "Inter, sans-serif" }}>{c?.name}</div>
                  <div className="text-xs truncate" style={{ color: T.inkFaint, fontFamily: "Inter, sans-serif" }}>{o.items.map(i => `${i.qty}x ${i.product}`).join(", ")}</div>
                </div>
                <div className="text-right shrink-0">
                  <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 13, color: T.ink }}>{formatBRL(orderTotal(o))}</div>
                  <div className="text-xs" style={{ color: T.inkFaint }}>{relativeDayLabel(o.deliveryDate)}</div>
                </div>
                <Badge bg={s.bg} fg={s.fg}>{o.status}</Badge>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-3">
          {ORDER_STATUSES.map(status => {
            const list = sorted.filter(o => o.status === status);
            const s = statusStyle(status);
            return (
              <div key={status} className="shrink-0 w-64">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.fg }} />
                  <span className="text-xs font-semibold" style={{ color: T.inkSoft, fontFamily: "Inter, sans-serif" }}>{status}</span>
                  <span className="text-xs" style={{ color: T.inkFaint }}>({list.length})</span>
                </div>
                <div className="flex flex-col gap-2">
                  {list.map(o => {
                    const c = clientById(clients, o.clientId);
                    return (
                      <Card key={o.id} className="p-3">
                        <div className="text-sm font-medium" style={{ color: T.ink, fontFamily: "Inter, sans-serif" }}>{c?.name}</div>
                        <div className="text-xs" style={{ color: T.inkFaint, fontFamily: "Inter, sans-serif" }}>{o.items.map(i => `${i.qty}x ${i.product}`).join(", ")}</div>
                        <div className="text-xs mt-1" style={{ color: T.gold, fontFamily: "IBM Plex Mono, monospace" }}>{formatBRL(orderTotal(o))}</div>
                      </Card>
                    );
                  })}
                  {list.length === 0 && <div className="text-xs text-center py-4 rounded-xl border border-dashed" style={{ color: T.inkFaint, borderColor: T.line }}>vazio</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================== DELIVERIES ============================== */
function DeliveriesScreen({ app }) {
  const { orders, clients, completeDelivery } = app;
  const deliverable = orders.filter(o => !["Pago", "Cancelado"].includes(o.status) || o.deliveryDate);
  const today = todayISO();
  const groups = {
    "Atrasadas": deliverable.filter(o => o.deliveryDate < today && !["Entregue","Pago"].includes(o.status)),
    "Hoje": deliverable.filter(o => o.deliveryDate === today && !["Entregue","Pago"].includes(o.status)),
    "Próximas": deliverable.filter(o => o.deliveryDate > today && !["Entregue","Pago"].includes(o.status)),
  };
  const [askPayment, setAskPayment] = useState(null);

  return (
    <div className="px-5 py-6 max-w-3xl mx-auto pb-24 md:pb-10">
      <SectionTitle eyebrow="Logística" title="Entregas" />
      {Object.entries(groups).map(([label, list]) => list.length > 0 && (
        <div key={label} className="mb-6">
          <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: label === "Atrasadas" ? T.rust : T.inkSoft, fontFamily: "Inter, sans-serif" }}>{label} ({list.length})</div>
          <div className="flex flex-col gap-2.5">
            {list.map(o => {
              const c = clientById(clients, o.clientId);
              return (
                <Card key={o.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium" style={{ color: T.ink, fontFamily: "Inter, sans-serif" }}>{c?.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: T.inkFaint, fontFamily: "Inter, sans-serif" }}>{o.items.map(i => `${i.qty}x ${i.product}`).join(", ")}</div>
                      <div className="text-xs mt-1 flex items-center gap-1" style={{ color: T.inkSoft, fontFamily: "Inter, sans-serif" }}><MapPin size={11} /> {o.deliveryAddress || c?.address}</div>
                      <div className="text-xs mt-0.5" style={{ color: T.inkFaint, fontFamily: "Inter, sans-serif" }}>{formatDateBR(o.deliveryDate)}{o.deliveryTime ? ` às ${o.deliveryTime}` : ""}</div>
                    </div>
                    <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 13, color: T.ink }} className="shrink-0">{formatBRL(orderTotal(o))}</div>
                  </div>
                  {askPayment === o.id ? (
                    <div className="mt-3 pt-3 border-t" style={{ borderColor: T.line }}>
                      <div className="text-xs mb-2" style={{ color: T.inkSoft, fontFamily: "Inter, sans-serif" }}>O pagamento também foi realizado?</div>
                      <div className="flex flex-wrap gap-1.5">
                        {[["Sim, integral", "integral"], ["Parcial", "parcial"], ["Ainda não", "pendente"], ["Já pago antes", "ja_pago"]].map(([label2, val]) => (
                          <button key={val} onClick={() => { completeDelivery(o.id, val); setAskPayment(null); }} className="text-xs px-2.5 py-1.5 rounded-full" style={{ backgroundColor: T.goldBg, color: T.goldDark, fontFamily: "Inter, sans-serif" }}>{label2}</button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setAskPayment(o.id)} className="mt-3 w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5" style={{ backgroundColor: T.green, color: "#fff", fontFamily: "Inter, sans-serif" }}>
                      <PackageCheck size={14} /> Marcar como entregue
                    </button>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      ))}
      {Object.values(groups).every(l => l.length === 0) && <EmptyState icon={Truck} title="Nenhuma entrega pendente" text="Tudo entregue por aqui. Bom trabalho!" />}
    </div>
  );
}

/* ============================== FINANCE ============================== */
function FinanceScreen({ app }) {
  const { orders, expenses } = app;
  const finTotal = financeSummary(orders, expenses, false);
  const byCat = expensesByCategory(expenses);
  const recentExpenses = [...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  const paidOrders = orders.filter(o => o.status === "Pago").sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

  return (
    <div className="px-5 py-6 max-w-4xl mx-auto pb-24 md:pb-10">
      <SectionTitle eyebrow="Dinheiro, sem complicação" title="Financeiro" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Entradas" value={formatBRL(finTotal.income)} icon={TrendingUp} accent={T.green} accentBg={T.greenBg} />
        <StatCard label="Saídas" value={formatBRL(finTotal.spent)} icon={Wallet} accent={T.rust} accentBg={T.rustBg} />
        <StatCard label="Saldo estimado" value={formatBRL(finTotal.balance)} icon={CircleDollarSign} accent={T.gold} accentBg={T.goldBg} />
        <StatCard label="A receber" value={formatBRL(finTotal.pending)} icon={AlertTriangle} accent={T.rust} accentBg={T.rustBg} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5">
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: T.ink }} className="mb-3">Despesas por categoria</div>
          <div className="flex flex-col gap-2.5">
            {byCat.map(([cat, val]) => (
              <div key={cat}>
                <div className="flex justify-between text-xs mb-1" style={{ fontFamily: "Inter, sans-serif" }}>
                  <span style={{ color: T.inkSoft }}>{cat}</span>
                  <span style={{ color: T.ink, fontFamily: "IBM Plex Mono, monospace" }}>{formatBRL(val)}</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ backgroundColor: T.grayBg }}>
                  <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, (val / finTotal.spent) * 100)}%`, backgroundColor: T.rust }} />
                </div>
              </div>
            ))}
            {byCat.length === 0 && <div className="text-sm" style={{ color: T.inkFaint }}>Nenhuma despesa registrada.</div>}
          </div>
        </Card>

        <Card className="p-5">
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: T.ink }} className="mb-3">Últimas movimentações</div>
          <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto">
            {[...recentExpenses.map(e => ({ ...e, kind: "saida" })), ...paidOrders.map(o => ({ ...o, kind: "entrada", description: o.items.map(i => i.product).join(", "), value: orderTotal(o) }))]
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 10)
              .map((mv, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="min-w-0">
                    <div className="truncate" style={{ color: T.ink, fontFamily: "Inter, sans-serif" }}>{mv.description}</div>
                    <div className="text-xs" style={{ color: T.inkFaint }}>{formatDateBR(mv.date)}</div>
                  </div>
                  <span style={{ fontFamily: "IBM Plex Mono, monospace", color: mv.kind === "entrada" ? T.greenDark : T.rust }}>
                    {mv.kind === "entrada" ? "+" : "-"}{formatBRL(mv.value)}
                  </span>
                </div>
              ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ============================== INVENTORY ============================== */
function InventoryScreen({ app }) {
  const { products, insumos } = app;
  return (
    <div className="px-5 py-6 max-w-4xl mx-auto pb-24 md:pb-10">
      <SectionTitle eyebrow="O que você tem em mãos" title="Estoque" />
      <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: T.inkSoft, fontFamily: "Inter, sans-serif" }}>Produtos prontos</div>
      <div className="grid md:grid-cols-2 gap-3 mb-6">
        {products.map(p => {
          const low = p.stock <= p.minStock;
          return (
            <Card key={p.id} className="p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: T.goldBg }}>
                <Leaf size={18} style={{ color: T.goldDark }} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium" style={{ color: T.ink, fontFamily: "Inter, sans-serif" }}>{p.name}</div>
                <div className="text-xs" style={{ color: T.inkFaint, fontFamily: "Inter, sans-serif" }}>{p.size} · {formatBRL(p.price)}</div>
              </div>
              <div className="text-right">
                <div style={{ fontFamily: "IBM Plex Mono, monospace", fontWeight: 600, color: low ? T.rust : T.ink }}>{p.stock}</div>
                {low && <Badge bg={T.rustBg} fg={T.rust} style={{ marginTop: 2 }}>estoque baixo</Badge>}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: T.inkSoft, fontFamily: "Inter, sans-serif" }}>Insumos</div>
      <div className="grid md:grid-cols-2 gap-3">
        {insumos.map(i => {
          const low = i.qty <= i.minStock;
          return (
            <Card key={i.id} className="p-3.5 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium" style={{ color: T.ink, fontFamily: "Inter, sans-serif" }}>{i.name}</div>
                <div className="text-xs" style={{ color: T.inkFaint, fontFamily: "Inter, sans-serif" }}>{i.supplier || "—"}</div>
              </div>
              <div className="text-right">
                <div style={{ fontFamily: "IBM Plex Mono, monospace", fontWeight: 600, color: low ? T.rust : T.ink, fontSize: 13.5 }}>{i.qty} {i.unit}</div>
                {low && <Badge bg={T.rustBg} fg={T.rust} style={{ marginTop: 2 }}>repor</Badge>}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ============================== PRODUCTION ============================== */
function ProductionScreen({ app }) {
  const { productionLots } = app;
  return (
    <div className="px-5 py-6 max-w-3xl mx-auto pb-24 md:pb-10">
      <SectionTitle eyebrow="Módulo em evolução" title="Produção" />
      <div className="flex flex-col gap-3">
        {productionLots.map(l => {
          const s = l.status === "Finalizado" ? { bg: T.greenBg, fg: T.greenDark } : l.status === "Descartado" ? { bg: T.rustBg, fg: T.rust } : { bg: T.goldBg, fg: T.goldDark };
          return (
            <Card key={l.id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 12, color: T.inkFaint }}>{l.code}</span>
                <Badge bg={s.bg} fg={s.fg}>{l.status}</Badge>
              </div>
              <div className="text-sm font-medium mb-1" style={{ color: T.ink, fontFamily: "Inter, sans-serif" }}>{l.product} · {l.volume}</div>
              <div className="text-xs flex flex-wrap gap-x-4 gap-y-1" style={{ color: T.inkSoft, fontFamily: "Inter, sans-serif" }}>
                <span>Início: {formatDateBR(l.startDate)}</span>
                <span>Envase previsto: {formatDateBR(l.forecastBottling)}</span>
                {l.bottlingDate && <span>Envasado em: {formatDateBR(l.bottlingDate)}</span>}
                <span>{l.bottlesProduced ?? l.bottlesForecast} garrafas {l.bottlesProduced ? "" : "(previsão)"}</span>
              </div>
            </Card>
          );
        })}
      </div>
      <div className="text-xs mt-4 italic" style={{ color: T.inkFaint, fontFamily: "Inter, sans-serif" }}>Novos lotes por enquanto são registrados manualmente — em breve o assistente também vai entender mensagens como "iniciei um lote de tradicional hoje".</div>
    </div>
  );
}

/* ============================== RESELLERS ============================== */
function ResellersScreen({ app }) {
  const { resellers } = app;
  return (
    <div className="px-5 py-6 max-w-3xl mx-auto pb-24 md:pb-10">
      <SectionTitle eyebrow="Parcerias" title="Pontos de revenda" />
      <div className="flex flex-col gap-3">
        {resellers.map(r => (
          <Card key={r.id} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16, color: T.ink }}>{r.name}</div>
              <Badge bg={T.blueBg} fg={T.blue}>{r.model}</Badge>
            </div>
            <div className="text-xs mb-3" style={{ color: T.inkSoft, fontFamily: "Inter, sans-serif" }}>{r.contact} · {r.phone}</div>
            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div><div style={{ fontFamily: "IBM Plex Mono, monospace", fontWeight: 600, color: T.ink }}>{r.stockThere}</div><div className="text-xs" style={{ color: T.inkFaint }}>no local</div></div>
              <div><div style={{ fontFamily: "IBM Plex Mono, monospace", fontWeight: 600, color: T.ink }}>{formatBRL(r.amountDue)}</div><div className="text-xs" style={{ color: T.inkFaint }}>a receber</div></div>
              <div><div style={{ fontFamily: "IBM Plex Mono, monospace", fontWeight: 600, color: T.ink }}>{formatBRL(r.commission)}</div><div className="text-xs" style={{ color: T.inkFaint }}>comissão/un</div></div>
            </div>
            <div className="text-xs flex items-center justify-between pt-2 border-t" style={{ color: T.inkSoft, borderColor: T.line, fontFamily: "Inter, sans-serif" }}>
              <span>Última entrega: {formatDateBR(r.lastDelivery)}</span>
              <span style={{ color: T.gold, fontWeight: 500 }}>Próxima visita: {relativeDayLabel(r.nextVisit)}</span>
            </div>
          </Card>
        ))}
        {resellers.length === 0 && <EmptyState icon={Store} title="Nenhum ponto de revenda ainda" text='Conte pro assistente: "Entreguei 20 garrafas para o Café da Praça em consignação..."' />}
      </div>
    </div>
  );
}

/* ============================== AGENDA ============================== */
function AgendaScreen({ app }) {
  const { reminders, orders, clients, toggleReminder } = app;
  const today = todayISO();
  const items = [
    ...reminders.map(r => ({ id: r.id, type: "lembrete", date: r.date, title: r.text, done: r.done })),
    ...orders.filter(o => o.deliveryDate && !["Entregue","Pago","Cancelado"].includes(o.status)).map(o => ({
      id: o.id, type: "entrega", date: o.deliveryDate, title: `Entrega — ${clientById(clients, o.clientId)?.name}`, done: false,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="px-5 py-6 max-w-3xl mx-auto pb-24 md:pb-10">
      <SectionTitle eyebrow="O que vem por aí" title="Agenda" />
      <div className="flex flex-col gap-2.5">
        {items.map(it => {
          const overdue = it.date < today && !it.done;
          return (
            <Card key={it.type + it.id} className="p-3.5 flex items-center gap-3">
              {it.type === "lembrete" ? (
                <button onClick={() => toggleReminder(it.id)} className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0" style={{ borderColor: it.done ? T.green : T.line, backgroundColor: it.done ? T.green : "transparent" }}>
                  {it.done && <Check size={13} color="#fff" />}
                </button>
              ) : (
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: T.blueBg }}>
                  <Truck size={12} style={{ color: T.blue }} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm" style={{ color: it.done ? T.inkFaint : T.ink, textDecoration: it.done ? "line-through" : "none", fontFamily: "Inter, sans-serif" }}>{it.title}</div>
              </div>
              <span className="text-xs font-medium shrink-0" style={{ color: overdue ? T.rust : T.inkFaint, fontFamily: "Inter, sans-serif" }}>{relativeDayLabel(it.date)}</span>
            </Card>
          );
        })}
        {items.length === 0 && <EmptyState icon={Calendar} title="Agenda vazia" text="Peça ao assistente para criar um lembrete." />}
      </div>
    </div>
  );
}

/* ============================== SETTINGS ============================== */
function SettingsScreen({ app }) {
  const [confirmingReset, setConfirmingReset] = useState(null); // "demo" | "blank" | null
  const rows = [
    ["Perfil da empreendedora", "Nome, telefone e loja"],
    ["Notificações", "Alertas de estoque, entregas e cobranças"],
    ["Integrações", "WhatsApp Business, Google Calendar, Pix — em breve"],
    ["Produtos e preços", "Editar catálogo de sabores"],
    ["Exportar dados", "Planilha de vendas e despesas — em breve"],
  ];
  return (
    <div className="px-5 py-6 max-w-2xl mx-auto pb-24 md:pb-10">
      <SectionTitle eyebrow="Ajustes" title="Configurações" />

      <Card className="p-4 mb-5 flex items-start gap-3" style={{ backgroundColor: T.greenBg, borderColor: T.greenBg }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#fff" }}>
          <Check size={14} style={{ color: T.greenDark }} />
        </div>
        <div>
          <div className="text-sm font-medium" style={{ color: T.greenDark, fontFamily: "Inter, sans-serif" }}>
            {app.storageAvailable ? "Seus dados são salvos automaticamente" : "Não foi possível salvar agora"}
          </div>
          <div className="text-xs mt-0.5" style={{ color: T.greenDark, opacity: 0.85, fontFamily: "Inter, sans-serif" }}>
            Tudo o que você registra pelo assistente ou pelos botões fica guardado neste dispositivo/conta e continua aqui na próxima vez que você abrir o app.
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-2.5 mb-6">
        {rows.map(([t, s], i) => (
          <Card key={i} className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium" style={{ color: T.ink, fontFamily: "Inter, sans-serif" }}>{t}</div>
              <div className="text-xs" style={{ color: T.inkFaint, fontFamily: "Inter, sans-serif" }}>{s}</div>
            </div>
            <ChevronRight size={16} style={{ color: T.inkFaint }} />
          </Card>
        ))}
      </div>

      <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: T.inkSoft, fontFamily: "Inter, sans-serif" }}>Dados do aplicativo</div>
      <div className="flex flex-col gap-2.5">
        <Card className="p-4">
          <div className="text-sm font-medium mb-1" style={{ color: T.ink, fontFamily: "Inter, sans-serif" }}>Começar do zero com os dados de exemplo</div>
          <div className="text-xs mb-3" style={{ color: T.inkFaint, fontFamily: "Inter, sans-serif" }}>Apaga tudo que você registrou e volta para os dados de demonstração (Paula, Ana, Lucas, Café da Praça).</div>
          {confirmingReset === "demo" ? (
            <div className="flex gap-2">
              <button onClick={() => { app.resetData(); setConfirmingReset(null); }} className="flex-1 py-2 rounded-xl text-xs font-semibold" style={{ backgroundColor: T.rust, color: "#fff", fontFamily: "Inter, sans-serif" }}>Sim, restaurar exemplo</button>
              <button onClick={() => setConfirmingReset(null)} className="py-2 px-3 rounded-xl text-xs font-medium" style={{ backgroundColor: T.grayBg, color: T.gray, fontFamily: "Inter, sans-serif" }}>Cancelar</button>
            </div>
          ) : (
            <button onClick={() => setConfirmingReset("demo")} className="text-xs font-medium px-3 py-2 rounded-xl" style={{ backgroundColor: T.goldBg, color: T.goldDark, fontFamily: "Inter, sans-serif" }}>Restaurar exemplo</button>
          )}
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium mb-1" style={{ color: T.ink, fontFamily: "Inter, sans-serif" }}>Apagar tudo e começar vazio</div>
          <div className="text-xs mb-3" style={{ color: T.inkFaint, fontFamily: "Inter, sans-serif" }}>Remove clientes, pedidos, despesas e lembretes de exemplo. Use quando for começar a registrar o seu negócio de verdade.</div>
          {confirmingReset === "blank" ? (
            <div className="flex gap-2">
              <button onClick={() => { app.clearToBlankSlate(); setConfirmingReset(null); }} className="flex-1 py-2 rounded-xl text-xs font-semibold" style={{ backgroundColor: T.rust, color: "#fff", fontFamily: "Inter, sans-serif" }}>Sim, apagar tudo</button>
              <button onClick={() => setConfirmingReset(null)} className="py-2 px-3 rounded-xl text-xs font-medium" style={{ backgroundColor: T.grayBg, color: T.gray, fontFamily: "Inter, sans-serif" }}>Cancelar</button>
            </div>
          ) : (
            <button onClick={() => setConfirmingReset("blank")} className="text-xs font-medium px-3 py-2 rounded-xl" style={{ backgroundColor: T.rustBg, color: T.rust, fontFamily: "Inter, sans-serif" }}>Apagar tudo</button>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ============================== APP ============================== */
export default function App() {
  const seed = useRef(buildDemoData()).current;
  const [clients, setClients] = useState(seed.clients);
  const [products, setProducts] = useState(seed.products);
  const [insumos, setInsumos] = useState(seed.insumos);
  const [orders, setOrders] = useState(seed.orders);
  const [expenses, setExpenses] = useState(seed.expenses);
  const [reminders, setReminders] = useState(seed.reminders);
  const [resellers, setResellers] = useState(seed.resellers);
  const [productionLots] = useState(seed.productionLots);

  const [tab, setTab] = useState("assistente");
  const [activeClient, setActiveClient] = useState(null);
  const [showMore, setShowMore] = useState(false);

  const [messages, setMessages] = useState([]);
  const [apiHistory, setApiHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [isHydrated, setIsHydrated] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);

  /* ---------- load saved data on open (browser localStorage) ---------- */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : null;
      if (data) {
        if (data.clients) setClients(data.clients);
        if (data.products) setProducts(data.products);
        if (data.insumos) setInsumos(data.insumos);
        if (data.orders) setOrders(data.orders);
        if (data.expenses) setExpenses(data.expenses);
        if (data.reminders) setReminders(data.reminders);
        if (data.resellers) setResellers(data.resellers);
        if (data.messages) setMessages(data.messages);
        if (data.apiHistory) setApiHistory(data.apiHistory);
      }
    } catch (err) {
      // nada salvo ainda (primeiro uso) — mantém os dados de exemplo
    } finally {
      setIsHydrated(true);
    }
  }, []);

  /* ---------- save automatically whenever something changes ---------- */
  useEffect(() => {
    if (!isHydrated) return;
    const t = setTimeout(() => {
      try {
        const payload = JSON.stringify({ clients, products, insumos, orders, expenses, reminders, resellers, messages, apiHistory });
        window.localStorage.setItem(STORAGE_KEY, payload);
        setStorageAvailable(true);
      } catch (err) {
        setStorageAvailable(false);
      }
    }, 600);
    return () => clearTimeout(t);
  }, [isHydrated, clients, products, insumos, orders, expenses, reminders, resellers, messages, apiHistory]);

  function resetData() {
    try { window.localStorage.removeItem(STORAGE_KEY); } catch (err) { /* ignore */ }
    const fresh = buildDemoData();
    setClients(fresh.clients);
    setProducts(fresh.products);
    setInsumos(fresh.insumos);
    setOrders(fresh.orders);
    setExpenses(fresh.expenses);
    setReminders(fresh.reminders);
    setResellers(fresh.resellers);
    setMessages([]);
    setApiHistory([]);
  }

  function clearToBlankSlate() {
    setClients([]);
    setProducts(seed.products);
    setInsumos(seed.insumos);
    setOrders([]);
    setExpenses([]);
    setReminders([]);
    setResellers([]);
    setMessages([]);
    setApiHistory([]);
  }

  function appendMessage(role, text, card) {
    setMessages(prev => [...prev, { id: uid(), role, text, card }]);
  }

  function resolveCard(msgId) {
    setMessages(prev => prev.map(m => (m.id === msgId ? { ...m, card: { ...m.card, resolved: true } } : m)));
  }

  /* ---------- entity helpers ---------- */
  function findClientByName(name) {
    if (!name) return null;
    const n = name.trim().toLowerCase();
    return clients.find(c => c.name.toLowerCase() === n || c.name.toLowerCase().includes(n) || n.includes(c.name.toLowerCase()));
  }
  function findOrCreateClient(name) {
    const existing = findClientByName(name);
    if (existing) return existing.id;
    const id = uid();
    setClients(prev => [...prev, { id, name: name || "Cliente", phone: "", address: "", neighborhood: "", notes: "", preferredProducts: [] }]);
    return id;
  }
  function findProductByName(name) {
    if (!name) return null;
    const n = name.trim().toLowerCase();
    return products.find(p => p.name.toLowerCase() === n || p.name.toLowerCase().includes(n) || n.includes(p.name.toLowerCase().split(" ")[1] || ""));
  }
  function findInsumoByName(name) {
    if (!name) return null;
    const n = name.trim().toLowerCase();
    return insumos.find(i => i.name.toLowerCase() === n || i.name.toLowerCase().includes(n));
  }

  /* ---------- apply actions ---------- */
  function applyAction(intent, dados) {
    switch (intent) {
      case "criar_pedido": {
        const clientId = findOrCreateClient(dados.cliente);
        const items = (dados.itens || []).map(i => ({ product: i.produto, qty: Number(i.quantidade) || 0, unitPrice: Number(i.preco_unitario) || 0 }));
        const newOrder = {
          id: uid(), clientId, date: todayISO(), items, discount: Number(dados.desconto) || 0,
          deliveryDate: dados.data_entrega || null, deliveryTime: dados.horario_entrega || null,
          deliveryAddress: dados.endereco_entrega || null, paymentMethod: dados.forma_pagamento || null,
          notes: dados.observacoes || null, status: "Pedido recebido", paidValue: 0,
        };
        setOrders(prev => [newOrder, ...prev]);
        return `Pedido de ${dados.cliente} registrado — ${formatBRL(orderTotal(newOrder))}.`;
      }
      case "registrar_entrega": {
        const client = findClientByName(dados.cliente);
        if (!client) return `Não encontrei um cliente chamado "${dados.cliente}".`;
        const openOrder = [...orders].filter(o => o.clientId === client.id && !["Entregue", "Pago", "Cancelado"].includes(o.status)).sort((a, b) => b.date.localeCompare(a.date))[0];
        if (!openOrder) return `Não encontrei um pedido em aberto de ${client.name}.`;
        let newStatus = "Aguardando pagamento";
        let paidValue = 0;
        if (dados.status_pagamento === "integral" || dados.status_pagamento === "ja_pago") { newStatus = "Pago"; paidValue = orderTotal(openOrder); }
        else if (dados.status_pagamento === "parcial") { paidValue = Number(dados.valor_pago) || 0; }
        setOrders(prev => prev.map(o => (o.id === openOrder.id ? { ...o, status: newStatus, paidValue } : o)));
        setProducts(prev => prev.map(p => {
          const item = openOrder.items.find(i => i.product.toLowerCase() === p.name.toLowerCase());
          return item ? { ...p, stock: Math.max(0, p.stock - item.qty) } : p;
        }));
        return `Entrega de ${client.name} registrada. Status: ${newStatus}.`;
      }
      case "registrar_pagamento": {
        const client = findClientByName(dados.cliente);
        if (!client) return `Não encontrei um cliente chamado "${dados.cliente}".`;
        const openOrder = [...orders].filter(o => o.clientId === client.id && o.status === "Aguardando pagamento").sort((a, b) => b.date.localeCompare(a.date))[0];
        if (!openOrder) return `${client.name} não tem pagamentos pendentes no momento.`;
        const total = orderTotal(openOrder);
        const valor = dados.valor ? Number(dados.valor) : total - (openOrder.paidValue || 0);
        const newPaid = (openOrder.paidValue || 0) + valor;
        const newStatus = newPaid >= total ? "Pago" : "Aguardando pagamento";
        setOrders(prev => prev.map(o => (o.id === openOrder.id ? { ...o, paidValue: newPaid, status: newStatus, paymentMethod: dados.forma_pagamento || o.paymentMethod } : o)));
        return `Pagamento de ${formatBRL(valor)} registrado para ${client.name}.`;
      }
      case "registrar_despesa": {
        const newExpense = { id: uid(), date: dados.data || todayISO(), description: dados.descricao, category: EXPENSE_CATEGORIES.includes(dados.categoria) ? dados.categoria : "Outras despesas", value: Number(dados.valor) || 0, supplier: dados.fornecedor || null, paymentMethod: dados.forma_pagamento || null };
        setExpenses(prev => [newExpense, ...prev]);
        return `Despesa de ${formatBRL(newExpense.value)} registrada em ${newExpense.category}.`;
      }
      case "registrar_compra_insumo": {
        const value = Number(dados.valor) || 0;
        const qty = Number(dados.quantidade) || 0;
        const newExpense = { id: uid(), date: todayISO(), description: `Compra de ${dados.insumo}`, category: "Ingredientes", value, supplier: dados.fornecedor || null, paymentMethod: null };
        setExpenses(prev => [newExpense, ...prev]);
        const existing = findInsumoByName(dados.insumo);
        if (existing) {
          setInsumos(prev => prev.map(i => (i.id === existing.id ? { ...i, qty: i.qty + qty, lastCost: qty > 0 ? value / qty : i.lastCost, supplier: dados.fornecedor || i.supplier } : i)));
        } else {
          setInsumos(prev => [...prev, { id: uid(), name: dados.insumo, unit: dados.unidade || "un", qty, minStock: 1, lastCost: qty > 0 ? value / qty : 0, supplier: dados.fornecedor || null }]);
        }
        return `Compra de ${qty} ${dados.unidade || ""} de ${dados.insumo} registrada — ${formatBRL(value)}.`;
      }
      case "criar_lembrete": {
        const newReminder = { id: uid(), text: dados.texto, date: dados.data || todayISO(), relatedTo: dados.relacionado_a || null, done: false };
        setReminders(prev => [...prev, newReminder].sort((a, b) => a.date.localeCompare(b.date)));
        return `Lembrete criado para ${formatDateBR(newReminder.date)}.`;
      }
      case "criar_cliente": {
        const id = uid();
        setClients(prev => [...prev, { id, name: dados.nome, phone: dados.telefone || "", address: dados.endereco || "", neighborhood: "", notes: "", preferredProducts: [] }]);
        return `Cliente ${dados.nome} cadastrado.`;
      }
      case "registrar_consignacao": {
        const qty = Number(dados.quantidade) || 0;
        const productName = dados.produto || products[0]?.name;
        const existing = resellers.find(r => r.name.toLowerCase() === (dados.estabelecimento || "").toLowerCase());
        const nextVisit = dados.data_proxima_visita || addDaysISO(null, 7);
        if (existing) {
          setResellers(prev => prev.map(r => (r.id === existing.id ? {
            ...r, model: "Consignação", resalePrice: Number(dados.preco_revenda) || r.resalePrice,
            suggestedPrice: Number(dados.preco_sugerido) || r.suggestedPrice, commission: Number(dados.comissao_unidade) || r.commission,
            lastDelivery: todayISO(), nextVisit, stockThere: (r.stockThere || 0) + qty, amountDue: (r.amountDue || 0) + qty * (Number(dados.preco_revenda) || r.resalePrice),
          } : r)));
        } else {
          setResellers(prev => [...prev, {
            id: uid(), name: dados.estabelecimento, contact: "", phone: "", address: "", neighborhood: "",
            model: "Consignação", resalePrice: Number(dados.preco_revenda) || 0, suggestedPrice: Number(dados.preco_sugerido) || 0,
            commission: Number(dados.comissao_unidade) || 0, lastDelivery: todayISO(), nextVisit, stockThere: qty,
            amountDue: qty * (Number(dados.preco_revenda) || 0), notes: "",
          }]);
        }
        setProducts(prev => prev.map(p => (p.name.toLowerCase() === (productName || "").toLowerCase() ? { ...p, stock: Math.max(0, p.stock - qty) } : p)));
        setReminders(prev => [...prev, { id: uid(), text: `Voltar em ${dados.estabelecimento}`, date: nextVisit, relatedTo: dados.estabelecimento, done: false }].sort((a, b) => a.date.localeCompare(b.date)));
        return `Consignação com ${dados.estabelecimento} registrada — ${qty} garrafas entregues.`;
      }
      default:
        return "Registrado.";
    }
  }

  /* ---------- queries ---------- */
  function answerQuery(intent, params) {
    const periodo = (params && params.periodo) || "mes";
    const monthOnly = periodo === "mes";
    const today = todayISO();

    if (intent === "consultar_vendas") {
      let list = orders.filter(o => o.status !== "Cancelado");
      if (periodo === "hoje") list = list.filter(o => o.date === today);
      else if (periodo === "semana") list = list.filter(o => o.date >= addDaysISO(null, -7));
      else if (periodo === "mes") list = list.filter(o => isSameMonth(o.date, today));
      const total = list.reduce((s, o) => s + orderTotal(o), 0);
      const label = periodo === "hoje" ? "hoje" : periodo === "semana" ? "nos últimos 7 dias" : periodo === "mes" ? "neste mês" : "no total";
      return `Você vendeu ${formatBRL(total)} ${label}, em ${list.length} pedido${list.length === 1 ? "" : "s"}.`;
    }
    if (intent === "consultar_despesas") {
      let list = expenses;
      if (params?.categoria) list = list.filter(e => e.category.toLowerCase().includes(params.categoria.toLowerCase()) || e.description.toLowerCase().includes(params.categoria.toLowerCase()));
      if (monthOnly) list = list.filter(e => isSameMonth(e.date, today));
      const total = list.reduce((s, e) => s + e.value, 0);
      return params?.categoria
        ? `Você gastou ${formatBRL(total)} com ${params.categoria}${monthOnly ? " neste mês" : ""}.`
        : `Suas despesas somam ${formatBRL(total)}${monthOnly ? " neste mês" : ""}.`;
    }
    if (intent === "consultar_estoque") {
      if (params?.cliente) {
        const r = resellers.find(rr => rr.name.toLowerCase().includes((params.cliente || "").toLowerCase()));
        if (r) return `Você deixou aproximadamente ${r.stockThere} garrafas no ${r.name}.`;
      }
      const lines = products.map(p => `${p.name}: ${p.stock} garrafas`).join(" · ");
      return `Estoque atual — ${lines}.`;
    }
    if (intent === "consultar_pagamentos_pendentes") {
      const pend = orders.filter(o => o.status === "Aguardando pagamento");
      if (pend.length === 0) return "Ninguém está te devendo no momento. 🎉";
      const lines = pend.map(o => `${clientById(clients, o.clientId)?.name} — ${formatBRL(orderTotal(o) - (o.paidValue || 0))}`).join("; ");
      return `Estão te devendo: ${lines}.`;
    }
    if (intent === "consultar_agenda") {
      const upcoming = reminders.filter(r => !r.done && r.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
      if (upcoming.length === 0) return "Sua agenda está livre por enquanto.";
      return `Próximos compromissos: ${upcoming.map(r => `${r.text} (${relativeDayLabel(r.date)})`).join("; ")}.`;
    }
    return "Não consegui entender essa consulta.";
  }

  function buildDailySummary() {
    const today = todayISO();
    const todayDeliveries = orders.filter(o => o.deliveryDate === today && !["Entregue","Pago","Cancelado"].includes(o.status));
    const pendingCharges = orders.filter(o => o.status === "Aguardando pagamento");
    const lowStock = [...products.filter(p => p.stock <= p.minStock), ...insumos.filter(i => i.qty <= i.minStock)];
    const resellerVisits = resellers.filter(r => r.nextVisit === today);
    const parts = [`Bom dia! Hoje você tem:`];
    parts.push(`• ${todayDeliveries.length} entrega${todayDeliveries.length === 1 ? "" : "s"}`);
    if (pendingCharges.length) parts.push(`• ${pendingCharges.length} pagamento${pendingCharges.length === 1 ? "" : "s"} para cobrar`);
    if (lowStock.length) parts.push(`• ${lowStock.length} item${lowStock.length === 1 ? "" : "ns"} com estoque baixo`);
    if (resellerVisits.length) parts.push(`• ${resellerVisits.length} ponto${resellerVisits.length === 1 ? "" : "s"} de revenda para visitar`);
    return parts.join("\n");
  }

  function resumoDoDia() {
    appendMessage("assistant", buildDailySummary());
  }

  /* ---------- assistant call ---------- */
  async function sendMessage(userText) {
    appendMessage("user", userText);
    setIsLoading(true);
    const newHistory = [...apiHistory, { role: "user", content: userText }].slice(-16);
    try {
      const stateSnapshot = { clients, products, insumos, resellers };
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: buildSystemPrompt(stateSnapshot),
          messages: newHistory,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(typeof data.error === "string" ? data.error : JSON.stringify(data.error));
      const textBlock = (data.content || []).find(b => b.type === "text");
      const raw = textBlock ? textBlock.text : "{}";
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setApiHistory([...newHistory, { role: "assistant", content: raw }]);
      handleAssistantResult(parsed);
    } catch (err) {
      console.error("Assistant error:", err);
      appendMessage("assistant", "Não consegui entender agora. Pode tentar reescrever a mensagem?");
    } finally {
      setIsLoading(false);
    }
  }

  function handleAssistantResult(parsed) {
    const { intent, status, pergunta, dados, consulta_params, resposta_livre } = parsed;

    if (intent === "resumo_diario") { appendMessage("assistant", buildDailySummary()); return; }
    if (intent === "conversa_geral") { appendMessage("assistant", resposta_livre || "Pode contar mais sobre o que você precisa?"); return; }
    if (status === "consulta") { appendMessage("assistant", answerQuery(intent, consulta_params)); return; }
    if (status === "faltando_info") { appendMessage("assistant", pergunta || "Pode me dar mais detalhes?"); return; }

    if (status === "completo") {
      const { title } = confirmationFields(intent, dados || {});
      const msgId = uid();
      const card = {
        intent, dados: dados || {}, resolved: false,
        onConfirm: () => { const result = applyAction(intent, dados || {}); resolveCard(msgId); appendMessage("assistant", `✅ ${result}`); },
        onCorrect: () => { resolveCard(msgId); appendMessage("assistant", "Sem problemas — me diga o que corrigir e eu ajusto."); },
        onCancel: () => { resolveCard(msgId); appendMessage("assistant", "Combinado, não salvei nada."); },
      };
      setMessages(prev => [...prev, { id: msgId, role: "assistant", text: `Entendi o seguinte:`, card }]);
      return;
    }
    appendMessage("assistant", "Não consegui entender direito. Pode reformular?");
  }

  function completeDelivery(orderId, statusPagamento) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const c = clientById(clients, order.clientId);
    applyAction("registrar_entrega", { cliente: c?.name, status_pagamento: statusPagamento, valor_pago: statusPagamento === "parcial" ? orderTotal(order) / 2 : null });
  }

  function toggleReminder(id) {
    setReminders(prev => prev.map(r => (r.id === id ? { ...r, done: !r.done } : r)));
  }

  function goTab(id) { setTab(id); setActiveClient(null); }

  const app = {
    clients, products, insumos, orders, expenses, reminders, resellers, productionLots,
    messages, sendMessage, isLoading, resumoDoDia,
    activeClient, setActiveClient, goTab,
    completeDelivery, toggleReminder,
    resetData, clearToBlankSlate, storageAvailable,
  };

  let screen;
  if (tab === "clientes" && activeClient) screen = <ClientDetailScreen app={app} />;
  else if (tab === "assistente") screen = <AssistantScreen app={app} />;
  else if (tab === "dashboard") screen = <DashboardScreen app={app} />;
  else if (tab === "pedidos") screen = <OrdersScreen app={app} />;
  else if (tab === "entregas") screen = <DeliveriesScreen app={app} />;
  else if (tab === "clientes") screen = <ClientsScreen app={app} />;
  else if (tab === "financeiro") screen = <FinanceScreen app={app} />;
  else if (tab === "estoque") screen = <InventoryScreen app={app} />;
  else if (tab === "producao") screen = <ProductionScreen app={app} />;
  else if (tab === "revendedores") screen = <ResellersScreen app={app} />;
  else if (tab === "agenda") screen = <AgendaScreen app={app} />;
  else if (tab === "config") screen = <SettingsScreen app={app} />;

  if (!isHydrated) {
    return (
      <div className="flex flex-col items-center justify-center gap-3" style={{ backgroundColor: T.bg, minHeight: "100vh" }}>
        <style>{FONTS}</style>
        <div className="w-12 h-12 rounded-full flex items-center justify-center animate-pulse" style={{ backgroundColor: T.gold }}>
          <Leaf size={22} color="#fff" />
        </div>
        <div style={{ fontFamily: "Fraunces, serif", color: T.ink, fontSize: 15 }}>Carregando seus dados...</div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: T.bg, minHeight: "100vh" }}>
      <style>{FONTS}</style>
      <div className="flex">
        <Sidebar active={tab} onSelect={goTab} />
        <div className="flex-1 min-w-0">{screen}</div>
      </div>
      <BottomNav active={tab} onSelect={goTab} onMore={() => setShowMore(true)} />
      {showMore && <MoreSheet onSelect={goTab} onClose={() => setShowMore(false)} />}
    </div>
  );
}
