import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Plug, Webhook, Database, Stethoscope,
  FlaskConical, Scan, Code2, Construction, ChevronRight,
  CheckCircle2, Clock, Zap
} from "lucide-react";

const features = [
  {
    icon: <Code2 className="w-6 h-6 text-purple-500" />,
    title: "API RESTful Documentada",
    description: "API REST completa com documentação Swagger/OpenAPI 3.0, autenticação OAuth 2.0 e chaves de API por aplicação.",
    status: "V3",
  },
  {
    icon: <Webhook className="w-6 h-6 text-violet-500" />,
    title: "Webhooks Configuráveis",
    description: "Configuração de webhooks para eventos do sistema — novo processo, indicador crítico, desvio, aprovação de documento.",
    status: "V3",
  },
  {
    icon: <Database className="w-6 h-6 text-purple-600" />,
    title: "HIS / ERP Integrado",
    description: "Conectores nativos para os principais sistemas HIS e ERP hospitalares — Tasy, MV, Philips, SAP.",
    status: "V3",
  },
  {
    icon: <Stethoscope className="w-6 h-6 text-violet-600" />,
    title: "HL7 / FHIR",
    description: "Suporte ao padrão internacional HL7 FHIR R4 para interoperabilidade com prontuários eletrônicos e plataformas de saúde.",
    status: "V3",
  },
  {
    icon: <FlaskConical className="w-6 h-6 text-purple-400" />,
    title: "LIS — Laboratório",
    description: "Integração com sistemas laboratoriais para importação automática de resultados e alertas de valores críticos.",
    status: "V3",
  },
  {
    icon: <Scan className="w-6 h-6 text-violet-400" />,
    title: "PACS / RIS — Imagem",
    description: "Integração com sistemas de imagem médica para consulta de laudos e exames diretamente nos processos clínicos.",
    status: "V3",
  },
];

const integrations = [
  {
    name: "API QHealth One",
    descricao: "Acesso externo via REST API documentada",
    tipo: "API",
    status: "coming",
    versao: "V3",
    icon: <Code2 className="w-5 h-5" />,
    cor: "from-purple-500 to-violet-600",
    bgCor: "bg-purple-50 border-purple-200",
    textCor: "text-purple-600",
  },
  {
    name: "Webhooks",
    descricao: "Eventos em tempo real para sistemas externos",
    tipo: "Event",
    status: "coming",
    versao: "V3",
    icon: <Webhook className="w-5 h-5" />,
    cor: "from-violet-500 to-purple-600",
    bgCor: "bg-violet-50 border-violet-200",
    textCor: "text-violet-600",
  },
  {
    name: "FHIR R4",
    descricao: "Interoperabilidade com prontuários eletrônicos",
    tipo: "Padrão",
    status: "coming",
    versao: "V3",
    icon: <Stethoscope className="w-5 h-5" />,
    cor: "from-blue-500 to-indigo-600",
    bgCor: "bg-blue-50 border-blue-200",
    textCor: "text-blue-600",
  },
  {
    name: "HIS — Tasy / MV / Philips",
    descricao: "Sincronização com sistemas hospitalares",
    tipo: "HIS",
    status: "coming",
    versao: "V3",
    icon: <Database className="w-5 h-5" />,
    cor: "from-slate-600 to-slate-800",
    bgCor: "bg-slate-50 border-slate-200",
    textCor: "text-slate-600",
  },
  {
    name: "LIS — Laboratório",
    descricao: "Resultados laboratoriais automáticos",
    tipo: "LIS",
    status: "available",
    versao: "V3",
    icon: <FlaskConical className="w-5 h-5" />,
    cor: "from-green-500 to-emerald-600",
    bgCor: "bg-green-50 border-green-200",
    textCor: "text-green-600",
  },
  {
    name: "PACS / RIS — Imagem",
    descricao: "Laudos e imagens médicas integrados",
    tipo: "PACS",
    status: "coming",
    versao: "V3",
    icon: <Scan className="w-5 h-5" />,
    cor: "from-teal-500 to-emerald-600",
    bgCor: "bg-teal-50 border-teal-200",
    textCor: "text-teal-600",
  },
  {
    name: "ERP / SAP",
    descricao: "Dados financeiros e de suprimentos",
    tipo: "ERP",
    status: "coming",
    versao: "V3",
    icon: <Database className="w-5 h-5" />,
    cor: "from-amber-500 to-orange-600",
    bgCor: "bg-amber-50 border-amber-200",
    textCor: "text-amber-600",
  },
  {
    name: "E-mail / SMTP",
    descricao: "Notificações por e-mail configurável",
    tipo: "Notificação",
    status: "connected",
    versao: "V1",
    icon: <Zap className="w-5 h-5" />,
    cor: "from-rose-500 to-pink-600",
    bgCor: "bg-rose-50 border-rose-200",
    textCor: "text-rose-600",
  },
];

