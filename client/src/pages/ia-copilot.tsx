import { useState, useRef, useEffect } from "react";
import { useTenant } from "@/hooks/use-tenant";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Bot,
  Send,
  Sparkles,
  Award,
  FileText,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Copy,
  Download,
  RefreshCw,
  Lightbulb,
  Target,
  Building2,
  Clock,
  Star,
  Zap,
  MessageSquare,
  Search,
  TrendingUp,
  Shield,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type MessageRole = "user" | "ai";

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

interface Gap {
  label: string;
  count: string;
  severity: "critico" | "alto" | "medio";
}

interface EvidenceSuggestion {
  code: string;
  description: string;
  docType: string;
  icon: React.ReactNode;
}

interface ReportItem {
  title: string;
  format: "PDF" | "Excel";
  icon: React.ReactNode;
}

interface AuditQuestion {
  id: number;
  text: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  "📋 Gaps críticos do Nível 2",
  "🔍 Evidências faltantes na UTI",
  "📊 Gerar relatório de prontidão",
  "✅ Checklist para visita simulada",
  "⚠️ Riscos com maior risco de NC",
  "📝 Protocolo de Sepse — aderência",
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    role: "user",
    content: "Quais evidências faltam para a UTI atingir o Nível 2?",
    timestamp: new Date(Date.now() - 1000 * 60 * 8),
  },
  {
    id: "2",
    role: "ai",
    content: `Analisando os requisitos ONA 2026 para **UTI Adulto no Nível 2**, identifiquei **8 evidências críticas ausentes**:

**Cap. 2 — Gestão de Pessoas:**
• Matriz de competências da equipe de enfermagem (requisito 2.3.1) — Ausente
• Registros de treinamento em suporte avançado de vida (2.3.4) — Desatualizado (vencido em Jan/26)

**Cap. 4 — Atenção ao Paciente:**
• Protocolo de Sedação e Analgesia com indicadores de monitoramento (4.2.1) — Ausente
• Checklist de prontuário completo na admissão (4.1.3) — Parcialmente implementado

**Cap. 5 — Segurança do Paciente:**
• Relatório mensal de eventos NSP (5.1.2) — Janeiro e Fevereiro/26 pendentes
• Avaliação de risco de queda documentada (5.2.1) — Cobertura apenas 45%
• Bundle de prevenção de IRAS com registros (5.3.2) — Ausente
• Prontuário eletrônico integrado ao processo de cuidado (5.4.1) — Em implantação

💡 **Recomendação de prioridade:** Iniciar pelos treinamentos de SAV (prazo ANVISA) e protocolo de sedação, que impactam requisitos eliminatórios. Os relatórios de NSP podem ser gerados retroativamente com os dados do sistema.

Deseja que eu gere um plano de ação com responsáveis e prazos sugeridos para cada item?`,
    timestamp: new Date(Date.now() - 1000 * 60 * 7),
  },
  {
    id: "3",
    role: "user",
    content: "Gera o relatório executivo de prontidão do mês",
    timestamp: new Date(Date.now() - 1000 * 60 * 4),
  },
  {
    id: "4",
    role: "ai",
    content: `Aqui está o **Relatório Executivo de Prontidão ONA — Março/2026**:

---

**🏥 HOSPITAL GERAL | SCORE GERAL: 71% (Meta: 80%)**

**Resumo por Capítulo:**
| Capítulo | Conformidade | Status |
|---|---|---|
| Cap. 1 — Gestão Organizacional | 84% | ✅ Conforme |
| Cap. 2 — Gestão de Pessoas | 65% | ⚠️ Atenção |
| Cap. 3 — Gestão de Processos | 78% | ⚠️ Atenção |
| Cap. 4 — Atenção ao Paciente | 69% | ⚠️ Atenção |
| Cap. 5 — Segurança do Paciente | 58% | 🔴 Crítico |
| Cap. 6 — Gestão de Resultados | 73% | ⚠️ Atenção |

**🔴 Pontos Críticos que requerem ação imediata:**
1. 23 evidências com vencimento ou ausência total (Cap. 5)
2. 8 treinamentos obrigatórios não realizados (Cap. 2)
3. 12 requisitos do Nível 2 ainda sem avaliação registrada

**📈 Evolução Mensal:**
• Jan/26: 64% → Fev/26: 68% → Mar/26: 71% (**+3pp**)

**💬 Parecer IA:** Com o ritmo atual de evolução (+3pp/mês), o hospital atingirá a meta de 80% em **julho de 2026**. Para antecipar para maio/26, recomenda-se focar nos 5 requisitos eliminatórios pendentes e nas evidências do Capítulo 5.

---

Desejo exportar em PDF ou detalhar algum capítulo específico?`,
    timestamp: new Date(Date.now() - 1000 * 60 * 3),
  },
];

