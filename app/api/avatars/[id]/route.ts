const palette = ["#E84A27", "#F2C14E", "#D2A233", "#C76A4B", "#6C5A8C", "#25251F"];

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const label = id.startsWith("faculty") ? `F${id.slice(-1)}` : id.split("-").at(-1)?.slice(-2) || "CSS";
  const seed = [...id].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  const background = palette[seed % palette.length];
  const foreground = background === "#25251F" || background === "#6C5A8C" || background === "#E84A27" ? "#FFFDF7" : "#12120F";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 500"><rect width="600" height="500" fill="${background}"/><path d="M0 420L600 110M0 500L600 190" stroke="${foreground}" stroke-opacity=".12" stroke-width="18"/><rect x="22" y="22" width="556" height="456" fill="none" stroke="${foreground}" stroke-width="3"/><text x="300" y="292" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="138" font-weight="900" fill="${foreground}">${label}</text><text x="42" y="72" font-family="monospace" font-size="18" font-weight="700" fill="${foreground}">CSS / NIT DURGAPUR</text></svg>`;
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400" } });
}
