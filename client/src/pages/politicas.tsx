import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { printReport } from "@/lib/print-pdf";
import {
  BookOpen, Plus, Search, Filter, Download, ChevronRight,
  CheckCircle2, Clock, AlertCircle, FileText, Eye,
  Calendar, Users, Building2, TrendingUp, Edit, Star
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type DocStatus = "Vigente" | "Em revisão" | "Vencida" | "Rascunho";
type DocType = "Política" | "Regimento" | "Manual" | "POP" | "Norma";

interface PolicyDoc {
  id: number;
  code: string;
  title: string;
  type: DocType;
  status: DocStatus;
  version: string;
  approvedDate: string;
  nextReview: string;
  responsible: string;
  scope: string;
  isONA: boolean;
  description: string;
  category: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const documents: PolicyDoc[] = [
  {
    id: 1, code: "POL-001", title: "Política de Segurança do Paciente",
    type: "Política", status: "Vigente", version: "3.1",
    approvedDate: "2026-01-10", nextReview: "2027-01-10",
    responsible: "Dir. Qualidade", scope: "Toda a instituição",
    isONA: true, category: "Segurança",
    description: "Define as diretrizes institucionais para promoção da cultura de segurança do paciente, gestão de eventos adversos e metas de segurança.",
  },
  {
    id: 2, code: "REG-001", title: "Regimento Interno do NSP",
    type: "Regimento", status: "Em revisão", version: "2.0 (rev.)",
    approvedDate: "2023-03-01", nextReview: "2026-03-01",
    responsible: "NSP", scope: "Núcleo de Segurança do Paciente",
    isONA: true, category: "Comissão",
    description: "Regulamenta o funcionamento, composição, atribuições e rotinas do Núcleo de Segurança do Paciente conforme RDC 36/2013.",
  },
  {
    id: 3, code: "POL-002", title: "Política de Gestão de Riscos",
    type: "Política", status: "Vigente", version: "2.3",
    approvedDate: "2025-06-15", nextReview: "2026-06-15",
    responsible: "Dir. Qualidade + Risco", scope: "Toda a instituição",
    isONA: true, category: "Gestão",
    description: "Estabelece a metodologia de identificação, avaliação, tratamento e monitoramento de riscos institucionais clínicos e operacionais.",
  },
  {
    id: 4, code: "MAN-001", title: "Manual da Qualidade Institucional",
    type: "Manual", status: "Vigente", version: "4.0",
    approvedDate: "2025-09-01", nextReview: "2026-09-01",
    responsible: "Dir. Qualidade", scope: "Toda a instituição",
    isONA: true, category: "Qualidade",
    description: "Documento mestre que descreve o Sistema de Gestão da Qualidade, estrutura organizacional e compromisso com a melhoria contínua.",
  },
  {
    id: 5, code: "POL-003", title: "Política de Privacidade e Proteção de Dados (LGPD)",
    type: "Política", status: "Vigente", version: "1.2",
    approvedDate: "2025-08-20", nextReview: "2026-08-20",
    responsible: "DPO — Dr. Alexandre", scope: "Toda a instituição",
    isONA: false, category: "Compliance",
    description: "Define os princípios e regras para coleta, tratamento, armazenamento e compartilhamento de dados pessoais de pacientes e colaboradores.",
  },
  {
    id: 6, code: "REG-002", title: "Regimento Interno da CCIH",
    type: "Regimento", status: "Vigente", version: "3.0",
    approvedDate: "2025-04-10", nextReview: "2026-04-10",
    responsible: "CCIH", scope: "Comissão de Controle de Infecção",
    isONA: true, category: "Comissão",
    description: "Estrutura, composição e responsabilidades da Comissão de Controle de Infecção Hospitalar conforme Portaria MS 2616/1998.",
  },
  {
    id: 7, code: "POL-004", title: "Política de Humanização (PNH)",
    type: "Política", status: "Vigente", version: "2.1",
    approvedDate: "2025-11-05", nextReview: "2026-11-05",
    responsible: "COHUM", scope: "Toda a instituição",
    isONA: true, category: "Assistência",
    description: "Implementação dos princípios da Política Nacional de Humanização, com foco no cuidado centrado no paciente e na gestão participativa.",
  },
  {
    id: 8, code: "NOR-001", title: "Norma de Controle de Documentos e Registros",
    type: "Norma", status: "Vigente", version: "2.0",
    approvedDate: "2026-02-01", nextReview: "2027-02-01",
    responsible: "Dir. Qualidade", scope: "Toda a instituição",
    isONA: true, category: "Qualidade",
    description: "Estabelece os critérios para elaboração, revisão, aprovação, distribuição, arquivamento e obsolescência de documentos institucionais.",
  },
  {
    id: 9, code: "POL-005", title: "Política de Gestão de Pessoas",
    type: "Política", status: "Vencida", version: "1.4",
    approvedDate: "2024-01-15", nextReview: "2025-01-15",
    responsible: "RH", scope: "Toda a instituição",
    isONA: true, category: "Gestão",
    description: "Define as diretrizes para recrutamento, seleção, integração, avaliação de desempenho e desenvolvimento dos colaboradores.",
  },
  {
    id: 10, code: "MAN-002", title: "Manual de Boas Práticas em Farmácia",
    type: "Manual", status: "Em revisão", version: "2.1 (rev.)",
    approvedDate: "2024-07-01", nextReview: "2025-07-01",
    responsible: "Farm. Pedro", scope: "Farmácia",
    isONA: false, category: "Assistência",
    description: "Boas práticas para dispensação, armazenamento, controle de estoque e uso seguro de medicamentos.",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusMeta(s: DocStatus) {
  switch (s) {
    case "Vigente":     return { cls: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" };
    case "Em revisão":  return { cls: "bg-amber-100 text-amber-700 border-amber-200",       dot: "bg-amber-500" };
    case "Vencida":     return { cls: "bg-rose-100 text-rose-700 border-rose-200",           dot: "bg-rose-500" };
    case "Rascunho":    return { cls: "bg-slate-100 text-slate-600 border-slate-200",       dot: "bg-slate-400" };
  }
}

function typeMeta(t: DocType) {
  switch (t) {
    case "Política":   return "bg-violet-50 text-violet-700 border-violet-200";
    case "Regimento":  return "bg-sky-50 text-sky-700 border-sky-200";
    case "Manual":     return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "POP":        return "bg-teal-50 text-teal-700 border-teal-200";
    case "Norma":      return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Politicas() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [selected, setSelected] = useState<PolicyDoc | null>(null);
  const [showNovoForm, setShowNovoForm] = useState(false);

  const filtered = documents.filter((d) => {
    const matchSearch =
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || d.status === filterStatus;
    const matchType = filterType === "all" || d.type === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const vigente = documents.filter((d) => d.status === "Vigente").length;
  const emRevisao = documents.filter((d) => d.status === "Em revisão").length;
  const vencida = documents.filter((d) => d.status === "Vencida").length;
  const onaCount = documents.filter((d) => d.isONA).length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Page Header ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-3">
            <span className="hover:text-slate-700 cursor-pointer" onClick={() => navigate("/")}>Início</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-700 font-medium">Políticas & Regimentos</span>
            <Badge className="ml-2 bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs px-2 py-0.5">Módulo 14</Badge>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <BookOpen className="w-7 h-7 text-indigo-500" />
                Políticas & Regimentos
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Gestão de documentos normativos institucionais · Políticas, regimentos, manuais e normas
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button variant="outline" className="border-slate-200 text-slate-600 gap-2 text-sm" onClick={() => printReport({ title: "Relatório de Políticas e Regimentos", subtitle: "Documentos normativos institucionais vigentes", module: "Políticas & Regimentos", columns: [{ label: "Documento", key: "doc" }, { label: "Tipo", key: "tipo" }, { label: "Versão", key: "versao" }, { label: "Revisão", key: "revisao" }, { label: "Status", key: "status" }], rows: [{ doc: "Política de Segurança do Paciente", tipo: "Política", versao: "v4.2", revisao: "Jun/2026", status: "✓ Vigente" }, { doc: "Regimento Interno da Diretoria", tipo: "Regimento", versao: "v2.0", revisao: "Dez/2025", status: "✓ Vigente" }, { doc: "Manual de Qualidade Institucional", tipo: "Manual", versao: "v5.1", revisao: "Mar/2026", status: "✓ Vigente" }, { doc: "Política de Privacidade e LGPD", tipo: "Política", versao: "v1.3", revisao: "Jan/2026", status: "✓ Vigente" }, { doc: "Norma de Gestão de Documentos", tipo: "Norma", versao: "v3.0", revisao: "Set/2025", status: "⚠ Revisão vencida" }] })}>
                <Download className="w-4 h-4" />
                Exportar
              </Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 text-sm" onClick={() => setShowNovoForm(v => !v)}>
                <Plus className="w-4 h-4" />
                Novo Documento
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-6">
        {/* ── Novo Documento Form ── */}
        {showNovoForm && (
          <Card className="bg-white border border-indigo-200 shadow-sm mb-5">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-bold text-slate-800">Novo Documento</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Título</label>
                  <input className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Título do documento" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Tipo</label>
                  <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300">
                    <option>Política</option>
                    <option>Regimento</option>
                    <option>Manual</option>
                    <option>POP</option>
                    <option>Norma</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Responsável</label>
                  <input className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Nome do responsável" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" className="border-slate-200 text-slate-600 text-xs" onClick={() => setShowNovoForm(false)}>
                  Cancelar
                </Button>
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs" onClick={() => { toast.success("Criado com sucesso!"); setShowNovoForm(false); }}>
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Vigentes", value: vigente, icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, bg: "bg-emerald-50", text: "text-emerald-700" },
            { label: "Em Revisão", value: emRevisao, icon: <Clock className="w-5 h-5 text-amber-500" />, bg: "bg-amber-50", text: "text-amber-700" },
            { label: "Vencidas", value: vencida, icon: <AlertCircle className="w-5 h-5 text-rose-500" />, bg: "bg-rose-50", text: "text-rose-700" },
            { label: "Exigidos pela ONA", value: onaCount, icon: <Star className="w-5 h-5 text-indigo-500" />, bg: "bg-indigo-50", text: "text-indigo-700" },
          ].map((k) => (
            <Card key={k.label} className="bg-white border border-slate-200 shadow-sm">
              <CardContent className="py-4 px-5 flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", k.bg)}>{k.icon}</div>
                <div>
                  <p className="text-xs text-slate-500">{k.label}</p>
                  <p className={cn("text-2xl font-bold", k.text)}>{k.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Vencidas alert */}
        {vencida > 0 && (
          <Card className="bg-rose-50 border border-rose-200 shadow-sm mb-5">
            <CardContent className="py-3 px-5 flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <p className="text-sm text-rose-800">
                <strong>{vencida} documento(s)</strong> com prazo de revisão vencido — ação imediata recomendada para atendimento ONA.
              </p>
              <Button size="sm" className="ml-auto bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1.5 flex-shrink-0" onClick={() => { setFilterStatus("Vencida"); toast.info("Filtrando documentos com prazo de revisão vencido"); }}>
                Ver vencidos
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar documento..."
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 w-56"
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />Status:
          </div>
          {["all", "Vigente", "Em revisão", "Vencida"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border transition-all",
                filterStatus === s
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
              )}
            >
              {s === "all" ? "Todos" : s}
            </button>
          ))}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">Tipo:</div>
          {["all", "Política", "Regimento", "Manual", "Norma"].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border transition-all",
                filterType === t
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
              )}
            >
              {t === "all" ? "Todos" : t}
            </button>
          ))}
        </div>

        <div className="flex gap-5">
          {/* ── Document List ── */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              {/* Table header */}
              <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-0 px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <span className="w-24">Código</span>
                <span>Documento</span>
                <span className="px-4 text-center">Tipo</span>
                <span className="px-4 text-center">Status</span>
                <span className="px-4 text-center">Próx. Revisão</span>
                <span className="px-4 text-center">Ações</span>
              </div>

              <div className="divide-y divide-slate-100">
                {filtered.map((doc) => {
                  const sm = statusMeta(doc.status);
                  const tm = typeMeta(doc.type);
                  const isSelected = selected?.id === doc.id;
                  const isOverdue = doc.status === "Vencida";
                  return (
                    <div
                      key={doc.id}
                      onClick={() => setSelected(isSelected ? null : doc)}
                      className={cn(
                        "grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-0 px-4 py-3.5 cursor-pointer transition-colors hover:bg-slate-50",
                        isSelected && "bg-indigo-50",
                        isOverdue && "border-l-4 border-l-rose-400"
                      )}
                    >
                      <div className="w-24 flex items-center">
                        <span className="text-xs font-mono font-bold text-slate-400">{doc.code}</span>
                      </div>
                      <div className="min-w-0 pr-4">
                        <p className="text-sm font-medium text-slate-700 truncate">{doc.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                          <span>v{doc.version}</span>
                          <span>·</span>
                          <span>{doc.responsible}</span>
                          {doc.isONA && (
                            <>
                              <span>·</span>
                              <Star className="w-3 h-3 text-indigo-400" />
                              <span className="text-indigo-500">ONA</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="px-4 flex items-center justify-center">
                        <Badge className={cn("text-xs border px-2 py-0.5", tm)}>{doc.type}</Badge>
                      </div>
                      <div className="px-4 flex items-center justify-center">
                        <Badge className={cn("text-xs border px-2 py-0.5 flex items-center gap-1", sm.cls)}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", sm.dot)} />
                          {doc.status}
                        </Badge>
                      </div>
                      <div className="px-4 flex items-center justify-center">
                        <span className={cn("text-xs font-medium", isOverdue ? "text-rose-600 font-bold" : "text-slate-500")}>
                          {new Date(doc.nextReview).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <div className="px-4 flex items-center gap-1.5 justify-center">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Visualizar" onClick={(e) => { e.stopPropagation(); toast.info("Abrindo..."); }}>
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Editar" onClick={(e) => { e.stopPropagation(); toast.info("Abrindo editor..."); }}>
                          <Edit className="w-3.5 h-3.5 text-slate-500" />
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {filtered.length === 0 && (
                  <div className="py-12 text-center text-slate-400 text-sm">
                    Nenhum documento encontrado.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Detail Panel ── */}
          {selected && (
            <div className="w-72 flex-shrink-0">
              <Card className="bg-white border border-indigo-200 shadow-sm sticky top-4">
                <CardHeader className="pb-3 pt-5 px-5 border-b border-slate-100">
                  <p className="text-xs font-mono text-slate-400 mb-0.5">{selected.code}</p>
                  <CardTitle className="text-sm font-bold text-slate-800 leading-snug">{selected.title}</CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5 pt-4 space-y-4">
                  <p className="text-xs text-slate-500 leading-relaxed">{selected.description}</p>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {[
                      { label: "Tipo", value: selected.type },
                      { label: "Versão", value: selected.version },
                      { label: "Responsável", value: selected.responsible },
                      { label: "Abrangência", value: selected.scope },
                      { label: "Categoria", value: selected.category },
                      { label: "Aprovado em", value: new Date(selected.approvedDate).toLocaleDateString("pt-BR") },
                      { label: "Próx. revisão", value: new Date(selected.nextReview).toLocaleDateString("pt-BR") },
                    ].map((f) => (
                      <div key={f.label} className="col-span-2">
                        <p className="text-slate-400 font-medium">{f.label}</p>
                        <p className="text-slate-700 font-semibold text-xs">{f.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2 text-xs" onClick={() => toast.info("Abrindo...")}>
                      <Eye className="w-3.5 h-3.5" />
                      Visualizar documento
                    </Button>
                    <Button size="sm" variant="outline" className="w-full border-slate-200 text-slate-600 gap-2 text-xs" onClick={() => toast.success("Operação realizada com sucesso!")}>
                      <Edit className="w-3.5 h-3.5" />
                      Iniciar revisão
                    </Button>
                    <Button size="sm" variant="outline" className="w-full border-slate-200 text-slate-600 gap-2 text-xs" onClick={() => toast.info("Exportando...")}>
                      <Download className="w-3.5 h-3.5" />
                      Baixar PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
