import type { jsPDF } from "jspdf";

interface RadarDataPoint {
  label: string;
  value: number;
  maxValue: number;
}

interface BarDataPoint {
  label: string;
  value: number;
  gap: "critical_gap" | "development_gap" | "strength";
}

interface BrandColors {
  green: [number, number, number];
  greenLight: [number, number, number];
  greenDark: [number, number, number];
  amber: [number, number, number];
  red: [number, number, number];
  textDark: [number, number, number];
  textMuted: [number, number, number];
  lineGray: [number, number, number];
  bg: [number, number, number];
}

const BRAND: BrandColors = {
  green: [34, 197, 94],
  greenLight: [240, 253, 244],
  greenDark: [22, 163, 74],
  amber: [217, 119, 6],
  red: [220, 38, 38],
  textDark: [17, 24, 39],
  textMuted: [107, 114, 128],
  lineGray: [229, 231, 235],
  bg: [249, 250, 251],
};

export function drawRadarChart(
  doc: jsPDF,
  centerX: number,
  centerY: number,
  radius: number,
  data: RadarDataPoint[],
): void {
  const n = data.length;
  if (n < 3) return;

  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;
  const levels = [1, 2, 3, 4];

  doc.setFillColor(BRAND.bg[0], BRAND.bg[1], BRAND.bg[2]);
  doc.circle(centerX, centerY, radius + 2, "F");

  for (const level of levels) {
    const r = (level / 4) * radius;
    doc.setDrawColor(BRAND.lineGray[0], BRAND.lineGray[1], BRAND.lineGray[2]);
    doc.setLineWidth(0.2);

    const sides = n;
    for (let i = 0; i < sides; i++) {
      const a1 = startAngle + i * angleStep;
      const a2 = startAngle + ((i + 1) % sides) * angleStep;
      doc.line(
        centerX + r * Math.cos(a1),
        centerY + r * Math.sin(a1),
        centerX + r * Math.cos(a2),
        centerY + r * Math.sin(a2),
      );
    }

    doc.setFontSize(6);
    doc.setTextColor(BRAND.textMuted[0], BRAND.textMuted[1], BRAND.textMuted[2]);
    doc.text(level.toString(), centerX + 1, centerY - r + 3);
  }

  for (let i = 0; i < n; i++) {
    const angle = startAngle + i * angleStep;
    doc.setDrawColor(BRAND.lineGray[0], BRAND.lineGray[1], BRAND.lineGray[2]);
    doc.setLineWidth(0.15);
    doc.line(centerX, centerY, centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle));
  }

  const points: [number, number][] = data.map((d, i) => {
    const angle = startAngle + i * angleStep;
    const r = (Math.min(d.value, d.maxValue) / d.maxValue) * radius;
    return [centerX + r * Math.cos(angle), centerY + r * Math.sin(angle)];
  });

  doc.setFillColor(34, 197, 94);
  doc.setGState(new (doc as any).GState({ opacity: 0.2 }));
  const firstPt = points[0];
  const relativePoints = points.slice(1).map((p, i) => {
    const prev = points[i];
    return [p[0] - prev[0], p[1] - prev[1]];
  });
  relativePoints.push([firstPt[0] - points[points.length - 1][0], firstPt[1] - points[points.length - 1][1]]);
  doc.lines(relativePoints as [number, number][], firstPt[0], firstPt[1], [1, 1], "F");
  doc.setGState(new (doc as any).GState({ opacity: 1 }));

  doc.setDrawColor(BRAND.greenDark[0], BRAND.greenDark[1], BRAND.greenDark[2]);
  doc.setLineWidth(0.6);
  for (let i = 0; i < points.length; i++) {
    const next = points[(i + 1) % points.length];
    doc.line(points[i][0], points[i][1], next[0], next[1]);
  }

  for (const [px, py] of points) {
    doc.setFillColor(BRAND.greenDark[0], BRAND.greenDark[1], BRAND.greenDark[2]);
    doc.circle(px, py, 1.2, "F");
    doc.setFillColor(255, 255, 255);
    doc.circle(px, py, 0.6, "F");
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(BRAND.textDark[0], BRAND.textDark[1], BRAND.textDark[2]);
  for (let i = 0; i < n; i++) {
    const angle = startAngle + i * angleStep;
    const labelR = radius + 8;
    const lx = centerX + labelR * Math.cos(angle);
    const ly = centerY + labelR * Math.sin(angle);

    const lines = doc.splitTextToSize(data[i].label, 30);
    const align = Math.abs(Math.cos(angle)) < 0.1 ? "center" : Math.cos(angle) > 0 ? "left" : "right";
    doc.text(lines, lx, ly, { align, baseline: "middle" });
  }
}

