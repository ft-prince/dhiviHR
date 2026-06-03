import { jsPDF } from "jspdf";
import autoTable, { type UserOptions } from "jspdf-autotable";
import { drawRadarChart, drawBarChart, drawReadinessBand } from "./charts";

const W = 210;
const H = 297;
const MARGIN = 20;
const CONTENT_W = W - MARGIN * 2;
const FONT_BODY = "helvetica";
const FONT_DISPLAY = "helvetica";

const BRAND = {
  50: [240, 253, 244] as [number, number, number],
  500: [34, 197, 94] as [number, number, number],
  600: [22, 163, 74] as [number, number, number],
  900: [20, 83, 45] as [number, number, number],
  textDark: [17, 24, 39] as [number, number, number],
  textMuted: [107, 114, 128] as [number, number, number],
  amber: [217, 119, 6] as [number, number, number],
  red: [220, 38, 38] as [number, number, number],
  lineGray: [229, 231, 235] as [number, number, number],
};

export interface CompetencyScore {
  id: string;
  label: string;
  average: number;
  gap: "critical_gap" | "development_gap" | "strength";
}

export interface ReportData {
  studentName: string;
  stream: string;
  date: string;
  totalScore: number;
  readinessLevel: string;
  readinessLabel: string;
  competencies: CompetencyScore[];
  reportJson?: Record<string, unknown> | null;
}

interface PageState {
  pageNum: number;
  y: number;
}

function applyPageDecoration(doc: jsPDF, pageNum: number, studentName: string): void {
  doc.setFillColor(BRAND[600][0], BRAND[600][1], BRAND[600][2]);
  doc.rect(0, 0, W, 4, "F");

  doc.setFillColor(249, 250, 251);
  doc.rect(0, H - 14, W, 14, "F");
  doc.setDrawColor(BRAND.lineGray[0], BRAND.lineGray[1], BRAND.lineGray[2]);
  doc.line(0, H - 14, W, H - 14);

  doc.setFont(FONT_BODY, "normal");
  doc.setFontSize(8);
  doc.setTextColor(BRAND.textMuted[0], BRAND.textMuted[1], BRAND.textMuted[2]);
  doc.text(`dhiviHR Campus Readiness Index`, MARGIN, H - 6);
  doc.text(`Page ${pageNum}`, W - MARGIN - 10, H - 6);
}

function checkSpace(doc: jsPDF, state: PageState, needed: number, studentName: string): number {
  if (state.y + needed > H - 20) {
    doc.addPage();
    state.pageNum++;
    applyPageDecoration(doc, state.pageNum, studentName);
    state.y = 25;
    return 25;
  }
  return state.y;
}

function sectionHeading(doc: jsPDF, state: PageState, title: string, studentName: string): void {
  state.y = checkSpace(doc, state, 25, studentName);
  doc.setFont(FONT_DISPLAY, "bold");
  doc.setFontSize(18);
  doc.setTextColor(BRAND[900][0], BRAND[900][1], BRAND[900][2]);
  doc.text(title, MARGIN, state.y);
  doc.setDrawColor(BRAND.lineGray[0], BRAND.lineGray[1], BRAND.lineGray[2]);
  doc.line(MARGIN, state.y + 4, W - MARGIN, state.y + 4);
  state.y += 12;
}

