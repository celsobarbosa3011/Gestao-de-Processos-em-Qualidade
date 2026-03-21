import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  FileText, GitCommit, PenLine, Lock,
  CheckCircle2, Construction, ChevronRight, Eye, Calendar, User
} from "lucide-react";

const features = [
  {
    icon: <FileText className="w-6 h-6 text-slate-600" />,
    title: "Políticas Institucionais",
    description: "Biblioteca centralizada de políticas, regimentos internos, normas internas e regulamentos com categorização e busca avançada.",
    status: "V2",
  },
  {
    icon: <GitCommit className="w-6 h-6 text-slate-700" />,
    title: "Workflow de Aprovação",
    description: "Fluxo digital de aprovação com etapas configuráveis: elaboração, revisão técnica, validação jurídica e aprovação da diretoria.",
    status: "V2",
  },
  {
    icon: <PenLine className="w-6 h-6 text-slate-500" />,
    title: "Assinatura Digital",
    description: "Assinatura digital de documentos com validade jurídica, carimbo de tempo e hash SHA-256 para integridade.",
    status: "V2",
  },
  {
    icon: <Lock className="w-6 h-6 text-slate-800" />,
    title: "Versionamento Imutável",
    description: "Histórico imutável de versões com blockchain interno — nenhuma versão pode ser alterada após publicação.",
    status: "V2",
  },
  {
    icon: <Eye className="w-6 h-6 text-slate-600" />,
    title: "Confirmação de Leitura",
    description: "Distribuição controlada com confirmação de leitura por colaborador e relatório de cobertura por unidade.",
    status: "V2",
  },
  {
    icon: <CheckCircle2 className="w-6 h-6 text-slate-500" />,
    title: "Revisão Periódica Automática",
    description: "Alertas automáticos para revisão periódica de documentos com base na periodicidade configurada por tipo.",
    status: "V3",
  },
];

const policies = [
  {
    title: "Política de Segurança do Paciente",
    code: "POL-001",
    tipo: "Política",
    versao: "v3.2",
    status: "Vigente",
    revisao: "Jan/2026",
    aprovadoPor: "Diretoria Técnica",
    statusColor: "bg-green-100 text-green-700 border-green-200",
  },
  {
    title: "Regimento Interno do Corpo Clínico",
    code: "REG-002",
    tipo: "Regimento",
    versao: "v2.0",
    status: "Vigente",
    revisao: "Mar/2026",
    aprovadoPor: "Conselho Diretor",
    statusColor: "bg-green-100 text-green-700 border-green-200",
  },
  {
    title: "Norma de Prevenção e Controle de IRAS",
    code: "NOR-008",
    tipo: "Norma",
    versao: "v4.1",
    status: "Vigente",
    revisao: "Jun/2025",
    aprovadoPor: "CCIH",
    statusColor: "bg-amber-100 text-amber-700 border-amber-200",
  },
  {
    title: "Política de Gestão de Resíduos (PGRSS)",
    code: "POL-012",
    tipo: "Política",
    versao: "v1.5",
    status: "Em revisão",
    revisao: "Abr/2026",
    aprovadoPor: "Em aprovação",
    statusColor: "bg-orange-100 text-orange-700 border-orange-200",
  },
  {
    title: "Código de Ética e Conduta",
    code: "COD-001",
    tipo: "Código",
    versao: "v2.1",
    status: "Vigente",
    revisao: "Dez/2025",
    aprovadoPor: "Diretoria Geral",
    statusColor: "bg-green-100 text-green-700 border-green-200",
  },
  {
    title: "Manual de Biossegurança",
    code: "MAN-004",
    tipo: "Manual",
    versao: "v3.0",
    status: "Vigente",
    revisao: "Ago/2025",
    aprovadoPor: "SESMT",
    statusColor: "bg-green-100 text-green-700 border-green-200",
  },
];

const tipoColors: Record<string, string> = {
  "Política": "bg-slate-100 text-slate-600 border-slate-200",
  "Regimento": "bg-blue-100 text-blue-700 border-blue-200",
  "Norma": "bg-violet-100 text-violet-700 border-violet-200",
  "Código": "bg-rose-100 text-rose-700 border-rose-200",
  "Manual": "bg-teal-100 text-teal-700 border-teal-200",
};

