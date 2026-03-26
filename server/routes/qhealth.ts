/**
 * QHealth One 2026 — API Routes
 * Módulos: Diagnóstico, GUT, ONA, Riscos, Indicadores,
 *          Documentos, Comissões, Planos de Ação, Eventos de Segurança
 */

import { Router } from "express";
import type { Request } from "express";
import { db } from "../storage";
import {
  diagnosticCycles, diagnosticItems, gutItems,
  onaRequirements, onaEvidences, onaAdherence,
  risks, riskMitigations,
  indicators, indicatorValues,
  documents, documentReadings,
  commissions, commissionMeetings, commissionDeliberations,
  actionPlans, actionPlanTasks,
  safetyEvents, managedProtocols, trainings, normativeReferences,
  swotAnalyses, swotItems, bscPerspectives, bscObjectives, patientJourneySteps
} from "../../shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { verifyToken } from "../auth";

const router = Router();

// ────────────────────────────────────────────────────────────────────────────
// LGPD / Multi-tenant helper
// Retorna o unitId do usuário logado quando ele não é admin.
// Quando admin (ou sem token), retorna null → sem filtro → vê tudo.
// ────────────────────────────────────────────────────────────────────────────
function getRequesterUnitId(req: Request): number | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  const payload = verifyToken(authHeader.substring(7));
  if (!payload || payload.role === "admin") return null;
  return payload.unitId ?? null;
}

// ============================================================
// MÓDULO 2 — Diagnóstico Institucional
// ============================================================

// GET /api/qhealth/diagnostic-cycles
router.get("/diagnostic-cycles", async (req, res) => {
  try {
    const cycles = await db.select().from(diagnosticCycles).orderBy(desc(diagnosticCycles.createdAt));
    res.json(cycles);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch diagnostic cycles" });
  }
});

// POST /api/qhealth/diagnostic-cycles
router.post("/diagnostic-cycles", async (req, res) => {
  try {
    const [cycle] = await db.insert(diagnosticCycles).values(req.body).returning();
    res.status(201).json(cycle);
  } catch (error) {
    res.status(500).json({ error: "Failed to create diagnostic cycle" });
  }
});

// GET /api/qhealth/diagnostic-cycles/:id/items
router.get("/diagnostic-cycles/:id/items", async (req, res) => {
  try {
    const items = await db.select().from(diagnosticItems)
      .where(eq(diagnosticItems.cycleId, parseInt(req.params.id)))
      .orderBy(diagnosticItems.requirementCode);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch diagnostic items" });
  }
});

// PUT /api/qhealth/diagnostic-items/:id
router.put("/diagnostic-items/:id", async (req, res) => {
  try {
    const [item] = await db.update(diagnosticItems)
      .set(req.body)
      .where(eq(diagnosticItems.id, parseInt(req.params.id)))
      .returning();
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: "Failed to update diagnostic item" });
  }
});

// ============================================================
// MÓDULO 3 — Matriz GUT
// ============================================================

// GET /api/qhealth/gut-items
router.get("/gut-items", async (req, res) => {
  try {
    const items = await db.select().from(gutItems).orderBy(desc(gutItems.createdAt));
    // Calculate score and return sorted
    const withScores = items.map(i => ({
      ...i,
      score: i.gravity * i.urgency * i.tendency
    })).sort((a, b) => b.score - a.score);
    res.json(withScores);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch GUT items" });
  }
});

// POST /api/qhealth/gut-items
router.post("/gut-items", async (req, res) => {
  try {
    const [item] = await db.insert(gutItems).values(req.body).returning();
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: "Failed to create GUT item" });
  }
});

// PUT /api/qhealth/gut-items/:id
router.put("/gut-items/:id", async (req, res) => {
  try {
    const [item] = await db.update(gutItems)
      .set(req.body)
      .where(eq(gutItems.id, parseInt(req.params.id)))
      .returning();
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: "Failed to update GUT item" });
  }
});

