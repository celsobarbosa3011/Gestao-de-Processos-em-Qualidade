import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  GraduationCap, ClipboardCheck, QrCode, RefreshCw,
  BookOpen, Users, Construction, ChevronRight, Clock, Star
} from "lucide-react";

const features = [
  {
    icon: <BookOpen className="w-6 h-6 text-indigo-500" />,
    title: "Trilhas por Cargo",
    description: "Trilhas de aprendizagem configuradas por cargo e área — o colaborador vê apenas o que é relevante para sua função.",
    status: "V2",
  },
  {
    icon: <ClipboardCheck className="w-6 h-6 text-blue-500" />,
    title: "Pré-teste e Pós-teste",
    description: "Avaliação de conhecimento antes e após o treinamento com análise de evolução individual e por equipe.",
    status: "V2",
  },
  {
    icon: <QrCode className="w-6 h-6 text-indigo-600" />,
    title: "Certificado com QR Code",
    description: "Emissão automática de certificado digital com QR Code validável online, assinado digitalmente pela instituição.",
    status: "V2",
  },
  {
    icon: <RefreshCw className="w-6 h-6 text-blue-600" />,
    title: "Recertificação Automática",
    description: "Alertas e convocações automáticas para recertificação periódica conforme prazo de validade do treinamento.",
    status: "V2",
  },
  {
    icon: <Users className="w-6 h-6 text-indigo-400" />,
    title: "Gestão de Turmas e Presenças",
    description: "Controle de turmas presenciais e online com lista de presença digital e integração com calendário institucional.",
    status: "V3",
  },
  {
    icon: <GraduationCap className="w-6 h-6 text-blue-400" />,
    title: "Relatório de Educação Continuada",
    description: "Relatório gerencial de horas de treinamento por colaborador, unidade e período para obrigações regulatórias.",
    status: "V3",
  },
];

const trainings = [
  {
    title: "Protocolo de Sepse — Reconhecimento e Manejo",
    categoria: "Protocolo Clínico",
    cargos: ["Enfermeiro", "Médico", "Técnico de Enfermagem"],
    duracao: "4h",
    progresso: 78,
    inscritos: 42,
    status: "Ativo",
    nota: 8.7,
  },
  {
    title: "Prevenção e Controle de Infecções (PCIH)",
    categoria: "Segurança",
    cargos: ["Todos os colaboradores"],
    duracao: "2h",
    progresso: 91,
    inscritos: 128,
    status: "Ativo",
    nota: 9.1,
  },
  {
    title: "Manejo de Resíduos de Saúde — PGRSS",
    categoria: "Meio Ambiente",
    cargos: ["Higienização", "Enfermagem", "Farmácia"],
    duracao: "1h30",
    progresso: 65,
    inscritos: 37,
    status: "Ativo",
    nota: 7.9,
  },
  {
    title: "Identificação Segura do Paciente",
    categoria: "Segurança do Paciente",
    cargos: ["Todos os colaboradores assistenciais"],
    duracao: "1h",
    progresso: 55,
    inscritos: 93,
    status: "Ativo",
    nota: 8.3,
  },
  {
    title: "Prevenção de Quedas e Lesões por Pressão",
    categoria: "Protocolo Clínico",
    cargos: ["Enfermeiro", "Técnico de Enfermagem", "Fisioterapeuta"],
    duracao: "3h",
    progresso: 40,
    inscritos: 56,
    status: "Novo",
    nota: null,
  },
];

const roadmap = [
  { version: "V1 (Atual)", item: "Registro de capacitações nos processos", done: true },
  { version: "V2", item: "Trilhas por cargo com pré/pós-teste e certificado digital", done: false },
  { version: "V2", item: "Recertificação automática e convocação por e-mail/notificação", done: false },
  { version: "V3", item: "Gestão de turmas, presenças e relatório de educação continuada", done: false },
];

export default function TreinamentosPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg flex-shrink-0">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-800">Módulo 16 — Treinamentos</h1>
              <Badge className="bg-amber-100 text-amber-800 border border-amber-300 font-medium">
                <Construction className="w-3 h-3 mr-1" /> Em desenvolvimento
              </Badge>
              <Badge variant="outline" className="text-indigo-700 border-indigo-300">V2</Badge>
            </div>
            <p className="text-slate-500 mt-1 max-w-2xl">
              Trilhas de aprendizagem por cargo, pré e pós-teste, emissão de certificados com QR Code verificável e recertificação automática por vencimento.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 self-start md:self-auto"
          disabled
        >
          Em breve
        </Button>
      </div>

      {/* Preview Banner */}
      <div className="rounded-2xl border border-indigo-200 bg-white/70 backdrop-blur p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <Construction className="w-5 h-5 text-amber-500" />
          <span className="font-semibold text-slate-700">Prévia da Interface — Módulo em Construção (V2)</span>
        </div>
        <p className="text-slate-500 text-sm">
          O Módulo de Treinamentos estará disponível na versão 2. Abaixo, uma prévia dos cursos e trilhas que serão gerenciados na plataforma.
        </p>
      </div>

      {/* Training Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-700">Catálogo de Treinamentos — {trainings.length} cursos</h2>
          <Button size="sm" disabled className="opacity-50 cursor-not-allowed bg-indigo-600 text-white">
            + Novo Treinamento
          </Button>
        </div>
        <div className="space-y-4">
          {trainings.map((t, i) => (
            <Card key={i} className="border border-slate-200 bg-white/80 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-blue-100 border border-indigo-200 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-semibold text-slate-800 text-sm">{t.title}</p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {t.nota !== null && (
                          <div className="flex items-center gap-1 text-xs text-amber-600">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span className="font-bold">{t.nota}</span>
                          </div>
                        )}
                        <Badge className={cn(
                          "text-xs",
                          t.status === "Ativo" ? "bg-green-100 text-green-700 border-green-200" : "bg-blue-100 text-blue-700 border-blue-200"
                        )}>{t.status}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mb-2 flex-wrap">
                      <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50 text-xs">{t.categoria}</Badge>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{t.duracao}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{t.inscritos} inscritos</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {t.cargos.map((cargo, j) => (
                        <span key={j} className="text-xs bg-slate-100 text-slate-600 rounded-md px-2 py-0.5 border border-slate-200">{cargo}</span>
                      ))}
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-500">Conclusão geral</span>
                        <span className={cn(
                          "text-xs font-bold",
                          t.progresso >= 80 ? "text-green-600" : t.progresso >= 50 ? "text-amber-600" : "text-orange-600"
                        )}>{t.progresso}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            t.progresso >= 80 ? "bg-green-500" : t.progresso >= 50 ? "bg-amber-500" : "bg-orange-500"
                          )}
                          style={{ width: `${t.progresso}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                    {f.icon}
                  </div>
                  <Badge variant="outline" className={cn(
                    "text-xs font-semibold",
                    f.status === "V2" ? "text-indigo-600 border-indigo-300" : "text-purple-600 border-purple-300"
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
