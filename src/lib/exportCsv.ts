import type { TrendItem } from "@/lib/mockData";

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportTrendsCsv(trends: TrendItem[]) {
  const lines: string[] = [];

  lines.push("GOOGLE ADS KEYWORD DATA");
  lines.push("Keyword,Volume,Change %");
  trends.forEach(t => {
    lines.push(`${escapeCsv(t.keyword)},${t.volume},${t.change}%`);
  });

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `funeral-trends-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