// ============================================================
// MÓDULO 4 — Acreditação ONA 2026
// ============================================================

// GET /api/qhealth/ona-requirements
router.get("/ona-requirements", async (req, res) => {
  try {
    const { level, chapter } = req.query;
    let query = db.select().from(onaRequirements);
    const reqs = await query.orderBy(onaRequirements.order, onaRequirements.code);
    res.json(reqs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch ONA requirements" });
  }
});

// GET /api/qhealth/ona-adherence/:unitId
router.get("/ona-adherence/:unitId", async (req, res) => {
  try {
    const adherences = await db.select().from(onaAdherence)
      .where(eq(onaAdherence.unitId, parseInt(req.params.unitId)));
    res.json(adherences);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch ONA adherence" });
  }
});

// PUT /api/qhealth/ona-adherence
router.put("/ona-adherence", async (req, res) => {
  try {
    const { requirementId, unitId, status, comments, confirmedBy } = req.body;
    const existing = await db.select().from(onaAdherence)
      .where(and(
        eq(onaAdherence.requirementId, requirementId),
        eq(onaAdherence.unitId, unitId)
      ));

    let result;
    if (existing.length > 0) {
      [result] = await db.update(onaAdherence)
        .set({ status, comments, confirmedBy, evaluatedAt: new Date() })
        .where(eq(onaAdherence.id, existing[0].id))
        .returning();
    } else {
      [result] = await db.insert(onaAdherence)
        .values({ requirementId, unitId, status, comments, confirmedBy, evaluatedAt: new Date() })
        .returning();
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to update ONA adherence" });
  }
});

// GET /api/qhealth/ona-evidences/:requirementId
router.get("/ona-evidences/:requirementId", async (req, res) => {
  try {
    const evidences = await db.select().from(onaEvidences)
      .where(eq(onaEvidences.requirementId, parseInt(req.params.requirementId)));
    res.json(evidences);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch ONA evidences" });
  }
});

// POST /api/qhealth/ona-evidences
router.post("/ona-evidences", async (req, res) => {
  try {
    const [evidence] = await db.insert(onaEvidences).values(req.body).returning();
    res.status(201).json(evidence);
  } catch (error) {
    res.status(500).json({ error: "Failed to create ONA evidence" });
  }
});

// ============================================================
// MÓDULO 7 — Riscos
// ============================================================

// GET /api/qhealth/risks
router.get("/risks", async (req, res) => {
  try {
    const unitId = getRequesterUnitId(req);
    const query = db.select().from(risks);
    const allRisks = await (unitId ? query.where(eq(risks.unitId, unitId)) : query)
      .orderBy(desc(risks.createdAt));
    const withScore = allRisks.map(r => ({
      ...r,
      inherentScore: r.probability * r.impact,
      residualScore: (r.residualProbability || 1) * (r.residualImpact || 1)
    })).sort((a, b) => b.inherentScore - a.inherentScore);
    res.json(withScore);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch risks" });
  }
});

// POST /api/qhealth/risks
router.post("/risks", async (req, res) => {
  try {
    const [risk] = await db.insert(risks).values(req.body).returning();
    res.status(201).json(risk);
  } catch (error) {
    res.status(500).json({ error: "Failed to create risk" });
  }
});

// PUT /api/qhealth/risks/:id
router.put("/risks/:id", async (req, res) => {
  try {
    const [risk] = await db.update(risks)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(risks.id, parseInt(req.params.id)))
      .returning();
    res.json(risk);
  } catch (error) {
    res.status(500).json({ error: "Failed to update risk" });
  }
});

// GET /api/qhealth/risks/:id/mitigations
router.get("/risks/:id/mitigations", async (req, res) => {
  try {
    const mitigations = await db.select().from(riskMitigations)
      .where(eq(riskMitigations.riskId, parseInt(req.params.id)));
    res.json(mitigations);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch risk mitigations" });
  }
});

// ============================================================
// MÓDULO 9 — Comissões
// ============================================================

// GET /api/qhealth/commissions
router.get("/commissions", async (req, res) => {
  try {
    const unitId = getRequesterUnitId(req);
    const query = db.select().from(commissions);
    const all = await (unitId ? query.where(eq(commissions.unitId, unitId)) : query)
      .orderBy(commissions.name);
    res.json(all);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch commissions" });
  }
});

// POST /api/qhealth/commissions
router.post("/commissions", async (req, res) => {
  try {
    const [commission] = await db.insert(commissions).values(req.body).returning();
    res.status(201).json(commission);
  } catch (error) {
    res.status(500).json({ error: "Failed to create commission" });
  }
});

// GET /api/qhealth/commissions/:id/meetings
router.get("/commissions/:id/meetings", async (req, res) => {
  try {
    const meetings = await db.select().from(commissionMeetings)
      .where(eq(commissionMeetings.commissionId, parseInt(req.params.id)))
      .orderBy(desc(commissionMeetings.meetingDate));
    res.json(meetings);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch commission meetings" });
  }
});

// POST /api/qhealth/commission-meetings
router.post("/commission-meetings", async (req, res) => {
  try {
    const [meeting] = await db.insert(commissionMeetings).values(req.body).returning();
    res.status(201).json(meeting);
  } catch (error) {
    res.status(500).json({ error: "Failed to create commission meeting" });
  }
});

// GET /api/qhealth/commission-deliberations
router.get("/commission-deliberations", async (req, res) => {
  try {
    const { meetingId } = req.query;
    let delibs;
    if (meetingId) {
      delibs = await db.select().from(commissionDeliberations)
        .where(eq(commissionDeliberations.meetingId, parseInt(meetingId as string)));
    } else {
      delibs = await db.select().from(commissionDeliberations).orderBy(desc(commissionDeliberations.createdAt));
    }
    res.json(delibs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch deliberations" });
  }
});

// ============================================================
// MÓDULO 10 — Indicadores
// ============================================================

// GET /api/qhealth/indicators
router.get("/indicators", async (req, res) => {
  try {
    const { layer, unitId } = req.query;
    let all = await db.select().from(indicators).where(eq(indicators.active, true));
    if (layer) all = all.filter(i => i.layer === layer);
    res.json(all);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch indicators" });
  }
});

// GET /api/qhealth/indicators/:id/values
router.get("/indicators/:id/values", async (req, res) => {
  try {
    const values = await db.select().from(indicatorValues)
      .where(eq(indicatorValues.indicatorId, parseInt(req.params.id)))
      .orderBy(desc(indicatorValues.period));
    res.json(values);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch indicator values" });
  }
});

// POST /api/qhealth/indicators
router.post("/indicators", async (req, res) => {
  try {
    const [indicator] = await db.insert(indicators).values(req.body).returning();
    res.status(201).json(indicator);
  } catch (error) {
    res.status(500).json({ error: "Failed to create indicator" });
  }
});

// PUT /api/qhealth/indicators/:id
router.put("/indicators/:id", async (req, res) => {
  try {
    const [indicator] = await db.update(indicators)
      .set(req.body)
      .where(eq(indicators.id, parseInt(req.params.id)))
      .returning();
    res.json(indicator);
  } catch (error) {
    res.status(500).json({ error: "Failed to update indicator" });
  }
});

// POST /api/qhealth/indicator-values
router.post("/indicator-values", async (req, res) => {
  try {
    const [value] = await db.insert(indicatorValues).values(req.body).returning();
    res.status(201).json(value);
  } catch (error) {
    res.status(500).json({ error: "Failed to register indicator value" });
  }
});

// ============================================================
// MÓDULO 15 — Documentos & Evidências
// ============================================================

// GET /api/qhealth/documents
router.get("/documents", async (req, res) => {
  try {
    const { type, status } = req.query;
    const unitId = getRequesterUnitId(req);
    const query = db.select().from(documents);
    let docs = await (unitId ? query.where(eq(documents.unitId, unitId)) : query)
      .orderBy(desc(documents.updatedAt));
    if (type) docs = docs.filter(d => d.type === type);
    if (status) docs = docs.filter(d => d.status === status);
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

// POST /api/qhealth/documents
router.post("/documents", async (req, res) => {
  try {
    const [doc] = await db.insert(documents).values(req.body).returning();
    res.status(201).json(doc);
  } catch (error) {
    res.status(500).json({ error: "Failed to create document" });
  }
});

// PUT /api/qhealth/documents/:id
router.put("/documents/:id", async (req, res) => {
  try {
    const [doc] = await db.update(documents)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(documents.id, parseInt(req.params.id)))
      .returning();
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: "Failed to update document" });
  }
});

// POST /api/qhealth/documents/:id/readings
router.post("/documents/:id/readings", async (req, res) => {
  try {
    const [reading] = await db.insert(documentReadings).values({
      documentId: parseInt(req.params.id),
      userId: req.body.userId,
      version: req.body.version,
    }).returning();
    res.status(201).json(reading);
  } catch (error) {
    res.status(500).json({ error: "Failed to register document reading" });
  }
});

// ============================================================
// MÓDULO 17 — Gestão Operacional (Planos de Ação)
// ============================================================

// GET /api/qhealth/action-plans
router.get("/action-plans", async (req, res) => {
  try {
    const { status, origin } = req.query;
    const unitId = getRequesterUnitId(req);
    const query = db.select().from(actionPlans);
    let plans = await (unitId ? query.where(eq(actionPlans.unitId, unitId)) : query)
      .orderBy(desc(actionPlans.createdAt));
    if (status) plans = plans.filter(p => p.status === status);
    if (origin) plans = plans.filter(p => p.origin === origin);
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch action plans" });
  }
});

// POST /api/qhealth/action-plans
router.post("/action-plans", async (req, res) => {
  try {
    const [plan] = await db.insert(actionPlans).values(req.body).returning();
    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ error: "Failed to create action plan" });
  }
});

