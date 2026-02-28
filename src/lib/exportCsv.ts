import type { TrendItem, RedditPost } from "@/lib/mockData";

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportTrendsCsv(trends: TrendItem[], redditPosts: RedditPost[]) {
  const lines: string[] = [];

  // Trends section
  lines.push("GOOGLE TRENDS DATA");
  lines.push("Keyword,Volume,Change %");
  trends.forEach(t => {
    lines.push(`${escapeCsv(t.keyword)},${t.volume},${t.change}%`);
  });

  lines.push("");

  // Reddit section
  lines.push("REDDIT DISCUSSIONS");
  lines.push("Title,Subreddit,Score,Comments,Sentiment,URL");
  redditPosts.forEach(p => {
    lines.push(
      `${escapeCsv(p.title)},${escapeCsv(p.subreddit)},${p.score},${p.comments},${p.sentiment},${escapeCsv(p.url)}`
    );
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