export function drawBarChart(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  data: BarDataPoint[],
): number {
  const barHeight = 8;
  const gap = 6;
  const labelWidth = 55;
  const barAreaWidth = width - labelWidth - 20;
  let currentY = y;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(BRAND.textDark[0], BRAND.textDark[1], BRAND.textDark[2]);
  doc.text("Competency Scores", x, currentY);
  currentY += 8;

  for (const item of data) {
    const barColor = item.gap === "strength" ? BRAND.green
      : item.gap === "development_gap" ? BRAND.amber
      : BRAND.red;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(BRAND.textDark[0], BRAND.textDark[1], BRAND.textDark[2]);
    const truncLabel = item.label.length > 25 ? item.label.slice(0, 23) + "…" : item.label;
    doc.text(truncLabel, x, currentY + barHeight / 2 + 1);

    const barX = x + labelWidth;
    doc.setFillColor(BRAND.lineGray[0], BRAND.lineGray[1], BRAND.lineGray[2]);
    doc.roundedRect(barX, currentY, barAreaWidth, barHeight, 2, 2, "F");

    const filledWidth = Math.max((item.value / 4) * barAreaWidth, 2);
    doc.setFillColor(barColor[0], barColor[1], barColor[2]);
    doc.roundedRect(barX, currentY, filledWidth, barHeight, 2, 2, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(BRAND.textDark[0], BRAND.textDark[1], BRAND.textDark[2]);
    doc.text(`${item.value.toFixed(1)}`, barX + barAreaWidth + 3, currentY + barHeight / 2 + 1);

    currentY += barHeight + gap;
  }

  currentY += 4;
  doc.setFontSize(7);
  doc.setTextColor(BRAND.textMuted[0], BRAND.textMuted[1], BRAND.textMuted[2]);
  const legendItems = [
    { color: BRAND.green, label: "Strength (3.0+)" },
    { color: BRAND.amber, label: "Development (2.0-2.9)" },
    { color: BRAND.red, label: "Critical (<2.0)" },
  ];
  let legendX = x;
  for (const li of legendItems) {
    doc.setFillColor(li.color[0], li.color[1], li.color[2]);
    doc.roundedRect(legendX, currentY, 4, 4, 1, 1, "F");
    doc.text(li.label, legendX + 6, currentY + 3.5);
    legendX += 45;
  }

  return currentY + 8;
}

export function drawReadinessBand(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  score: number,
  level: string,
): void {
  const bands = [
    { label: "Learner", min: 0, max: 2.0, color: [239, 68, 68] as [number, number, number] },
    { label: "Practitioner", min: 2.0, max: 2.75, color: BRAND.amber },
    { label: "Accelerator", min: 2.75, max: 3.5, color: [59, 130, 246] as [number, number, number] },
    { label: "Future Ready", min: 3.5, max: 4.0, color: BRAND.green },
  ];

  const bandHeight = 12;
  const bandWidth = width / bands.length;

  for (let i = 0; i < bands.length; i++) {
    const bx = x + i * bandWidth;
    const b = bands[i];
    const isActive = b.label.toLowerCase().replace(" ", "_") === level ||
      b.label.toLowerCase().replace(" ", "") === level.toLowerCase().replace("_", "").replace(" ", "");

    if (isActive) {
      doc.setFillColor(b.color[0], b.color[1], b.color[2]);
    } else {
      doc.setFillColor(BRAND.lineGray[0], BRAND.lineGray[1], BRAND.lineGray[2]);
    }
    doc.roundedRect(bx + 1, y, bandWidth - 2, bandHeight, 2, 2, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(isActive ? 255 : BRAND.textMuted[0], isActive ? 255 : BRAND.textMuted[1], isActive ? 255 : BRAND.textMuted[2]);
    doc.text(b.label, bx + bandWidth / 2, y + bandHeight / 2 + 1, { align: "center" });
  }

  const markerX = x + (Math.min(score, 4) / 4) * width;
  const markerY = y + bandHeight + 3;
  doc.setFillColor(BRAND.textDark[0], BRAND.textDark[1], BRAND.textDark[2]);
  doc.triangle(markerX - 2, markerY + 4, markerX + 2, markerY + 4, markerX, markerY, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(BRAND.textDark[0], BRAND.textDark[1], BRAND.textDark[2]);
  doc.text(`${score.toFixed(2)}`, markerX, markerY + 8, { align: "center" });
}
