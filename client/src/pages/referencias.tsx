import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Search,
  ExternalLink,
  Download,
  Star,
  StarOff,
  Filter,
  FileText,
  Shield,
  Activity,
  Building2,
  Stethoscope,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  ChevronRight,
  Tag,
  Globe,
  CalendarDays,
  BookMarked,
  Layers,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type RefCategory =
  | "ONA"
  | "ANVISA"
  | "CFM"
  | "COFEN"
  | "ANS"
  | "MS"
  | "ABNT"
  | "Internacional";

type RefType = "Norma" | "Resolução" | "RDC" | "Portaria" | "Manual" | "Guia" | "Nota Técnica";

interface NormativeRef {
  id: string;
  code: string;
  title: string;
  category: RefCategory;
  type: RefType;
  issuer: string;
  publishedAt: string;
  updatedAt?: string;
  status: "vigente" | "revogada" | "em_revisao";
  onaRelation?: string[];
  description: string;
  isFavorite: boolean;
  tags: string[];
  linkedModules: string[];
  requiresAction: boolean;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const normativeRefs: NormativeRef[] = [
  {
    id: "1",
    code: "ONA-2026",
    title: "Manual Brasileiro de Acreditação ONA 2026 — Organizações Prestadoras de Serviços de Saúde",
    category: "ONA",
    type: "Manual",
    issuer: "Organização Nacional de Acreditação",
    publishedAt: "2025-01-01",
    status: "vigente",
    onaRelation: ["Seção 1", "Seção 2", "Seção 3"],
    description: "Manual completo com critérios N1, N2 e N3 para acreditação de organizações prestadoras de serviços de saúde. Define os padrões mínimos de segurança e qualidade.",
    isFavorite: true,
    tags: ["acreditação", "ONA", "qualidade", "N1", "N2", "N3"],
    linkedModules: ["Acreditação ONA", "Diagnóstico", "Indicadores"],
    requiresAction: false,
  },
  {
    id: "2",
    code: "RDC 63/2011",
    title: "Requisitos de Boas Práticas de Funcionamento para os Serviços de Saúde",
    category: "ANVISA",
    type: "RDC",
    issuer: "ANVISA",
    publishedAt: "2011-06-25",
    updatedAt: "2023-03-10",
    status: "vigente",
    onaRelation: ["Capítulo 4", "Capítulo 7"],
    description: "Dispõe sobre os Requisitos de Boas Práticas de Funcionamento para os Serviços de Saúde. Regulamenta notificação de eventos adversos graves e sentinela.",
    isFavorite: true,
    tags: ["eventos adversos", "notificação", "Notivisa", "ANVISA"],
    linkedModules: ["Notificação de Eventos", "Governança Clínica"],
    requiresAction: true,
  },
  {
    id: "3",
    code: "RDC 36/2013",
    title: "Institui ações para a segurança do paciente em serviços de saúde",
    category: "ANVISA",
    type: "RDC",
    issuer: "ANVISA",
    publishedAt: "2013-07-25",
    status: "vigente",
    onaRelation: ["Capítulo 6"],
    description: "Institui ações para a segurança do paciente em serviços de saúde e dá outras providências. Exige criação do Núcleo de Segurança do Paciente.",
    isFavorite: true,
    tags: ["segurança do paciente", "NSP", "PNSP", "ANVISA"],
    linkedModules: ["Notificação de Eventos", "Comissões", "Indicadores"],
    requiresAction: false,
  },
  {
    id: "4",
    code: "RDC 222/2018",
    title: "Regulamenta as Boas Práticas de Gerenciamento dos Resíduos de Serviços de Saúde",
    category: "ANVISA",
    type: "RDC",
    issuer: "ANVISA",
    publishedAt: "2018-03-28",
    status: "vigente",
    description: "Regulamenta as Boas Práticas de Gerenciamento dos Resíduos de Serviços de Saúde e dá outras providências.",
    isFavorite: false,
    tags: ["resíduos", "PGRSS", "meio ambiente", "ANVISA"],
    linkedModules: ["Governança Clínica", "Processos"],
    requiresAction: false,
  },
  {
    id: "5",
    code: "Portaria MS 529/2013",
    title: "Institui o Programa Nacional de Segurança do Paciente (PNSP)",
    category: "MS",
    type: "Portaria",
    issuer: "Ministério da Saúde",
    publishedAt: "2013-04-01",
    status: "vigente",
    onaRelation: ["Capítulo 6"],
    description: "Institui o Programa Nacional de Segurança do Paciente (PNSP) com objetivo de contribuir para a qualificação do cuidado em saúde em todos os estabelecimentos de saúde do território nacional.",
    isFavorite: true,
    tags: ["PNSP", "segurança", "Ministério da Saúde", "política"],
    linkedModules: ["Notificação de Eventos", "Indicadores"],
    requiresAction: false,
  },
  {
    id: "6",
    code: "CFM 2.299/2021",
    title: "Código de Ética Médica Atualizado 2021",
    category: "CFM",
    type: "Resolução",
    issuer: "Conselho Federal de Medicina",
    publishedAt: "2021-09-01",
    status: "vigente",
    description: "Atualiza o Código de Ética Médica com novos princípios sobre telemedicina, pesquisa e relação médico-paciente.",
    isFavorite: false,
    tags: ["ética médica", "CFM", "conduta"],
    linkedModules: ["Governança Clínica", "Políticas"],
    requiresAction: false,
  },
  {
    id: "7",
    code: "COFEN 564/2017",
    title: "Código de Ética dos Profissionais de Enfermagem",
    category: "COFEN",
    type: "Resolução",
    issuer: "Conselho Federal de Enfermagem",
    publishedAt: "2017-11-06",
    status: "vigente",
    description: "Aprova o novo Código de Ética dos Profissionais de Enfermagem com princípios, direitos e deveres dos profissionais da área.",
    isFavorite: false,
    tags: ["enfermagem", "ética", "COFEN"],
    linkedModules: ["Governança Clínica", "Políticas"],
    requiresAction: false,
  },
  {
    id: "8",
    code: "ANS-Qualiss 2023",
    title: "Programa de Qualificação das Operadoras — QUALISS 2023",
    category: "ANS",
    type: "Manual",
    issuer: "Agência Nacional de Saúde Suplementar",
    publishedAt: "2023-01-01",
    status: "vigente",
    description: "Define indicadores de desempenho e qualidade para operadoras de planos de saúde, com dimensões de gestão de saúde, atenção à saúde, sustentabilidade e garantia de acesso.",
    isFavorite: true,
    tags: ["ANS", "Qualiss", "plano de saúde", "indicadores"],
    linkedModules: ["Indicadores", "Acreditação ONA"],
    requiresAction: true,
  },
  {
    id: "9",
    code: "ABNT NBR ISO 9001:2015",
    title: "Sistemas de gestão da qualidade — Requisitos",
    category: "ABNT",
    type: "Norma",
    issuer: "Associação Brasileira de Normas Técnicas",
    publishedAt: "2015-09-30",
    status: "vigente",
    description: "Especifica requisitos para um sistema de gestão da qualidade quando uma organização necessita demonstrar sua capacidade para fornecer produtos e serviços que atendam aos requisitos do cliente.",
    isFavorite: false,
    tags: ["ISO 9001", "SGQ", "ABNT", "qualidade"],
    linkedModules: ["Diagnóstico", "Processos", "Indicadores"],
    requiresAction: false,
  },
  {
    id: "10",
    code: "JCI 7th Ed.",
    title: "Joint Commission International — Accreditation Standards for Hospitals (7th Ed.)",
    category: "Internacional",
    type: "Manual",
    issuer: "Joint Commission International",
    publishedAt: "2020-07-01",
    status: "vigente",
    description: "Referência internacional para acreditação hospitalar. Aplicável como benchmarking para organizações com certificação ONA N3 buscando reconhecimento internacional.",
    isFavorite: false,
    tags: ["JCI", "internacional", "acreditação", "benchmark"],
    linkedModules: ["Acreditação ONA", "Diagnóstico"],
    requiresAction: false,
  },
  {
    id: "11",
    code: "Portaria MS 1.377/2013",
    title: "Protocolos de Segurança do Paciente — Identificação, Comunicação e Cirurgia Segura",
    category: "MS",
    type: "Portaria",
    issuer: "Ministério da Saúde",
    publishedAt: "2013-07-09",
    status: "vigente",
    onaRelation: ["Capítulo 6.2", "Capítulo 6.3"],
    description: "Aprova os Protocolos de Segurança do Paciente de identificação do paciente, higiene das mãos, segurança na prescrição, uso e administração de medicamentos e cirurgia segura.",
    isFavorite: true,
    tags: ["protocolo", "cirurgia segura", "identificação", "medicamentos"],
    linkedModules: ["Protocolos Gerenciados", "Notificação de Eventos"],
    requiresAction: false,
  },
  {
    id: "12",
    code: "RDC 17/2010",
    title: "Boas Práticas de Fabricação de Medicamentos",
    category: "ANVISA",
    type: "RDC",
    issuer: "ANVISA",
    publishedAt: "2010-04-16",
    status: "revogada",
    description: "Norma revogada. Substituída por RDC 301/2019 que dispõe sobre as Diretrizes Gerais de Boas Práticas de Fabricação de Medicamentos.",
    isFavorite: false,
    tags: ["medicamentos", "farmácia", "BPF", "ANVISA"],
    linkedModules: ["Processos"],
    requiresAction: false,
  },
  {
    id: "13",
    code: "ISO 15189:2022",
    title: "Requisitos de qualidade e competência para laboratórios médicos",
    category: "Internacional",
    type: "Norma",
    issuer: "International Organization for Standardization",
    publishedAt: "2022-12-01",
    status: "vigente",
    description: "Especifica os requisitos de qualidade e competência para laboratórios médicos. Edição 2022 com requisitos atualizados para gestão do risco e imparcialidade.",
    isFavorite: false,
    tags: ["laboratório", "ISO 15189", "qualidade", "diagnóstico"],
    linkedModules: ["Indicadores", "Processos"],
    requiresAction: false,
  },
  {
    id: "14",
    code: "Lei 13.709/2018",
    title: "Lei Geral de Proteção de Dados Pessoais (LGPD)",
    category: "MS",
    type: "Norma",
    issuer: "Presidência da República",
    publishedAt: "2018-08-14",
    updatedAt: "2019-12-27",
    status: "vigente",
    description: "Dispõe sobre o tratamento de dados pessoais, inclusive nos meios digitais, por pessoa natural ou por pessoa jurídica de direito público ou privado.",
    isFavorite: true,
    tags: ["LGPD", "dados pessoais", "privacidade", "compliance"],
    linkedModules: ["Administração", "Documentos"],
    requiresAction: true,
  },
];

// ─── Config ───────────────────────────────────────────────────────────────────

const categoryConfig: Record<RefCategory, { color: string; bg: string; icon: React.ReactNode }> = {
  ONA: { color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/30", icon: <Shield className="w-4 h-4" /> },
  ANVISA: { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", icon: <Activity className="w-4 h-4" /> },
  CFM: { color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/30", icon: <Stethoscope className="w-4 h-4" /> },
  COFEN: { color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/30", icon: <Stethoscope className="w-4 h-4" /> },
  ANS: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", icon: <Building2 className="w-4 h-4" /> },
  MS: { color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/30", icon: <AlertTriangle className="w-4 h-4" /> },
  ABNT: { color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30", icon: <FileText className="w-4 h-4" /> },
  Internacional: { color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/30", icon: <Globe className="w-4 h-4" /> },
};

const statusConfig = {
  vigente: { label: "Vigente", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  revogada: { label: "Revogada", color: "bg-red-500/15 text-red-400 border-red-500/30" },
  em_revisao: { label: "Em Revisão", color: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Referencias() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<RefCategory | "Todas">("Todas");
  const [selectedStatus, setSelectedStatus] = useState<"todos" | "vigente" | "revogada" | "em_revisao">("vigente");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(
    new Set(normativeRefs.filter((r) => r.isFavorite).map((r) => r.id))
  );
  const [selected, setSelected] = useState<NormativeRef | null>(normativeRefs[0]);

  const categories: Array<RefCategory | "Todas"> = [
    "Todas", "ONA", "ANVISA", "MS", "ANS", "CFM", "COFEN", "ABNT", "Internacional",
  ];

  const filtered = normativeRefs.filter((ref) => {
    const matchSearch =
      search === "" ||
      ref.title.toLowerCase().includes(search.toLowerCase()) ||
      ref.code.toLowerCase().includes(search.toLowerCase()) ||
      ref.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchCategory = selectedCategory === "Todas" || ref.category === selectedCategory;
    const matchStatus = selectedStatus === "todos" || ref.status === selectedStatus;
    const matchFav = !showFavoritesOnly || favorites.has(ref.id);
    return matchSearch && matchCategory && matchStatus && matchFav;
  });

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const requiresActionCount = normativeRefs.filter((r) => r.requiresAction).length;
  const vigenteCount = normativeRefs.filter((r) => r.status === "vigente").length;
  const favCount = favorites.size;

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">Referências Normativas</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Legislações, normas e manuais aplicáveis à instituição
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800">
              <RefreshCw className="w-4 h-4 mr-2" />
              Sincronizar
            </Button>
            <Button size="sm" className="bg-orange-600 hover:bg-orange-500 text-white">
              <Download className="w-4 h-4 mr-2" />
              Exportar Lista
            </Button>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-4 gap-4 mt-5">
          {[
            { label: "Referências Mapeadas", value: normativeRefs.length, icon: <BookMarked className="w-4 h-4" />, color: "text-orange-400" },
            { label: "Vigentes", value: vigenteCount, icon: <CheckCircle2 className="w-4 h-4" />, color: "text-emerald-400" },
            { label: "Requerem Ação", value: requiresActionCount, icon: <AlertTriangle className="w-4 h-4" />, color: "text-amber-400" },
            { label: "Favoritas", value: favCount, icon: <Star className="w-4 h-4" />, color: "text-sky-400" },
          ].map((kpi) => (
            <Card key={kpi.label} className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-slate-700/60", kpi.color)}>
                  {kpi.icon}
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-100">{kpi.value}</p>
                  <p className="text-xs text-slate-400">{kpi.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Content — split layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — list */}
        <div className="w-[420px] flex-shrink-0 border-r border-slate-800 flex flex-col">
          {/* Search & filters */}
          <div className="p-4 border-b border-slate-800 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar norma, código ou tag..."
                className="pl-9 bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select
                className="flex-1 text-xs bg-slate-800 border border-slate-700 rounded-md text-slate-300 px-2 py-1.5"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
              >
                <option value="todos">Todos os status</option>
                <option value="vigente">Vigente</option>
                <option value="revogada">Revogada</option>
                <option value="em_revisao">Em Revisão</option>
              </select>
              <button
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs border transition-colors flex items-center gap-1.5",
                  showFavoritesOnly
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                )}
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              >
                <Star className="w-3.5 h-3.5" />
                Favoritas
              </button>
            </div>
            {/* Category pills */}
            <div className="flex flex-wrap gap-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-xs border transition-colors",
                    selectedCategory === cat
                      ? "bg-orange-500/20 border-orange-500/50 text-orange-300"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                <BookOpen className="w-10 h-10 mb-3 opacity-40" />
                <p className="text-sm">Nenhuma referência encontrada</p>
              </div>
            )}
            {filtered.map((ref) => {
              const catCfg = categoryConfig[ref.category];
              const isFav = favorites.has(ref.id);
              return (
                <button
                  key={ref.id}
                  onClick={() => setSelected(ref)}
                  className={cn(
                    "w-full text-left p-4 border-b border-slate-800 transition-colors hover:bg-slate-800/50",
                    selected?.id === ref.id && "bg-slate-800/80 border-l-2 border-l-orange-500"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("p-1.5 rounded-lg border mt-0.5", catCfg.bg, catCfg.color)}>
                      {catCfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-mono text-orange-400">{ref.code}</span>
                        <div className="flex items-center gap-1.5">
                          {ref.requiresAction && (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                          )}
                          <span className={cn(
                            "text-xs px-1.5 py-0.5 rounded-full border",
                            statusConfig[ref.status].color
                          )}>
                            {statusConfig[ref.status].label}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-snug">{ref.title}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={cn("text-xs", catCfg.color)}>{ref.category}</span>
                        <span className="text-slate-600">·</span>
                        <span className="text-xs text-slate-500">{ref.type}</span>
                        {isFav && <Star className="w-3 h-3 text-amber-400 ml-auto fill-amber-400" />}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right panel — detail */}
        {selected ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Title area */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-mono text-orange-400 font-semibold">{selected.code}</span>
                  <Badge
                    className={cn("text-xs border", statusConfig[selected.status].color)}
                    variant="outline"
                  >
                    {statusConfig[selected.status].label}
                  </Badge>
                  {selected.requiresAction && (
                    <Badge className="text-xs bg-amber-500/20 text-amber-400 border-amber-500/30" variant="outline">
                      Requer Ação
                    </Badge>
                  )}
                </div>
                <h2 className="text-lg font-bold text-slate-100 leading-snug">{selected.title}</h2>
                <p className="text-sm text-slate-400 mt-1">Emissor: {selected.issuer}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleFavorite(selected.id)}
                  className="p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                >
                  {favorites.has(selected.id)
                    ? <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    : <StarOff className="w-4 h-4" />
                  }
                </button>
              </div>
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Categoria", value: selected.category, icon: <Tag className="w-3.5 h-3.5" /> },
                { label: "Tipo", value: selected.type, icon: <FileText className="w-3.5 h-3.5" /> },
                {
                  label: "Publicado em",
                  value: new Date(selected.publishedAt).toLocaleDateString("pt-BR"),
                  icon: <CalendarDays className="w-3.5 h-3.5" />,
                },
              ].map((meta) => (
                <Card key={meta.label} className="bg-slate-800/40 border-slate-700/50">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      {meta.icon}
                      <span className="text-xs">{meta.label}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-200">{meta.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Description */}
            <Card className="bg-slate-800/40 border-slate-700/50">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm text-slate-300">Descrição / Ementa</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-sm text-slate-400 leading-relaxed">{selected.description}</p>
              </CardContent>
            </Card>

            {/* ONA Relations */}
            {selected.onaRelation && selected.onaRelation.length > 0 && (
              <Card className="bg-sky-500/5 border-sky-500/20">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm text-sky-400 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Capítulos ONA Relacionados
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="flex flex-wrap gap-2">
                    {selected.onaRelation.map((rel) => (
                      <span
                        key={rel}
                        className="px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-medium"
                      >
                        {rel}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Linked Modules */}
            <Card className="bg-slate-800/40 border-slate-700/50">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Módulos Impactados
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="flex flex-wrap gap-2">
                  {selected.linkedModules.map((mod) => (
                    <button
                      key={mod}
                      className="px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-300 text-xs font-medium flex items-center gap-1 hover:bg-orange-500/20 transition-colors"
                    >
                      {mod}
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card className="bg-slate-800/40 border-slate-700/50">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="flex flex-wrap gap-1.5">
                  {selected.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-400 text-xs border border-slate-700"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Action required */}
            {selected.requiresAction && (
              <Card className="bg-amber-500/5 border-amber-500/20">
                <CardContent className="p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-300">Ação Necessária</p>
                    <p className="text-xs text-amber-400/80 mt-1">
                      Esta norma requer atenção ativa da equipe de qualidade. Verifique o plano de adequação
                      e os prazos de conformidade associados.
                    </p>
                    <Button size="sm" className="mt-3 bg-amber-600 hover:bg-amber-500 text-white">
                      Ver Plano de Adequação
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <div className="text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Selecione uma referência para ver detalhes</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