const statusConfig = {
  connected: { label: "Conectado", color: "bg-green-100 text-green-700 border-green-200", icon: <CheckCircle2 className="w-3 h-3" /> },
  available: { label: "Disponível", color: "bg-blue-100 text-blue-700 border-blue-200", icon: <CheckCircle2 className="w-3 h-3" /> },
  coming: { label: "Em breve (V3)", color: "bg-slate-100 text-slate-600 border-slate-300", icon: <Clock className="w-3 h-3" /> },
};

const roadmap = [
  { version: "V1 (Atual)", item: "Notificações por e-mail e WebSocket interno", done: true },
  { version: "V2", item: "API REST parcial para leitura de dados", done: false },
  { version: "V3", item: "API completa documentada + Webhooks + HIS/ERP/FHIR/LIS/PACS", done: false },
];

export default function IntegracoesPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-50 p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg flex-shrink-0">
            <Plug className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-800">Módulo 22 — Integrações</h1>
              <Badge className="bg-amber-100 text-amber-800 border border-amber-300 font-medium">
                <Construction className="w-3 h-3 mr-1" /> Em desenvolvimento
              </Badge>
              <Badge variant="outline" className="text-purple-700 border-purple-300">V3</Badge>
            </div>
            <p className="text-slate-500 mt-1 max-w-2xl">
              API RESTful documentada, Webhooks configuráveis e conectores nativos para HIS, ERP, padrão HL7/FHIR, sistemas laboratoriais (LIS) e de imagem (PACS/RIS).
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="border-purple-300 text-purple-700 hover:bg-purple-50 self-start md:self-auto"
          disabled
        >
          Em breve
        </Button>
      </div>

      {/* Preview Banner */}
      <div className="rounded-2xl border border-purple-200 bg-white/70 backdrop-blur p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <Construction className="w-5 h-5 text-amber-500" />
          <span className="font-semibold text-slate-700">Prévia do Hub de Integrações — Módulo em Construção (V3)</span>
        </div>
        <p className="text-slate-500 text-sm">
          As integrações abaixo estão mapeadas para a versão 3 do QHealth One. O e-mail/SMTP já está ativo na versão atual. O restante estará disponível conforme o roadmap.
        </p>
      </div>

      {/* Integration Tiles */}
      <div>
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Hub de Integrações — {integrations.length} conectores</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {integrations.map((intg, i) => {
            const st = statusConfig[intg.status as keyof typeof statusConfig];
            return (
              <div key={i} className={cn(
                "rounded-2xl border p-4 hover:shadow-md transition-shadow",
                intg.bgCor
              )}>
                <div className="flex items-start justify-between mb-3">
                  <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-sm", intg.cor)}>
                    {intg.icon}
                  </div>
                  <Badge variant="outline" className="text-xs font-semibold text-slate-500 border-slate-300">{intg.versao}</Badge>
                </div>
                <p className={cn("font-bold text-sm mb-0.5", intg.textCor)}>{intg.name}</p>
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">{intg.descricao}</p>
                <Badge className={cn("text-xs flex items-center gap-1 w-fit", st.color)}>
                  {st.icon} {st.label}
                </Badge>
              </div>
            );
          })}
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
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100">
                    {f.icon}
                  </div>
                  <Badge variant="outline" className="text-xs font-semibold text-purple-600 border-purple-300">
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