const GAPS: Gap[] = [
  { label: "Evidências vencidas", count: "23 documentos", severity: "critico" },
  { label: "Treinamentos não realizados", count: "8 itens", severity: "alto" },
  { label: "Requisitos N2 sem avaliação", count: "12 itens", severity: "alto" },
  { label: "Indicadores abaixo da meta", count: "15 itens", severity: "medio" },
  { label: "POPs desatualizados", count: "7 documentos", severity: "medio" },
];

const EVIDENCE_SUGGESTIONS: EvidenceSuggestion[] = [
  {
    code: "2.3.1",
    description: "Matriz de competências — Equipe UTI",
    docType: "Planilha / Formulário",
    icon: <Target className="w-4 h-4 text-sky-400" />,
  },
  {
    code: "5.1.2",
    description: "Relatório NSP Janeiro e Fevereiro/26",
    docType: "Relatório mensal",
    icon: <Shield className="w-4 h-4 text-emerald-400" />,
  },
  {
    code: "4.2.1",
    description: "Protocolo de Sedação e Analgesia",
    docType: "POP / Protocolo clínico",
    icon: <FileText className="w-4 h-4 text-violet-400" />,
  },
  {
    code: "5.2.1",
    description: "Avaliação de risco de queda — 100% pacientes",
    docType: "Formulário / Prontuário",
    icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
  },
];

const REPORTS: ReportItem[] = [
  { title: "Relatório de Prontidão ONA", format: "PDF", icon: <BarChart3 className="w-4 h-4" /> },
  { title: "Dossiê de Acreditação", format: "PDF", icon: <Award className="w-4 h-4" /> },
  { title: "Parecer por Unidade", format: "PDF", icon: <Building2 className="w-4 h-4" /> },
  { title: "Checklist de Visita Simulada", format: "Excel", icon: <CheckCircle2 className="w-4 h-4" /> },
];

const SAMPLE_AUDIT_QUESTIONS: AuditQuestion[] = [
  { id: 1, text: "Como é realizado o controle de competências e qualificação da equipe de enfermagem da UTI? Quais registros evidenciam isso?" },
  { id: 2, text: "Demonstre o processo de identificação e resposta a deterioração clínica do paciente. Onde estão os registros dos últimos 30 dias?" },
  { id: 3, text: "Como a unidade garante a adesão ao bundle de prevenção de IRAS? Qual é a taxa de conformidade atual?" },
];

