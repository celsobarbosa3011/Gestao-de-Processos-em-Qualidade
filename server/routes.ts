import type { Express } from "express";
import { type Server } from "http";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { uploadRouter } from "./routes/uploads";
import { authRouter } from "./routes/auth";
import { usersRouter } from "./routes/users";
import { unitsRouter } from "./routes/units";
import { processesRouter } from "./routes/processes";
import { processTypesRouter } from "./routes/process_types";
import { prioritiesRouter } from "./routes/priorities";
import { eventsRouter } from "./routes/events";
import { settingsRouter } from "./routes/settings";
import { checklistsRouter } from "./routes/checklists";
import { attachmentsRouter } from "./routes/attachments";
import { labelsRouter } from "./routes/labels";
import { chatRouter } from "./routes/chat";
import { permissionsRouter } from "./routes/permissions";
import { templatesRouter } from "./routes/templates";
import { featuresRouter } from "./routes/features";
import { timeEntriesRouter } from "./routes/time_entries";
import { customFieldsRouter } from "./routes/custom_fields";
import { automationsRouter } from "./routes/automations";
import { notificationsRouter } from "./routes/notifications";
import { swimlanesRouter } from "./routes/swimlanes";
import { analyticsRouter } from "./routes/analytics";
import { dashboardWidgetsRouter } from "./routes/dashboard_widgets";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Register Object Storage routes for persistent file storage
  registerObjectStorageRoutes(app);

  // Register API routes
  app.use("/api/upload", uploadRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/profiles", usersRouter);
  app.use("/api/units", unitsRouter);
  app.use("/api/processes", processesRouter);
  app.use("/api/process-types", processTypesRouter);
  app.use("/api/priorities", prioritiesRouter);
  app.use("/api/events", eventsRouter);
  app.use("/api/settings", settingsRouter);
  app.use("/api/checklists", checklistsRouter); // Generic checklist ops
  app.use("/api/attachments", attachmentsRouter); // Generic attachment ops
  app.use("/api/labels", labelsRouter); // Generic label ops
  app.use("/api/chat", chatRouter);
  app.use("/api/permissions", permissionsRouter);
  app.use("/api/templates", templatesRouter);
  app.use("/api/features", featuresRouter);
  app.use("/api/time-entries", timeEntriesRouter); // Generic time-entry ops
  app.use("/api/custom-fields", customFieldsRouter);
  app.use("/api/automations", automationsRouter);
  app.use("/api/notifications", notificationsRouter);
  app.use("/api/swimlanes", swimlanesRouter);
  app.use("/api/analytics", analyticsRouter);
  app.use("/api/dashboard/widgets", dashboardWidgetsRouter);

  return httpServer;
}
