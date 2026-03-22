/**
 * QHealth One 2026 — Utilitário de Geração de PDF via Impressão
 * Abre janela de impressão formatada com layout corporativo hospitalar.
 * Compatível com "Salvar como PDF" do navegador (Chrome, Edge, Firefox).
 */

export interface ReportColumn {
  label: string;
  key: string;
  align?: "left" | "center" | "right";
}

export interface PrintReportOptions {
  title: string;
  subtitle?: string;
  module?: string;
  hospital?: string;
  columns?: ReportColumn[];
  rows?: Record<string, string | number>[];
  customContent?: string;
  kpis?: { label: string; value: string | number; color?: string }[];
  autoprint?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildKpiGrid(kpis: NonNullable<PrintReportOptions["kpis"]>): string {
  const cols = kpis
    .map(
      (k) => `
    <div style="border:1px solid #e2e8f0;border-radius:6px;padding:10px 14px;text-align:center;background:#f8fafc">
      <div style="font-size:22px;font-weight:900;color:${k.color || "#0f172a"}">${k.value}</div>
      <div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;margin-top:2px">${k.label}</div>
    </div>`
    )
    .join("");
  return `<div style="display:grid;grid-template-columns:repeat(${Math.min(kpis.length, 5)},1fr);gap:8px;margin:14px 0">${cols}</div>`;
}

function buildTable(
  columns: ReportColumn[],
  rows: Record<string, string | number>[]
): string {
  const ths = columns
    .map(
      (c) =>
        `<th style="background:#f1f5f9;padding:7px 10px;border:1px solid #cbd5e1;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;text-align:${c.align || "left"}">${c.label}</th>`
    )
    .join("");
  const trs = rows
    .map((row, i) => {
      const tds = columns
        .map(
          (c) =>
            `<td style="padding:5px 10px;border:1px solid #e2e8f0;font-size:10px;text-align:${c.align || "left"};background:${i % 2 === 0 ? "#fff" : "#f8fafc"}">${row[c.key] ?? ""}</td>`
        )
        .join("");
      return `<tr>${tds}</tr>`;
    })
    .join("");
  return `<table style="width:100%;border-collapse:collapse;margin:12px 0"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
}

// ─── Main export function ─────────────────────────────────────────────────────

export function printReport(opts: PrintReportOptions): void {
  const win = window.open("", "_blank", "width=1024,height=768,scrollbars=yes");
  if (!win) {
    alert(
      "Pop-ups bloqueados. Permita pop-ups para este site para gerar PDFs."
    );
    return;
  }

  const date = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const time = new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const tableHtml =
    opts.columns && opts.rows
      ? buildTable(opts.columns, opts.rows)
      : "";

  const kpisHtml = opts.kpis ? buildKpiGrid(opts.kpis) : "";

  const css = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #111; padding: 28px 36px; }
    .header { border-bottom: 3px solid #0f172a; padding-bottom: 14px; margin-bottom: 18px; }
    .header-inner { display: flex; justify-content: space-between; align-items: flex-start; }
    .logo { font-size: 20px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; }
    .logo span { color: #0ea5e9; }
    .logo-sub { font-size: 9px; color: #64748b; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.1em; }
    .header-right { text-align: right; font-size: 10px; color: #6b7280; line-height: 1.6; }
    h1 { font-size: 15px; font-weight: 900; margin: 10px 0 4px; text-align: center; text-transform: uppercase; letter-spacing: 0.05em; color: #0f172a; }
    .subtitle { text-align: center; font-size: 10px; color: #6b7280; margin-bottom: 16px; }
    h2 { font-size: 11px; color: #1e40af; margin: 16px 0 6px; font-weight: 800; border-bottom: 1px solid #bfdbfe; padding-bottom: 3px; text-transform: uppercase; letter-spacing: 0.06em; }
    p { font-size: 10px; color: #374151; line-height: 1.5; margin: 4px 0; }
    .footer { margin-top: 28px; border-top: 1px solid #e5e7eb; padding-top: 10px; display: flex; justify-content: space-between; font-size: 9px; color: #9ca3af; }
    .actions { margin-top: 18px; display: flex; gap: 10px; justify-content: center; padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1; }
    .btn { padding: 9px 24px; border: none; border-radius: 5px; cursor: pointer; font-size: 12px; font-weight: 700; }
    .btn-primary { background: #1d4ed8; color: #fff; }
    .btn-secondary { background: #6b7280; color: #fff; }
    .badge { display: inline-block; padding: 2px 7px; border-radius: 3px; font-size: 9px; font-weight: 700; }
    .info-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 10px 14px; margin: 10px 0; }
    .info-box p { color: #1e40af; }
    @media print {
      .actions { display: none !important; }
      body { padding: 10px 14px; }
      @page { size: A4; margin: 15mm 12mm; }
    }
  `;

  win.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${opts.title} — QHealth One 2026</title>
  <style>${css}</style>
</head>
<body>
  <div class="header">
    <div class="header-inner">
      <div>
        <div class="logo">QHealth <span>One</span> 2026</div>
        <div class="logo-sub">Sistema de Gestão da Qualidade em Saúde</div>
      </div>
      <div class="header-right">
        <div><strong>${opts.hospital || "Instituição de Saúde"}</strong></div>
        <div>Módulo: ${opts.module || opts.title}</div>
        <div>Emitido em ${date} às ${time}</div>
      </div>
    </div>
  </div>

  <h1>${opts.title}</h1>
  ${opts.subtitle ? `<p class="subtitle">${opts.subtitle}</p>` : ""}

  ${kpisHtml}
  ${tableHtml}
  ${opts.customContent || ""}

  <div class="footer">
    <span>QHealth One 2026 &mdash; Relatório gerado em ${date}</span>
    <span>Documento confidencial &mdash; Uso interno</span>
  </div>

  <div class="actions">
    <button class="btn btn-primary" onclick="window.print()">🖨️ Imprimir / Salvar como PDF</button>
    <button class="btn btn-secondary" onclick="window.close()">✕ Fechar</button>
  </div>

  <script>
    // Auto-trigger print after short delay to allow render
    ${opts.autoprint !== false ? "setTimeout(() => window.print(), 700);" : ""}
  </script>
</body>
</html>`);

  win.document.close();
}

// ─── Specific NSP Form Print ─────────────────────────────────────────────────

export interface NSPFormData {
  nspNumber?: string;
  prazo?: string;
  descricao?: string;
  tipoNotificacao?: string;
  dadosPaciente?: string;
  motivoAbertura?: string;
  registradoPor?: string;
  setorNotificante?: string;
  dataOcorrencia?: string;
  horaOcorrencia?: string;
  setorNotificado?: string;
  dataNotificacao?: string;
  horaNotificacao?: string;
  descricaoEvento?: string;
  houveDano?: string;
  descricaoDano?: string;
  acoesImediatas?: string;
  dataAnalise?: string;
  localAnalise?: string;
  horarioAnalise?: string;
  impactado?: string;
  tiposIncidente?: string[];
  porques?: string[];
  dano?: string;
  planos?: { acao: string; responsavel: string; prazo: string; status: string }[];
  hospital?: string;
}

export function printNSPForm(data: NSPFormData): void {
  const win = window.open("", "_blank", "width=1024,height=768,scrollbars=yes");
  if (!win) {
    alert("Pop-ups bloqueados. Permita pop-ups para gerar o formulário NSP.");
    return;
  }

  const date = new Date().toLocaleDateString("pt-BR");
  const time = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const checkboxItem = (checked: boolean, label: string) =>
    `<span style="display:inline-flex;align-items:center;gap:4px;margin-right:12px;font-size:10px">
      <span style="display:inline-block;width:12px;height:12px;border:1.5px solid #374151;border-radius:2px;background:${checked ? "#1d4ed8" : "#fff"};text-align:center;line-height:10px;font-size:9px;color:white">${checked ? "✓" : ""}</span>
      ${label}
    </span>`;

  const radioItem = (checked: boolean, label: string) =>
    `<span style="display:inline-flex;align-items:center;gap:4px;margin-right:16px;font-size:10px">
      <span style="display:inline-block;width:12px;height:12px;border:1.5px solid #374151;border-radius:50%;background:${checked ? "#1d4ed8" : "#fff"}"></span>
      ${label}
    </span>`;

  const incidentesCols = [
    ["Processos", "Equipamentos"],
    ["Contratualização", "Dispositivo/Equip. Médicos"],
    ["Documentação", "Medicamentos (dose errada, med. errado, paciente errado, etc)"],
    ["Infecção Ass. aos Cuidados à Saúde", "Cadeia medicamentos"],
    ["Intercorrências (febre, alergia, etc)", "Identificação do paciente"],
    ["Hemovigilância", "Estrutura predial"],
    ["Outros", ""],
  ];

  const tipos = data.tiposIncidente || [];
  const incTable = incidentesCols
    .map(
      ([a, b]) =>
        `<tr>
      <td style="padding:4px 6px;border:1px solid #ccc;font-size:9px">${checkboxItem(tipos.includes(a), a)}</td>
      <td style="padding:4px 6px;border:1px solid #ccc;font-size:9px">${b ? checkboxItem(tipos.includes(b), b) : ""}</td>
    </tr>`
    )
    .join("");

  const porques = data.porques || ["", "", "", "", ""];
  const planosRows = (data.planos || [{ acao: "", responsavel: "", prazo: "", status: "" }])
    .map(
      (p) =>
        `<tr>
      <td style="border:1px solid #ccc;padding:5px 6px;font-size:9px;min-height:20px">${p.acao}</td>
      <td style="border:1px solid #ccc;padding:5px 6px;font-size:9px">${p.responsavel}</td>
      <td style="border:1px solid #ccc;padding:5px 6px;font-size:9px">${p.prazo}</td>
      <td style="border:1px solid #ccc;padding:5px 6px;font-size:9px">${p.status}</td>
    </tr>`
    )
    .join("");

  const css = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 10px; color: #000; padding: 16px 20px; }
    .logo-bar { display: flex; align-items: center; gap: 12px; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 8px; }
    .logo { font-size: 14px; font-weight: 900; color: #0f172a; }
    .logo span { color: #0ea5e9; }
    .doc-title { text-align: center; flex: 1; }
    .doc-title h1 { font-size: 13px; font-weight: 900; text-transform: uppercase; }
    .doc-ref { font-size: 8px; color: #666; text-align: right; }
    .field-row { display: flex; gap: 8px; margin: 5px 0; align-items: flex-end; }
    .field { flex: 1; }
    .field label { font-size: 8px; font-weight: 700; text-transform: uppercase; color: #374151; display: block; margin-bottom: 2px; }
    .field .val { border-bottom: 1px solid #000; min-height: 14px; font-size: 9px; padding: 0 2px; }
    .section-title { background: #1e3a5f; color: #fff; font-size: 10px; font-weight: 900; text-align: center; padding: 4px; text-transform: uppercase; margin: 8px 0 4px; letter-spacing: 0.05em; }
    .patient-box { border: 2px dashed #64748b; padding: 8px; min-height: 60px; font-size: 9px; }
    .tipo-box { border: 1px solid #000; padding: 8px; }
    table.form { width: 100%; border-collapse: collapse; }
    table.form td { border: 1px solid #000; padding: 4px 6px; vertical-align: top; }
    .footer-ref { text-align: right; font-size: 8px; color: #555; margin-top: 6px; }
    .actions { margin-top: 14px; display: flex; gap: 10px; justify-content: center; padding: 10px; background: #f1f5f9; border-radius: 6px; }
    .btn { padding: 8px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 700; }
    .btn-primary { background: #1d4ed8; color: #fff; }
    .btn-secondary { background: #6b7280; color: #fff; }
    @media print {
      .actions { display: none !important; }
      body { padding: 8px 10px; }
      @page { size: A4; margin: 10mm 8mm; }
    }
  `;

  win.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Notificação de Evento NSP — QHealth One 2026</title>
  <style>${css}</style>
</head>
<body>

  <!-- HEADER -->
  <div class="logo-bar">
    <div>
      <div class="logo">QHealth <span>One</span></div>
      <div style="font-size:7px;color:#64748b;text-transform:uppercase">Programa de Qualidade</div>
    </div>
    <div class="doc-title">
      <h1>Notificação de Evento / Não Conformidade / Quebra de Contrato</h1>
      <div style="font-size:8px;color:#555;margin-top:2px">${data.hospital || "Instituição de Saúde"}</div>
    </div>
    <div class="doc-ref">
      <div>Numerador NSP: <strong>${data.nspNumber || "_______________"}</strong></div>
      <div>Prazo: ${data.prazo || "_______________"}</div>
      <div>Emitido: ${date} ${time}</div>
    </div>
  </div>

  <!-- TIPO + PACIENTE -->
  <table style="width:100%;border-collapse:collapse;margin-bottom:6px">
    <tr>
      <td style="width:55%;border:1px solid #000;padding:6px;vertical-align:top">
        <div style="font-size:8px;font-weight:700;text-transform:uppercase;color:#555;margin-bottom:4px">Etiqueta com os Dados do Paciente</div>
        <div style="font-size:9px;min-height:50px;white-space:pre-wrap">${data.dadosPaciente || ""}</div>
      </td>
      <td style="width:45%;border:1px solid #000;padding:6px;vertical-align:top">
        <div style="font-size:9px;font-weight:700;margin-bottom:4px">TIPO DE NOTIFICAÇÃO</div>
        ${radioItem(data.tipoNotificacao === "Evento", "Evento")}
        ${radioItem(data.tipoNotificacao === "Não conformidade", "Não conformidade")}
        ${radioItem(data.tipoNotificacao === "Quebra de Contrato", "Quebra de Contrato")}
      </td>
    </tr>
  </table>

  <!-- MOTIVO DA ABERTURA -->
  <div class="section-title">Motivo da Abertura</div>
  <table class="form" style="margin-bottom:6px">
    <tr>
      <td style="width:25%"><strong style="font-size:8px">Registrado por (Opcional):</strong><br><span style="font-size:9px">${data.registradoPor || ""}</span></td>
      <td style="width:20%"><strong style="font-size:8px">Setor Notificante:</strong><br><span style="font-size:9px">${data.setorNotificante || ""}</span></td>
      <td style="width:15%"><strong style="font-size:8px">Data Ocorrência:</strong><br><span style="font-size:9px">${data.dataOcorrencia || "__/__/____"}</span></td>
      <td style="width:15%"><strong style="font-size:8px">Hora Ocorrência:</strong><br><span style="font-size:9px">${data.horaOcorrencia || "__:__"}</span></td>
      <td style="width:15%"><strong style="font-size:8px">Setor Notificado:</strong><br><span style="font-size:9px">${data.setorNotificado || ""}</span></td>
    </tr>
    <tr>
      <td><strong style="font-size:8px">Data Notificação:</strong><br><span style="font-size:9px">${data.dataNotificacao || "__/__/____"}</span></td>
      <td><strong style="font-size:8px">Hora Notificação:</strong><br><span style="font-size:9px">${data.horaNotificacao || "__:__"}</span></td>
      <td colspan="3">&nbsp;</td>
    </tr>
    <tr>
      <td colspan="5">
        <strong style="font-size:8px">Descrição do Evento / Não Conformidade / Quebra de Contrato:</strong><br>
        <div style="min-height:35px;font-size:9px;margin-top:2px;white-space:pre-wrap">${data.descricaoEvento || ""}</div>
      </td>
    </tr>
    <tr>
      <td colspan="5">
        <strong style="font-size:8px">Houve consequência(s) / DANO(S) ao paciente ou profissional?</strong>&nbsp;&nbsp;
        ${radioItem(data.houveDano === "Sim", "Sim")}
        ${radioItem(data.houveDano === "Não", "Não")}
        ${data.houveDano === "Sim" ? `<br><div style="min-height:25px;font-size:9px;margin-top:3px;white-space:pre-wrap">${data.descricaoDano || ""}</div>` : ""}
      </td>
    </tr>
    <tr>
      <td colspan="5">
        <strong style="font-size:8px">Quais ações foram tomadas imediatamente após a detecção do evento (ação de disposição)?</strong><br>
        <div style="min-height:25px;font-size:9px;margin-top:2px;white-space:pre-wrap">${data.acoesImediatas || ""}</div>
      </td>
    </tr>
  </table>

  <!-- ANÁLISE -->
  <div class="section-title">Análise de Não Conformidades e Eventos</div>
  <table class="form" style="margin-bottom:4px">
    <tr>
      <td style="width:30%"><strong style="font-size:8px">Data:</strong> ${data.dataAnalise || ""}</td>
      <td style="width:35%"><strong style="font-size:8px">Local:</strong> ${data.localAnalise || ""}</td>
      <td style="width:35%"><strong style="font-size:8px">Horário:</strong> ${data.horarioAnalise || ""}</td>
    </tr>
    <tr>
      <td colspan="3">
        <strong style="font-size:8px">Impactado:</strong>&nbsp;
        ${radioItem(data.impactado === "Paciente", "Paciente")}
        ${radioItem(data.impactado === "Acompanhante", "Acompanhante")}
        ${radioItem(data.impactado === "Colaborador", "Colaborador")}
      </td>
    </tr>
  </table>

  <div style="font-size:9px;font-weight:700;text-align:center;background:#e5e7eb;padding:3px;margin-bottom:2px;text-transform:uppercase">Análise do Evento — Tipo de Incidente</div>
  <table class="form" style="margin-bottom:6px">
    ${incTable}
  </table>

  <!-- 5 PORQUÊS -->
  <div class="section-title">Análise de Causa Raiz — Ferramenta 5 Porquês</div>
  <table class="form" style="margin-bottom:6px">
    <tr>
      <td style="width:50%;vertical-align:top">
        ${[0, 2, 4].map((i) => `<div style="margin-bottom:5px"><strong style="font-size:8px">Por quê? ${i + 1}</strong><div style="min-height:20px;font-size:9px;border-bottom:1px solid #ccc;white-space:pre-wrap">${porques[i] || ""}</div></div>`).join("")}
      </td>
      <td style="width:50%;vertical-align:top">
        ${[1, 3].map((i) => `<div style="margin-bottom:5px"><strong style="font-size:8px">Por quê? ${i + 1}</strong><div style="min-height:20px;font-size:9px;border-bottom:1px solid #ccc;white-space:pre-wrap">${porques[i] || ""}</div></div>`).join("")}
        <div style="margin-bottom:5px"><strong style="font-size:8px;color:#dc2626">Dano (causa raiz identificada):</strong><div style="min-height:20px;font-size:9px;border-bottom:2px solid #dc2626;white-space:pre-wrap">${data.dano || ""}</div></div>
      </td>
    </tr>
  </table>

  <!-- PLANO DE AÇÃO -->
  <div class="section-title">Ações para Melhorias — Plano de Ação</div>
  <table class="form">
    <thead>
      <tr style="background:#e5e7eb">
        <th style="padding:4px 6px;border:1px solid #000;font-size:9px;width:45%">Plano de Ação</th>
        <th style="padding:4px 6px;border:1px solid #000;font-size:9px;width:25%">Responsável</th>
        <th style="padding:4px 6px;border:1px solid #000;font-size:9px;width:15%">Prazo</th>
        <th style="padding:4px 6px;border:1px solid #000;font-size:9px;width:15%">Status</th>
      </tr>
    </thead>
    <tbody>
      ${planosRows}
      <tr><td style="min-height:16px;border:1px solid #000">&nbsp;</td><td style="border:1px solid #000">&nbsp;</td><td style="border:1px solid #000">&nbsp;</td><td style="border:1px solid #000">&nbsp;</td></tr>
    </tbody>
  </table>

  <div class="footer-ref">POR BN - 003 &nbsp;|&nbsp; QHealth One 2026</div>

  <div class="actions">
    <button class="btn btn-primary" onclick="window.print()">🖨️ Imprimir / Salvar como PDF</button>
    <button class="btn btn-secondary" onclick="window.close()">✕ Fechar</button>
  </div>

  <script>setTimeout(() => window.print(), 800);</script>
</body>
</html>`);

  win.document.close();
}
