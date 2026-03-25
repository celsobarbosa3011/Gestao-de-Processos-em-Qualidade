import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { printReport } from "@/lib/print-pdf";
import { getGutItems, createGutItem } from "@/lib/api";
import {
  Triangle, AlertTriangle, Filter, Plus, ArrowRight, TrendingUp,
  Download, MoreHorizontal, CheckSquare, Building2, Target,
  ChevronUp, ChevronDown, Minus, Bot, Star, Eye, Edit
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

// ============================================================
// MOCK DATA
// ============================================================

const gutItems = [
  { id: 1, title: "Falha no processo de identificação do paciente — ausência de pulseira dupla", origin: "Diagnóstico", originCode: "Ciclo Mar/26", unit: "UTI + PS", chapter: "Cap. 5 — Segurança", gravity: 5, urgency: 5, tendency: 4, status: "open", responsible: "Enf. Carla", aiJustification: "Risco direto à segurança do paciente, com histórico de 2 eventos adversos no último trimestre." },
  { id: 2, title: "Aderência ao protocolo de sepse abaixo de 60% no PS", origin: "Indicador", originCode: "IND-SEG-042", unit: "PS", chapter: "Cap. 3 — Atenção", gravity: 5, urgency: 5, tendency: 3, status: "open", responsible: "Dr. Carlos", aiJustification: "Taxa de mortalidade por sepse no PS é 20% superior à média nacional." },
  { id: 3, title: "Documentação do CFM desatualizada para medicina intensiva", origin: "ONA", originCode: "Req. 2.1.3", unit: "UTI", chapter: "Cap. 1 — Liderança", gravity: 4, urgency: 5, tendency: 4, status: "in_progress", responsible: "Dir. Médica", aiJustification: "Requisito eliminatório na visita ONA. Prazo regulatório vencendo em 60 dias." },
  { id: 4, title: "Não conformidade no descarte de resíduos infectantes no CME", origin: "Risco", originCode: "RSK-007", unit: "CME", chapter: "Cap. 6 — Infraestrutura", gravity: 4, urgency: 5, tendency: 3, status: "open", responsible: "Eng. Clínica", aiJustification: "ANVISA pode emitir notificação sanitária com multa acima de R$500mil." },
  { id: 5, title: "Ausência de treinamento em suporte avançado de vida na UTI", origin: "Diagnóstico", originCode: "Ciclo Mar/26", unit: "UTI", chapter: "Cap. 2 — Pessoas", gravity: 4, urgency: 4, tendency: 3, status: "open", responsible: "RH", aiJustification: "Equipe de plantão sem certificação BLS/ACLS vigente." },
  { id: 6, title: "Checklist de cirurgia segura não aplicado em 30% dos procedimentos", origin: "Auditoria", originCode: "AUD-CC-01", unit: "CC", chapter: "Cap. 5 — Segurança", gravity: 5, urgency: 3, tendency: 3, status: "open", responsible: "Coord. CC", aiJustification: "OMS exige 100% de aplicação. Risco de evento sentinela." },
  { id: 7, title: "Sistema de backup de dados sem teste há 6 meses", origin: "Risco", originCode: "RSK-012", unit: "TI", chapter: "Cap. 6 — Infraestrutura", gravity: 4, urgency: 4, tendency: 2, status: "open", responsible: "TI", aiJustification: "Risco de perda de dados críticos de pacientes." },
  { id: 8, title: "Taxa de higiene das mãos abaixo de 80% na UTI", origin: "Indicador", originCode: "IND-SEG-001", unit: "UTI", chapter: "Cap. 5 — Segurança", gravity: 4, urgency: 4, tendency: 3, status: "in_progress", responsible: "CCIH", aiJustification: "Correlação com aumento de IRAS. Bundles CCIH em implantação." },
  { id: 9, title: "Regimento do NSP sem revisão há 3 anos", origin: "Comissão", originCode: "NSP-Mar/26", unit: "NSP", chapter: "Cap. 1 — Liderança", gravity: 3, urgency: 4, tendency: 2, status: "open", responsible: "NSP", aiJustification: "RDC 36/2013 exige revisão anual do regimento." },
  { id: 10, title: "Ausência de mapa de risco na Farmácia", origin: "ONA", originCode: "Req. 6.2.1", unit: "Farm", chapter: "Cap. 6 — Infraestrutura", gravity: 3, urgency: 3, tendency: 3, status: "resolved", responsible: "Farm. Pedro", aiJustification: "Requisito do Nível 1 já em resolução." },
];

const gutScore = (g: number, u: number, t: number) => g * u * t;

const gutLevel = (score: number) => {
  if (score >= 75) return { label: "Crítico", color: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-500" };
  if (score >= 40) return { label: "Alto", color: "bg-orange-100 text-orange-700 border-orange-200", dot: "bg-orange-500" };
  if (score >= 20) return { label: "Médio", color: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-400" };
  return { label: "Baixo", color: "bg-green-100 text-green-700 border-green-200", dot: "bg-green-400" };
};

const originColors: Record<string, string> = {
  "Diagnóstico": "bg-sky-100 text-sky-700",
  "ONA": "bg-violet-100 text-violet-700",
  "Risco": "bg-orange-100 text-orange-700",
  "Indicador": "bg-purple-100 text-purple-700",
  "Comissão": "bg-emerald-100 text-emerald-700",
  "Auditoria": "bg-amber-100 text-amber-700",
};

const RatingDots = ({ value, max = 5, color }: { value: number; max?: number; color: string }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: max }).map((_, i) => (
      <div key={i} className={cn("w-2.5 h-2.5 rounded-sm", i < value ? color : "bg-slate-200 dark:bg-slate-700")} />
    ))}
  </div>
);

