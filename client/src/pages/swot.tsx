import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTenant } from "@/hooks/use-tenant";
import { getSwotAnalyses, createSwotAnalysis, getSwotItems, createSwotItem, deleteSwotItem } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Plus, X, Check, Shield, TrendingDown, TrendingUp, AlertTriangle,
  FileText, Download, Lightbulb, Grid2X2, Calendar, Printer,
  ChevronRight, BarChart2, Target, Zap,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type QuadrantKey = "forcas" | "fraquezas" | "oportunidades" | "ameacas";
type Impact = "alta" | "media" | "baixa";

interface SwotItem {
  id: string;
  texto: string;
  impacto: Impact;
}

interface SwotAnalysis {
  id: string;
  nome: string;
  contexto: string;
  data: string;
  forcas: SwotItem[];
  fraquezas: SwotItem[];
  oportunidades: SwotItem[];
  ameacas: SwotItem[];
}

// ── Static configs ──────────────────────────────────────────────────────────────

const IMPACT: Record<Impact, { label: string; color: string; bg: string }> = {
  alta: { label: "Alta", color: "text-red-700", bg: "bg-red-100" },
  media: { label: "Média", color: "text-amber-700", bg: "bg-amber-100" },
  baixa: { label: "Baixa", color: "text-emerald-700", bg: "bg-emerald-100" },
};

const QUAD_CONFIG = {
  forcas: {
    label: "Forças",
    sub: "Strengths",
    desc: "Vantagens internas e competências da instituição",
    Icon: Shield,
    headerCls: "bg-emerald-600",
    bodyCls: "bg-emerald-50",
    borderCls: "border-emerald-300",
    itemCls: "bg-white border border-emerald-100",
    btnCls: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-dashed border-emerald-300",
    tag: "Positivo • Interno",
    tagCls: "text-emerald-100/80",
  },
  fraquezas: {
    label: "Fraquezas",
    sub: "Weaknesses",
    desc: "Limitações internas que precisam ser superadas",
    Icon: TrendingDown,
    headerCls: "bg-rose-600",
    bodyCls: "bg-rose-50",
    borderCls: "border-rose-300",
    itemCls: "bg-white border border-rose-100",
    btnCls: "bg-rose-100 text-rose-700 hover:bg-rose-200 border border-dashed border-rose-300",
    tag: "Negativo • Interno",
    tagCls: "text-rose-100/80",
  },
  oportunidades: {
    label: "Oportunidades",
    sub: "Opportunities",
    desc: "Fatores externos favoráveis a serem aproveitados",
    Icon: TrendingUp,
    headerCls: "bg-sky-600",
    bodyCls: "bg-sky-50",
    borderCls: "border-sky-300",
    itemCls: "bg-white border border-sky-100",
    btnCls: "bg-sky-100 text-sky-700 hover:bg-sky-200 border border-dashed border-sky-300",
    tag: "Positivo • Externo",
    tagCls: "text-sky-100/80",
  },
  ameacas: {
    label: "Ameaças",
    sub: "Threats",
    desc: "Fatores externos que representam riscos",
    Icon: AlertTriangle,
    headerCls: "bg-amber-600",
    bodyCls: "bg-amber-50",
    borderCls: "border-amber-300",
    itemCls: "bg-white border border-amber-100",
    btnCls: "bg-amber-100 text-amber-700 hover:bg-amber-200 border border-dashed border-amber-300",
    tag: "Negativo • Externo",
    tagCls: "text-amber-100/80",
  },
} as const;

const QUAD_ORDER: QuadrantKey[] = ["forcas", "fraquezas", "oportunidades", "ameacas"];

function genId() { return Math.random().toString(36).slice(2, 9); }

// ── Sample data ────────────────────────────────────────────────────────────────