const roadmap = [
  { version: "V1 (Atual)", item: "Upload de documentos nos processos", done: true },
  { version: "V2", item: "Biblioteca de políticas com workflow de aprovação e assinatura digital", done: false },
  { version: "V2", item: "Versionamento imutável e confirmação de leitura", done: false },
  { version: "V3", item: "Revisão periódica automática e integração com treinamentos", done: false },
];

export default function PoliticasPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shadow-lg flex-shrink-0">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-800">Módulo 14 — Políticas & Regimentos</h1>
              <Badge className="bg-amber-100 text-amber-800 border border-amber-300 font-medium">
                <Construction className="w-3 h-3 mr-1" /> Em desenvolvimento
              </Badge>
              <Badge variant="outline" className="text-slate-700 border-slate-400">V2</Badge>
            </div>
            <p className="text-slate-500 mt-1 max-w-2xl">
              Biblioteca centralizada de políticas institucionais, regimentos e normas internas com workflow de aprovação, assinatura digital e versionamento imutável.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="border-slate-400 text-slate-700 hover:bg-slate-100 self-start md:self-auto"
          disabled
        >
          Em breve
        </Button>
      </div>

      {/* Preview Banner */}
      <div className="rounded-2xl border border-slate-300 bg-white/70 backdrop-blur p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <Construction className="w-5 h-5 text-amber-500" />
          <span className="font-semibold text-slate-700">Prévia da Biblioteca — Módulo em Construção (V2)</span>
        </div>
        <p className="text-slate-500 text-sm">
          Os documentos abaixo representam a estrutura real da biblioteca de políticas. O módulo completo com workflows e assinatura digital estará disponível na versão 2.
        </p>
      </div>

      {/* Policy Library */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-700">Biblioteca de Documentos — {policies.length} documentos</h2>
          <Button size="sm" disabled className="opacity-50 cursor-not-allowed bg-slate-600 text-white">
            + Novo Documento
          </Button>
        </div>
        <div className="space-y-3">
          {policies.map((pol, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="font-semibold text-slate-800 text-sm truncate">{pol.title}</p>
                      <Badge variant="outline" className={cn("text-xs flex-shrink-0", tipoColors[pol.tipo] || "")}>
                        {pol.tipo}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                      <span className="font-mono">{pol.code}</span>
                      <span>{pol.versao}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Revisão: {pol.revisao}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" /> {pol.aprovadoPor}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge className={cn("text-xs", pol.statusColor)}>{pol.status}</Badge>
                  <Button size="sm" variant="ghost" className="text-slate-400 hover:text-slate-600 p-1.5" disabled>
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Cards */}
      <div>
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Funcionalidades Planejadas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <Card key={i} className="border border-slate-200 bg-white/80 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-200">
                    {f.icon}
                  </div>
                  <Badge variant="outline" className={cn(
                    "text-xs font-semibold",
                    f.status === "V2" ? "text-slate-600 border-slate-400" : "text-purple-600 border-purple-300"
                  )}>
                    {f.status}
                  </Badge>
                </div>
                <CardTitle className="text-sm font-semibold text-slate-800 mt-2">{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500 leading-relaxed">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Roadmap */}
      <div>
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Roadmap</h2>
        <div className="space-y-3">
          {roadmap.map((r, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm">
              <div className={cn("w-3 h-3 rounded-full flex-shrink-0", r.done ? "bg-green-500" : "bg-slate-300")} />
              <Badge variant="outline" className={cn(
                "text-xs font-semibold flex-shrink-0",
                r.done ? "text-green-700 border-green-300 bg-green-50" : "text-slate-600 border-slate-300"
              )}>
                {r.version}
              </Badge>
              <span className={cn("text-sm", r.done ? "text-slate-700 font-medium" : "text-slate-500")}>{r.item}</span>
              {r.done && <Badge className="ml-auto bg-green-100 text-green-700 text-xs">Disponível</Badge>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