const chartData = gutItems
  .map(i => ({ ...i, score: gutScore(i.gravity, i.urgency, i.tendency) }))
  .sort((a, b) => b.score - a.score)
  .slice(0, 8)
  .map(i => ({ name: i.title.slice(0, 25) + "...", score: i.score, unit: i.unit }));

export default function MatrizGUT() {
  const [, navigate] = useLocation();
  const [selectedItem, setSelectedItem] = useState<typeof gutItems[0] | null>(null);
  const [sortBy, setSortBy] = useState<"score" | "gravity" | "urgency" | "tendency">("score");
  const [filterOrigin, setFilterOrigin] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showNovoForm, setShowNovoForm] = useState(false);
  const [novoForm, setNovoForm] = useState({ title: "", unit: "", responsible: "", gravity: "3", urgency: "3", tendency: "3" });
  const qc = useQueryClient();

  const { data: dbGutItems } = useQuery({
    queryKey: ["gut-items"],
    queryFn: getGutItems,
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: createGutItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gut-items"] });
      setNovoForm({ title: "", unit: "", responsible: "", gravity: "3", urgency: "3", tendency: "3" });
      setShowNovoForm(false);
      toast.success("Item GUT cadastrado com sucesso!");
    },
    onError: () => toast.error("Erro ao salvar item GUT."),
  });

  function handleNovoSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!novoForm.title.trim() || !novoForm.unit.trim()) {
      toast.error("Preencha título e unidade.");
      return;
    }
    createMutation.mutate({
      title: novoForm.title,
      origin: "Manual",
      originCode: "Manual",
      unit: novoForm.unit,
      chapter: "Cap. 1 — Liderança",
      gravity: Number(novoForm.gravity),
      urgency: Number(novoForm.urgency),
      tendency: Number(novoForm.tendency),
      status: "open",
      responsible: novoForm.responsible || "—",
    } as any);
  }

  // Use real data from DB when available, else fallback to mock
  const baseItems = (dbGutItems && dbGutItems.length > 0)
    ? dbGutItems.map(i => ({
        ...i,
        originCode: (i as any).originCode || "DB",
        chapter: (i as any).chapter || "Cap. 1",
        aiJustification: (i as any).aiJustification || "Item do banco de dados.",
      }))
    : gutItems;

  const sortedItems = baseItems
    .filter(i => filterOrigin === "all" || i.origin === filterOrigin)
    .filter(i => filterStatus === "all" || i.status === filterStatus)
    .map(i => ({ ...i, score: gutScore(i.gravity, i.urgency, i.tendency) }))
    .sort((a, b) => {
      if (sortBy === "score") return b.score - a.score;
      if (sortBy === "gravity") return b.gravity - a.gravity;
      if (sortBy === "urgency") return b.urgency - a.urgency;
      return b.tendency - a.tendency;
    });

  const criticalCount = sortedItems.filter(i => gutScore(i.gravity, i.urgency, i.tendency) >= 75).length;
  const highCount = sortedItems.filter(i => { const s = gutScore(i.gravity, i.urgency, i.tendency); return s >= 40 && s < 75; }).length;

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Triangle className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Matriz GUT</h1>
            <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
              {criticalCount} críticos
            </Badge>
          </div>
          <p className="text-slate-500 text-sm">Priorização estratégica por Gravidade × Urgência × Tendência</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => printReport({ title: "Matriz de Priorização GUT", subtitle: "Gravidade × Urgência × Tendência — QHealth One 2026", module: "Matriz GUT", columns: [{ label: "Problema / Risco", key: "prob" }, { label: "G", key: "g", align: "center" }, { label: "U", key: "u", align: "center" }, { label: "T", key: "t", align: "center" }, { label: "GUT", key: "gut", align: "center" }, { label: "Prioridade", key: "prio" }], rows: [{ prob: "Falha na identificação do paciente", g: "5", u: "5", t: "4", gut: "100", prio: "🔴 Crítica" }, { prob: "Medicamento alta vigilância sem dupla checagem", g: "5", u: "4", t: "4", gut: "80", prio: "🔴 Crítica" }, { prob: "Taxa IACS UTI acima da meta", g: "4", u: "4", t: "4", gut: "64", prio: "🟠 Alta" }, { prob: "Falta de leitos UTI", g: "4", u: "3", t: "3", gut: "36", prio: "🟡 Média" }, { prob: "Treinamentos ONA pendentes", g: "3", u: "4", t: "3", gut: "36", prio: "🟡 Média" }, { prob: "Manutenção preventiva atrasada", g: "3", u: "3", t: "3", gut: "27", prio: "🟢 Baixa" }] })}>
            <Download className="w-3.5 h-3.5" />
            Exportar
          </Button>
          <Button size="sm" className="h-8 gap-1.5 text-xs bg-amber-500 hover:bg-amber-600 text-white border-0" onClick={() => setShowNovoForm(true)}>
            <Plus className="w-3.5 h-3.5" />
            Novo Item GUT
          </Button>
        </div>
      </div>

      {/* Novo Item GUT inline form */}
      {showNovoForm && (
        <form onSubmit={handleNovoSubmit} className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-amber-800">Cadastrar Novo Item GUT</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Título *</label>
              <input
                type="text"
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="Descrição do problema ou risco"
                value={novoForm.title}
                onChange={e => setNovoForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Unidade *</label>
              <input
                type="text"
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="Ex: UTI, PS, CME"
                value={novoForm.unit}
                onChange={e => setNovoForm(f => ({ ...f, unit: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Responsável</label>
              <input
                type="text"
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="Nome do responsável"
                value={novoForm.responsible}
                onChange={e => setNovoForm(f => ({ ...f, responsible: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Gravidade (1-5)</label>
                <input
                  type="number" min={1} max={5}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  value={novoForm.gravity}
                  onChange={e => setNovoForm(f => ({ ...f, gravity: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Urgência (1-5)</label>
                <input
                  type="number" min={1} max={5}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  value={novoForm.urgency}
                  onChange={e => setNovoForm(f => ({ ...f, urgency: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tendência (1-5)</label>
                <input
                  type="number" min={1} max={5}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  value={novoForm.tendency}
                  onChange={e => setNovoForm(f => ({ ...f, tendency: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => setShowNovoForm(false)}>Cancelar</Button>
            <Button type="submit" size="sm" className="h-8 text-xs bg-amber-500 hover:bg-amber-600 text-white border-0">Salvar Item GUT</Button>
          </div>
        </form>
      )}

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Crítico (GUT ≥ 75)", value: criticalCount, color: "text-red-600", bg: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800" },
          { label: "Alto (GUT 40-74)", value: highCount, color: "text-orange-600", bg: "bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800" },
          { label: "Total de Itens", value: sortedItems.length, color: "text-slate-700", bg: "bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700" },
          { label: "Com Plano de Ação", value: sortedItems.filter(i => i.status !== "open").length, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800" },
        ].map(kpi => (
          <Card key={kpi.label} className={cn("border", kpi.bg)}>
            <CardContent className="pt-4 pb-3 px-4">
              <p className={cn("text-3xl font-bold", kpi.color)}>{kpi.value}</p>
              <p className="text-xs text-slate-500 mt-1">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Main matrix table */}
        <div className="xl:col-span-2 space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Filter className="w-3.5 h-3.5" />Origem:
            </div>
            {["all", "Diagnóstico", "ONA", "Risco", "Indicador", "Comissão"].map(o => (
              <button
                key={o}
                onClick={() => setFilterOrigin(o)}
                className={cn(
                  "text-xs px-2.5 py-1 rounded-full border transition-all",
                  filterOrigin === o
                    ? "bg-amber-500 text-white border-amber-500"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-300"
                )}
              >
                {o === "all" ? "Todos" : o}
              </button>
            ))}
            <div className="ml-2 flex items-center gap-1.5 text-xs text-slate-500">
              Status:
            </div>
            {["all", "open", "in_progress", "resolved"].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={cn(
                  "text-xs px-2.5 py-1 rounded-full border transition-all",
                  filterStatus === s
                    ? "bg-slate-700 text-white border-slate-700"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                )}
              >
                {s === "all" ? "Todos" : s === "open" ? "Aberto" : s === "in_progress" ? "Em andamento" : "Resolvido"}
              </button>
            ))}
          </div>

          {/* Sort header */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-0 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <span>Gap / Problema</span>
              {(["gravity", "urgency", "tendency"] as const).map(k => (
                <button
                  key={k}
                  onClick={() => setSortBy(k)}
                  className={cn("flex items-center gap-0.5 px-3 justify-center hover:text-slate-700 transition-colors", sortBy === k && "text-amber-600")}
                >
                  {k === "gravity" ? "G" : k === "urgency" ? "U" : "T"}
                  {sortBy === k ? <ChevronDown className="w-3 h-3" /> : <Minus className="w-3 h-3 opacity-30" />}
                </button>
              ))}
              <button
                onClick={() => setSortBy("score")}
                className={cn("flex items-center gap-0.5 px-3 justify-center hover:text-slate-700 transition-colors", sortBy === "score" && "text-amber-600")}
              >
                GUT {sortBy === "score" && <ChevronDown className="w-3 h-3" />}
              </button>
              <span className="px-3 text-center">Ação</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedItems.map((item, i) => {
                const score = gutScore(item.gravity, item.urgency, item.tendency);
                const level = gutLevel(score);
                const isSelected = selectedItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-0 px-4 py-3 cursor-pointer transition-all",
                      isSelected ? "bg-amber-50 dark:bg-amber-950/20" : "hover:bg-slate-50 dark:hover:bg-slate-800/30",
                      item.status === "resolved" && "opacity-60"
                    )}
                    onClick={() => setSelectedItem(isSelected ? null : item)}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="text-xs font-bold text-slate-400 w-5 flex-shrink-0 mt-0.5">#{i + 1}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug line-clamp-2">{item.title}</p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <Badge variant="outline" className={cn("text-[10px] py-0 px-1.5 h-4", originColors[item.origin])}>
                            {item.origin}
                          </Badge>
                          <span className="text-[10px] text-slate-400">{item.unit}</span>
                        </div>
                      </div>
                    </div>

                    {(["gravity", "urgency", "tendency"] as const).map(k => (
                      <div key={k} className="flex items-center justify-center px-3">
                        <span className={cn(
                          "text-sm font-bold w-6 h-6 rounded-full flex items-center justify-center",
                          item[k] >= 4 ? "bg-red-100 text-red-700" :
                          item[k] >= 3 ? "bg-amber-100 text-amber-700" :
                          "bg-slate-100 text-slate-600"
                        )}>{item[k]}</span>
                      </div>
                    ))}

                    <div className="flex items-center justify-center px-3">
                      <span className={cn("text-sm font-bold px-2.5 py-0.5 rounded-lg border", level.color)}>
                        {score}
                      </span>
                    </div>

                    <div className="flex items-center justify-center px-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={(e) => { e.stopPropagation(); navigate("/gestao-operacional"); }}
                        title="Criar plano de ação"
                      >
                        <CheckSquare className="w-3.5 h-3.5 text-slate-500 hover:text-emerald-600" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Detail + Chart */}
        <div className="space-y-4">
          {/* Selected item detail */}
          {selectedItem ? (
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
              <CardHeader className="pb-3 pt-4 px-4">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                    {selectedItem.title}
                  </CardTitle>
                </div>
                <Badge variant="outline" className={cn("text-[10px] w-fit mt-1", gutLevel(gutScore(selectedItem.gravity, selectedItem.urgency, selectedItem.tendency)).color)}>
                  GUT {gutScore(selectedItem.gravity, selectedItem.urgency, selectedItem.tendency)} — {gutLevel(gutScore(selectedItem.gravity, selectedItem.urgency, selectedItem.tendency)).label}
                </Badge>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-4">
                <div className="space-y-2.5">
                  {[
                    { label: "Gravidade", key: "gravity" as const, desc: "Impacto se o problema continuar" },
                    { label: "Urgência", key: "urgency" as const, desc: "Pressão do tempo para resolver" },
                    { label: "Tendência", key: "tendency" as const, desc: "Evolução se nada for feito" },
                  ].map(({ label, key, desc }) => (
                    <div key={key}>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{label}</span>
                        <span className="text-xs font-bold text-amber-600">{selectedItem[key]}/5</span>
                      </div>
                      <Progress value={selectedItem[key] * 20} className="h-2" />
                      <p className="text-[10px] text-slate-400 mt-0.5">{desc}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg bg-slate-800/60 border border-slate-700/40 p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Bot className="w-3.5 h-3.5 text-sky-400" />
                    <span className="text-[10px] font-semibold text-sky-400 uppercase tracking-wider">Justificativa IA</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{selectedItem.aiJustification}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                  <div><span className="font-semibold">Unidade:</span> {selectedItem.unit}</div>
                  <div><span className="font-semibold">Origem:</span> {selectedItem.origin}</div>
                  <div><span className="font-semibold">Ref.:</span> {selectedItem.originCode}</div>
                  <div><span className="font-semibold">Responsável:</span> {selectedItem.responsible}</div>
                </div>

                <Button
                  onClick={() => { toast.info("Abrindo Gestão Operacional..."); navigate("/gestao-operacional"); }}
                  className="w-full h-8 text-xs bg-amber-500 hover:bg-amber-600 text-white border-0 gap-1.5"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  Criar Plano de Ação
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-slate-200 dark:border-slate-800">
              <CardContent className="p-6 text-center">
                <Triangle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Clique em um item para ver o detalhe GUT e justificativa da IA</p>
              </CardContent>
            </Card>
          )}

          {/* Chart */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                Ranking por Score GUT
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 15, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" strokeOpacity={0.4} />
                  <XAxis type="number" domain={[0, 125]} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={false} axisLine={false} tickLine={false} width={0} />
                  <Tooltip
                    contentStyle={{ background: "#1e293b", border: "none", borderRadius: 8, fontSize: 11 }}
                    formatter={(v: any) => [`GUT: ${v}`, ""]}
                    labelFormatter={(_, p) => p[0]?.payload?.name || ""}
                  />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]} maxBarSize={18}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.score >= 75 ? "#ef4444" : entry.score >= 40 ? "#f97316" : "#f59e0b"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