// PUT /api/qhealth/action-plans/:id
router.put("/action-plans/:id", async (req, res) => {
  try {
    const [plan] = await db.update(actionPlans)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(actionPlans.id, parseInt(req.params.id)))
      .returning();
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: "Failed to update action plan" });
  }
});

// GET /api/qhealth/action-plans/:id/tasks
router.get("/action-plans/:id/tasks", async (req, res) => {
  try {
    const tasks = await db.select().from(actionPlanTasks)
      .where(eq(actionPlanTasks.planId, parseInt(req.params.id)))
      .orderBy(actionPlanTasks.order);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch plan tasks" });
  }
});

// ============================================================
// MÓDULO 20 — Notificação de Eventos (RDC 63 + Notivisa)
// ============================================================

// GET /api/qhealth/safety-events
router.get("/safety-events", async (req, res) => {
  try {
    const { status, category } = req.query;
    const unitId = getRequesterUnitId(req);
    const query = db.select().from(safetyEvents);
    let events = await (unitId ? query.where(eq(safetyEvents.unitId, unitId)) : query)
      .orderBy(desc(safetyEvents.occurrenceDate));
    if (status) events = events.filter(e => e.status === status);
    if (category) events = events.filter(e => e.category === category);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch safety events" });
  }
});

// POST /api/qhealth/safety-events
router.post("/safety-events", async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      code: `${req.body.category === 'sentinel' ? 'ES' : req.body.category === 'adverse_event' ? 'EA' : 'QE'}-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`,
    };
    const [event] = await db.insert(safetyEvents).values(eventData).returning();
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: "Failed to create safety event" });
  }
});

