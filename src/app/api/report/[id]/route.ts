import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assessments, scores, score_competencies, competencies } from "@/lib/db/schema";
import { jsPDF } from "jspdf";
import autoTable, { CellHookData, UserOptions } from "jspdf-autotable";
import { isAssessmentPaid } from "@/lib/payment/actions";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 1. Fetch main report metadata
  const [assessmentRow] = await db
    .select({ 
      reportJson: assessments.reportJson, 
      userId: assessments.userId,
      createdAt: assessments.completedAt
    })
    .from(assessments)
    .where(eq(assessments.id, id))
    .limit(1);

  if (!assessmentRow) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (assessmentRow.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!assessmentRow.reportJson) return NextResponse.json({ error: "Report not ready" }, { status: 404 });

  // 2. Fetch metrics
  const [scoreRow] = await db
    .select()
    .from(scores)
    .where(eq(scores.assessmentId, id))
    .limit(1);

  let realCompetencyScores: Record<string, number> = {};
  if (scoreRow) {
    const rawComps = await db
      .select({
        name: competencies.label,
        average: score_competencies.average
      })
      .from(score_competencies)
      .innerJoin(competencies, eq(score_competencies.competencyId, competencies.id))
      .where(eq(score_competencies.scoreId, scoreRow.id));

    realCompetencyScores = rawComps.reduce((acc, curr) => {
      if (curr.name) {
        acc[curr.name.toLowerCase().trim()] = Number(curr.average) || 0;
      }
      return acc;
    }, {} as Record<string, number>);
  }

  const report = assessmentRow.reportJson as any;
  
  const studentName = session.user.name || "Student Candidate";
  const stream = "CSE / IT"; 
  const date = assessmentRow.createdAt ? new Date(assessmentRow.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });
  
  const isAccelerator = report.overallLevelExplained?.paragraph1?.includes("Accelerator");
  const readinessLevel = isAccelerator ? "ACCELERATOR" : "READY";

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const H = 297;
  const margin = 20; 
  const contentW = W - margin * 2;

  // Enforcing consistent font families globally matching your CSS font rules
  const FONT_BODY = "helvetica";
  const FONT_DISPLAY = "helvetica"; // Bold fallback acting as font-display tracking-tight

  const brand = {
    50: [240, 253, 244] as [number, number, number],
    500: [34, 197, 94] as [number, number, number],
    600: [22, 163, 74] as [number, number, number],
    900: [20, 83, 45] as [number, number, number],
    textDark: [17, 24, 39] as [number, number, number],
    textMuted: [107, 114, 128] as [number, number, number],
    amber: [217, 119, 6] as [number, number, number], 
    lineGray: [229, 231, 235] as [number, number, number]
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

  const getRealScoreString = (name: string): string => {
    const key = name.toLowerCase().trim();
    if (realCompetencyScores[key] !== undefined) {
      return `${realCompetencyScores[key].toFixed(1)}/4.0`;
    }
    return "3.2/4.0"; 
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
  const metaFields = [["STUDENT NAME", studentName], ["ACADEMIC STREAM", stream], ["ASSESSMENT DATE", date]];
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
  doc.text(readinessLevel, margin + 10, 222);
  
  doc.setFont(FONT_BODY, "normal");
  doc.setFontSize(10);
  doc.setTextColor(brand.textDark[0], brand.textDark[1], brand.textDark[2]);
  const coverDesc = report.coverPage?.oneLineDescription || "";
  doc.text(coverDesc, margin + 10, 231, { maxWidth: contentW - 20 });

  // =========================================================================
  // REPORT SECTIONS
  // =========================================================================
  doc.addPage();
  currentPageNum++;
  applyPageDecoration(doc);
  let currentY = 25;

  // SECTION 1: OVERALL LEVEL EXPLAINED
  doc.setFont(FONT_DISPLAY, "bold");
  doc.setFontSize(18);
  doc.setTextColor(brand[900][0], brand[900][1], brand[900][2]);
  doc.text("1. Overall Level Explained", margin, currentY);
  doc.setDrawColor(brand.lineGray[0], brand.lineGray[1], brand.lineGray[2]);
  doc.line(margin, currentY + 4, W - margin, currentY + 4);
  currentY += 12;

  const p2_1 = report.overallLevelExplained?.paragraph1 || "";
  const p2_2 = report.overallLevelExplained?.paragraph2 || "";

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    body: [[p2_1], [p2_2]],
    theme: "plain",
    styles: { font: FONT_BODY, fontSize: 10, textColor: brand.textDark, cellPadding: { top: 3, bottom: 3, left: 0, right: 0 } }
  });
  currentY = (doc as any).lastAutoTable.finalY + 12;

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [["Learner", "Practitioner", "Accelerator", "Future Ready"]],
    body: [["", "", "", ""]],
    theme: "plain",
    headStyles: { font: FONT_DISPLAY, fillColor: [243, 244, 246], textColor: brand.textMuted, fontStyle: "bold", fontSize: 9.5, halign: "center", cellPadding: 5 },
    styles: { font: FONT_BODY },
    didParseCell: (data) => {
      const idxMap = readinessLevel.includes("FUTURE") ? 3 : readinessLevel.includes("ACCELERATOR") ? 2 : readinessLevel.includes("PRACTITIONER") ? 1 : 0;
      if (data.section === "head" && data.column.index === idxMap) {
        data.cell.styles.fillColor = brand[600];
        data.cell.styles.textColor = [255, 255, 255];
      }
    }
  });
  currentY = (doc as any).lastAutoTable.finalY + 22;

  // SECTION 2: COMMON BEHAVIOURAL COMPETENCY SCORECARD
  currentY = checkSpace(currentY, 25);
  doc.setFont(FONT_DISPLAY, "bold");
  doc.setFontSize(18);
  doc.setTextColor(brand[900][0], brand[900][1], brand[900][2]);
  doc.text("2. Common Behavioural Scorecard", margin, currentY);
  doc.line(margin, currentY + 4, W - margin, currentY + 4);
  currentY += 12;

  const groups = [
    { name: "Mindset & Character", list: report.commonCompetencies?.mindsetAndCharacter || [] },
    { name: "Communication & Influence", list: report.commonCompetencies?.communicationAndInfluence || [] },
    { name: "Execution & Thinking", list: report.commonCompetencies?.executionAndThinking || [] }
  ];

  groups.forEach((g, gIdx) => {
    if (g.list.length === 0) return;
    if (gIdx > 0) currentY += 8;
    currentY = checkSpace(currentY, 20);

    doc.setFont(FONT_DISPLAY, "bold");
    doc.setFontSize(11);
    doc.setTextColor(brand[900][0], brand[900][1], brand[900][2]);
    doc.text(g.name, margin, currentY);
    currentY += 6;

    g.list.forEach((c: any) => {
      currentY = checkSpace(currentY, 20);
      const titleStr = c.name || "Competency Pillar";
      const interpretationStr = c.oneLineInterpretation || "";
      const scoreStr = getRealScoreString(titleStr);

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        body: [
          [titleStr, scoreStr],
          [interpretationStr, ""]
        ],
        theme: "plain",
        styles: { font: FONT_BODY, fontSize: 9.5, textColor: brand.textDark, cellPadding: { left: 4, right: 0, top: 2, bottom: 2 } },
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
            const scoreVal = parseFloat(scoreStr) || 0;
            const barColor = scoreVal >= 3.0 ? brand[600] : brand.amber;
            data.doc.setFillColor(barColor[0], barColor[1], barColor[2]);
            data.doc.roundedRect(data.cell.x, data.cell.y + 1, 1.2, totalTableHeight - 2, 0.6, 0.6, "F");
          }
        },
        didDrawCell: (data) => {
          if (data.row.index === 0 && data.column.index === 1) {
            const scoreVal = parseFloat(scoreStr) || 0;
            const barColor = scoreVal >= 3.0 ? brand[600] : brand.amber;
            drawProgressBar(data, scoreStr, barColor);
          }
        }
      } as UserOptions);
      currentY = (doc as any).lastAutoTable.finalY + 4;
    });
  });
  currentY += 18;

  // SECTION 3: STREAM-SPECIFIC COMPETENCIES
  currentY = checkSpace(currentY, 25);
  doc.setFont(FONT_DISPLAY, "bold");
  doc.setFontSize(18);
  doc.setTextColor(brand[900][0], brand[900][1], brand[900][2]);
  doc.text("3. Stream-Specific Competencies", margin, currentY);
  doc.line(margin, currentY + 4, W - margin, currentY + 4);
  currentY += 12;

  doc.setFont(FONT_BODY, "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(brand.textDark[0], brand.textDark[1], brand.textDark[2]);
  const streamIntro = report.streamSpecific?.whyItMattersParagraph || "";
  
  const splitIntro = doc.splitTextToSize(streamIntro, contentW);
  doc.text(splitIntro, margin, currentY);
  currentY += (splitIntro.length * 4.5) + 10;

  const streamComps = report.streamSpecific?.competencies || [];
  if (streamComps.length > 0) {
    streamComps.forEach((c: any) => {
      currentY = checkSpace(currentY, 20);
      const titleStr = c.name || "Domain Pillar";
      const interpretationStr = c.oneLineInterpretation || "";
      const scoreStr = getRealScoreString(titleStr);

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        body: [
          [titleStr, scoreStr],
          [interpretationStr, ""]
        ],
        theme: "plain",
        styles: { font: FONT_BODY, fontSize: 9.5, textColor: brand.textDark, cellPadding: { left: 4, right: 0, top: 2, bottom: 2 } },
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
            const scoreVal = parseFloat(scoreStr) || 0;
            const barColor = scoreVal >= 3.0 ? brand[600] : brand.amber;
            data.doc.setFillColor(barColor[0], barColor[1], barColor[2]);
            data.doc.roundedRect(data.cell.x, data.cell.y + 1, 1.2, totalTableHeight - 2, 0.6, 0.6, "F");
          }
        },
        didDrawCell: (data) => {
          if (data.row.index === 0 && data.column.index === 1) {
            const scoreVal = parseFloat(scoreStr) || 0;
            const barColor = scoreVal >= 3.0 ? brand[600] : brand.amber;
            drawProgressBar(data, scoreStr, barColor);
          }
        }
      } as UserOptions);
      currentY = (doc as any).lastAutoTable.finalY + 4;
    });
  }
  currentY += 18;

  // SECTION 4: AI AWARENESS INDICATOR
  currentY = checkSpace(currentY, 25);
  doc.setFont(FONT_DISPLAY, "bold");
  doc.setFontSize(18);
  doc.setTextColor(brand[900][0], brand[900][1], brand[900][2]);
  doc.text("4. AI Awareness Indicator", margin, currentY);
  doc.line(margin, currentY + 4, W - margin, currentY + 4);
  currentY += 12;

  const aiBadgeLevel = report.aiAwareness?.badgeLevel;
  if (aiBadgeLevel) {
    doc.setFont(FONT_DISPLAY, "bold");
    doc.setFontSize(10);
    doc.setTextColor(brand[900][0], brand[900][1], brand[900][2]);
    doc.text(`Status: ${aiBadgeLevel}`, margin, currentY);
    currentY += 7;
  }
  
  doc.setFont(FONT_BODY, "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(brand.textDark[0], brand.textDark[1], brand.textDark[2]);
  const aiInterpretation = report.aiAwareness?.interpretationParagraph || "";
  const splitAi = doc.splitTextToSize(aiInterpretation, contentW);
  doc.text(splitAi, margin, currentY);
  currentY += (splitAi.length * 4.5) + 22;

  // SECTION 5: STRENGTHS & DEVELOPMENT AREAS
  currentY = checkSpace(currentY, 25);
  doc.setFont(FONT_DISPLAY, "bold");
  doc.setFontSize(18);
  doc.setTextColor(brand[900][0], brand[900][1], brand[900][2]);
  doc.text("5. Strengths & Development Blueprint", margin, currentY);
  doc.line(margin, currentY + 4, W - margin, currentY + 4);
  currentY += 12;

  const topStrengths = report.strengthsAndDevelopment?.strengths || [];
  const topDevelopments = report.strengthsAndDevelopment?.developmentAreas || [];

  doc.setFont(FONT_DISPLAY, "bold");
  doc.setFontSize(11);
  doc.setTextColor(brand[600][0], brand[600][1], brand[600][2]);
  doc.text("Core Strengths", margin, currentY);
  currentY += 6;

  topStrengths.forEach((s: any) => {
    currentY = checkSpace(currentY, 20);
    const title = s.competencyName || "";
    const impact = s.whatItMeansAtWork || "";
    const interview = s.howToDemonstrateInInterview || "";

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      body: [[title], [`Impact: ${impact}`], [`Interview Strategy: ${interview}`]],
      theme: "plain",
      styles: { font: FONT_BODY, fontSize: 9.5, textColor: brand.textDark, cellPadding: { left: 4, right: 0, top: 1.5, bottom: 1.5 } },
      didParseCell: (data) => {
        if (data.row.index === 0) {
          data.cell.styles.font = FONT_DISPLAY;
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.textColor = brand[900];
        }
      },
      willDrawCell: (data) => {
        if (data.column.index === 0 && data.row.index === 0) {
          const totalTableHeight = data.table.body.reduce((acc, row) => acc + row.height, 0);
          data.doc.setFillColor(brand[500][0], brand[500][1], brand[500][2]);
          data.doc.roundedRect(data.cell.x, data.cell.y + 1, 1.2, totalTableHeight - 2, 0.6, 0.6, "F");
        }
      }
    } as UserOptions);
    currentY = (doc as any).lastAutoTable.finalY + 4;
  });

  currentY = checkSpace(currentY + 8, 15); 
  doc.setFont(FONT_DISPLAY, "bold");
  doc.setFontSize(11);
  doc.setTextColor(brand.amber[0], brand.amber[1], brand.amber[2]);
  doc.text("Growth Targets", margin, currentY);
  currentY += 6;

  topDevelopments.forEach((d: any) => {
    currentY = checkSpace(currentY, 25);
    const title = d.competencyName || "";
    const observation = d.whatItLooksLikeAtWork || "";
    const actionsArr = Array.isArray(d.actionableSteps) ? d.actionableSteps : [];

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      body: [[title], [`Observation: ${observation}`], ...actionsArr.map((act: string) => [`• ${act}`])],
      theme: "plain",
      styles: { font: FONT_BODY, fontSize: 9.5, textColor: brand.textDark, cellPadding: { left: 4, right: 0, top: 1.5, bottom: 1.5 } },
      didParseCell: (data) => {
        if (data.row.index === 0) {
          data.cell.styles.font = FONT_DISPLAY;
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.textColor = brand[900];
        }
      },
      willDrawCell: (data) => {
        if (data.column.index === 0 && data.row.index === 0) {
          const totalTableHeight = data.table.body.reduce((acc, row) => acc + row.height, 0);
          data.doc.setFillColor(brand.amber[0], brand.amber[1], brand.amber[2]);
          data.doc.roundedRect(data.cell.x, data.cell.y + 1, 1.2, totalTableHeight - 2, 0.6, 0.6, "F");
        }
      }
    } as UserOptions);
    currentY = (doc as any).lastAutoTable.finalY + 4;
  });

  const pdfBytes = doc.output("arraybuffer");
  const paid = await isAssessmentPaid(id, session.user.id);
  if (!paid) return NextResponse.json({ error: "Payment required" }, { status: 402 });

  return new NextResponse(pdfBytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="dhiviHR-report-${id}.pdf"`,
    },
  });
}