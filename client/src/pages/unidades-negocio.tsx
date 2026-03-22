import { useState } from "react";
import { useLocation } from "wouter";
import {
  Building2, BarChart3, FileText, Users, AlertTriangle, CheckCircle2,
  TrendingUp, ArrowRight, Plus, Settings, Star, Activity, Award,
  Pill, Stethoscope, FlaskConical, Eye, GraduationCap, Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const units = [
  { id: 1, name: "Hospital Geral", code: "HG", type: "Hospital", score: 71, onaN1: 84, onaN2: 71, onaN3: 58, status: "yellow", pops: 45, protocols: 12, plans: 8, overdue: 3, staff: 320 },
  { id: 2, name: "UTI Adulto", code: "UTI", type: "UTI", score: 88, onaN1: 92, onaN2: 88, onaN3: 72, status: "green", pops: 18, protocols: 8, plans: 3, overdue: 0, staff: 45 },
  { id: 3, name: "Centro Cirúrgico", code: "CC", type: "Centro Cirúrgico", score: 82, onaN1: 90, onaN2: 82, onaN3: 65, status: "green", pops: 22, protocols: 6, plans: 5, overdue: 1, staff: 38 },
  { id: 4, name: "Laboratório Clínico", code: "LAB", type: "Laboratório", score: 78, onaN1: 88, onaN2: 78, onaN3: 55, status: "yellow", pops: 15, protocols: 4, plans: 4, overdue: 2, staff: 28 },
  { id: 5, name: "Pronto-Socorro", code: "PS", type: "PA", score: 67, onaN1: 75, onaN2: 67, onaN3: 45, status: "yellow", pops: 20, protocols: 9, plans: 10, overdue: 5, staff: 85 },
  { id: 6, name: "Diagnóstico por Imagem", code: "IMG", type: "Imagem", score: 61, onaN1: 72, onaN2: 61, onaN3: 38, status: "yellow", pops: 10, protocols: 3, plans: 6, overdue: 2, staff: 22 },
  { id: 7, name: "Hemodiálise", code: "HD", type: "Nefrologia", score: 54, onaN1: 65, onaN2: 54, onaN3: 28, status: "red", pops: 12, protocols: 5, plans: 8, overdue: 4, staff: 18 },
  { id: 8, name: "Farmácia", code: "FARM", type: "Farmácia", score: 75, onaN1: 85, onaN2: 75, onaN3: 52, status: "yellow", pops: 14, protocols: 6, plans: 5, overdue: 1, staff: 16 },
  { id: 9, name: "Ambulatório", code: "AMB", type: "Ambulatório", score: 70, onaN1: 80, onaN2: 70, onaN3: 48, status: "yellow", pops: 16, protocols: 4, plans: 6, overdue: 2, staff: 42 },
  { id: 10, name: "CME", code: "CME", type: "CME", score: 69, onaN1: 79, onaN2: 69, onaN3: 44, status: "yellow", pops: 9, protocols: 3, plans: 4, overdue: 3, staff: 12 },
];

const semaphoreConfig = {
  green: { label: "Apto", dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700 border-emerald-200", text: "text-emerald-700" },
  yellow: { label: "Atenção", dot: "bg-amber-500", badge: "bg-amber-100 text-amber-700 border-amber-200", text: "text-amber-700" },
  red: { label: "Crítico", dot: "bg-red-500", badge: "bg-red-100 text-red-700 border-red-200", text: "text-red-700" },
};

export default function UnidadesNegocio() {
  const [, navigate] = useLocation();
  const [selected, setSelected] = useState<typeof units[0] | null>(null);

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Unidades de Negócio</h1>
          </div>
          <p className="text-slate-500 text-sm">Visão individual e consolidação corporativa por unidade assistencial</p>
        </div>
        <Button size="sm" className="h-8 gap-1.5 text-xs bg-sky-600 hover:bg-sky-700 text-white border-0" onClick={() => toast.info("Cadastro de nova unidade em breve disponível")}>
          <Plus className="w-3.5 h-3.5" />
          Nova Unidade
        </Button>
      </div>

      {/* Ranking de unidades */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-3">
        {units.sort((a, b) => b.score - a.score).map((unit, i) => {
          const sem = semaphoreConfig[unit.status as keyof typeof semaphoreConfig];
          const isSelected = selected?.id === unit.id;
          return (
            <Card
              key={unit.id}
              onClick={() => setSelected(isSelected ? null : unit)}
              className={cn(
                "cursor-pointer border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
                isSelected ? "border-sky-400 ring-1 ring-sky-400" : "border-slate-200 dark:border-slate-800"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn("w-2 h-2 rounded-full flex-shrink-0", sem.dot)} />
                      <Badge variant="outline" className={cn("text-[10px] py-0 px-1.5 h-4", sem.badge)}>{unit.code}</Badge>
                      <span className="text-[10px] text-slate-400">#{i + 1}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug">{unit.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{unit.type} • {unit.staff} colaboradores</p>
                  </div>
                  <p className={cn("text-2xl font-bold", sem.text)}>{unit.score}%</p>
                </div>

                <div className="space-y-1.5 mb-3">
                  {[
                    { label: "N1", value: unit.onaN1, color: "bg-sky-400" },
                    { label: "N2", value: unit.onaN2, color: "bg-violet-400" },
                    { label: "N3", value: unit.onaN3, color: "bg-amber-400" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500 w-4">{label}</span>
                      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", color)} style={{ width: `${value}%` }} />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 w-7 text-right">{value}%</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-1 text-center">
                  {[
                    { label: "POPs", value: unit.pops },
                    { label: "Planos", value: unit.plans },
                    { label: "Vencidos", value: unit.overdue },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-lg bg-slate-50 dark:bg-slate-800 py-1.5">
                      <p className={cn("text-sm font-bold", label === "Vencidos" && value > 0 ? "text-red-600" : "text-slate-700 dark:text-slate-300")}>{value}</p>
                      <p className="text-[9px] text-slate-400">{label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detail panel */}
      {selected && (
        <Card className="border-sky-200 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/20">
          <CardHeader className="pb-3 pt-4 px-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sky-500" />
                {selected.name}
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => navigate("/acreditacao-ona")} className="h-7 text-xs gap-1">
                <Award className="w-3 h-3" />
                Ver no ONA
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "POPs Vigentes", value: selected.pops, icon: <FileText className="w-4 h-4 text-sky-500" />, path: "/documentos" },
                { label: "Protocolos", value: selected.protocols, icon: <Pill className="w-4 h-4 text-violet-500" />, path: "/protocolos" },
                { label: "Planos de Ação", value: selected.plans, icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, path: "/gestao-operacional" },
                { label: "Planos Vencidos", value: selected.overdue, icon: <AlertTriangle className="w-4 h-4 text-red-500" />, path: "/gestao-operacional" },
              ].map(({ label, value, icon, path }) => (
                <div
                  key={label}
                  onClick={() => navigate(path)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-sm transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">{icon}</div>
                  <div>
                    <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{value}</p>
                    <p className="text-[11px] text-slate-500">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