// PUT /api/qhealth/safety-events/:id
router.put("/safety-events/:id", async (req, res) => {
  try {
    const [event] = await db.update(safetyEvents)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(safetyEvents.id, parseInt(req.params.id)))
      .returning();
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: "Failed to update safety event" });
  }
});

// ============================================================
// MÓDULO 12 — Protocolos Gerenciados
// ============================================================

// GET /api/qhealth/managed-protocols
router.get("/managed-protocols", async (req, res) => {
  try {
    const protocols = await db.select().from(managedProtocols).orderBy(managedProtocols.name);
    res.json(protocols);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch protocols" });
  }
});

// POST /api/qhealth/managed-protocols
router.post("/managed-protocols", async (req, res) => {
  try {
    const [protocol] = await db.insert(managedProtocols).values(req.body).returning();
    res.status(201).json(protocol);
  } catch (error) {
    res.status(500).json({ error: "Failed to create protocol" });
  }
});

// PUT /api/qhealth/managed-protocols/:id
router.put("/managed-protocols/:id", async (req, res) => {
  try {
    const [protocol] = await db.update(managedProtocols)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(managedProtocols.id, parseInt(req.params.id)))
      .returning();
    res.json(protocol);
  } catch (error) {
    res.status(500).json({ error: "Failed to update protocol" });
  }
});