function renderCoverPage(doc: jsPDF, data: ReportData): void {
  doc.setFillColor(BRAND[50][0], BRAND[50][1], BRAND[50][2]);
  doc.rect(0, 0, W, H, "F");

  doc.setFont(FONT_DISPLAY, "bold");
  doc.setFontSize(38);
  doc.setTextColor(BRAND[900][0], BRAND[900][1], BRAND[900][2]);
  doc.text("dhivi", MARGIN, 55);
  doc.setTextColor(BRAND[500][0], BRAND[500][1], BRAND[500][2]);
  doc.text("HR", MARGIN + doc.getTextWidth("dhivi"), 55);

  doc.setFontSize(11);
  doc.setTextColor(BRAND[900][0], BRAND[900][1], BRAND[900][2]);
  doc.text("STUDENT ASSESSMENT REPORT", MARGIN, 64);
  doc.setFillColor(BRAND[500][0], BRAND[500][1], BRAND[500][2]);
  doc.roundedRect(MARGIN, 67, 40, 1.2, 0.5, 0.5, "F");

  let coverY = 110;
  const metaFields = [
    ["STUDENT NAME", data.studentName],
    ["ACADEMIC STREAM", data.stream],
    ["ASSESSMENT DATE", data.date],
  ];
  for (const [label, value] of metaFields) {
    doc.setFont(FONT_DISPLAY, "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(BRAND[600][0], BRAND[600][1], BRAND[600][2]);
    doc.text(label, MARGIN, coverY);
    doc.setFont(FONT_BODY, "normal");
    doc.setFontSize(14);
    doc.setTextColor(BRAND.textDark[0], BRAND.textDark[1], BRAND.textDark[2]);
    doc.text(value, MARGIN, coverY + 7);
    coverY += 24;
  }

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(MARGIN, 195, CONTENT_W, 65, 4, 4, "F");
  doc.setFillColor(BRAND[500][0], BRAND[500][1], BRAND[500][2]);
  doc.roundedRect(MARGIN, 195, 2.5, 65, 1, 1, "F");

  doc.setFont(FONT_DISPLAY, "bold");
  doc.setFontSize(9);
  doc.setTextColor(BRAND.textMuted[0], BRAND.textMuted[1], BRAND.textMuted[2]);
  doc.text("OVERALL READINESS STATUS", MARGIN + 10, 206);
  doc.setFontSize(24);
  doc.setTextColor(BRAND[900][0], BRAND[900][1], BRAND[900][2]);
  doc.text(data.readinessLabel, MARGIN + 10, 218);

  doc.setFont(FONT_BODY, "normal");
  doc.setFontSize(10);
  doc.setTextColor(BRAND.textDark[0], BRAND.textDark[1], BRAND.textDark[2]);
  doc.text(`Total Score: ${data.totalScore.toFixed(2)} / 4.0`, MARGIN + 10, 228);

  drawReadinessBand(doc, MARGIN + 10, 235, CONTENT_W - 20, data.totalScore, data.readinessLevel);

  const coverDesc = (data.reportJson as any)?.coverPage?.oneLineDescription;
  if (coverDesc) {
    doc.setFont(FONT_BODY, "normal");
    doc.setFontSize(9);
    doc.setTextColor(BRAND.textMuted[0], BRAND.textMuted[1], BRAND.textMuted[2]);
    const lines = doc.splitTextToSize(coverDesc, CONTENT_W - 20);
    doc.text(lines, MARGIN + 10, 255);
  }
}

function renderChartsPage(doc: jsPDF, data: ReportData, state: PageState): void {
  doc.addPage();
  state.pageNum++;
  applyPageDecoration(doc, state.pageNum, data.studentName);
  state.y = 25;

  sectionHeading(doc, state, "Competency Profile", data.studentName);

  const radarData = data.competencies.map((c) => ({
    label: c.label,
    value: c.average,
    maxValue: 4,
  }));

  if (radarData.length >= 3) {
    drawRadarChart(doc, W / 2, state.y + 45, 35, radarData);
    state.y += 100;
  }

  state.y = checkSpace(doc, state, 20 + data.competencies.length * 14, data.studentName);

  const barData = data.competencies.map((c) => ({
    label: c.label,
    value: c.average,
    gap: c.gap,
  }));

  state.y = drawBarChart(doc, MARGIN, state.y, CONTENT_W, barData);
}

function renderScorecardPage(doc: jsPDF, data: ReportData, state: PageState): void {
  doc.addPage();
  state.pageNum++;
  applyPageDecoration(doc, state.pageNum, data.studentName);
  state.y = 25;

  sectionHeading(doc, state, "Competency Scorecard", data.studentName);

  autoTable(doc, {
    startY: state.y,
    margin: { left: MARGIN, right: MARGIN },
    body: [
      ["Overall Score", `${data.totalScore.toFixed(2)} / 4.0`],
      ["Readiness Level", data.readinessLabel],
      ["Student", data.studentName],
      ["Stream", data.stream],
      ["Date", data.date],
    ],
    theme: "plain",
    styles: { font: FONT_BODY, fontSize: 10, textColor: BRAND.textDark, cellPadding: { top: 2.5, bottom: 2.5, left: 0, right: 0 } },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 } },
  });
  state.y = (doc as any).lastAutoTable.finalY + 12;

  for (const c of data.competencies) {
    state.y = checkSpace(doc, state, 20, data.studentName);
    const scoreStr = `${c.average.toFixed(1)}/4.0`;
    const barColor = c.gap === "strength" ? BRAND[600] : c.gap === "development_gap" ? BRAND.amber : BRAND.red;

    autoTable(doc, {
      startY: state.y,
      margin: { left: MARGIN, right: MARGIN },
      body: [[c.label, scoreStr]],
      theme: "plain",
      styles: { font: FONT_BODY, fontSize: 9.5, textColor: BRAND.textDark, cellPadding: { left: 4, right: 0, top: 2, bottom: 2 } },
      columnStyles: { 0: { cellWidth: "auto" }, 1: { cellWidth: 55 } },
      didParseCell: (d) => {
        if (d.row.index === 0 && d.column.index === 0) {
          d.cell.styles.font = FONT_DISPLAY;
          d.cell.styles.fontStyle = "bold";
          d.cell.styles.textColor = BRAND[900];
        }
      },
      willDrawCell: (d) => {
        if (d.column.index === 0 && d.row.index === 0) {
          const h = d.table.body.reduce((a, r) => a + r.height, 0);
          d.doc.setFillColor(barColor[0], barColor[1], barColor[2]);
          d.doc.roundedRect(d.cell.x, d.cell.y + 1, 1.2, h - 2, 0.6, 0.6, "F");
        }
      },
      didDrawCell: (d) => {
        if (d.row.index === 0 && d.column.index === 1) {
          const rawScore = parseFloat(scoreStr) || 0;
          const pct = Math.min(rawScore / 4, 1);
          const bw = Math.max(d.cell.width - 14, 10);
          const sx = d.cell.x;
          const sy = d.cell.y + d.cell.height / 2 - 1.5;
          d.doc.setFillColor(237, 242, 247);
          d.doc.roundedRect(sx, sy, bw, 3, 1.5, 1.5, "F");
          d.doc.setFillColor(barColor[0], barColor[1], barColor[2]);
          d.doc.roundedRect(sx, sy, bw * pct, 3, 1.5, 1.5, "F");
          d.doc.setFont(FONT_DISPLAY, "bold");
          d.doc.setFontSize(8.5);
          d.doc.setTextColor(BRAND.textDark[0], BRAND.textDark[1], BRAND.textDark[2]);
          d.doc.text(`${rawScore.toFixed(1)}`, sx + bw + 3, sy + 2.2);
        }
      },
    } as UserOptions);
    state.y = (doc as any).lastAutoTable.finalY + 4;
  }
}

