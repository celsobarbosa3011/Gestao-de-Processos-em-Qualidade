/**
 * setor-form.tsx
 * Formulários Setoriais — Auto-preenchimento do Sistema
 * Cada setor preenche seus dados e o sistema popula todos os módulos automaticamente.
 */

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTenant } from "@/hooks/use-tenant";
import {
  SECTORS,
  saveSectorSubmission,
  getSectorSubmissions,
  populateSystemFromSector,
  SectorSubmission,
  Sector,
} from "@/lib/sector-mapper";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Building2,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MinusCircle,
  Zap,
  ChevronRight,
  BarChart3,
  Activity,
  Users,
  Shield,
  Heart,
  Stethoscope,
  Pill,
  Wrench,
  RotateCcw,
  Star,
  CheckSquare,
  TrendingUp,
  FileText,
  ArrowLeft,
  Send,
} from "lucide-react";

// ─── Icon map ─────────────────────────────────────────────────────────────────

const SECTOR_ICONS: Record<string, React.ReactNode> = {
  Pill: <Pill className="w-6 h-6" />,
  Activity: <Activity className="w-6 h-6" />,
  Shield: <Shield className="w-6 h-6" />,
  Heart: <Heart className="w-6 h-6" />,
  Wrench: <Wrench className="w-6 h-6" />,
  Users: <Users className="w-6 h-6" />,
  BarChart3: <BarChart3 className="w-6 h-6" />,
  Stethoscope: <Stethoscope className="w-6 h-6" />,
};

// ─── Compliance button config ─────────────────────────────────────────────────

const COMPLIANCE_BUTTONS = [
  {
    value: "sim",
    label: "Sim",
    icon: CheckCircle2,
    cls: "border-slate-200 text-slate-600 hover:border-emerald-400 hover:text-emerald-700",
    active: "bg-emerald-500 border-emerald-500 text-white shadow-md",
  },
  {
    value: "parcial",
    label: "Parcial",
    icon: AlertTriangle,
    cls: "border-slate-200 text-slate-600 hover:border-amber-400 hover:text-amber-700",
    active: "bg-amber-500 border-amber-500 text-white shadow-md",
  },
  {
    value: "nao",
    label: "Não",
    icon: XCircle,
    cls: "border-slate-200 text-slate-600 hover:border-red-400 hover:text-red-700",
    active: "bg-red-500 border-red-500 text-white shadow-md",
  },
  {
    value: "na",
    label: "N/A",
    icon: MinusCircle,
    cls: "border-slate-200 text-slate-500 hover:border-slate-400",
    active: "bg-slate-400 border-slate-400 text-white shadow-md",
  },
];

// ─── Submission result ────────────────────────────────────────────────────────

