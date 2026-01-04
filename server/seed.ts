import { storage } from "./storage";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Create admin user
    const admin = await storage.createProfile({
      email: "admin@mediflow.com",
      password: "admin123", // In production, hash this!
      name: "Dr. Admin",
      role: "admin",
      unit: "Central",
      status: "active"
    });
    console.log("✓ Created admin user");

    // Create regular users
    const sarah = await storage.createProfile({
      email: "sarah@mediflow.com",
      password: "sarah123",
      name: "Enf. Sarah",
      role: "user",
      unit: "Unidade A",
      status: "active"
    });
    console.log("✓ Created user: Sarah");

    const joao = await storage.createProfile({
      email: "joao@mediflow.com",
      password: "joao123",
      name: "Rec. João",
      role: "user",
      unit: "Unidade B",
      status: "active"
    });
    console.log("✓ Created user: João");

    // Create sample processes
    const process1 = await storage.createProcess({
      title: "Solicitação de Medicamentos - Lote A",
      description: "Reposição mensal de antibióticos para a ala pediátrica.",
      unit: "Unidade A",
      type: "Suprimentos",
      priority: "high",
      status: "new",
      responsibleId: sarah.id,
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5), // 5 days from now
    });
    await storage.createEvent({
      processId: process1.id,
      userId: sarah.id,
      action: "created",
      details: "Processo criado"
    });
    console.log("✓ Created process 1");

    const process2 = await storage.createProcess({
      title: "Manutenção de Ar Condicionado",
      description: "Sala de espera principal com falha na refrigeração.",
      unit: "Unidade A",
      type: "Manutenção",
      priority: "medium",
      status: "analysis",
      responsibleId: sarah.id,
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10),
    });
    await storage.createEvent({
      processId: process2.id,
      userId: sarah.id,
      action: "created",
      details: "Processo criado"
    });
    await storage.createEvent({
      processId: process2.id,
      userId: sarah.id,
      action: "status_changed",
      details: "Status alterado para analysis"
    });
    console.log("✓ Created process 2");

    const process3 = await storage.createProcess({
      title: "Contratação de Téc. Enfermagem",
      description: "Substituição para licença maternidade.",
      unit: "Unidade B",
      type: "RH",
      priority: "critical",
      status: "pending",
      responsibleId: joao.id,
      deadline: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // Overdue
    });
    await storage.createEvent({
      processId: process3.id,
      userId: joao.id,
      action: "created",
      details: "Processo criado"
    });
    console.log("✓ Created process 3");

    // Initialize alert settings
    await storage.updateAlertSettings({
      warningDays: 5,
      criticalDays: 2,
      stalledDays: 15
    });
    console.log("✓ Initialized alert settings");

    console.log("✅ Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }
}

seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