function renderStrengthsAndGaps(doc: jsPDF, data: ReportData, state: PageState): void {
  sectionHeading(doc, state, "Strengths & Development Areas", data.studentName);

  const strengths = data.competencies.filter((c) => c.gap === "strength");
  const devGaps = data.competencies.filter((c) => c.gap === "development_gap");
  const critGaps = data.competencies.filter((c) => c.gap === "critical_gap");

  const renderGroup = (title: string, items: CompetencyScore[], color: [number, number, number]) => {
    if (items.length === 0) return;
    state.y = checkSpace(doc, state, 15, data.studentName);
    doc.setFont(FONT_DISPLAY, "bold");
    doc.setFontSize(11);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(title, MARGIN, state.y);
    state.y += 6;

    for (const c of items) {
      state.y = checkSpace(doc, state, 16, data.studentName);
      autoTable(doc, {
        startY: state.y,
        margin: { left: MARGIN, right: MARGIN },
        body: [[c.label, `${c.average.toFixed(2)} / 4.0`]],
        theme: "plain",
        styles: { font: FONT_BODY, fontSize: 9.5, textColor: BRAND.textDark, cellPadding: { left: 4, right: 0, top: 2, bottom: 2 } },
        columnStyles: { 0: { cellWidth: "auto" }, 1: { cellWidth: 30, halign: "right" } },
        didParseCell: (d) => { if (d.column.index === 0) { d.cell.styles.font = FONT_DISPLAY; d.cell.styles.fontStyle = "bold"; d.cell.styles.textColor = BRAND[900]; } },
        willDrawCell: (d) => {
          if (d.column.index === 0 && d.row.index === 0) {
            const h = d.table.body.reduce((a, r) => a + r.height, 0);
            d.doc.setFillColor(color[0], color[1], color[2]);
            d.doc.roundedRect(d.cell.x, d.cell.y + 1, 1.2, h - 2, 0.6, 0.6, "F");
          }
        },
      } as UserOptions);
      state.y = (doc as any).lastAutoTable.finalY + 4;
    }
  };

  renderGroup("Core Strengths", strengths, BRAND[600]);
  renderGroup("Development Gaps", devGaps, BRAND.amber);
  renderGroup("Critical Gaps", critGaps, BRAND.red);
}