const SAMPLE_ANALYSES: SwotAnalysis[] = [
  {
    id: "1",
    nome: "SWOT Institucional 2026",
    contexto: "Análise estratégica geral para planejamento da acreditação ONA 2026",
    data: "2026-03-01",
    forcas: [
      { id: "f1", texto: "Equipe médica altamente qualificada e experiente", impacto: "alta" },
      { id: "f2", texto: "Infraestrutura moderna com equipamentos de última geração", impacto: "alta" },
      { id: "f3", texto: "Processos de segurança do paciente bem estabelecidos", impacto: "media" },
      { id: "f4", texto: "Alta taxa de satisfação dos pacientes — NPS 87", impacto: "media" },
    ],
    fraquezas: [
      { id: "w1", texto: "Alta rotatividade de enfermagem (turnover 28%)", impacto: "alta" },
      { id: "w2", texto: "Documentação clínica ainda em processo de padronização", impacto: "alta" },
      { id: "w3", texto: "Capacitação insuficiente em prontuário eletrônico", impacto: "media" },
    ],
    oportunidades: [
      { id: "o1", texto: "Crescimento da demanda por serviços de alta complexidade na região", impacto: "alta" },
      { id: "o2", texto: "Incentivos governamentais para hospitais acreditados ONA", impacto: "alta" },
      { id: "o3", texto: "Expansão de convênios com operadoras de planos de saúde", impacto: "media" },
    ],
    ameacas: [
      { id: "t1", texto: "Concorrência crescente de novos hospitais privados na região", impacto: "alta" },
      { id: "t2", texto: "Restrições orçamentárias e cortes nos repasses governamentais", impacto: "alta" },
      { id: "t3", texto: "Mudanças regulatórias frequentes em saúde suplementar", impacto: "media" },
    ],
  },
  {
    id: "2",
    nome: "SWOT — UTI",
    contexto: "Análise da Unidade de Terapia Intensiva para acreditação ONA Nível 3",
    data: "2026-02-15",
    forcas: [
      { id: "f1", texto: "Índice de infecção zero nos últimos 6 meses", impacto: "alta" },
      { id: "f2", texto: "Protocolos de sepse bem implementados e auditados", impacto: "alta" },
    ],
    fraquezas: [
      { id: "w1", texto: "Superlotação em períodos de pico de demanda", impacto: "alta" },
      { id: "w2", texto: "Ausência de protocolo formal de handoff entre turnos", impacto: "media" },
    ],
    oportunidades: [
      { id: "o1", texto: "Implantação de telemedicina para monitoramento remoto", impacto: "alta" },
    ],
    ameacas: [
      { id: "t1", texto: "Escassez de intensivistas no mercado regional", impacto: "alta" },
      { id: "t2", texto: "Aumento do custo de insumos críticos", impacto: "media" },
    ],
  },
];

// ── Quadrant sub-component ─────────────────────────────────────────────────────

function Quadrant({
  qKey, items, onAdd, onRemove, onImpact,
}: {
  qKey: QuadrantKey;
  items: SwotItem[];
  onAdd: (qKey: QuadrantKey, texto: string, impacto: Impact) => void;
  onRemove: (qKey: QuadrantKey, id: string) => void;
  onImpact: (qKey: QuadrantKey, id: string, impacto: Impact) => void;
}) {
  const q = QUAD_CONFIG[qKey];
  const Icon = q.Icon;
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState("");
  const [newImpact, setNewImpact] = useState<Impact>("media");

  const handleAdd = () => {
    if (!newText.trim()) return;
    onAdd(qKey, newText.trim(), newImpact);
    setNewText("");
    setNewImpact("media");
    setAdding(false);
  };

  const sorted = [...items].sort((a, b) => {
    const ord: Record<Impact, number> = { alta: 0, media: 1, baixa: 2 };
    return ord[a.impacto] - ord[b.impacto];
  });

  return (
    <div className={cn("rounded-xl border-2 flex flex-col overflow-hidden min-h-[280px]", q.borderCls)}>
      {/* Header */}
      <div className={cn("px-4 py-3 flex items-center gap-3", q.headerCls)}>
        <Icon className="w-4 h-4 text-white flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">{q.label}</span>
            <span className="text-white/60 text-xs">{q.sub}</span>
          </div>
          <p className={cn("text-xs truncate", q.tagCls)}>{q.tag} · {q.desc}</p>
        </div>
        <Badge className="bg-white/20 text-white border-0 text-xs flex-shrink-0">{items.length}</Badge>
      </div>

      {/* Body */}
      <div className={cn("flex-1 p-3 space-y-2", q.bodyCls)}>
        {sorted.map(item => (
          <div key={item.id} className={cn("flex items-start gap-2 p-2.5 rounded-lg", q.itemCls)}>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800 leading-snug">{item.texto}</p>
              <div className="flex items-center gap-1 mt-1.5">
                {(["alta", "media", "baixa"] as Impact[]).map(lvl => (
                  <button
                    key={lvl}
                    onClick={() => onImpact(qKey, item.id, lvl)}
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded font-medium transition-colors",
                      item.impacto === lvl
                        ? cn(IMPACT[lvl].bg, IMPACT[lvl].color)
                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                    )}
                  >
                    {IMPACT[lvl].label}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => onRemove(qKey, item.id)}
              className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {/* Add form */}
        {adding ? (
          <div className="border border-dashed border-gray-300 rounded-lg p-2.5 bg-white space-y-2">
            <textarea
              autoFocus
              value={newText}
              onChange={e => setNewText(e.target.value)}
              placeholder="Descreva o item..."
              className="w-full text-sm text-gray-700 border-0 outline-none resize-none bg-transparent placeholder:text-gray-400"
              rows={2}
              onKeyDown={e => {
                if (e.key === "Enter" && e.ctrlKey) handleAdd();
                if (e.key === "Escape") { setAdding(false); setNewText(""); }
              }}
            />
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-gray-400">Impacto:</span>
              {(["alta", "media", "baixa"] as Impact[]).map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setNewImpact(lvl)}
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded font-medium transition-colors",
                    newImpact === lvl ? cn(IMPACT[lvl].bg, IMPACT[lvl].color) : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                  )}
                >
                  {IMPACT[lvl].label}
                </button>
              ))}
              <div className="ml-auto flex gap-1">
                <button
                  onClick={handleAdd}
                  className="p-1 rounded bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { setAdding(false); setNewText(""); }}
                  className="p-1 rounded bg-gray-100 text-gray-400 hover:bg-gray-200 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors", q.btnCls)}
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar item
          </button>
        )}
      </div>
    </div>
  );
}