const UNITS = ["UTI Adulto", "Pronto-Socorro", "Centro Cirúrgico", "Maternidade", "Internação Geral"];
const CHAPTERS = ["Cap. 1 — Gestão Organizacional", "Cap. 2 — Gestão de Pessoas", "Cap. 3 — Gestão de Processos", "Cap. 4 — Atenção ao Paciente", "Cap. 5 — Segurança do Paciente", "Cap. 6 — Gestão de Resultados"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(date: Date): string {
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function severityConfig(severity: Gap["severity"]) {
  switch (severity) {
    case "critico":
      return { label: "Crítico", className: "bg-red-500/20 text-red-400 border-red-500/30" };
    case "alto":
      return { label: "Alto", className: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
    case "medio":
      return { label: "Médio", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" };
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BotAvatar({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <div
      className={cn(
        "rounded-xl flex items-center justify-center bg-gradient-to-br from-sky-500 to-emerald-500 flex-shrink-0 shadow-lg shadow-sky-500/20",
        size === "md" ? "w-9 h-9" : "w-7 h-7"
      )}
    >
      <Bot className={cn("text-white", size === "md" ? "w-5 h-5" : "w-4 h-4")} />
    </div>
  );
}

function UserAvatar() {
  return (
    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600 flex-shrink-0 shadow-lg shadow-violet-500/20">
      <span className="text-white text-xs font-bold">CB</span>
    </div>
  );
}

function FormattedAIContent({ content }: { content: string }) {
  // Simple renderer: bold, bullet points, horizontal rules, inline code
  const lines = content.split("\n");
  return (
    <div className="space-y-1 text-sm leading-relaxed text-slate-200">
      {lines.map((line, i) => {
        if (line.startsWith("---")) {
          return <hr key={i} className="border-slate-600 my-2" />;
        }
        if (line.startsWith("| ")) {
          // Table row
          const cells = line.split("|").filter((c) => c.trim() !== "");
          const isHeader = lines[i + 1]?.startsWith("|---") || lines[i + 1]?.startsWith("| ---");
          const isDivider = /^\|[-| ]+\|$/.test(line.trim());
          if (isDivider) return null;
          return (
            <div key={i} className={cn("grid gap-2 text-xs py-1 border-b border-slate-700/50", isHeader && "font-semibold text-sky-300")} style={{ gridTemplateColumns: `repeat(${cells.length}, 1fr)` }}>
              {cells.map((cell, j) => (
                <span key={j} className="truncate">{renderInline(cell.trim())}</span>
              ))}
            </div>
          );
        }
        if (line.startsWith("• ") || line.startsWith("- ")) {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-sky-400 mt-0.5 flex-shrink-0">•</span>
              <span>{renderInline(line.slice(2))}</span>
            </div>
          );
        }
        if (line.startsWith("#")) {
          const text = line.replace(/^#+\s*/, "");
          return <p key={i} className="font-semibold text-white">{renderInline(text)}</p>;
        }
        if (line.startsWith("💡") || line.startsWith("📈") || line.startsWith("📊") || line.startsWith("💬") || line.startsWith("🔴") || line.startsWith("🏥")) {
          return <p key={i} className="text-slate-300">{renderInline(line)}</p>;
        }
        if (line.trim() === "") return <div key={i} className="h-1" />;
        return <p key={i}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  // Handle **bold**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3">
      <BotAvatar />
      <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1 items-center">
          <span className="text-xs text-slate-400 mr-2">IA analisando</span>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function IACopilot() {
  const { isAdmin } = useTenant();
  const [messages, setMessages] = useState<ChatMessage[]>(isAdmin ? INITIAL_MESSAGES : []);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState(UNITS[0]);
  const [selectedChapter, setSelectedChapter] = useState(CHAPTERS[4]);
  const [showAuditQuestions, setShowAuditQuestions] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  function handleSend(text?: string) {
    const content = (text ?? inputValue).trim();
    if (!content) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: generateAIResponse(content),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 2200);
  }

  function generateAIResponse(prompt: string): string {
    const lower = prompt.toLowerCase();
    if (lower.includes("sepse") || lower.includes("sepsis")) {
      return `Analisando a **aderência ao Protocolo de Sepse** no sistema:\n\n**Cap. 4 — Atenção ao Paciente (Req. 4.3.2):**\n• Taxa de ativação do protocolo: 78% (meta ≥ 90%)\n• Tempo médio de reconhecimento: 42 min (meta ≤ 30 min)\n• Administração de antibiótico na 1ª hora: 61% (meta ≥ 80%)\n\n**Evidências ausentes:**\n• Fluxograma atualizado de triagem por SIRS/qSOFA — Ausente\n• Treinamento da equipe no Bundle de Sepse — 3/8 plantonistas pendentes\n• Indicadores do bundle no relatório mensal de qualidade — Não publicado\n\n💡 **Recomendação:** Priorizar o treinamento das equipes e publicar o indicador de adesão ao bundle no dashboard de qualidade para evidenciar monitoramento contínuo ao avaliador ONA.`;
    }
    if (lower.includes("checklist") || lower.includes("visita simulada")) {
      return `**Checklist de Visita Simulada ONA 2026 — Gerado pela IA:**\n\n**No dia anterior à visita:**\n• Verificar pasta de evidências organizada por capítulo\n• Confirmar disponibilidade dos responsáveis por cada setor\n• Realizar rodada nas unidades críticas (UTI, PS, CC)\n• Validar que indicadores do mês corrente estão publicados\n\n**Durante a visita — documentos que o avaliador pedirá:**\n• Organograma atualizado e assinado pela direção\n• Política de segurança do paciente vigente\n• Últimos 3 meses de relatórios de eventos adversos\n• Atas de reunião do Comitê de Qualidade\n• Planilha de treinamentos realizados (últimos 12 meses)\n• POPs das 10 últimas revisões com assinatura de aprovação\n\n💡 Posso gerar o checklist completo em PDF com campos para marcação. Deseja?`;
    }
    if (lower.includes("gap") || lower.includes("nível 2") || lower.includes("nivel 2")) {
      return `Análise de **Gaps Críticos para o Nível 2 ONA 2026:**\n\n**Score atual:** 71% | **Meta Nível 2:** 80%\n\n**Requisitos eliminatórios pendentes (prioridade máxima):**\n• 5.1 — Sistema de gestão de eventos adversos ativo: **Parcial** (relatórios ausentes)\n• 2.1 — Dimensionamento de pessoal documentado: **Ausente**\n• 4.1 — Prontuário com elementos obrigatórios: **68% conformidade**\n\n**Para fechar o gap de 9pp até o Nível 2:**\n• Regularizar evidências vencidas → +3pp estimado\n• Concluir treinamentos obrigatórios → +2pp estimado\n• Publicar indicadores em atraso → +2pp estimado\n• Completar avaliações de risco → +2pp estimado\n\n💡 Com foco nos itens acima, é possível atingir 80% em **45 a 60 dias**.`;
    }
    return `Entendido! Processando sua consulta sobre **"${prompt}"** com base no **Manual ONA 2026**...\n\nCom base nas informações do sistema e nos requisitos do manual, identifiquei os seguintes pontos relevantes:\n\n• Requisitos relacionados mapeados no sistema\n• Evidências cadastradas vs. evidências necessárias analisadas\n• Recomendações geradas com base nas melhores práticas\n\n💡 Para uma análise mais precisa, posso cruzar com os dados das unidades específicas. Deseja detalhar algum setor ou capítulo em particular?`;
  }

  function handleCopy(id: string, content: string) {
    navigator.clipboard.writeText(content).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleNewChat() {
    setMessages([]);
    setInputValue("");
    setIsTyping(false);
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-sky-500/30">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-white font-bold text-lg leading-tight">IA ONA Copilot</h1>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] px-2 py-0.5 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block mr-1 animate-pulse" />
                IA Ativo
              </Badge>
            </div>
            <p className="text-slate-400 text-xs">Especialista em Acreditação ONA 2026 • Hospital Geral</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleNewChat}
            className="border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 bg-slate-800/50 text-xs gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Novo Chat
          </Button>
          <Button
            size="sm"
            className="bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 text-white text-xs gap-1.5 shadow-lg shadow-sky-500/20"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar
          </Button>
        </div>
      </div>

      {/* ── Main split layout ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ════════════════════════════════════════════
            LEFT — Chat interface (2/3)
        ════════════════════════════════════════════ */}
        <div className="flex flex-col flex-1 min-w-0 border-r border-slate-800/60">
          {/* Quick prompt chips */}
          <div className="flex-shrink-0 px-4 py-3 border-b border-slate-800/40 bg-slate-900/60">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt.replace(/^[\p{Emoji}\s]+/u, "").trim() || prompt)}
                  className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full border border-slate-700/60 bg-slate-800/60 text-slate-300 hover:text-white hover:border-sky-500/60 hover:bg-slate-700/60 transition-all duration-150 whitespace-nowrap"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Chat messages area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-900 to-slate-800 p-4 space-y-5"
          >
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-16">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center shadow-2xl shadow-sky-500/30 animate-pulse">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-lg">IA ONA Copilot pronta</p>
                  <p className="text-slate-400 text-sm mt-1">Faça uma pergunta ou use os atalhos acima</p>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4 max-w-md w-full">
                  {[
                    { icon: <Search className="w-4 h-4" />, text: "Analisa gaps por capítulo" },
                    { icon: <FileText className="w-4 h-4" />, text: "Gera relatórios automáticos" },
                    { icon: <Lightbulb className="w-4 h-4" />, text: "Sugere evidências faltantes" },
                    { icon: <Shield className="w-4 h-4" />, text: "Verifica requisitos ONA 2026" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-slate-800/50 border border-slate-700/40 text-slate-400 text-xs">
                      <span className="text-sky-400">{item.icon}</span>
                      {item.text}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn("flex gap-3 group", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
              >
                {msg.role === "ai" ? <BotAvatar /> : <UserAvatar />}

                <div className={cn("flex flex-col max-w-[78%]", msg.role === "user" ? "items-end" : "items-start")}>
                  <div
                    className={cn(
                      "px-4 py-3 rounded-2xl text-sm shadow-lg relative",
                      msg.role === "user"
                        ? "bg-gradient-to-br from-violet-600 to-purple-700 text-white rounded-br-sm shadow-violet-500/20"
                        : "bg-slate-800/80 border border-slate-700/50 rounded-bl-sm"
                    )}
                  >
                    {msg.role === "ai" ? (
                      <FormattedAIContent content={msg.content} />
                    ) : (
                      <p className="text-white text-sm">{msg.content}</p>
                    )}

                    {msg.role === "ai" && (
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-slate-700/50 text-slate-500 hover:text-slate-300"
                      >
                        {copiedId === msg.id ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-600 mt-1 px-1">{formatTime(msg.timestamp)}</span>
                </div>
              </div>
            ))}

            {isTyping && <TypingIndicator />}
          </div>

          {/* Message input */}
          <div className="flex-shrink-0 p-4 bg-slate-900/80 border-t border-slate-800/60 backdrop-blur-sm">
            <div className="flex gap-2 items-end">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Pergunte sobre requisitos ONA, evidências, gaps, auditoria..."
                  className="bg-slate-800/60 border-slate-700/60 text-white placeholder:text-slate-500 focus:border-sky-500/60 focus:ring-sky-500/20 pr-4 h-11 text-sm"
                />
              </div>
              <Button
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || isTyping}
                className="bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 text-white h-11 w-11 p-0 shadow-lg shadow-sky-500/20 disabled:opacity-40 flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[10px] text-slate-600 mt-2 text-center flex items-center justify-center gap-1">
              <Zap className="w-3 h-3 text-sky-600" />
              Powered by IA especializada em Manual ONA 2026
            </p>
          </div>
        </div>

        {/* ════════════════════════════════════════════
            RIGHT — Tools panel (1/3)
        ════════════════════════════════════════════ */}
        <div className="w-[360px] flex-shrink-0 bg-slate-950 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">

              {/* ── Section 1: Gap Analysis Automático ── */}
              <Card className="bg-slate-900/60 border-slate-800/60">
                <CardHeader className="pb-3 pt-4 px-4">
                  <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center">
                      <BarChart3 className="w-3.5 h-3.5 text-white" />
                    </div>
                    Gap Analysis Automático
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  {/* Score */}
                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-400">Score Geral</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg font-bold text-white">{isAdmin ? "71%" : "—"}</span>
                        <span className="text-[10px] text-slate-500">/ meta 80%</span>
                      </div>
                    </div>
                    <Progress value={isAdmin ? 71 : 0} className="h-2 bg-slate-700" />
                    <div className="flex justify-between mt-1.5">
                      <span className="text-[10px] text-slate-600">0%</span>
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-3 bg-emerald-500/40 rounded-sm" style={{ marginLeft: "calc(80% - 4px)" }} />
                        <span className="text-[10px] text-emerald-500">meta</span>
                      </div>
                      <span className="text-[10px] text-slate-600">100%</span>
                    </div>
                  </div>

                  {/* Gap list */}
                  <div className="space-y-2">
                    {(isAdmin ? GAPS : []).map((gap, i) => {
                      const cfg = severityConfig(gap.severity);
                      return (
                        <div key={i} className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/30 hover:border-slate-600/40 transition-colors">
                          <div className="flex items-center gap-2 min-w-0">
                            <AlertTriangle className={cn("w-3.5 h-3.5 flex-shrink-0", gap.severity === "critico" ? "text-red-400" : gap.severity === "alto" ? "text-amber-400" : "text-yellow-400")} />
                            <div className="min-w-0">
                              <p className="text-xs text-slate-200 truncate">{gap.label}</p>
                              <p className="text-[10px] text-slate-500">{gap.count}</p>
                            </div>
                          </div>
                          <Badge className={cn("text-[9px] px-1.5 py-0.5 border flex-shrink-0", cfg.className)}>
                            {cfg.label}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-slate-700/60 text-slate-300 hover:text-white hover:border-sky-500/50 bg-slate-800/30 text-xs gap-1.5"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    Ver relatório completo
                    <ChevronRight className="w-3 h-3 ml-auto" />
                  </Button>
                </CardContent>
              </Card>

              {/* ── Section 2: Sugestão de Evidências ── */}
              <Card className="bg-slate-900/60 border-slate-800/60">
                <CardHeader className="pb-3 pt-4 px-4">
                  <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                      <Lightbulb className="w-3.5 h-3.5 text-white" />
                    </div>
                    Sugestão de Evidências
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2">
                  {(isAdmin ? EVIDENCE_SUGGESTIONS : []).map((ev, i) => (
                    <div key={i} className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/30 hover:border-slate-600/40 transition-colors">
                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-700/60 flex items-center justify-center flex-shrink-0 mt-0.5">
                          {ev.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded">
                              Req. {ev.code}
                            </span>
                          </div>
                          <p className="text-xs text-slate-200 leading-snug">{ev.description}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{ev.docType}</p>
                        </div>
                        <Button
                          size="sm"
                          className="h-6 px-2 text-[10px] bg-sky-600/20 hover:bg-sky-600/40 text-sky-400 border border-sky-500/30 flex-shrink-0"
                          variant="outline"
                        >
                          Vincular
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* ── Section 3: Relatórios Automáticos ── */}
              <Card className="bg-slate-900/60 border-slate-800/60">
                <CardHeader className="pb-3 pt-4 px-4">
                  <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                      <FileText className="w-3.5 h-3.5 text-white" />
                    </div>
                    Relatórios Automáticos
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2">
                  {REPORTS.map((report, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/30 hover:border-slate-600/40 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-slate-700/60 flex items-center justify-center flex-shrink-0 text-slate-400">
                          {report.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-slate-200 truncate">{report.title}</p>
                          <Badge className={cn("text-[9px] px-1.5 py-0 border mt-0.5", report.format === "PDF" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20")}>
                            {report.format}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="h-7 px-2.5 text-[10px] bg-slate-700/60 hover:bg-slate-600/60 text-slate-300 border border-slate-600/40 gap-1 flex-shrink-0"
                        variant="outline"
                      >
                        <Download className="w-3 h-3" />
                        Gerar
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* ── Section 4: Auditoria Assistida ── */}
              <Card className="bg-slate-900/60 border-slate-800/60">
                <CardHeader className="pb-3 pt-4 px-4">
                  <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                      <Shield className="w-3.5 h-3.5 text-white" />
                    </div>
                    Auditoria Assistida
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  <p className="text-[11px] text-slate-400">Gerar perguntas para auditoria interna</p>

                  {/* Selectors */}
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] text-slate-500 mb-1 block">Unidade</label>
                      <select
                        value={selectedUnit}
                        onChange={(e) => setSelectedUnit(e.target.value)}
                        className="w-full bg-slate-800/60 border border-slate-700/60 text-slate-200 text-xs rounded-md px-2.5 py-2 focus:outline-none focus:border-sky-500/60"
                      >
                        {UNITS.map((u) => (
                          <option key={u} value={u} className="bg-slate-800">{u}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 mb-1 block">Capítulo ONA</label>
                      <select
                        value={selectedChapter}
                        onChange={(e) => setSelectedChapter(e.target.value)}
                        className="w-full bg-slate-800/60 border border-slate-700/60 text-slate-200 text-xs rounded-md px-2.5 py-2 focus:outline-none focus:border-sky-500/60"
                      >
                        {CHAPTERS.map((c) => (
                          <option key={c} value={c} className="bg-slate-800">{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <Button
                    onClick={() => setShowAuditQuestions(true)}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs gap-1.5 shadow-lg shadow-emerald-500/20"
                    size="sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Gerar Checklist IA
                  </Button>

                  {showAuditQuestions && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-px flex-1 bg-slate-700/50" />
                        <span className="text-[10px] text-slate-500">perguntas geradas</span>
                        <div className="h-px flex-1 bg-slate-700/50" />
                      </div>
                      {SAMPLE_AUDIT_QUESTIONS.map((q) => (
                        <div key={q.id} className="flex gap-2.5 p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/30">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0 mt-0.5">
                            {q.id}
                          </div>
                          <p className="text-[11px] text-slate-300 leading-snug">{q.text}</p>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-slate-700/60 text-slate-400 hover:text-white text-[10px] gap-1.5 mt-1"
                      >
                        <Download className="w-3 h-3" />
                        Exportar checklist completo
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ── Footer badge ── */}
              <div className="flex items-center justify-center gap-2 py-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/40 border border-slate-700/30">
                  <Star className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] text-slate-400">QHealth One 2026 • Módulo 21</span>
                  <Award className="w-3 h-3 text-sky-400" />
                </div>
              </div>

            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
