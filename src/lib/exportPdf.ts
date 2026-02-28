import jsPDF from "jspdf";

const BRAND = "FuneralTrends · Powered by DISRUPT Media";
const ACCENT = [255, 0, 153] as const; // #FF0099 tertiary

function addHeader(doc: jsPDF, title: string) {
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...ACCENT);
  doc.text(title, 20, 22);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(140, 140, 140);
  doc.text(BRAND, 20, 30);
  doc.text(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), 190, 30, { align: "right" });

  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.5);
  doc.line(20, 34, 190, 34);
}

function addFooter(doc: jsPDF, pageNum: number) {
  doc.setFontSize(7);
  doc.setTextColor(160, 160, 160);
  doc.text(BRAND, 105, 288, { align: "center" });
  doc.text(`Page ${pageNum}`, 190, 288, { align: "right" });
}

export function exportVideoIdeasPdf(keyword: string, ideas: string[]) {
  const doc = new jsPDF();
  let page = 1;

  addHeader(doc, `Video Ideas: ${keyword}`);

  let y = 44;

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`${ideas.length} AI-generated short-form video ideas`, 20, y);
  y += 10;

  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  ideas.forEach((idea, i) => {
    if (y > 272) {
      addFooter(doc, page);
      doc.addPage();
      page++;
      y = 20;
    }

    const numText = `${i + 1}.`;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...ACCENT);
    doc.text(numText, 20, y);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    const lines = doc.splitTextToSize(idea, 155);
    doc.text(lines, 30, y);
    y += lines.length * 5 + 4;
  });

  addFooter(doc, page);
  doc.save(`video-ideas-${keyword.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}

export function exportScriptPdf(idea: string, script: { hook: string; body: string; cta: string; wordCount: number }, tone: string) {
  const doc = new jsPDF();

  addHeader(doc, "Video Script");

  let y = 44;

  // Topic
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("TOPIC", 20, y);
  y += 6;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  const topicLines = doc.splitTextToSize(idea, 170);
  doc.text(topicLines, 20, y);
  y += topicLines.length * 6 + 4;

  // Tone
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Tone: ${tone}  ·  ~${script.wordCount} words  ·  ~45 seconds`, 20, y);
  y += 12;

  // Hook
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...ACCENT);
  doc.text("🎬 HOOK (3 SEC)", 20, y);
  y += 7;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  const hookLines = doc.splitTextToSize(script.hook, 170);
  doc.text(hookLines, 20, y);
  y += hookLines.length * 6 + 8;

  // Body
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...ACCENT);
  doc.text("📝 SCRIPT", 20, y);
  y += 7;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 30, 30);
  const bodyLines = doc.splitTextToSize(script.body, 170);
  doc.text(bodyLines, 20, y);
  y += bodyLines.length * 5 + 8;

  // CTA
  if (y > 250) {
    doc.addPage();
    y = 20;
  }
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...ACCENT);
  doc.text("📣 CALL TO ACTION", 20, y);
  y += 7;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  const ctaLines = doc.splitTextToSize(script.cta, 170);
  doc.text(ctaLines, 20, y);

  addFooter(doc, 1);
  doc.save(`script-${idea.slice(0, 30).toLowerCase().replace(/\s+/g, "-")}.pdf`);
}
