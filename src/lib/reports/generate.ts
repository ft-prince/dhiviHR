import { and, eq, asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assessments, scores, score_competencies, competencies, users as usersT } from "@/lib/db/schema";
import { jsPDF } from "jspdf";
import autoTable, { CellHookData, UserOptions } from "jspdf-autotable";
import { READINESS_LEVEL } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface CompetencyDetail {
  average: number;
  gap: "critical_gap" | "development_gap" | "strength";
}

interface GenerateReportOptions {
  assessmentId: string;
  user: {
    id: string;
    name?: string | null;
  };
}

export async function generateReportPdfBuffer({ assessmentId, user }: GenerateReportOptions): Promise<Buffer> {  

  // 1. Fetch data exactly like the Report Page using Promise.all & identical Left Joins
  const [rows, dbCompetencies] = await Promise.all([
    db
      .select({
        assessment: assessments,
        score: scores,
        score_competencies: score_competencies,
        user: usersT,
      })
      .from(assessments)
      .leftJoin(scores, eq(scores.assessmentId, assessments.id))
      .leftJoin(score_competencies, eq(score_competencies.scoreId, scores.id))
      .leftJoin(usersT, eq(usersT.id, assessments.userId))
      .where(
        and(
          eq(assessments.id, assessmentId), 
          eq(assessments.userId, user.id)
        )
      ),
    db
      .select({ id: competencies.id, label: competencies.label })
      .from(competencies)
      .orderBy(asc(competencies.orderIndex))
  ]);

  // 2. Validate row match
  if (!rows || rows.length === 0) throw new Error("Report not found");
  
  const { assessment, score, user: dbUser } = rows[0];
  
  if (assessment.status !== "completed" || !score) {
    throw new Error("Assessment is not completed or scores are missing");
  }

  // 3. Match against your predefined utility array (No hardcoding string values)
  const band = READINESS_LEVEL.find((b) => b.level === score.level);
  if (!band) throw new Error("Invalid readiness level detected");

  // 4. Cast the breakdown object data cleanly matching the page structure
  const breakdownData: Record<string, CompetencyDetail> = {};
  for (const r of rows) {
    if (r.score_competencies?.competencyId) {
      breakdownData[r.score_competencies.competencyId] = {
        average: Number(r.score_competencies.average) || 0,
        gap: r.score_competencies.gap as "critical_gap" | "development_gap" | "strength",
      };
    }
  }

  // 5. Build the tidy lookup map: { [id]: "Label Name" }
  const labelMap = Object.fromEntries(dbCompetencies.map((c) => [c.id, c.label]));

  // 6. Build a structured list of actual user scores bound to their correct label names
  //    This mirrors exactly what the ReportPage does in its Object.entries(labelMap) map.
  const structuredCompetencies = Object.entries(labelMap)
    .filter(([compId]) => breakdownData[compId])
    .map(([compId, labelName]) => {
      const competencyRow = breakdownData[compId];
      const averageValue = typeof competencyRow === 'number' ? competencyRow : (competencyRow?.average ?? 0);
      const gapStatus = competencyRow?.gap ?? "critical_gap";

      return {
        id: compId,
        label: labelName,
        average: averageValue,
        gap: gapStatus,
      };
    });

  const studentName = dbUser?.name || user.name || "Student Candidate";
  const stream = (dbUser as any)?.stream as string || "CSE/IT";

  const date = assessment.completedAt 
    ? new Date(assessment.completedAt).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }) 
    : new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });
  
  const totalScore = score.total;
  const readinessLabel = band.label;

  // ── getRealScoreString ────────────────────────────────────────────────────
  // Looks up a competency by its label name (case-insensitive trim) from the
  // structuredCompetencies array that was built from the actual DB rows.
  // Returns "X.X/4.0" if found, or null if that label has no data — caller
  // decides what to render (never falls back to a made-up number).
  const getRealScoreString = (labelName: string): string | null => {
    const key = labelName.toLowerCase().trim();
    const found = structuredCompetencies.find(
      (c) => c.label.toLowerCase().trim() === key
    );
    if (!found) return null;
    return `${found.average.toFixed(1)}/4.0`;
  };

  // ── groups ────────────────────────────────────────────────────────────────
  // Groups are derived entirely from structuredCompetencies (real DB data).
  // Each item exposes only the fields that actually exist on the object.
  const groups = [
    {
      name: "Mindset & Character",
      list: structuredCompetencies.filter((c) =>
        ["mindset", "character", "grit", "ownership"].some((kw) =>
          c.label.toLowerCase().includes(kw)
        )
      ),
    },
    {
      name: "Communication & Influence",
      list: structuredCompetencies.filter((c) =>
        ["communication", "influence", "presentation", "teamwork"].some((kw) =>
          c.label.toLowerCase().includes(kw)
        )
      ),
    },
    {
      name: "Execution & Thinking",
      list: structuredCompetencies.filter((c) =>
        ["execution", "thinking", "problem solving", "technical", "coding"].some(
          (kw) => c.label.toLowerCase().includes(kw)
        )
      ),
    },
  ];

  // Any competency that didn't match a group keyword goes into a catch-all
  const groupedIds = new Set(groups.flatMap((g) => g.list.map((c) => c.id)));
  const ungrouped = structuredCompetencies.filter((c) => !groupedIds.has(c.id));
  if (ungrouped.length > 0) {
    groups.push({ name: "Other Competencies", list: ungrouped });
  }

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const W = 210;
  const H = 297;
  const margin = 20; 
  const contentW = W - margin * 2;

  const FONT_BODY = "helvetica";
  const FONT_DISPLAY = "helvetica";

  const brand = {
    50: [240, 253, 244] as [number, number, number],
    500: [34, 197, 94] as [number, number, number],
    600: [22, 163, 74] as [number, number, number],
    900: [20, 83, 45] as [number, number, number],
    textDark: [17, 24, 39] as [number, number, number],
    textMuted: [107, 114, 128] as [number, number, number],
    amber: [217, 119, 6] as [number, number, number], 
    lineGray: [229, 231, 235] as [number, number, number],
  };

  let currentPageNum = 1;

  const applyPageDecoration = (pdf: typeof doc) => {
    pdf.setFillColor(brand[600][0], brand[600][1], brand[600][2]);
    pdf.rect(0, 0, W, 4, "F");
    
    pdf.setFillColor(249, 250, 251);
    pdf.rect(0, H - 14, W, 14, "F");
    pdf.setDrawColor(brand.lineGray[0], brand.lineGray[1], brand.lineGray[2]);
    pdf.line(0, H - 14, W, H - 14);
    
    pdf.setFont(FONT_BODY, "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(brand.textMuted[0], brand.textMuted[1], brand.textMuted[2]);
    pdf.text(`dhiviHR Campus Readiness Index • ${studentName}`, margin, H - 6);
    pdf.text(`Page ${currentPageNum}`, W - margin - 10, H - 6);
  };

  const checkSpace = (currentY: number, needed: number): number => {
    if (currentY + needed > H - 20) {
      doc.addPage();
      currentPageNum++;
      applyPageDecoration(doc);
      return 25; 
    }
    return currentY;
  };

  const drawProgressBar = (data: CellHookData, scoreValue: string, hexColor: [number, number, number]) => {
    const rawScore = parseFloat(scoreValue.split("/")[0]) || 0.0;
    const pct = Math.min(Math.max(rawScore / 4.0, 0.0), 1);
    
    const containerWidth = data.cell.width;
    const barWidth = Math.max(containerWidth - 14, 10);
    const startX = data.cell.x;
    const startY = data.cell.y + data.cell.height / 2 - 1.5;
    
    data.doc.setFillColor(237, 242, 247);
    data.doc.roundedRect(startX, startY, barWidth, 3, 1.5, 1.5, "F");
    data.doc.setFillColor(hexColor[0], hexColor[1], hexColor[2]);
    data.doc.roundedRect(startX, startY, barWidth * pct, 3, 1.5, 1.5, "F");

    data.doc.setFont(FONT_DISPLAY, "bold");
    data.doc.setFontSize(8.5);
    data.doc.setTextColor(brand.textDark[0], brand.textDark[1], brand.textDark[2]);
    data.doc.text(`${rawScore.toFixed(1)}`, startX + barWidth + 3, startY + 2.2);
  };

  // =========================================================================
  // COVER PAGE
  // =========================================================================
  doc.setFillColor(brand[50][0], brand[50][1], brand[50][2]);
  doc.rect(0, 0, W, H, "F");
  
  doc.setFont(FONT_DISPLAY, "bold");
  doc.setFontSize(38);
  doc.setTextColor(brand[900][0], brand[900][1], brand[900][2]);
  doc.text("dhivi", margin, 55);
  doc.setTextColor(brand[500][0], brand[500][1], brand[500][2]);
  doc.text("HR", margin + doc.getTextWidth("dhivi"), 55);
  
  doc.setFontSize(11);
  doc.setTextColor(brand[900][0], brand[900][1], brand[900][2]);
  doc.text("STUDENT ASSESSMENT REPORT", margin, 64);
  doc.setFillColor(brand[500][0], brand[500][1], brand[500][2]);
  doc.roundedRect(margin, 67, 40, 1.2, 0.5, 0.5, "F");

  let coverY = 110;
  const metaFields = [
    ["STUDENT NAME", studentName],
    ["ACADEMIC STREAM", stream],
    ["ASSESSMENT DATE", date],
  ];
  metaFields.forEach(([label, value]) => {
    doc.setFont(FONT_DISPLAY, "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(brand[600][0], brand[600][1], brand[600][2]);
    doc.text(label, margin, coverY);
    doc.setFont(FONT_BODY, "normal");
    doc.setFontSize(14);
    doc.setTextColor(brand.textDark[0], brand.textDark[1], brand.textDark[2]);
    doc.text(value, margin, coverY + 7);
    coverY += 24;
  });

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, 200, contentW, 55, 4, 4, "F");
  doc.setFillColor(brand[500][0], brand[500][1], brand[500][2]);
  doc.roundedRect(margin, 200, 2.5, 55, 1, 1, "F");
  
  doc.setFont(FONT_DISPLAY, "bold");
  doc.setFontSize(9);
  doc.setTextColor(brand.textMuted[0], brand.textMuted[1], brand.textMuted[2]);
  doc.text("OVERALL READINESS STATUS", margin + 10, 211);
  doc.setFontSize(24);
  doc.setTextColor(brand[900][0], brand[900][1], brand[900][2]);
  doc.text(readinessLabel, margin + 10, 222);
  
  // Score line beneath readiness label — real data only
  doc.setFont(FONT_BODY, "normal");
  doc.setFontSize(10);
  doc.setTextColor(brand.textDark[0], brand.textDark[1], brand.textDark[2]);
  doc.text(`Total Score: ${totalScore.toFixed(2)} / 4.0`, margin + 10, 231);

  // =========================================================================
  // PAGE 2 — COMPETENCY SCORECARD
  // =========================================================================
  doc.addPage();
  currentPageNum++;
  applyPageDecoration(doc);
  let currentY = 25;

  // ── Section heading ───────────────────────────────────────────────────────
  doc.setFont(FONT_DISPLAY, "bold");
  doc.setFontSize(18);
  doc.setTextColor(brand[900][0], brand[900][1], brand[900][2]);
  doc.text("Competency Scorecard", margin, currentY);
  doc.setDrawColor(brand.lineGray[0], brand.lineGray[1], brand.lineGray[2]);
  doc.line(margin, currentY + 4, W - margin, currentY + 4);
  currentY += 12;

  // Summary row: overall score + readiness band
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    body: [
      ["Overall Score", `${totalScore.toFixed(2)} / 4.0`],
      ["Readiness Level", readinessLabel],
      ["Student", studentName],
      ["Stream", stream],
      ["Date", date],
    ],
    theme: "plain",
    styles: {
      font: FONT_BODY,
      fontSize: 10,
      textColor: brand.textDark,
      cellPadding: { top: 2.5, bottom: 2.5, left: 0, right: 0 },
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 50 },
    },
  });
  currentY = (doc as any).lastAutoTable.finalY + 16;

  // Readiness band highlight row (which band is active)
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [["Learner", "Practitioner", "Accelerator", "Future Ready"]],
    body: [["", "", "", ""]],
    theme: "plain",
    headStyles: {
      font: FONT_DISPLAY,
      fillColor: [243, 244, 246],
      textColor: brand.textMuted,
      fontStyle: "bold",
      fontSize: 9.5,
      halign: "center",
      cellPadding: 5,
    },
    styles: { font: FONT_BODY },
    didParseCell: (data) => {
      const idxMap =
        readinessLabel.toUpperCase().includes("FUTURE") ? 3
        : readinessLabel.toUpperCase().includes("ACCELERATOR") ? 2
        : readinessLabel.toUpperCase().includes("PRACTITIONER") ? 1
        : 0;
      if (data.section === "head" && data.column.index === idxMap) {
        data.cell.styles.fillColor = brand[600];
        data.cell.styles.textColor = [255, 255, 255];
      }
    },
  });
  currentY = (doc as any).lastAutoTable.finalY + 22;

  // ── Competency groups ─────────────────────────────────────────────────────
  groups.forEach((g, gIdx) => {
    if (g.list.length === 0) return;
    if (gIdx > 0) currentY += 8;
    currentY = checkSpace(currentY, 20);

    doc.setFont(FONT_DISPLAY, "bold");
    doc.setFontSize(11);
    doc.setTextColor(brand[900][0], brand[900][1], brand[900][2]);
    doc.text(g.name, margin, currentY);
    currentY += 6;

    g.list.forEach((c) => {
      currentY = checkSpace(currentY, 20);

      // Use the real label from the DB item; no invented name or interpretation
      const titleStr = c.label;
      const scoreStr = getRealScoreString(c.label) ?? `${c.average.toFixed(1)}/4.0`;
      const scoreVal = c.average;
      const barColor = scoreVal >= 3.0 ? brand[600] : brand.amber;

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        body: [
          [titleStr, scoreStr],
        ],
        theme: "plain",
        styles: {
          font: FONT_BODY,
          fontSize: 9.5,
          textColor: brand.textDark,
          cellPadding: { left: 4, right: 0, top: 2, bottom: 2 },
        },
        columnStyles: { 0: { cellWidth: "auto" }, 1: { cellWidth: 55 } },
        didParseCell: (data) => {
          if (data.row.index === 0 && data.column.index === 0) {
            data.cell.styles.font = FONT_DISPLAY;
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.textColor = brand[900];
          }
        },
        willDrawCell: (data) => {
          if (data.column.index === 0 && data.row.index === 0) {
            const totalTableHeight = data.table.body.reduce((acc, r) => acc + r.height, 0);
            data.doc.setFillColor(barColor[0], barColor[1], barColor[2]);
            data.doc.roundedRect(
              data.cell.x, data.cell.y + 1, 1.2, totalTableHeight - 2, 0.6, 0.6, "F"
            );
          }
        },
        didDrawCell: (data) => {
          if (data.row.index === 0 && data.column.index === 1) {
            drawProgressBar(data, scoreStr, barColor);
          }
        },
      } as UserOptions);
      currentY = (doc as any).lastAutoTable.finalY + 4;
    });
  });

  // =========================================================================
  // PAGE 3 — STRENGTHS & GAPS (derived from real gap field, no AI text)
  // =========================================================================
  currentY = checkSpace(currentY + 18, 25);
  doc.setFont(FONT_DISPLAY, "bold");
  doc.setFontSize(18);
  doc.setTextColor(brand[900][0], brand[900][1], brand[900][2]);
  doc.text("Strengths & Development Areas", margin, currentY);
  doc.setDrawColor(brand.lineGray[0], brand.lineGray[1], brand.lineGray[2]);
  doc.line(margin, currentY + 4, W - margin, currentY + 4);
  currentY += 12;

  const strengths = structuredCompetencies.filter((c) => c.gap === "strength");
  const developmentGaps = structuredCompetencies.filter((c) => c.gap === "development_gap");
  const criticalGaps = structuredCompetencies.filter((c) => c.gap === "critical_gap");

  // ── Core Strengths ────────────────────────────────────────────────────────
  if (strengths.length > 0) {
    currentY = checkSpace(currentY, 15);
    doc.setFont(FONT_DISPLAY, "bold");
    doc.setFontSize(11);
    doc.setTextColor(brand[600][0], brand[600][1], brand[600][2]);
    doc.text("Core Strengths", margin, currentY);
    currentY += 6;

    strengths.forEach((c) => {
      currentY = checkSpace(currentY, 16);
      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        body: [[c.label, `${c.average.toFixed(2)} / 4.0`]],
        theme: "plain",
        styles: {
          font: FONT_BODY,
          fontSize: 9.5,
          textColor: brand.textDark,
          cellPadding: { left: 4, right: 0, top: 2, bottom: 2 },
        },
        columnStyles: { 0: { cellWidth: "auto" }, 1: { cellWidth: 30, halign: "right" } },
        didParseCell: (data) => {
          if (data.column.index === 0) {
            data.cell.styles.font = FONT_DISPLAY;
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.textColor = brand[900];
          }
        },
        willDrawCell: (data) => {
          if (data.column.index === 0 && data.row.index === 0) {
            const totalTableHeight = data.table.body.reduce((acc, r) => acc + r.height, 0);
            data.doc.setFillColor(brand[500][0], brand[500][1], brand[500][2]);
            data.doc.roundedRect(
              data.cell.x, data.cell.y + 1, 1.2, totalTableHeight - 2, 0.6, 0.6, "F"
            );
          }
        },
      } as UserOptions);
      currentY = (doc as any).lastAutoTable.finalY + 4;
    });
  }

  // ── Development Gaps ──────────────────────────────────────────────────────
  if (developmentGaps.length > 0) {
    currentY = checkSpace(currentY + 8, 15);
    doc.setFont(FONT_DISPLAY, "bold");
    doc.setFontSize(11);
    doc.setTextColor(brand.amber[0], brand.amber[1], brand.amber[2]);
    doc.text("Development Gaps", margin, currentY);
    currentY += 6;

    developmentGaps.forEach((c) => {
      currentY = checkSpace(currentY, 16);
      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        body: [[c.label, `${c.average.toFixed(2)} / 4.0`]],
        theme: "plain",
        styles: {
          font: FONT_BODY,
          fontSize: 9.5,
          textColor: brand.textDark,
          cellPadding: { left: 4, right: 0, top: 2, bottom: 2 },
        },
        columnStyles: { 0: { cellWidth: "auto" }, 1: { cellWidth: 30, halign: "right" } },
        didParseCell: (data) => {
          if (data.column.index === 0) {
            data.cell.styles.font = FONT_DISPLAY;
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.textColor = brand[900];
          }
        },
        willDrawCell: (data) => {
          if (data.column.index === 0 && data.row.index === 0) {
            const totalTableHeight = data.table.body.reduce((acc, r) => acc + r.height, 0);
            data.doc.setFillColor(brand.amber[0], brand.amber[1], brand.amber[2]);
            data.doc.roundedRect(
              data.cell.x, data.cell.y + 1, 1.2, totalTableHeight - 2, 0.6, 0.6, "F"
            );
          }
        },
      } as UserOptions);
      currentY = (doc as any).lastAutoTable.finalY + 4;
    });
  }

  // ── Critical Gaps ─────────────────────────────────────────────────────────
  if (criticalGaps.length > 0) {
    currentY = checkSpace(currentY + 8, 15);
    doc.setFont(FONT_DISPLAY, "bold");
    doc.setFontSize(11);
    doc.setTextColor(217, 70, 45); // red-ish for critical
    doc.text("Critical Gaps", margin, currentY);
    currentY += 6;

    criticalGaps.forEach((c) => {
      currentY = checkSpace(currentY, 16);
      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        body: [[c.label, `${c.average.toFixed(2)} / 4.0`]],
        theme: "plain",
        styles: {
          font: FONT_BODY,
          fontSize: 9.5,
          textColor: brand.textDark,
          cellPadding: { left: 4, right: 0, top: 2, bottom: 2 },
        },
        columnStyles: { 0: { cellWidth: "auto" }, 1: { cellWidth: 30, halign: "right" } },
        didParseCell: (data) => {
          if (data.column.index === 0) {
            data.cell.styles.font = FONT_DISPLAY;
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.textColor = brand[900];
          }
        },
        willDrawCell: (data) => {
          if (data.column.index === 0 && data.row.index === 0) {
            const totalTableHeight = data.table.body.reduce((acc, r) => acc + r.height, 0);
            data.doc.setFillColor(217, 70, 45);
            data.doc.roundedRect(
              data.cell.x, data.cell.y + 1, 1.2, totalTableHeight - 2, 0.6, 0.6, "F"
            );
          }
        },
      } as UserOptions);
      currentY = (doc as any).lastAutoTable.finalY + 4;
    });
  }

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