// ============================================================
// MÓDULO 16 — Treinamentos
// ============================================================

// GET /api/qhealth/trainings
router.get("/trainings", async (req, res) => {
  try {
    const all = await db.select().from(trainings).where(eq(trainings.active, true));
    res.json(all);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch trainings" });
  }
});

// POST /api/qhealth/trainings
router.post("/trainings", async (req, res) => {
  try {
    const [training] = await db.insert(trainings).values(req.body).returning();
    res.status(201).json(training);
  } catch (error) {
    res.status(500).json({ error: "Failed to create training" });
  }
});

// PUT /api/qhealth/trainings/:id
router.put("/trainings/:id", async (req, res) => {
  try {
    const [training] = await db.update(trainings)
      .set(req.body)
      .where(eq(trainings.id, parseInt(req.params.id)))
      .returning();
    res.json(training);
  } catch (error) {
    res.status(500).json({ error: "Failed to update training" });
  }
});

// ============================================================
// MÓDULO 19 — Referências Normativas
// ============================================================

// GET /api/qhealth/normative-references
router.get("/normative-references", async (req, res) => {
  try {
    const refs = await db.select().from(normativeReferences)
      .where(eq(normativeReferences.active, true))
      .orderBy(normativeReferences.code);
    res.json(refs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch normative references" });
  }
});

// ============================================================
// MÓDULO — Análise SWOT
// ============================================================

// GET /api/qhealth/swot-analyses
router.get("/swot-analyses", async (req, res) => {
  try {
    const unitId = getRequesterUnitId(req);
    const query = db.select().from(swotAnalyses);
    const analyses = await (unitId ? query.where(eq(swotAnalyses.unitId, unitId)) : query)
      .orderBy(desc(swotAnalyses.createdAt));
    res.json(analyses);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch SWOT analyses" });
  }
});

// POST /api/qhealth/swot-analyses
router.post("/swot-analyses", async (req, res) => {
  try {
    const [analysis] = await db.insert(swotAnalyses).values(req.body).returning();
    res.status(201).json(analysis);
  } catch (error) {
    res.status(500).json({ error: "Failed to create SWOT analysis" });
  }
});

// GET /api/qhealth/swot-analyses/:id/items
router.get("/swot-analyses/:id/items", async (req, res) => {
  try {
    const items = await db.select().from(swotItems)
      .where(eq(swotItems.analysisId, parseInt(req.params.id)))
      .orderBy(swotItems.quadrant, swotItems.order);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch SWOT items" });
  }
});

// POST /api/qhealth/swot-items
router.post("/swot-items", async (req, res) => {
  try {
    const [item] = await db.insert(swotItems).values(req.body).returning();
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: "Failed to create SWOT item" });
  }
});