// ── Cross-strategy insights ────────────────────────────────────────────────────

const INSIGHT_CONFIG = [
  {
    key: "SO",
    title: "SO — Estratégias de Crescimento",
    desc: "Use as Forças para aproveitar as Oportunidades",
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    titleCls: "text-emerald-800",
    badgeCls: "bg-emerald-100 text-emerald-700",
    icon: TrendingUp,
  },
  {
    key: "WO",
    title: "WO — Estratégias de Desenvolvimento",
    desc: "Supere as Fraquezas aproveitando as Oportunidades",
    border: "border-sky-200",
    bg: "bg-sky-50",
    titleCls: "text-sky-800",
    badgeCls: "bg-sky-100 text-sky-700",
    icon: Target,
  },
  {
    key: "ST",
    title: "ST — Estratégias de Manutenção",
    desc: "Use as Forças para minimizar as Ameaças",
    border: "border-amber-200",
    bg: "bg-amber-50",
    titleCls: "text-amber-800",
    badgeCls: "bg-amber-100 text-amber-700",
    icon: Shield,
  },
  {
    key: "WT",
    title: "WT — Estratégias de Sobrevivência",
    desc: "Minimize Fraquezas e evite as Ameaças",
    border: "border-rose-200",
    bg: "bg-rose-50",
    titleCls: "text-rose-800",
    badgeCls: "bg-rose-100 text-rose-700",
    icon: AlertTriangle,
  },
] as const;

const GENERIC_INSIGHTS: Record<string, string[]> = {
  SO: [
    "Usar os pontos fortes internos para expandir e capturar novas oportunidades de mercado",
    "Alavancar as competências da equipe para atender à crescente demanda externa",
    "Aproveitar a infraestrutura existente para diversificação de serviços",
  ],
  WO: [
    "Investir em capacitação para eliminar lacunas internas e aproveitar oportunidades externas",
    "Usar incentivos externos para financiar melhorias nos processos internos deficientes",
    "Criar parcerias estratégicas para suprir as limitações internas identificadas",
  ],
  ST: [
    "Usar os diferenciais competitivos internos para se proteger das ameaças externas",
    "Fortalecer a marca e a reputação institucional como escudo contra a concorrência",
    "Investir em certificações e acreditações para blindar a posição de mercado",
  ],
  WT: [
    "Priorizar as ações de mitigação para as fraquezas que amplificam as ameaças externas",
    "Criar planos de contingência e reservas orçamentárias para cenários adversos",
    "Reduzir exposição às ameaças eliminando as vulnerabilidades mais críticas primeiro",
  ],
};

