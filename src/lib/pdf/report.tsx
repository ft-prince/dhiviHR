import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import { COMPETENCY_LABELS, type Competency } from "@/lib/scoring";

Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf",
      fontWeight: "normal",
    },
    {
      src: "https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmEU9vAw.ttf",
      fontWeight: "bold",
    },
  ],
});

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 11, fontFamily: "Roboto", color: "#0F172A" },
  banner: { backgroundColor: "#22C55E", color: "#fff", padding: 18, borderRadius: 8 },
  brand: { fontSize: 14, fontFamily: "Roboto", fontWeight: "bold", letterSpacing: 2 },
  h1: { fontSize: 24, fontFamily: "Roboto", fontWeight: "bold", marginTop: 4 },
  small: { fontSize: 9, color: "rgba(255,255,255,0.85)" },
  section: { marginTop: 24 },
  label: { fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: 1.2 },
  big: { fontSize: 30, fontFamily: "Roboto", fontWeight: "bold", color: "#16A34A", marginTop: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  competency: { marginTop: 10 },
  barTrack: { height: 8, backgroundColor: "#ECFDF3", borderRadius: 4, marginTop: 4 },
  barFill: { height: 8, backgroundColor: "#22C55E", borderRadius: 4 },
  pill: { backgroundColor: "#ECFDF3", color: "#15803D", padding: 8, borderRadius: 999, fontSize: 9 },
  footer: { position: "absolute", bottom: 32, left: 48, right: 48, fontSize: 9, color: "#64748B", textAlign: "center" },
  bullet: { marginTop: 4 },
});

export interface ReportData {
  name: string;
  email: string;
  total: number;
  level: string;
  levelLabel: string;
  track: string;
  breakdown: Record<string, number>;
  generatedAt: Date;
}

function recommendationsFor(level: string): string[] {
  switch (level) {
    case "high_impact":
      return [
        "Practice executive-presence interviews and salary negotiation drills.",
        "Optimize LinkedIn with measurable impact bullets and recruiter keywords.",
        "Prepare 3 leadership stories using the STAR framework.",
      ];
    case "industry_ready":
      return [
        "Do 5+ mock interviews in your target domain.",
        "Refine your 60-second pitch and your 'why this company' answer.",
        "Build a portfolio page that signals depth.",
      ];
    case "developing":
      return [
        "Strengthen structured answering with STAR for behavioral questions.",
        "Polish your resume — quantify achievements where possible.",
        "Practice mock HR rounds weekly.",
      ];
    default:
      return [
        "Build foundational communication confidence via daily speaking practice.",
        "Create a clean LinkedIn profile with a professional photo.",
        "Take entry-level mock interviews to reduce nervousness.",
      ];
  }
}

export function ReportDocument({ data }: { data: ReportData }) {
  const recs = recommendationsFor(data.level);
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.banner}>
          <Text style={styles.brand}>DHIVI HR</Text>
          <Text style={styles.h1}>Interview Readiness Report</Text>
          <Text style={styles.small}>{data.name} · {data.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Total Score</Text>
          <Text style={styles.big}>{data.total} / 100</Text>
          <Text style={{ marginTop: 6, fontSize: 14, fontFamily: "Roboto", fontWeight: "bold" }}>
            {data.levelLabel}
          </Text>
          <Text style={{ marginTop: 4, color: "#475569" }}>Workshop Track: {data.track}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Competency Breakdown</Text>
          {(Object.keys(data.breakdown) as Competency[]).map((c) => {
            const score = data.breakdown[c] ?? 0;
            return (
              <View key={c} style={styles.competency}>
                <View style={styles.row}>
                  <Text>{COMPETENCY_LABELS[c] ?? c}</Text>
                  <Text>{score.toFixed(1)} / 20</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${(score / 20) * 100}%` }]} />
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Growth Recommendations</Text>
          {recs.map((r, i) => (
            <Text key={i} style={styles.bullet}>• {r}</Text>
          ))}
        </View>

        <Text style={styles.footer}>
          Generated {data.generatedAt.toDateString()} · DHIVI HR · dhivihr@gmail.com · +91-9780973238
        </Text>
      </Page>
    </Document>
  );
}