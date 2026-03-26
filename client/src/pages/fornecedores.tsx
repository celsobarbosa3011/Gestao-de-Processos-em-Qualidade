import { useState } from "react";
import { useTenant } from "@/hooks/use-tenant";
import {
  Package,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  FileText,
  Shield,
  Star,
  CalendarDays,
  User,
  Building2,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type FornStatus = "qualificado" | "em_avaliacao" | "suspenso" | "desqualificado";
type FornCategoria =
  | "medicamentos"
  | "materiais"
  | "servicos"
  | "equipamentos"
  | "alimentacao"
  | "limpeza";

interface Fornecedor {
  id: number;
  razaoSocial: string;
  cnpj: string;
  categoria: FornCategoria;
  status: FornStatus;
  pontuacao: number;
  vencimentoContrato: string;
  responsavel: string;
  ultimaAvaliacao: string;
  critico: boolean;
  nota?: string;
}

interface Avaliacao {
  id: number;
  fornecedorId: number;
  fornecedor: string;
  entrega: number;
  qualidade: number;
  prazo: number;
  documentacao: number;
  notaFinal: number;
  avaliador: string;
  data: string;
  pendente: boolean;
}

interface Contrato {
  id: number;
  fornecedorId: number;
  fornecedor: string;
  objeto: string;
  valorMensal: number;
  inicio: string;
  fim: string;
}

interface DocChecklist {
  nome: string;
  presente: boolean;
}

interface ChecklistFornecedor {
  fornecedorId: number;
  fornecedor: string;
  docs: DocChecklist[];
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const mockFornecedores: Fornecedor[] = [
  {
    id: 1,
    razaoSocial: "Distribuidora Médica Ltda",
    cnpj: "12.345.678/0001-90",
    categoria: "medicamentos",
    status: "qualificado",
    pontuacao: 92,
    vencimentoContrato: "2026-08-15",
    responsavel: "Ana Costa",
    ultimaAvaliacao: "2026-02-10",
    critico: true,
  },
  {
    id: 2,
    razaoSocial: "Luva Cirúrgica Ind.",
    cnpj: "23.456.789/0001-01",
    categoria: "materiais",
    status: "qualificado",
    pontuacao: 88,
    vencimentoContrato: "2026-06-30",
    responsavel: "Carlos Lima",
    ultimaAvaliacao: "2026-01-20",
    critico: false,
  },
  {
    id: 3,
    razaoSocial: "Serviços de Limpeza SA",
    cnpj: "34.567.890/0001-12",
    categoria: "limpeza",
    status: "qualificado",
    pontuacao: 79,
    vencimentoContrato: "2026-04-10",
    responsavel: "Mariana Souza",
    ultimaAvaliacao: "2026-02-28",
    critico: false,
  },
  {
    id: 4,
    razaoSocial: "Manutenção Equipamentos XYZ",
    cnpj: "45.678.901/0001-23",
    categoria: "equipamentos",
    status: "qualificado",
    pontuacao: 85,
    vencimentoContrato: "2026-07-20",
    responsavel: "Roberto Alves",
    ultimaAvaliacao: "2026-03-01",
    critico: true,
  },
  {
    id: 5,
    razaoSocial: "Catering Hospitalar",
    cnpj: "56.789.012/0001-34",
    categoria: "alimentacao",
    status: "em_avaliacao",
    pontuacao: 71,
    vencimentoContrato: "2026-09-01",
    responsavel: "Fernanda Dias",
    ultimaAvaliacao: "2026-03-10",
    critico: false,
  },
  {
    id: 6,
    razaoSocial: "Oxigênio Medical Gases",
    cnpj: "67.890.123/0001-45",
    categoria: "materiais",
    status: "qualificado",
    pontuacao: 95,
    vencimentoContrato: "2026-12-31",
    responsavel: "Paulo Ferreira",
    ultimaAvaliacao: "2026-02-15",
    critico: true,
  },
  {
    id: 7,
    razaoSocial: "Fornecedor B",
    cnpj: "78.901.234/0001-56",
    categoria: "materiais",
    status: "suspenso",
    pontuacao: 45,
    vencimentoContrato: "2026-05-01",
    responsavel: "Juliana Torres",
    ultimaAvaliacao: "2026-02-05",
    critico: false,
    nota: "Auditoria reprovada 02/2026",
  },
  {
    id: 8,
    razaoSocial: "Laundry Hospital Service",
    cnpj: "89.012.345/0001-67",
    categoria: "servicos",
    status: "qualificado",
    pontuacao: 82,
    vencimentoContrato: "2026-10-15",
    responsavel: "Eduardo Nunes",
    ultimaAvaliacao: "2026-01-30",
    critico: false,
  },
  {
    id: 9,
    razaoSocial: "Reagentes Lab Ltda",
    cnpj: "90.123.456/0001-78",
    categoria: "materiais",
    status: "qualificado",
    pontuacao: 89,
    vencimentoContrato: "2026-11-20",
    responsavel: "Luciana Pinto",
    ultimaAvaliacao: "2026-03-05",
    critico: true,
  },
  {
    id: 10,
    razaoSocial: "Consultoria em TI Saúde",
    cnpj: "01.234.567/0001-89",
    categoria: "servicos",
    status: "em_avaliacao",
    pontuacao: 68,
    vencimentoContrato: "2026-08-31",
    responsavel: "Thiago Rocha",
    ultimaAvaliacao: "2026-03-12",
    critico: false,
  },
];

const mockAvaliacoes: Avaliacao[] = [
  {
    id: 1,
    fornecedorId: 5,
    fornecedor: "Catering Hospitalar",
    entrega: 72,
    qualidade: 70,
    prazo: 75,
    documentacao: 68,
    notaFinal: 71,
    avaliador: "Fernanda Dias",
    data: "2026-03-10",
    pendente: true,
  },
  {
    id: 2,
    fornecedorId: 10,
    fornecedor: "Consultoria em TI Saúde",
    entrega: 65,
    qualidade: 70,
    prazo: 68,
    documentacao: 70,
    notaFinal: 68,
    avaliador: "Thiago Rocha",
    data: "2026-03-12",
    pendente: true,
  },
  {
    id: 3,
    fornecedorId: 1,
    fornecedor: "Distribuidora Médica Ltda",
    entrega: 95,
    qualidade: 92,
    prazo: 90,
    documentacao: 91,
    notaFinal: 92,
    avaliador: "Ana Costa",
    data: "2026-02-10",
    pendente: false,
  },
  {
    id: 4,
    fornecedorId: 6,
    fornecedor: "Oxigênio Medical Gases",
    entrega: 98,
    qualidade: 95,
    prazo: 94,
    documentacao: 93,
    notaFinal: 95,
    avaliador: "Paulo Ferreira",
    data: "2026-02-15",
    pendente: false,
  },
  {
    id: 5,
    fornecedorId: 9,
    fornecedor: "Reagentes Lab Ltda",
    entrega: 90,
    qualidade: 89,
    prazo: 88,
    documentacao: 90,
    notaFinal: 89,
    avaliador: "Luciana Pinto",
    data: "2026-03-05",
    pendente: false,
  },
];

const mockContratos: Contrato[] = [
  {
    id: 1,
    fornecedorId: 1,
    fornecedor: "Distribuidora Médica Ltda",
    objeto: "Fornecimento de medicamentos hospitalares",
    valorMensal: 85000,
    inicio: "2025-08-15",
    fim: "2026-08-15",
  },
  {
    id: 2,
    fornecedorId: 3,
    fornecedor: "Serviços de Limpeza SA",
    objeto: "Serviços de higienização e limpeza hospitalar",
    valorMensal: 32000,
    inicio: "2025-04-10",
    fim: "2026-04-10",
  },
  {
    id: 3,
    fornecedorId: 4,
    fornecedor: "Manutenção Equipamentos XYZ",
    objeto: "Manutenção preventiva e corretiva de equipamentos médicos",
    valorMensal: 21000,
    inicio: "2025-07-20",
    fim: "2026-07-20",
  },
  {
    id: 4,
    fornecedorId: 6,
    fornecedor: "Oxigênio Medical Gases",
    objeto: "Fornecimento de gases medicinais (O2, CO2, N2O)",
    valorMensal: 18500,
    inicio: "2025-12-31",
    fim: "2026-12-31",
  },
  {
    id: 5,
    fornecedorId: 7,
    fornecedor: "Fornecedor B",
    objeto: "Fornecimento de materiais cirúrgicos",
    valorMensal: 9000,
    inicio: "2025-05-01",
    fim: "2026-05-01",
  },
  {
    id: 6,
    fornecedorId: 8,
    fornecedor: "Laundry Hospital Service",
    objeto: "Serviços de lavanderia hospitalar",
    valorMensal: 14000,
    inicio: "2025-10-15",
    fim: "2026-10-15",
  },
  {
    id: 7,
    fornecedorId: 9,
    fornecedor: "Reagentes Lab Ltda",
    objeto: "Reagentes e insumos para laboratório clínico",
    valorMensal: 27000,
    inicio: "2025-11-20",
    fim: "2026-11-20",
  },
];

const mockChecklists: ChecklistFornecedor[] = [
  {
    fornecedorId: 1,
    fornecedor: "Distribuidora Médica Ltda",
    docs: [
      { nome: "CNPJ ativo", presente: true },
      { nome: "Alvará sanitário", presente: true },
      { nome: "ISO 9001 / Certificação", presente: true },
      { nome: "Apólice de seguro", presente: true },
      { nome: "Licença ANVISA", presente: true },
    ],
  },
  {
    fornecedorId: 4,
    fornecedor: "Manutenção Equipamentos XYZ",
    docs: [
      { nome: "CNPJ ativo", presente: true },
      { nome: "Alvará sanitário", presente: true },
      { nome: "ISO 9001 / Certificação", presente: false },
      { nome: "Apólice de seguro", presente: true },
      { nome: "Licença ANVISA", presente: false },
    ],
  },
  {
    fornecedorId: 6,
    fornecedor: "Oxigênio Medical Gases",
    docs: [
      { nome: "CNPJ ativo", presente: true },
      { nome: "Alvará sanitário", presente: true },
      { nome: "ISO 9001 / Certificação", presente: true },
      { nome: "Apólice de seguro", presente: true },
      { nome: "Licença ANVISA", presente: true },
    ],
  },
  {
    fornecedorId: 9,
    fornecedor: "Reagentes Lab Ltda",
    docs: [
      { nome: "CNPJ ativo", presente: true },
      { nome: "Alvará sanitário", presente: true },
      { nome: "ISO 9001 / Certificação", presente: true },
      { nome: "Apólice de seguro", presente: false },
      { nome: "Licença ANVISA", presente: true },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusLabel(s: FornStatus): string {
  const map: Record<FornStatus, string> = {
    qualificado: "Qualificado",
    em_avaliacao: "Em Avaliação",
    suspenso: "Suspenso",
    desqualificado: "Desqualificado",
  };
  return map[s];
}

function statusVariant(
  s: FornStatus
): "default" | "secondary" | "destructive" | "outline" {
  if (s === "qualificado") return "default";
  if (s === "em_avaliacao") return "secondary";
  if (s === "suspenso") return "destructive";
  return "outline";
}

function categoriaLabel(c: FornCategoria): string {
  const map: Record<FornCategoria, string> = {
    medicamentos: "Medicamentos",
    materiais: "Materiais",
    servicos: "Serviços",
    equipamentos: "Equipamentos",
    alimentacao: "Alimentação",
    limpeza: "Limpeza",
  };
  return map[c];
}

function scoreColor(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  return "bg-red-500";
}

function scoreTextColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-600";
}

function diasParaVencer(dataFim: string): number {
  const hoje = new Date("2026-03-26");
  const fim = new Date(dataFim);
  return Math.ceil((fim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(d: string): string {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function formatCurrency(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Fornecedores() {
  const { isAdmin } = useTenant();
  const [activeTab, setActiveTab] = useState("fornecedores");

  const displayFornecedores = isAdmin ? mockFornecedores : [];
  const displayAvaliacoes = isAdmin ? mockAvaliacoes : [];
  const displayContratos = isAdmin ? mockContratos : [];
  const displayChecklists = isAdmin ? mockChecklists : [];

  const totalFornecedores = isAdmin ? 43 : 0;
  const totalQualificados = isAdmin ? 38 : 0;
  const emAvaliacao = isAdmin ? 3 : 0;
  const contratosVencendo = isAdmin ? 4 : 0;

  const pendentes = displayAvaliacoes.filter((a) => a.pendente);
  const recentes = displayAvaliacoes.filter((a) => !a.pendente);

  if (!isAdmin) {
    return (
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <Package className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Qualificação de Fornecedores</h1>
            <p className="text-sm text-muted-foreground">
              Gestão, avaliação e qualificação de fornecedores críticos — Requisito ONA
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground">
          <Package className="w-16 h-16 opacity-20" />
          <p className="text-lg font-medium">Acesso restrito</p>
          <p className="text-sm">Apenas administradores podem visualizar os fornecedores.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
          <Package className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Qualificação de Fornecedores</h1>
          <p className="text-sm text-muted-foreground">
            Gestão, avaliação e qualificação de fornecedores críticos — Requisito ONA
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Fornecedores</p>
                <p className="text-3xl font-bold mt-1">{totalFornecedores}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Qualificados</p>
                <p className="text-3xl font-bold mt-1 text-green-600">{totalQualificados}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Em Avaliação</p>
                <p className="text-3xl font-bold mt-1 text-yellow-600">{emAvaliacao}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Contratos Vencendo (30d)</p>
                <p className="text-3xl font-bold mt-1 text-red-600">{contratosVencendo}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-xl">
          <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
          <TabsTrigger value="avaliacoes">Avaliações</TabsTrigger>
          <TabsTrigger value="contratos">Contratos</TabsTrigger>
          <TabsTrigger value="qualificacao">Qualificação</TabsTrigger>
        </TabsList>

        {/* ── Tab: Fornecedores ── */}
        <TabsContent value="fornecedores" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lista de Fornecedores</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Razão Social</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">CNPJ</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Categoria</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground w-40">Score</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Responsável</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Última Avaliação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayFornecedores.map((f) => (
                      <tr key={f.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{f.razaoSocial}</span>
                            {f.critico && (
                              <Badge variant="destructive" className="text-xs px-1.5 py-0">
                                Crítico
                              </Badge>
                            )}
                            {f.nota && (
                              <span className="text-xs text-muted-foreground italic">
                                — {f.nota}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{f.cnpj}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs">
                            {categoriaLabel(f.categoria)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusVariant(f.status)}>
                            {statusLabel(f.status)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <Progress
                                value={f.pontuacao}
                                className={cn("h-2", scoreColor(f.pontuacao))}
                              />
                            </div>
                            <span className={cn("text-xs font-semibold w-8 text-right", scoreTextColor(f.pontuacao))}>
                              {f.pontuacao}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {f.responsavel}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(f.ultimaAvaliacao)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Avaliações ── */}
        <TabsContent value="avaliacoes" className="mt-4 space-y-6">
          {pendentes.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                Avaliações Pendentes
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendentes.map((av) => (
                  <Card key={av.id} className="border-yellow-200 dark:border-yellow-800">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{av.fornecedor}</CardTitle>
                        <Badge variant="secondary" className="text-xs">Pendente</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {[
                          { label: "Entrega", valor: av.entrega },
                          { label: "Qualidade", valor: av.qualidade },
                          { label: "Prazo", valor: av.prazo },
                          { label: "Documentação", valor: av.documentacao },
                        ].map((c) => (
                          <div key={c.label}>
                            <div className="flex justify-between mb-1">
                              <span className="text-muted-foreground">{c.label}</span>
                              <span className={cn("font-semibold", scoreTextColor(c.valor))}>
                                {c.valor}
                              </span>
                            </div>
                            <Progress value={c.valor} className={cn("h-1.5", scoreColor(c.valor))} />
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <User className="w-3 h-3" />
                          {av.avaliador}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <CalendarDays className="w-3 h-3" />
                          {formatDate(av.data)}
                        </div>
                        <div className={cn("font-bold text-base", scoreTextColor(av.notaFinal))}>
                          Nota: {av.notaFinal}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {recentes.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Avaliações Recentes
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentes.map((av) => (
                  <Card key={av.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold">{av.fornecedor}</CardTitle>
                        <Badge variant="default" className="text-xs">Concluída</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {[
                          { label: "Entrega", valor: av.entrega },
                          { label: "Qualidade", valor: av.qualidade },
                          { label: "Prazo", valor: av.prazo },
                          { label: "Documentação", valor: av.documentacao },
                        ].map((c) => (
                          <div key={c.label}>
                            <div className="flex justify-between mb-1">
                              <span className="text-muted-foreground">{c.label}</span>
                              <span className={cn("font-semibold", scoreTextColor(c.valor))}>
                                {c.valor}
                              </span>
                            </div>
                            <Progress value={c.valor} className={cn("h-1", scoreColor(c.valor))} />
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                        <span>{av.avaliador}</span>
                        <span>{formatDate(av.data)}</span>
                        <span className={cn("font-bold text-sm", scoreTextColor(av.notaFinal))}>
                          {av.notaFinal}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Tab: Contratos ── */}
        <TabsContent value="contratos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contratos Ativos</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fornecedor</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Objeto</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Valor Mensal</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Início</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fim</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayContratos.map((c) => {
                      const dias = diasParaVencer(c.fim);
                      const vencendo = dias <= 30;
                      const vencido = dias < 0;
                      return (
                        <tr key={c.id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-medium">{c.fornecedor}</td>
                          <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{c.objeto}</td>
                          <td className="px-4 py-3 font-semibold">{formatCurrency(c.valorMensal)}</td>
                          <td className="px-4 py-3 text-muted-foreground">{formatDate(c.inicio)}</td>
                          <td className="px-4 py-3 text-muted-foreground">{formatDate(c.fim)}</td>
                          <td className="px-4 py-3">
                            {vencido ? (
                              <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                                <XCircle className="w-3 h-3" />
                                Vencido
                              </Badge>
                            ) : vencendo ? (
                              <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                                <AlertCircle className="w-3 h-3" />
                                Vence em {dias}d
                              </Badge>
                            ) : (
                              <Badge variant="default" className="flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3" />
                                Vigente
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Qualificação ── */}
        <TabsContent value="qualificacao" className="mt-4">
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4 text-orange-500" />
            <span>Checklist de documentos obrigatórios para fornecedores críticos.</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayChecklists.map((cl) => {
              const totalDocs = cl.docs.length;
              const presentesDocs = cl.docs.filter((d) => d.presente).length;
              const pct = Math.round((presentesDocs / totalDocs) * 100);
              return (
                <Card key={cl.fornecedorId}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Star className="w-4 h-4 text-orange-500" />
                        {cl.fornecedor}
                        <Badge variant="destructive" className="text-xs px-1.5 py-0">Crítico</Badge>
                      </CardTitle>
                      <span className={cn("text-sm font-bold", scoreTextColor(pct))}>
                        {presentesDocs}/{totalDocs}
                      </span>
                    </div>
                    <Progress value={pct} className={cn("h-2 mt-2", scoreColor(pct))} />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {cl.docs.map((doc) => (
                      <div
                        key={doc.nome}
                        className="flex items-center gap-2 text-sm"
                      >
                        {doc.presente ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        )}
                        <span className={cn(doc.presente ? "text-foreground" : "text-muted-foreground line-through")}>
                          {doc.nome}
                        </span>
                        {!doc.presente && (
                          <Badge variant="destructive" className="text-xs px-1 py-0 ml-auto">
                            Pendente
                          </Badge>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