// ── Main page component ────────────────────────────────────────────────────────

const QUAD_TO_DB: Record<QuadrantKey, string> = {
  forcas: "strength", fraquezas: "weakness", oportunidades: "opportunity", ameacas: "threat",
};
const DB_TO_QUAD: Record<string, QuadrantKey> = {
  strength: "forcas", weakness: "fraquezas", opportunity: "oportunidades", threat: "ameacas",
};

export default function SwotPage() {
  const { isAdmin } = useTenant();
  const queryClient = useQueryClient();
  const [localAnalyses, setLocalAnalyses] = useState<SwotAnalysis[]>(SAMPLE_ANALYSES);
  const [selectedId, setSelectedId] = useState<string>("1");
  const [showNewForm, setShowNewForm] = useState(false);
  const [newNome, setNewNome] = useState("");
  const [newContexto, setNewContexto] = useState("");
  const [activeTab, setActiveTab] = useState<"matriz" | "insights">("matriz");

  // ── DB integration ───────────────────────────────────────────────────────
  const { data: dbAnalyses } = useQuery({ queryKey: ["swot-analyses"], queryFn: getSwotAnalyses, staleTime: 120_000 });
  const { data: dbItems } = useQuery({
    queryKey: ["swot-items", selectedId],
    queryFn: () => getSwotItems(selectedId),
    enabled: !!selectedId && selectedId.length > 8, // only numeric DB IDs
    staleTime: 60_000,
  });

  const createAnalysisMutation = useMutation({
    mutationFn: createSwotAnalysis,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["swot-analyses"] }),
  });
  const createItemMutation = useMutation({
    mutationFn: createSwotItem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["swot-items", selectedId] }),
  });
  const deleteItemMutation = useMutation({
    mutationFn: deleteSwotItem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["swot-items", selectedId] }),
  });

  // Merge DB analyses into local format for display
  const dbMapped: SwotAnalysis[] = (dbAnalyses ?? []).map(a => ({
    id: String(a.id),
    nome: a.title,
    contexto: a.period ?? "",
    data: a.createdAt ? new Date(a.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    forcas: [], fraquezas: [], oportunidades: [], ameacas: [],
  }));

  // Build items for selected DB analysis
  const dbItemsMapped = (dbItems ?? []).reduce<Pick<SwotAnalysis, "forcas"|"fraquezas"|"oportunidades"|"ameacas">>((acc, item) => {
    const qKey = DB_TO_QUAD[item.quadrant] ?? "forcas";
    acc[qKey] = [...(acc[qKey] || []), {
      id: String(item.id),
      texto: item.description,
      impacto: (item.impact as Impact) ?? "media",
    }];
    return acc;
  }, { forcas: [], fraquezas: [], oportunidades: [], ameacas: [] });

  const isDbId = (id: string) => id.length > 8 || (!isNaN(Number(id)) && Number(id) > 100);

  // Merge: DB analyses first, then local sample
  const dbAnalysesWithItems: SwotAnalysis[] = dbMapped.map(a =>
    a.id === selectedId ? { ...a, ...dbItemsMapped } : a
  );
  const analyses = dbAnalyses && dbAnalyses.length > 0 ? dbAnalysesWithItems : (isAdmin ? localAnalyses : []);

  const selected = analyses.find(a => a.id === selectedId) ?? analyses[0];

  // Mutation helpers (local state for non-DB analyses, DB calls for DB analyses)
  const mutate = (updater: (a: SwotAnalysis) => SwotAnalysis) => {
    setLocalAnalyses(prev => prev.map(a => a.id === selected.id ? updater(a) : a));
  };

  const handleAdd = (qKey: QuadrantKey, texto: string, impacto: Impact) => {
    if (dbAnalyses && dbAnalyses.length > 0) {
      createItemMutation.mutate({
        analysisId: Number(selectedId),
        quadrant: QUAD_TO_DB[qKey],
        description: texto,
        impact: impacto,
        order: 0,
      } as any);
    } else {
      mutate(a => ({ ...a, [qKey]: [...a[qKey], { id: genId(), texto, impacto }] }));
    }
  };

  const handleRemove = (qKey: QuadrantKey, id: string) => {
    if (dbAnalyses && dbAnalyses.length > 0) {
      deleteItemMutation.mutate(Number(id));
    } else {
      mutate(a => ({ ...a, [qKey]: a[qKey].filter(i => i.id !== id) }));
    }
  };

  const handleImpact = (qKey: QuadrantKey, id: string, impacto: Impact) => {
    // Local state update for instant feedback
    mutate(a => ({ ...a, [qKey]: a[qKey].map(i => i.id === id ? { ...i, impacto } : i) }));
  };

  const handleCreate = () => {
    if (!newNome.trim()) return;
    if (dbAnalyses !== undefined) {
      // Save to DB
      createAnalysisMutation.mutate({ title: newNome.trim(), period: newContexto.trim() || "2026", unitId: 1 } as any, {
        onSuccess: (created) => {
          setSelectedId(String((created as any).id));
          setNewNome(""); setNewContexto(""); setShowNewForm(false);
        },
      });
    } else {
      const next: SwotAnalysis = {
        id: genId(), nome: newNome.trim(), contexto: newContexto.trim(),
        data: new Date().toISOString().slice(0, 10),
        forcas: [], fraquezas: [], oportunidades: [], ameacas: [],
      };
      setLocalAnalyses(prev => [...prev, next]);
      setSelectedId(next.id);
      setNewNome(""); setNewContexto(""); setShowNewForm(false);
    }
  };

  const allItems = selected
    ? [...selected.forcas, ...selected.fraquezas, ...selected.oportunidades, ...selected.ameacas]
    : [];
  const highCount = allItems.filter(i => i.impacto === "alta").length;
  const balance = selected
    ? (selected.forcas.length + selected.oportunidades.length) - (selected.fraquezas.length + selected.ameacas.length)
    : 0;

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Grid2X2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Análise SWOT</h1>
            <p className="text-sm text-gray-500">Forças · Fraquezas · Oportunidades · Ameaças</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => window.print()}>
            <Printer className="w-3.5 h-3.5" />
            Imprimir
          </Button>
          <Button
            onClick={() => setShowNewForm(v => !v)}
            size="sm"
            className="gap-2 text-xs bg-violet-600 hover:bg-violet-700 text-white border-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova Análise
          </Button>
        </div>
      </div>

      {/* ── Analysis selector tabs ───────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        {analyses.map(a => (
          <button
            key={a.id}
            onClick={() => setSelectedId(a.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all",
              selectedId === a.id
                ? "bg-violet-600 border-violet-600 text-white shadow-sm"
                : "bg-white border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-700"
            )}
          >
            <FileText className="w-3.5 h-3.5" />
            {a.nome}
          </button>
        ))}
      </div>

      {/* ── New analysis form ────────────────────────────────────────────────── */}
      {showNewForm && (
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-violet-900 text-sm">Nova Análise SWOT</h3>
          <input
            autoFocus
            value={newNome}
            onChange={e => setNewNome(e.target.value)}
            placeholder="Nome da análise (ex: SWOT — Centro Cirúrgico 2026)"
            className="w-full text-sm border border-violet-200 rounded-lg px-3 py-2 outline-none bg-white focus:ring-2 focus:ring-violet-300"
          />
          <textarea
            value={newContexto}
            onChange={e => setNewContexto(e.target.value)}
            placeholder="Contexto e objetivo desta análise (opcional)..."
            className="w-full text-sm border border-violet-200 rounded-lg px-3 py-2 outline-none bg-white resize-none focus:ring-2 focus:ring-violet-300"
            rows={2}
          />
          <div className="flex gap-2">
            <Button
              onClick={handleCreate}
              size="sm"
              className="bg-violet-600 hover:bg-violet-700 text-white border-0 text-xs gap-1.5"
            >
              <Check className="w-3.5 h-3.5" /> Criar Análise
            </Button>
            <Button
              onClick={() => { setShowNewForm(false); setNewNome(""); setNewContexto(""); }}
              size="sm"
              variant="ghost"
              className="text-xs"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {selected && (
        <>
          {/* ── Context bar + KPIs ──────────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-900 text-base truncate">{selected.nome}</h2>
              {selected.contexto && <p className="text-sm text-gray-500 mt-0.5">{selected.contexto}</p>}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                {new Date(selected.data + "T12:00:00").toLocaleDateString("pt-BR")}
              </div>
              <Badge className="bg-violet-100 text-violet-700 border-0">{allItems.length} itens</Badge>
              {highCount > 0 && (
                <Badge className="bg-red-100 text-red-700 border-0">{highCount} alta prioridade</Badge>
              )}
              <Badge className={cn("border-0", balance >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>
                Balanço: {balance >= 0 ? "+" : ""}{balance}
              </Badge>
            </div>
          </div>

          {/* ── Stats summary ───────────────────────────────────────────────── */}
          <div className="grid grid-cols-4 gap-3">
            {QUAD_ORDER.map(qk => {
              const q = QUAD_CONFIG[qk];
              const Icon = q.Icon;
              const count = selected[qk].length;
              const highC = selected[qk].filter(i => i.impacto === "alta").length;
              return (
                <div key={qk} className={cn("rounded-xl border p-3 flex items-center gap-3", q.bodyCls, q.borderCls)}>
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", q.headerCls)}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">{q.label}</p>
                    <p className="text-xl font-bold text-gray-900">{count}</p>
                    {highC > 0 && <p className="text-[10px] text-red-500">{highC} alta</p>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── View tabs ───────────────────────────────────────────────────── */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
            {([["matriz", "Matriz SWOT"], ["insights", "Estratégias Cruzadas"]] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                  activeTab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── SWOT Matrix ─────────────────────────────────────────────────── */}
          {activeTab === "matriz" && (
            <div className="space-y-3">
              {/* Axis labels */}
              <div className="grid grid-cols-2 gap-4 text-center">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  ← Positivo (Útil)
                </p>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Negativo (Prejudicial) →
                </p>
              </div>
              {/* Row 1: Forças | Fraquezas (internal) */}
              <div className="grid grid-cols-2 gap-4">
                <Quadrant qKey="forcas" items={selected.forcas} onAdd={handleAdd} onRemove={handleRemove} onImpact={handleImpact} />
                <Quadrant qKey="fraquezas" items={selected.fraquezas} onAdd={handleAdd} onRemove={handleRemove} onImpact={handleImpact} />
              </div>
              {/* Row 2: Oportunidades | Ameaças (external) */}
              <div className="grid grid-cols-2 gap-4">
                <Quadrant qKey="oportunidades" items={selected.oportunidades} onAdd={handleAdd} onRemove={handleRemove} onImpact={handleImpact} />
                <Quadrant qKey="ameacas" items={selected.ameacas} onAdd={handleAdd} onRemove={handleRemove} onImpact={handleImpact} />
              </div>
              <p className="text-xs text-gray-400 text-center">
                Linhas: Interno (Forças/Fraquezas) · Externo (Oportunidades/Ameaças) · Ctrl+Enter para confirmar adição
              </p>
            </div>
          )}

          {/* ── Cross Insights ───────────────────────────────────────────────── */}
          {activeTab === "insights" && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900 text-sm">Análise Cruzada — Matriz de Estratégias SWOT</p>
                  <p className="text-blue-700 text-sm mt-1">
                    A combinação dos quadrantes gera 4 estratégias complementares: <strong>SO</strong> (crescer), <strong>WO</strong> (desenvolver),
                    <strong> ST</strong> (manter) e <strong>WT</strong> (sobreviver). Use estas estratégias para priorizar o plano de ação.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {INSIGHT_CONFIG.map(cfg => {
                  const Icon = cfg.icon;
                  return (
                    <div key={cfg.key} className={cn("rounded-xl border-2 p-5 space-y-3", cfg.bg, cfg.border)}>
                      <div className="flex items-start gap-3">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", cfg.badgeCls)}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className={cn("font-bold text-sm", cfg.titleCls)}>{cfg.title}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{cfg.desc}</p>
                        </div>
                      </div>
                      <ul className="space-y-2">
                        {GENERIC_INSIGHTS[cfg.key].map((insight, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-gray-700 leading-relaxed">{insight}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>

              {/* ONA connection */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-start gap-3">
                <Zap className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900 text-sm">Conexão com Acreditação ONA 2026</p>
                  <p className="text-amber-800 text-sm mt-1">
                    A Análise SWOT fundamenta o <strong>Planejamento Estratégico</strong> exigido pela ONA no Subsistema de Gestão Organizacional.
                    Use os resultados desta análise como evidência documental para os requisitos de <strong>Diagnóstico Situacional</strong> e
                    <strong> Gestão de Riscos Estratégicos</strong> durante a avaliação de acreditação.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
