/**
 * Script de limpeza de dados de usuário no banco de dados.
 * Uso: npx tsx scripts/cleanup-user.ts <unitId>
 * Exemplo: npx tsx scripts/cleanup-user.ts 34
 */
import { db, storage } from "../server/storage";
import {
  indicators, risks, gutItems, commissions, commissionMeetings, commissionDeliberations,
  documents, documentReadings, actionPlans, actionPlanTasks,
  safetyEvents, diagnosticCycles, diagnosticItems,
  swotAnalyses, swotItems, bscObjectives, trainings,
  onaEvidences, onaAdherence,
} from "../shared/schema";
import { eq } from "drizzle-orm";

async function cleanup(unitId: number) {
  console.log(`\n=== LIMPANDO DADOS DA UNIDADE #${unitId} ===\n`);

  const steps = [
    { name: "commission_deliberations", fn: async () => {
      // delete via commissions
      const comms = await db.select().from(commissions).where(eq(commissions.unitId, unitId));
      for (const c of comms) {
        await db.delete(commissionDeliberations).where(eq(commissionDeliberations.commissionId, c.id));
        await db.delete(commissionMeetings).where(eq(commissionMeetings.commissionId, c.id));
      }
      return comms.length;
    }},
    { name: "commissions",        fn: async () => { const r = await db.delete(commissions).where(eq(commissions.unitId, unitId)).returning(); return r.length; } },
    { name: "action_plan_tasks",  fn: async () => {
      const plans = await db.select().from(actionPlans).where(eq(actionPlans.unitId, unitId));
      for (const p of plans) await db.delete(actionPlanTasks).where(eq(actionPlanTasks.actionPlanId, p.id));
      return plans.length;
    }},
    { name: "action_plans",       fn: async () => { const r = await db.delete(actionPlans).where(eq(actionPlans.unitId, unitId)).returning(); return r.length; } },
    { name: "document_readings",  fn: async () => {
      const docs = await db.select().from(documents).where(eq(documents.unitId, unitId));
      for (const d of docs) await db.delete(documentReadings).where(eq(documentReadings.documentId, d.id));
      return docs.length;
    }},
    { name: "documents",          fn: async () => { const r = await db.delete(documents).where(eq(documents.unitId, unitId)).returning(); return r.length; } },
    { name: "safety_events",      fn: async () => { const r = await db.delete(safetyEvents).where(eq(safetyEvents.unitId, unitId)).returning(); return r.length; } },
    { name: "risks",              fn: async () => { const r = await db.delete(risks).where(eq(risks.unitId, unitId)).returning(); return r.length; } },
    { name: "gut_items",          fn: async () => { const r = await db.delete(gutItems).where(eq(gutItems.unitId, unitId)).returning(); return r.length; } },
    { name: "diagnostic_cycles",  fn: async () => {
      const cycles = await db.select().from(diagnosticCycles).where(eq(diagnosticCycles.unitId, unitId));
      for (const c of cycles) await db.delete(diagnosticItems).where(eq(diagnosticItems.cycleId, c.id));
      const r = await db.delete(diagnosticCycles).where(eq(diagnosticCycles.unitId, unitId)).returning();
      return r.length;
    }},
    { name: "indicators",         fn: async () => { const r = await db.delete(indicators).where(eq(indicators.unitId, unitId)).returning(); return r.length; } },
    { name: "swot_items",         fn: async () => {
      const analyses = await db.select().from(swotAnalyses).where(eq(swotAnalyses.unitId, unitId));
      for (const a of analyses) await db.delete(swotItems).where(eq(swotItems.analysisId, a.id));
      return analyses.length;
    }},
    { name: "swot_analyses",      fn: async () => { const r = await db.delete(swotAnalyses).where(eq(swotAnalyses.unitId, unitId)).returning(); return r.length; } },
    { name: "trainings",          fn: async () => { const r = await db.delete(trainings).where(eq(trainings.unitId, unitId)).returning(); return r.length; } },
    { name: "ona_evidences",      fn: async () => { const r = await db.delete(onaEvidences).where(eq(onaEvidences.unitId, unitId)).returning(); return r.length; } },
    { name: "bsc_objectives",     fn: async () => { const r = await db.delete(bscObjectives).where(eq(bscObjectives.unitId, unitId)).returning(); return r.length; } },
  ];

  let totalDeleted = 0;
  for (const step of steps) {
    try {
      const count = await step.fn();
      if (count > 0) console.log(`  ✓ ${step.name}: ${count} registro(s) removido(s)`);
      totalDeleted += count;
    } catch (e: any) {
      console.log(`  - ${step.name}: nenhum dado ou tabela não existe`);
    }
  }

  console.log(`\n=== Total removido: ${totalDeleted} registros ===`);
  console.log("\n⚠️  ATENÇÃO: Dados do localStorage (avaliações, validações ONA) devem ser");
  console.log("   limpos manualmente no navegador do usuário:");
  console.log("   Abrir DevTools (F12) > Application > Local Storage > Selecionar site > Delete All");
  console.log("   Chaves: ona_assessments, ona_validated_data, sector_submissions, sector_draft_*\n");
}

const unitId = parseInt(process.argv[2] || "34");
cleanup(unitId).catch(console.error).finally(() => process.exit(0));