interface SubmitResult {
  indicadoresCount: number;
  riscosCount: number;
  politicasCount: number;
  capasCount: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SetorForm() {
  const { isAdmin, validatedData, companyName } = useTenant();

  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitterName, setSubmitterName] = useState("");
  const [formCompanyName, setFormCompanyName] = useState("");
  const [activeTab, setActiveTab] = useState<"conformidades" | "metricas">("conformidades");
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [submissions, setSubmissions] = useState<SectorSubmission[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing submissions
  useEffect(() => {
    setSubmissions(getSectorSubmissions());
  }, []);

  // Pre-fill company name
  useEffect(() => {
    const name =
      validatedData?.companyInfo?.companyName || companyName || "";
    if (name && !formCompanyName) {
      setFormCompanyName(name);
    }
  }, [validatedData, companyName]);

  // When sector changes, load draft answers if they exist
  useEffect(() => {
    if (!selectedSector) return;
    const draftKey = `sector_draft_${selectedSector.id}`;
    const draft = localStorage.getItem(draftKey);
    if (draft) {
      try {
        setAnswers(JSON.parse(draft));
      } catch {
        setAnswers({});
      }
    } else {
      setAnswers({});
    }
    setSubmitResult(null);
    setActiveTab("conformidades");
  }, [selectedSector]);

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  // Progress calculation
  const totalQuestions = selectedSector?.questions.length ?? 0;
  const answeredCount = Object.keys(answers).filter(
    (k) => answers[k] !== "" && selectedSector?.questions.some((q) => q.id === k)
  ).length;
  const progress = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  // Split questions by type
  const complianceQuestions =
    selectedSector?.questions.filter((q) => q.type === "compliance") ?? [];
  const metricQuestions =
    selectedSector?.questions.filter((q) => q.type === "metric") ?? [];

  const answeredCompliance = complianceQuestions.filter(
    (q) => answers[q.id]
  ).length;
  const answeredMetrics = metricQuestions.filter((q) => answers[q.id]).length;

  const handleSaveDraft = () => {
    if (!selectedSector) return;
    const draftKey = `sector_draft_${selectedSector.id}`;
    localStorage.setItem(draftKey, JSON.stringify(answers));
    toast.success("Rascunho salvo!", {
      description: `Formulário do setor ${selectedSector.name} salvo localmente.`,
    });
  };

  const handleSubmit = () => {
    if (!selectedSector) return;
    if (!formCompanyName.trim()) {
      toast.error("Informe o nome da empresa antes de enviar.");
      return;
    }
    if (!submitterName.trim()) {
      toast.error("Informe seu nome (responsável pelo preenchimento).");
      return;
    }
    if (answeredCount === 0) {
      toast.error("Responda pelo menos uma pergunta antes de enviar.");
      return;
    }

    setIsSubmitting(true);
    try {
      const submission: SectorSubmission = {
        id: `${selectedSector.id}_${Date.now()}`,
        sectorId: selectedSector.id,
        sectorName: selectedSector.name,
        companyName: formCompanyName.trim(),
        submittedBy: submitterName.trim(),
        submittedAt: new Date().toISOString(),
        answers,
      };

      // Save submission
      saveSectorSubmission(submission);
      setSubmissions(getSectorSubmissions());

      // Generate and save system data
      const result = populateSystemFromSector(submission, formCompanyName);

      // Count new items generated
      const prevData = validatedData;
      const prevInd = prevData?.indicadores?.length ?? 0;
      const prevRiscos = prevData?.riscos?.length ?? 0;
      const prevPols = prevData?.politicas?.length ?? 0;
      const prevCapas = prevData?.capas?.length ?? 0;

      setSubmitResult({
        indicadoresCount: (result.indicadores?.length ?? 0) - prevInd,
        riscosCount: (result.riscos?.length ?? 0) - prevRiscos,
        politicasCount: (result.politicas?.length ?? 0) - prevPols,
        capasCount: (result.capas?.length ?? 0) - prevCapas,
      });

      // Clear draft
      localStorage.removeItem(`sector_draft_${selectedSector.id}`);

      toast.success(`Setor ${selectedSector.name} enviado com sucesso!`, {
        description: "O sistema foi atualizado com os dados do setor.",
      });
    } catch (err) {
      toast.error("Erro ao enviar formulário. Tente novamente.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyToSystem = (submission: SectorSubmission) => {
    try {
      populateSystemFromSector(submission, submission.companyName);
      toast.success(`Dados do setor ${submission.sectorName} aplicados ao sistema!`);
    } catch {
      toast.error("Erro ao aplicar dados. Tente novamente.");
    }
  };

  const handleReset = () => {
    setSelectedSector(null);
    setAnswers({});
    setSubmitResult(null);
    setActiveTab("conformidades");
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <ClipboardCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Formulários Setoriais
            </h1>
            <p className="text-sm text-slate-500">
              Auto-preenchimento do Sistema — QHealth One 2026
            </p>
          </div>
          <Badge className="ml-auto bg-violet-100 text-violet-700 border-violet-200">
            <Zap className="w-3 h-3 mr-1" />
            Novo
          </Badge>
        </div>
        <p className="text-slate-600 mt-2 text-sm">
          Cada setor preenche seus dados e o sistema popula automaticamente
          todos os módulos — indicadores, riscos, políticas e CAPAs.
        </p>
      </div>

      {/* Admin Panel — existing submissions */}
      {isAdmin && submissions.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-amber-800">
              <Star className="w-4 h-4" />
              Painel Admin — Formulários Recebidos ({submissions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {submissions.map((sub) => {
                const sec = SECTORS.find((s) => s.id === sub.sectorId);
                return (
                  <div
                    key={sub.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border bg-white",
                      sec?.borderColor ?? "border-slate-200"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br text-white",
                          sec?.gradientFrom ?? "from-slate-400",
                          sec?.gradientTo ?? "to-slate-600"
                        )}
                      >
                        {sec ? SECTOR_ICONS[sec.iconName] ?? <Building2 className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {sub.sectorName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {sub.submittedBy} •{" "}
                          {sub.companyName} •{" "}
                          {new Date(sub.submittedAt).toLocaleDateString("pt-BR")} •{" "}
                          {Object.keys(sub.answers).length} respostas
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-amber-400 text-amber-700 hover:bg-amber-100"
                      onClick={() => handleApplyToSystem(sub)}
                    >
                      <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                      Aplicar ao Sistema
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success result after submission */}
      {submitResult && selectedSector && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckSquare className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-emerald-800">
                  Formulário enviado com sucesso!
                </h2>
                <p className="text-sm text-emerald-600 mt-1">
                  Os dados do setor{" "}
                  <strong>{selectedSector.name}</strong> foram integrados ao
                  sistema.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-lg">
                <ResultCard
                  label="Indicadores"
                  count={submitResult.indicadoresCount}
                  color="text-blue-700"
                  bg="bg-blue-50 border-blue-200"
                  icon={<BarChart3 className="w-4 h-4" />}
                />
                <ResultCard
                  label="Riscos"
                  count={submitResult.riscosCount}
                  color="text-red-700"
                  bg="bg-red-50 border-red-200"
                  icon={<AlertTriangle className="w-4 h-4" />}
                />
                <ResultCard
                  label="Políticas"
                  count={submitResult.politicasCount}
                  color="text-indigo-700"
                  bg="bg-indigo-50 border-indigo-200"
                  icon={<FileText className="w-4 h-4" />}
                />
                <ResultCard
                  label="CAPAs"
                  count={submitResult.capasCount}
                  color="text-amber-700"
                  bg="bg-amber-50 border-amber-200"
                  icon={<CheckCircle2 className="w-4 h-4" />}
                />
              </div>

              <div className="flex gap-3 flex-wrap justify-center">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Preencher outro setor
                </Button>
                <Button
                  onClick={() => (window.location.href = "/home")}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
                >
                  <ChevronRight className="w-4 h-4 mr-1" />
                  Ver no sistema
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sector picker */}
      {!submitResult && (
        <>
          {!selectedSector ? (
            <div>
              <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">
                Selecione o setor para preenchimento
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {SECTORS.map((sector) => {
                  const hasSubmission = submissions.some(
                    (s) => s.sectorId === sector.id
                  );
                  return (
                    <button
                      key={sector.id}
                      onClick={() => setSelectedSector(sector)}
                      className={cn(
                        "relative text-left rounded-xl border-2 p-4 transition-all duration-200",
                        "hover:shadow-md hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-violet-400",
                        sector.bgColor,
                        sector.borderColor
                      )}
                    >
                      {hasSubmission && (
                        <span className="absolute top-2 right-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </span>
                      )}
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center text-white mb-3 bg-gradient-to-br shadow-md",
                          sector.gradientFrom,
                          sector.gradientTo
                        )}
                      >
                        {SECTOR_ICONS[sector.iconName] ?? (
                          <Building2 className="w-5 h-5" />
                        )}
                      </div>
                      <p className={cn("font-semibold text-sm leading-tight", sector.textColor)}>
                        {sector.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {sector.subtitle}
                      </p>
                      <p className="text-xs text-slate-400 mt-2">
                        {sector.questions.length} perguntas
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Sector form */
            <div className="space-y-6">
              {/* Back button + sector header */}
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedSector(null);
                    setAnswers({});
                    setSubmitResult(null);
                  }}
                  className="text-slate-500 hover:text-slate-800"
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  Voltar
                </Button>
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-white bg-gradient-to-br shadow-md",
                      selectedSector.gradientFrom,
                      selectedSector.gradientTo
                    )}
                  >
                    {SECTOR_ICONS[selectedSector.iconName] ?? (
                      <Building2 className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900">
                      {selectedSector.name}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {selectedSector.subtitle}
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      "ml-auto text-xs",
                      selectedSector.badgeColor
                    )}
                  >
                    {answeredCount}/{totalQuestions} respondidas
                  </Badge>
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                  <span>Progresso do preenchimento</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Metadata inputs */}
              <Card className="border-slate-200">
                <CardContent className="pt-4 pb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-600 block mb-1.5">
                        Nome da Empresa / Instituição *
                      </label>
                      <input
                        type="text"
                        value={formCompanyName}
                        onChange={(e) => setFormCompanyName(e.target.value)}
                        placeholder="Ex.: Hospital Santa Cruz"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 block mb-1.5">
                        Seu Nome (Responsável pelo preenchimento) *
                      </label>
                      <input
                        type="text"
                        value={submitterName}
                        onChange={(e) => setSubmitterName(e.target.value)}
                        placeholder="Ex.: Maria Silva — Farmacêutica RT"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tab selector */}
              <div className="flex gap-2 border-b border-slate-200 pb-0">
                <button
                  onClick={() => setActiveTab("conformidades")}
                  className={cn(
                    "px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px",
                    activeTab === "conformidades"
                      ? `border-violet-500 text-violet-700 ${selectedSector.bgColor}`
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  )}
                >
                  <ClipboardCheck className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                  Conformidades
                  <span
                    className={cn(
                      "ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-semibold",
                      activeTab === "conformidades"
                        ? "bg-violet-100 text-violet-700"
                        : "bg-slate-100 text-slate-500"
                    )}
                  >
                    {answeredCompliance}/{complianceQuestions.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("metricas")}
                  className={cn(
                    "px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px",
                    activeTab === "metricas"
                      ? `border-violet-500 text-violet-700 ${selectedSector.bgColor}`
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  )}
                >
                  <BarChart3 className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                  Métricas
                  <span
                    className={cn(
                      "ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-semibold",
                      activeTab === "metricas"
                        ? "bg-violet-100 text-violet-700"
                        : "bg-slate-100 text-slate-500"
                    )}
                  >
                    {answeredMetrics}/{metricQuestions.length}
                  </span>
                </button>
              </div>

              {/* Questions */}
              <div className="space-y-4">
                {activeTab === "conformidades" && (
                  <>
                    {complianceQuestions.length === 0 ? (
                      <p className="text-slate-500 text-sm text-center py-8">
                        Este setor não possui perguntas de conformidade.
                      </p>
                    ) : (
                      complianceQuestions.map((q, idx) => {
                        const currentAnswer = answers[q.id] ?? "";
                        return (
                          <Card
                            key={q.id}
                            className={cn(
                              "border transition-all duration-200",
                              currentAnswer
                                ? currentAnswer === "sim"
                                  ? "border-emerald-200 bg-emerald-50/30"
                                  : currentAnswer === "parcial"
                                  ? "border-amber-200 bg-amber-50/30"
                                  : currentAnswer === "nao"
                                  ? "border-red-200 bg-red-50/30"
                                  : "border-slate-200 bg-slate-50/30"
                                : "border-slate-200 bg-white"
                            )}
                          >
                            <CardContent className="pt-4 pb-4">
                              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                                <div className="flex-1">
                                  <div className="flex items-start gap-2 mb-1">
                                    <span className="text-xs font-bold text-slate-400 mt-0.5 shrink-0">
                                      {String(idx + 1).padStart(2, "0")}
                                    </span>
                                    <div>
                                      <p className="text-sm font-medium text-slate-800 leading-snug">
                                        {q.text}
                                      </p>
                                      {q.weight === 3 && (
                                        <Badge className="mt-1 text-xs bg-red-100 text-red-700 border-red-200">
                                          Obrigatório
                                        </Badge>
                                      )}
                                      {q.weight === 2 && (
                                        <Badge className="mt-1 text-xs bg-amber-100 text-amber-700 border-amber-200">
                                          Crítico
                                        </Badge>
                                      )}
                                      {q.help && (
                                        <p className="text-xs text-slate-400 mt-1 italic">
                                          {q.help}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-1.5 shrink-0">
                                  {COMPLIANCE_BUTTONS.map((btn) => {
                                    const Icon = btn.icon;
                                    const isActive = currentAnswer === btn.value;
                                    return (
                                      <button
                                        key={btn.value}
                                        onClick={() =>
                                          handleAnswer(
                                            q.id,
                                            isActive ? "" : btn.value
                                          )
                                        }
                                        className={cn(
                                          "flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all duration-150",
                                          isActive ? btn.active : btn.cls
                                        )}
                                      >
                                        <Icon className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">
                                          {btn.label}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </>
                )}

                {activeTab === "metricas" && (
                  <>
                    {metricQuestions.length === 0 ? (
                      <p className="text-slate-500 text-sm text-center py-8">
                        Este setor não possui perguntas de métricas.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {metricQuestions.map((q, idx) => {
                          const currentVal = answers[q.id] ?? "";
                          const numVal = parseFloat(currentVal);
                          const hasValue = !isNaN(numVal) && currentVal !== "";

                          let statusColor = "";
                          let statusLabel = "";
                          if (hasValue && q.metricTarget !== undefined && q.metricTargetDirection) {
                            if (q.metricTargetDirection === "higher") {
                              if (numVal >= q.metricTarget) {
                                statusColor = "text-emerald-600";
                                statusLabel = "Dentro da Meta";
                              } else if (numVal >= q.metricTarget * 0.75) {
                                statusColor = "text-amber-600";
                                statusLabel = "Atenção";
                              } else {
                                statusColor = "text-red-600";
                                statusLabel = "Abaixo da Meta";
                              }
                            } else {
                              if (numVal <= q.metricTarget) {
                                statusColor = "text-emerald-600";
                                statusLabel = "Dentro da Meta";
                              } else if (numVal <= q.metricTarget * 1.5) {
                                statusColor = "text-amber-600";
                                statusLabel = "Atenção";
                              } else {
                                statusColor = "text-red-600";
                                statusLabel = "Acima do Limite";
                              }
                            }
                          }

                          return (
                            <Card
                              key={q.id}
                              className={cn(
                                "border transition-all duration-200",
                                hasValue
                                  ? statusLabel === "Dentro da Meta"
                                    ? "border-emerald-200 bg-emerald-50/30"
                                    : statusLabel === "Atenção"
                                    ? "border-amber-200 bg-amber-50/30"
                                    : "border-red-200 bg-red-50/30"
                                  : "border-slate-200 bg-white"
                              )}
                            >
                              <CardContent className="pt-4 pb-4">
                                <div className="flex items-start gap-2 mb-3">
                                  <span className="text-xs font-bold text-slate-400 mt-0.5 shrink-0">
                                    {String(idx + 1).padStart(2, "0")}
                                  </span>
                                  <p className="text-sm font-medium text-slate-800 leading-snug">
                                    {q.text}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={currentVal}
                                    onChange={(e) =>
                                      handleAnswer(q.id, e.target.value)
                                    }
                                    placeholder="0"
                                    className="w-32 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                                  />
                                  <span className="text-xs text-slate-500 font-medium">
                                    {q.metricUnit}
                                  </span>
                                  {q.metricTarget !== undefined && (
                                    <span className="text-xs text-slate-400 ml-1">
                                      Meta:{" "}
                                      <strong>
                                        {q.metricTargetDirection === "lower"
                                          ? "≤"
                                          : "≥"}
                                        {q.metricTarget}
                                      </strong>
                                    </span>
                                  )}
                                </div>
                                {hasValue && statusLabel && (
                                  <p
                                    className={cn(
                                      "text-xs font-semibold mt-2",
                                      statusColor
                                    )}
                                  >
                                    {statusLabel}
                                  </p>
                                )}
                                {q.help && (
                                  <p className="text-xs text-slate-400 mt-1.5 italic">
                                    {q.help}
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  className="flex-1 sm:flex-none border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Salvar Rascunho
                </Button>
                <div className="flex-1" />
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || answeredCount === 0}
                  className={cn(
                    "flex-1 sm:flex-none bg-gradient-to-r text-white shadow-md transition-all",
                    selectedSector.gradientFrom.replace("from-", "from-"),
                    selectedSector.gradientTo.replace("to-", "to-"),
                    "hover:opacity-90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Activity className="w-4 h-4 mr-2 animate-pulse" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar para Análise
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Sub-component: Result card ───────────────────────────────────────────────

function ResultCard({
  label,
  count,
  color,
  bg,
  icon,
}: {
  label: string;
  count: number;
  color: string;
  bg: string;
  icon: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-xl border p-3 text-center", bg)}>
      <div className={cn("flex justify-center mb-1", color)}>{icon}</div>
      <p className={cn("text-2xl font-bold", color)}>{count}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}