function renderAISections(doc: jsPDF, data: ReportData, state: PageState): void {
  const report = data.reportJson as any;
  if (!report) return;

  const wrapText = (text: string) => {
    if (!text) return;
    doc.setFont(FONT_BODY, "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(BRAND.textDark[0], BRAND.textDark[1], BRAND.textDark[2]);
    const lines = doc.splitTextToSize(text, CONTENT_W);
    state.y = checkSpace(doc, state, lines.length * 4.5 + 5, data.studentName);
    doc.text(lines, MARGIN, state.y);
    state.y += lines.length * 4.5 + 6;
  };

  if (report.overallLevelExplained) {
    sectionHeading(doc, state, "Overall Level Explained", data.studentName);
    wrapText(report.overallLevelExplained.paragraph1);
    wrapText(report.overallLevelExplained.paragraph2);
  }

  if (report.industryReadiness?.paragraph) {
    sectionHeading(doc, state, "Industry Readiness Context", data.studentName);
    wrapText(report.industryReadiness.paragraph);
  }

  if (report.aiAwareness) {
    sectionHeading(doc, state, "AI Awareness Indicator", data.studentName);
    if (report.aiAwareness.badgeLevel) {
      state.y = checkSpace(doc, state, 10, data.studentName);
      doc.setFont(FONT_DISPLAY, "bold");
      doc.setFontSize(10);
      doc.setTextColor(BRAND[900][0], BRAND[900][1], BRAND[900][2]);
      doc.text(`Status: ${report.aiAwareness.badgeLevel}`, MARGIN, state.y);
      state.y += 7;
    }
    wrapText(report.aiAwareness.interpretationParagraph);
    if (report.aiAwareness.recommendedTools?.length) {
      doc.setFont(FONT_DISPLAY, "bold");
      doc.setFontSize(9);
      doc.setTextColor(BRAND[600][0], BRAND[600][1], BRAND[600][2]);
      state.y = checkSpace(doc, state, 10, data.studentName);
      doc.text("Recommended AI Tools:", MARGIN, state.y);
      state.y += 5;
      for (const tool of report.aiAwareness.recommendedTools) {
        wrapText(`• ${tool}`);
      }
    }
  }

  if (report.strengthsAndDevelopment) {
    sectionHeading(doc, state, "Strengths & Development Blueprint", data.studentName);

    const renderItems = (title: string, items: any[], color: [number, number, number]) => {
      if (!items?.length) return;
      state.y = checkSpace(doc, state, 15, data.studentName);
      doc.setFont(FONT_DISPLAY, "bold");
      doc.setFontSize(11);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(title, MARGIN, state.y);
      state.y += 7;

      for (const item of items) {
        state.y = checkSpace(doc, state, 25, data.studentName);
        doc.setFont(FONT_DISPLAY, "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(BRAND[900][0], BRAND[900][1], BRAND[900][2]);
        doc.text(item.competencyName || "", MARGIN + 4, state.y);
        state.y += 5;

        if (item.whatItMeansAtWork) wrapText(`Impact: ${item.whatItMeansAtWork}`);
        if (item.howToDemonstrateInInterview) wrapText(`Interview Strategy: ${item.howToDemonstrateInInterview}`);
        if (item.realWorldScenario) wrapText(`Scenario: ${item.realWorldScenario}`);
        if (item.whatItLooksLikeAtWork) wrapText(`Observation: ${item.whatItLooksLikeAtWork}`);
        if (item.actionableSteps?.length) {
          for (const step of item.actionableSteps) {
            wrapText(`• ${step}`);
          }
        }
      }
    };

    renderItems("Core Strengths", report.strengthsAndDevelopment.strengths, BRAND[600]);
    renderItems("Growth Targets", report.strengthsAndDevelopment.developmentAreas, BRAND.amber);
  }

  if (report.actionPlan) {
    sectionHeading(doc, state, "30-60-90 Day Action Plan", data.studentName);
    const phases = [
      { key: "days30", title: "Days 1-30: Foundation" },
      { key: "days60", title: "Days 31-60: Build" },
      { key: "days90", title: "Days 61-90: Demonstrate" },
    ];
    for (const phase of phases) {
      const items = report.actionPlan[phase.key];
      if (!items?.length) continue;
      state.y = checkSpace(doc, state, 12, data.studentName);
      doc.setFont(FONT_DISPLAY, "bold");
      doc.setFontSize(10);
      doc.setTextColor(BRAND[600][0], BRAND[600][1], BRAND[600][2]);
      doc.text(phase.title, MARGIN, state.y);
      state.y += 6;
      for (const action of items) {
        wrapText(`• ${action}`);
      }
    }
  }

  if (report.interviewPrep?.questions?.length) {
    sectionHeading(doc, state, "Interview Preparation Guide", data.studentName);
    for (const q of report.interviewPrep.questions) {
      state.y = checkSpace(doc, state, 20, data.studentName);
      doc.setFont(FONT_DISPLAY, "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(BRAND[900][0], BRAND[900][1], BRAND[900][2]);
      doc.text(`Q: ${q.question}`, MARGIN, state.y, { maxWidth: CONTENT_W });
      state.y += doc.splitTextToSize(`Q: ${q.question}`, CONTENT_W).length * 4.5 + 2;
      wrapText(`Framework: ${q.answerFramework}`);
    }
  }

  if (report.peerInsight?.positioningStatement) {
    sectionHeading(doc, state, "Peer Comparison Insight", data.studentName);
    wrapText(report.peerInsight.positioningStatement);
  }
}

export function generateFullReport(data: ReportData): Buffer {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const state: PageState = { pageNum: 1, y: 25 };

  renderCoverPage(doc, data);

  renderChartsPage(doc, data, state);

  renderScorecardPage(doc, data, state);

  renderStrengthsAndGaps(doc, data, state);

  state.y += 10;
  renderAISections(doc, data, state);

  return Buffer.from(doc.output("arraybuffer"));
}