// DELETE /api/qhealth/swot-items/:id
router.delete("/swot-items/:id", async (req, res) => {
  try {
    await db.delete(swotItems).where(eq(swotItems.id, parseInt(req.params.id)));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete SWOT item" });
  }
});

// ============================================================
// MÓDULO — Planejamento BSC
// ============================================================

// GET /api/qhealth/bsc-perspectives
router.get("/bsc-perspectives", async (req, res) => {
  try {
    const perspectives = await db.select().from(bscPerspectives).orderBy(bscPerspectives.order);
    res.json(perspectives);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch BSC perspectives" });
  }
});

// GET /api/qhealth/bsc-objectives
router.get("/bsc-objectives", async (req, res) => {
  try {
    const { perspectiveId } = req.query;
    let objectives = await db.select().from(bscObjectives).orderBy(desc(bscObjectives.createdAt));
    if (perspectiveId) {
      objectives = objectives.filter(o => o.perspectiveId === parseInt(perspectiveId as string));
    }
    res.json(objectives);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch BSC objectives" });
  }
});

// POST /api/qhealth/bsc-objectives
router.post("/bsc-objectives", async (req, res) => {
  try {
    const [objective] = await db.insert(bscObjectives).values(req.body).returning();
    res.status(201).json(objective);
  } catch (error) {
    res.status(500).json({ error: "Failed to create BSC objective" });
  }
});

// PUT /api/qhealth/bsc-objectives/:id
router.put("/bsc-objectives/:id", async (req, res) => {
  try {
    const [objective] = await db.update(bscObjectives)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(bscObjectives.id, parseInt(req.params.id)))
      .returning();
    res.json(objective);
  } catch (error) {
    res.status(500).json({ error: "Failed to update BSC objective" });
  }
});

// DELETE /api/qhealth/bsc-objectives/:id
router.delete("/bsc-objectives/:id", async (req, res) => {
  try {
    await db.delete(bscObjectives).where(eq(bscObjectives.id, parseInt(req.params.id)));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete BSC objective" });
  }
});

// ============================================================
// MÓDULO — Jornada do Paciente
// ============================================================

// GET /api/qhealth/patient-journey
router.get("/patient-journey", async (req, res) => {
  try {
    const steps = await db.select().from(patientJourneySteps).orderBy(patientJourneySteps.order);
    res.json(steps);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch patient journey" });
  }
});

// POST /api/qhealth/patient-journey
router.post("/patient-journey", async (req, res) => {
  try {
    const [step] = await db.insert(patientJourneySteps).values(req.body).returning();
    res.status(201).json(step);
  } catch (error) {
    res.status(500).json({ error: "Failed to create journey step" });
  }
});

// PUT /api/qhealth/patient-journey/:id
router.put("/patient-journey/:id", async (req, res) => {
  try {
    const [step] = await db.update(patientJourneySteps)
      .set(req.body)
      .where(eq(patientJourneySteps.id, parseInt(req.params.id)))
      .returning();
    res.json(step);
  } catch (error) {
    res.status(500).json({ error: "Failed to update journey step" });
  }
});

// ============================================================
// HOME EXECUTIVA — Dashboard summary
// ============================================================

// GET /api/qhealth/dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const [
      totalRisks,
      totalPlans,
      totalEvents,
      totalDocs,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(risks),
      db.select({ count: sql<number>`count(*)` }).from(actionPlans),
      db.select({ count: sql<number>`count(*)` }).from(safetyEvents),
      db.select({ count: sql<number>`count(*)` }).from(documents),
    ]);

    res.json({
      risks: totalRisks[0]?.count || 0,
      actionPlans: totalPlans[0]?.count || 0,
      safetyEvents: totalEvents[0]?.count || 0,
      documents: totalDocs[0]?.count || 0,
      onaScore: { level1: 84, level2: 71, level3: 58, overall: 71 }, // TODO: calculate from adherence
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

export const qhealthRouter = router;
