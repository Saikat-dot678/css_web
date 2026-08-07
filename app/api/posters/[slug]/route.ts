import { getEventBySlug } from "@/lib/repositories/events";

const colors: Record<string, [string, string, string]> = {
  Career: ["#E84A27", "#FFFDF7", "#12120F"],
  Placements: ["#12120F", "#F2EFE6", "#F2C14E"],
  Community: ["#F2C14E", "#12120F", "#C76A4B"],
  Competition: ["#6C5A8C", "#FFFDF7", "#F2C14E"],
  Research: ["#D2A233", "#12120F", "#FFFDF7"],
  "Open source": ["#C76A4B", "#FFFDF7", "#12120F"],
  Technical: ["#7B7368", "#FFFDF7", "#F2C14E"],
};

const escapeXml = (value: string) =>
  value.replace(/[<>&"']/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[character] ?? character);

export async function GET(_: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const event = await getEventBySlug(slug);
  if (!event) return new Response("Poster not found", { status: 404 });
  const date = new Date(`${event.date}T12:00:00`);
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en", { month: "short" }).toUpperCase();
  const year = date.getFullYear();
  const [background, foreground, accent] = colors[event.category] ?? colors.Career;
  const words = event.title.toUpperCase().split(/\s+/);
  const lines: string[] = [];
  for (let index = 0; index < words.length; index += 2) lines.push(words.slice(index, index + 2).join(" "));
  const title = lines.slice(0, 3).map((line, index) => `<text x="42" y="${330 + index * 76}" font-family="Arial,Helvetica,sans-serif" font-size="66" font-weight="900" fill="${foreground}">${escapeXml(line)}</text>`).join("");
  const status = event.status.replaceAll("_", " ").toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000"><rect width="800" height="1000" fill="${background}"/><rect x="28" y="28" width="744" height="944" fill="none" stroke="${foreground}" stroke-width="4"/><text x="42" y="82" font-family="monospace" font-size="22" font-weight="700" fill="${foreground}">CSS / NIT DURGAPUR</text><text x="42" y="136" font-family="monospace" font-size="18" font-weight="700" fill="${foreground}">${escapeXml(event.category.toUpperCase())}</text><circle cx="690" cy="116" r="45" fill="${accent}"/><text x="42" y="250" font-family="Arial,Helvetica,sans-serif" font-size="130" font-weight="900" fill="${foreground}">${day}</text><text x="250" y="240" font-family="monospace" font-size="32" font-weight="700" fill="${foreground}">${month}<tspan x="250" dy="38">${year}</tspan></text>${title}<line x1="42" y1="790" x2="758" y2="790" stroke="${foreground}" stroke-width="4"/><text x="42" y="838" font-family="monospace" font-size="22" font-weight="700" fill="${foreground}">${escapeXml(event.startTime)}</text><text x="42" y="884" font-family="monospace" font-size="22" font-weight="700" fill="${foreground}">${escapeXml(event.venue.toUpperCase().slice(0, 34))}</text><text x="42" y="942" font-family="monospace" font-size="18" font-weight="700" fill="${foreground}">${escapeXml(status)}</text></svg>`;
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-store" } });
}
